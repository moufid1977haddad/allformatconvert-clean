import { NextRequest, NextResponse } from "next/server";
import { convertPdfToDocx, ConvertApiError } from "@/lib/providers/convertApi";
import { guardPaidRoute } from "@/lib/quota/guard";
import { checkFileSize, MAX_CONVERTAPI_FILE_BYTES } from "@/lib/quota/limits";
import { alertServerError } from "@/lib/quota/errorAlerts";

// Give the ConvertAPI round-trip enough headroom inside the function's own
// execution budget -- same reasoning as convert-to-pdf/route.ts's identical
// constant.
export const maxDuration = 60;

// Rollback switch, same shape as CONVERTAPI_ENABLED in
// convert-to-pdf/route.ts (spec §9): only the literal value "true" routes
// PDFs to ConvertAPI. Unset, or any other value (including "false"),
// disables this route entirely -- the client falls back to its own
// client-side extraction, see pdf-to-word/page.jsx. Flipping this back off
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
  // Checked first, before touching the guard or reading the file body --
  // this 404 is a deliberate, distinct signal the client uses to fall back
  // to the old client-side extraction (page.jsx), never to be confused
  // with a real conversion failure. Nothing else in this route returns 404.
  if (!PDF_TO_WORD_CONVERTAPI_ENABLED) {
    return NextResponse.json({ error: "not_enabled" }, { status: 404 });
  }

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
  if (extension !== "pdf") {
    return NextResponse.json({ error: "Unsupported file type. Please upload a .pdf file." }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
  }

  // Validated BEFORE calling ConvertAPI, so a credit is never spent on a
  // file that would fail anyway -- same reasoning and same 25 MB ceiling as
  // handleConvertApi's checkFileSize call in convert-to-pdf/route.ts.
  const sizeCheck = checkFileSize(file, MAX_CONVERTAPI_FILE_BYTES, "PDF files");
  if (!sizeCheck.ok) {
    return NextResponse.json({ error: "This file is too large. Maximum size is 25 MB." }, { status: 413 });
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
      return NextResponse.json({ error: "Conversion failed. Please try again." }, { status: 502 });
    }

    const outName = file.name.replace(/\.[^.]+$/, "") + ".docx";
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${outName.replace(/"/g, "")}"`,
      },
    });
  } catch (err) {
    // No automatic fallback to a different provider on any ConvertAPI
    // failure -- every failure returns an explicit error to the user,
    // never a silent retry, same policy as handleConvertApi in
    // convert-to-pdf/route.ts. (The client-side pdfjs-dist fallback in
    // page.jsx exists only for the disabled-feature 404 above, never for a
    // real provider failure reaching this branch.)
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
      }
      return NextResponse.json({ error: mapped.message }, { status: mapped.status });
    }

    await alertServerError("pdf-to-word", "unexpected_error");
    return NextResponse.json({ error: "Conversion failed. Please try again." }, { status: 500 });
  }
}
