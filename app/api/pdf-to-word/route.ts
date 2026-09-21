import { NextRequest, NextResponse } from "next/server";
import { convertPdfToDocx, ConvertApiError } from "@/lib/providers/convertApi";
import { guardPaidRoute } from "@/lib/quota/guard";
import { checkFileSize, MAX_PDF_TO_WORD_STAGED_BYTES } from "@/lib/quota/limits";
import { isStagedRequest, respondStaged, fileResponse } from "@/lib/media/stagedRoute";
import { alertServerError } from "@/lib/quota/errorAlerts";
import { buildServerToolError, insertToolError } from "@/lib/reportError";

// Give the ConvertAPI round-trip enough headroom inside the function's own
// execution budget -- same reasoning as convert-to-pdf/route.ts's identical
// constant.
export const maxDuration = 300;

// Rollback switch, same shape as CONVERTAPI_ENABLED in
// convert-to-pdf/route.ts (spec §9): only the literal value "true" routes
// PDFs to ConvertAPI. Unset, or any other value (including "false"),
// disables this route: it answers 503 with a plain-language message and the
// page shows it. There is deliberately NO degraded fallback -- the old
// client-side plain-text extraction returned a result that looked normal
// but had lost tables, fonts and layout (audit D6). Flipping this back on
// is an env var change plus a redeploy, never a code change.
const PDF_TO_WORD_CONVERTAPI_ENABLED = process.env.PDF_TO_WORD_CONVERTAPI_ENABLED === "true";

// Real ConvertAPI HTTP status codes and response codes mapped to plain-
// language user messages -- copied verbatim from convert-to-pdf/route.ts's
// CONVERTAPI_ERROR_RESPONSES (same provider, same error taxonomy), with
// only the unsupported_format message adjusted for this route's input
// format. `alert` marks the rows that trigger alertServerError (everything
// except the two success-adjacent, self-explanatory cases: unsupported
// format and file-too-large, the latter handled separately by the size
// check below).
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
    message: "This file format isn't supported. Please upload a .pdf file.",
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

export async function POST(req: NextRequest) {
  // Checked first, before touching the guard or reading the file body. A
  // disabled tool fails loudly with a clear message; it never hands back a
  // lower-quality result that looks like a normal conversion.
  if (!PDF_TO_WORD_CONVERTAPI_ENABLED) {
    return NextResponse.json(
      { error: "PDF to Word is temporarily unavailable. Please try again later." },
      { status: 503 }
    );
  }

  // Staged path (files above the Vercel body ceiling) -- see lib/media/stagedRoute.ts.
  if (isStagedRequest(req)) return respondStaged(req, "docx", (file) => convertPdf(req, file, true));

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
  return convertPdf(req, file);
}

async function convertPdf(req: NextRequest, file: File, staged = false): Promise<NextResponse> {
  const extension = getExtension(file.name);
  if (extension !== "pdf") {
    return NextResponse.json({ error: "Unsupported file type. Please upload a .pdf file." }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
  }

  // Validated BEFORE calling ConvertAPI, so a credit is never spent on a
  // file that would fail anyway -- same reasoning and same 25 MB ceiling as
  // handleConvertApi's checkFileSize call in convert-to-pdf/route.ts.
  const sizeCheck = checkFileSize(file, MAX_PDF_TO_WORD_STAGED_BYTES, "PDF files");
  if (!sizeCheck.ok) {
    return NextResponse.json({ error: `This file is too large. Maximum size is ${MAX_PDF_TO_WORD_STAGED_BYTES / (1024 * 1024)} MB.` }, { status: 413 });
  }

  const guard = await guardPaidRoute(req, { route: "pdf-to-word", tool: "pdf-to-word" });
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
    const { docxBuffer, costMicros } = await convertPdfToDocx(fileBuffer, file.name);
    console.log(`[convertapi] pdf->docx cost_micros=${costMicros} input_mb=${Math.round(file.size / 1048576)}`);
    // Real reconciliation: actualCostMicros = response.ConversionCost *
    // CONVERTAPI_COST_MICROS, computed inside the adapter (only it knows
    // ConvertAPI's response shape) and returned here as the already-scaled
    // costMicros. Committed regardless of the magic-byte check below --
    // ConvertAPI's 2xx response means it already billed for this
    // conversion, whether or not the payload turns out to be a valid docx.
    await guard.commit(costMicros);

    const bytes = new Uint8Array(docxBuffer);
    // .docx is a ZIP container -- check for the "PK" magic bytes, NOT the
    // "%PDF-" check convert-to-pdf/route.ts uses (that would be checking
    // for the wrong output format here, since this route converts the
    // other direction).
    const isDocx = bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
    if (!isDocx) {
      // Mirrors the same defense-in-depth check handleConvertApi does for
      // its own output -- a 2xx from the provider isn't proof the bytes
      // are actually a valid docx, and streaming an invalid file to the
      // client with a .docx extension and no error would be worse than
      // refusing it here.
      await alertServerError("pdf-to-word", "non_docx_response");
      await insertToolError(buildServerToolError({
        tool: "pdf-to-word",
        file,
        error: new Error("non_docx_response"),
        userAgent: req.headers.get("user-agent"),
      }));
      return NextResponse.json({ error: "Conversion failed. Please try again." }, { status: 502 });
    }

    const outName = file.name.replace(/\.[^.]+$/, "") + ".docx";
    return fileResponse(bytes, {
      "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="${outName.replace(/"/g, "")}"`,
    }, staged);
  } catch (err) {
    // No automatic fallback to a different provider on any ConvertAPI
    // failure -- every failure returns an explicit error to the user,
    // never a silent retry, same policy as handleConvertApi in
    // convert-to-pdf/route.ts.
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
        await alertServerError("pdf-to-word", `${err.code} (HTTP ${err.httpStatus ?? "n/a"})`);
        await insertToolError(buildServerToolError({
          tool: "pdf-to-word",
          file,
          error: new Error(`${err.code} (HTTP ${err.httpStatus ?? "n/a"})`),
          userAgent: req.headers.get("user-agent"),
        }));
      }
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    await alertServerError("pdf-to-word", "unexpected_error");
    await insertToolError(buildServerToolError({
      tool: "pdf-to-word",
      file,
      error: err instanceof Error ? err : new Error("unexpected_error"),
      userAgent: req.headers.get("user-agent"),
    }));
    return NextResponse.json({ error: "Conversion failed. Please try again." }, { status: 500 });
  }
}
