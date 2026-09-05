import { NextRequest, NextResponse } from "next/server";
import { detectProprietarySymbolFonts } from "@/lib/officeSymbolFonts";
import { convertDocxToPdf, ConvertApiError } from "@/lib/providers/convertApi";
import { guardPaidRoute } from "@/lib/quota/guard";
import { checkFileSize, MAX_CONVERTAPI_FILE_BYTES } from "@/lib/quota/limits";
import { alertServerError } from "@/lib/quota/errorAlerts";

// Give the Gotenberg/ConvertAPI round-trip (up to GOTENBERG_TIMEOUT_MS
// below) enough headroom inside the function's own execution budget.
export const maxDuration = 60;

const GOTENBERG_TIMEOUT_MS = 30_000;

// Vercel Functions accept request bodies up to 100 MB, so this app-level
// limit is a deliberately stricter policy, not a workaround for a platform
// ceiling.
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

const ALLOWED_EXTENSIONS = new Set(["docx", "doc", "xlsx", "xls", "csv", "pptx", "ppt"]);

// Every non-docx row stays "gotenberg" by design, not by omission -- this
// table is the single place that answers "which engine handles this
// file," and it should stay legible enough that the answer is obvious
// without reading control flow. See
// docs/specs/2026-09-03-convertapi-word-to-pdf-integration.md §1.
const BACKEND_FOR_EXTENSION: Record<string, "convertapi" | "gotenberg"> = {
  docx: "convertapi",
  doc: "gotenberg",
  xlsx: "gotenberg",
  xls: "gotenberg",
  csv: "gotenberg",
  pptx: "gotenberg",
  ppt: "gotenberg",
};

// Rollback switch (spec §9): only the literal value "true" routes .docx to
// ConvertAPI. Unset, or any other value (including "false"), falls
// through to the existing Gotenberg path -- the same fail-safe-to-old-
// behavior default as every other extension. Flipping this back off is an
// env var change plus a redeploy, never a code change.
const CONVERTAPI_ENABLED = process.env.CONVERTAPI_ENABLED === "true";

// Real ConvertAPI HTTP status codes and response codes mapped to plain-
// language user messages, per spec §4 exactly. `alert` marks the rows
// that trigger alertServerError (everything except the two success-
// adjacent, self-explanatory cases: unsupported format and file-too-
// large, the latter handled separately by the size check below).
const CONVERTAPI_ERROR_RESPONSES: Record<string, { status: number; message: string; alert: boolean }> = {
  quota_exceeded: {
    status: 503,
    message: "Conversion is temporarily unavailable. Please try again later.",
    alert: true,
  },
  rate_limited: {
    status: 503,
    message: "Conversion is temporarily unavailable. Please try again later.",
    alert: true,
  },
  invalid_token: {
    status: 502,
    message: "Conversion isn't working right now. We've been notified.",
    alert: true,
  },
  unsupported_format: {
    status: 415,
    message: "This file format isn't supported. Please upload a .docx file.",
    alert: false,
  },
  timeout: {
    status: 504,
    message: "This conversion is taking too long. Try a smaller or simpler file.",
    alert: true,
  },
  corrupted_file: {
    status: 502,
    message: "This file couldn't be converted. It may be corrupted or in an unexpected format.",
    alert: true,
  },
  upstream_error: {
    status: 502,
    message: "Conversion failed. Please try again.",
    alert: true,
  },
};

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? "" : filename.slice(idx + 1).toLowerCase();
}

function backendFor(extension: string): "convertapi" | "gotenberg" {
  const backend = BACKEND_FOR_EXTENSION[extension];
  if (backend === "convertapi" && !CONVERTAPI_ENABLED) return "gotenberg";
  return backend;
}

export async function POST(req: NextRequest) {
  let file: File;
  try {
    const formData = await req.formData();
    const uploaded = formData.get("file");
    if (!uploaded || !(uploaded instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    file = uploaded;
  } catch {
    return NextResponse.json({ error: "Invalid multipart/form-data request." }, { status: 400 });
  }

  const extension = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return NextResponse.json(
      { error: "Unsupported file type. Allowed: .docx, .doc, .xlsx, .xls, .csv, .pptx, .ppt" },
      { status: 400 }
    );
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { error: `File is too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.` },
      { status: 413 }
    );
  }

  const backend = backendFor(extension);
  if (backend === "convertapi") {
    return handleConvertApi(req, file);
  }
  return handleGotenberg(file, extension);
}

// .docx only, and only while CONVERTAPI_ENABLED === "true" -- see
// docs/specs/2026-09-03-convertapi-word-to-pdf-integration.md.
async function handleConvertApi(req: NextRequest, file: File): Promise<NextResponse> {
  // Validated BEFORE calling ConvertAPI, so a credit is never spent on a
  // file that would fail anyway (§5). In practice the generic
  // MAX_FILE_SIZE_BYTES check above already enforces this same 25 MB
  // ceiling, but this check stands on its own per the spec, in case the
  // two constants are ever tuned independently in the future.
  const sizeCheck = checkFileSize(file, MAX_CONVERTAPI_FILE_BYTES, "Word documents");
  if (!sizeCheck.ok) {
    return NextResponse.json({ error: "This file is too large. Maximum size is 25 MB." }, { status: 413 });
  }

  const guard = await guardPaidRoute(req, { route: "word-to-pdf", tool: "word-to-pdf" });
  if (!guard.ok) return guard.response;

  let fileBuffer: Buffer;
  try {
    fileBuffer = Buffer.from(await file.arrayBuffer());
  } catch {
    await guard.release();
    return NextResponse.json(
      { error: "This file couldn't be converted. It may be corrupted or in an unexpected format." },
      { status: 400 }
    );
  }

  try {
    const { pdfBuffer, costMicros } = await convertDocxToPdf(fileBuffer, file.name);
    // Real reconciliation: actualCostMicros = response.ConversionCost *
    // CONVERTAPI_COST_MICROS, computed inside the adapter (only it knows
    // ConvertAPI's response shape) and returned here as the already-scaled
    // costMicros. Committed regardless of the magic-byte check below --
    // ConvertAPI's 2xx response means it already billed for this
    // conversion, whether or not the payload turns out to be a valid PDF.
    await guard.commit(costMicros);

    const bytes = new Uint8Array(pdfBuffer);
    const isPdf = bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
    if (!isPdf) {
      // Mirrors the same defense-in-depth check handleGotenberg already
      // does below -- a 2xx from the provider isn't proof the bytes are
      // actually a PDF, and streaming an invalid file to the client with a
      // .pdf extension and no error would be worse than refusing it here.
      await alertServerError("word-to-pdf", "non_pdf_response");
      return NextResponse.json({ error: "Conversion failed. Please try again." }, { status: 502 });
    }

    const outName = file.name.replace(/\.[^.]+$/, "") + ".pdf";
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${outName.replace(/"/g, "")}"`,
      },
    });
  } catch (err) {
    // No automatic fallback to Gotenberg on any ConvertAPI failure -- every
    // failure returns an explicit error to the user, never a silent retry
    // against a different provider.
    //
    // Release/commit boundary (see lib/providers/convertApi.js's
    // ConvertApiError#billed): release() only when ConvertAPI never
    // actually billed this request (a rejected/non-2xx response, or
    // fetch() itself never reaching ConvertAPI). A billed:true error means
    // a 2xx response was already received -- ConvertAPI already charged
    // for it -- so this must never release; treat it as a real, unknown
    // cost via commit(null), same as guard.js's null-cost path.
    if (err instanceof ConvertApiError && err.billed) {
      await guard.commit(null);
    } else {
      await guard.release();
    }

    if (err instanceof ConvertApiError) {
      const mapped = CONVERTAPI_ERROR_RESPONSES[err.code] || CONVERTAPI_ERROR_RESPONSES.upstream_error;
      if (mapped.alert) {
        // Server-side only, and deliberately limited to the error code and
        // HTTP status -- never the token, never the raw upstream body.
        await alertServerError("word-to-pdf", `${err.code} (HTTP ${err.httpStatus ?? "n/a"})`);
      }
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    await alertServerError("word-to-pdf", "unexpected_error");
    return NextResponse.json({ error: "Conversion failed. Please try again." }, { status: 500 });
  }
}

// Every extension except .docx (plus .docx itself when CONVERTAPI_ENABLED
// is not "true") -- unchanged from before this spec's implementation.
async function handleGotenberg(file: File, extension: string): Promise<NextResponse> {
  const gotenbergUrl = process.env.GOTENBERG_URL;
  const gotenbergUsername = process.env.GOTENBERG_USERNAME;
  const gotenbergPassword = process.env.GOTENBERG_PASSWORD;

  if (!gotenbergUrl || !gotenbergUsername || !gotenbergPassword) {
    // Deliberately do not include the values above in this message.
    return NextResponse.json({ error: "Conversion service is not configured." }, { status: 500 });
  }

  // Kicked off in parallel with the Gotenberg conversion below: scans the
  // upload for Wingdings/Wingdings 2/Wingdings 3/Webdings references so the
  // response can disclose the (confirmed, permanent) icon-font gap on
  // success. Reading the bytes here doesn't consume `file` -- Blob/File
  // bytes can be read more than once, so `gotenbergForm.append` below still
  // gets the original upload. Detection failures must never break the
  // actual conversion, hence the trailing .catch.
  const detectedFontsPromise: Promise<string[]> = file
    .arrayBuffer()
    .then((buf) => detectProprietarySymbolFonts(Buffer.from(buf), extension))
    .catch(() => []);

  const gotenbergForm = new FormData();
  gotenbergForm.append("files", file, file.name);

  const authHeader = "Basic " + Buffer.from(`${gotenbergUsername}:${gotenbergPassword}`).toString("base64");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GOTENBERG_TIMEOUT_MS);

  let gotenbergResponse: Response;
  try {
    gotenbergResponse = await fetch(`${gotenbergUrl.replace(/\/+$/, "")}/forms/libreoffice/convert`, {
      method: "POST",
      headers: { Authorization: authHeader },
      body: gotenbergForm,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return NextResponse.json({ error: "Conversion timed out. Try a smaller file." }, { status: 504 });
    }
    // Log only the failure kind, never credentials or the auth header.
    console.error("Gotenberg request failed:", err?.message || "unknown error");
    return NextResponse.json({ error: "Could not reach the conversion service." }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }

  if (!gotenbergResponse.ok) {
    if (gotenbergResponse.status === 401 || gotenbergResponse.status === 403) {
      console.error("Gotenberg rejected the request: authentication failed (status " + gotenbergResponse.status + ")");
      return NextResponse.json({ error: "Conversion service authentication failed." }, { status: 502 });
    }
    const bodyText = await gotenbergResponse.text().catch(() => "");
    console.error("Gotenberg conversion error:", gotenbergResponse.status, bodyText.slice(0, 500));
    return NextResponse.json(
      { error: "Conversion failed. The document may be corrupted or in an unsupported format." },
      { status: 502 }
    );
  }

  const pdfBuffer = await gotenbergResponse.arrayBuffer();
  const bytes = new Uint8Array(pdfBuffer);
  const isPdf = bytes.length >= 5 && String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-";
  if (!isPdf) {
    console.error("Gotenberg returned a non-PDF response despite a 2xx status.");
    return NextResponse.json({ error: "Conversion service returned an unexpected response." }, { status: 502 });
  }

  const outName = file.name.replace(/\.[^.]+$/, "") + ".pdf";
  const detectedFonts = await detectedFontsPromise;
  const headers: Record<string, string> = {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="${outName.replace(/"/g, "")}"`,
  };
  // Only set this header when it has something to say -- an empty-string
  // header would be a false "we checked and found nothing worth this
  // header existing" signal indistinguishable from "we didn't check".
  if (detectedFonts.length > 0) {
    headers["X-Detected-Symbol-Fonts"] = detectedFonts.join(",");
  }
  return new NextResponse(pdfBuffer, { status: 200, headers });
}
