// Shared handler for PDF -> Excel and PDF -> PowerPoint (ConvertAPI), built on the same pipeline as
// app/api/pdf-to-word/route.ts (left unchanged, proven in production): staged upload for large files,
// the shared spend guard, the same error taxonomy, the same billed/unbilled release rule, a magic-byte
// check of the output before it is ever handed back.
import { NextRequest, NextResponse } from "next/server";
import { ConvertApiError } from "@/lib/providers/convertApi";
import { guardPaidRoute } from "@/lib/quota/guard";
import { checkFileSize, MAX_PDF_TO_WORD_STAGED_BYTES } from "@/lib/quota/limits";
import { isStagedRequest, respondStaged, fileResponse } from "@/lib/media/stagedRoute";
import { alertServerError } from "@/lib/quota/errorAlerts";
import { buildServerToolError, insertToolError } from "@/lib/reportError";

type Spec = {
  tool: "pdf-to-excel" | "pdf-to-ppt";
  label: string; // "Excel" | "PowerPoint"
  ext: "xlsx" | "pptx";
  mime: string;
  convert: (buf: Buffer, name: string) => Promise<{ buffer: Buffer; costMicros: number }>;
};

// Same rollback switch as PDF to Word (one switch for ConvertAPI's PDF-to-Office conversions): only the
// literal "true" enables them; otherwise 503 with a plain message, never a degraded fallback.
const ENABLED = () => process.env.PDF_TO_WORD_CONVERTAPI_ENABLED === "true";

const ERRORS: Record<string, { status: number; message: string; alert: boolean }> = {
  quota_exceeded: { status: 503, message: "Conversion is temporarily unavailable. Please try again later.", alert: true },
  rate_limited: { status: 503, message: "Conversion is temporarily unavailable. Please try again later.", alert: true },
  invalid_token: { status: 502, message: "Conversion isn't working right now. We've been notified.", alert: true },
  unsupported_format: { status: 415, message: "This file format isn't supported. Please upload a .pdf file.", alert: false },
  timeout: { status: 504, message: "This conversion is taking too long. Try a smaller or simpler file.", alert: true },
  corrupted_file: { status: 502, message: "This file couldn't be converted. It may be corrupted or password-protected.", alert: true },
  upstream_error: { status: 502, message: "Conversion failed. Please try again.", alert: true },
};

export function makePdfToOfficeHandler(spec: Spec) {
  async function convert(req: NextRequest, file: File, staged = false): Promise<NextResponse> {
    if (!/\.pdf$/i.test(file.name)) return NextResponse.json({ error: "Unsupported file type. Please upload a .pdf file." }, { status: 400 });
    if (file.size === 0) return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
    if (!checkFileSize(file, MAX_PDF_TO_WORD_STAGED_BYTES, "PDF files").ok) {
      return NextResponse.json({ error: `This file is too large. Maximum size is ${MAX_PDF_TO_WORD_STAGED_BYTES / (1024 * 1024)} MB.` }, { status: 413 });
    }
    const guard = await guardPaidRoute(req, { route: spec.tool, tool: spec.tool });
    if (!guard.ok) return guard.response;

    let buf: Buffer;
    try {
      buf = Buffer.from(await file.arrayBuffer());
    } catch {
      await guard.release();
      return NextResponse.json({ error: "This file couldn't be read. It may be corrupted." }, { status: 400 });
    }
    // A PDF with no %PDF- header is refused before any credit is spent.
    if (buf.subarray(0, 1024).indexOf("%PDF-") === -1) {
      await guard.release();
      return NextResponse.json({ error: "This file is not a PDF." }, { status: 400 });
    }

    const report = async (code: string) => {
      await alertServerError(spec.tool, code);
      await insertToolError(buildServerToolError({ tool: spec.tool, file, error: new Error(code), userAgent: req.headers.get("user-agent") }));
    };

    try {
      const { buffer, costMicros } = await spec.convert(buf, file.name);
      console.log(`[convertapi] pdf->${spec.ext} cost_micros=${costMicros} input_mb=${Math.round(file.size / 1048576)}`);
      await guard.commit(costMicros); // a 2xx was billed, whatever the bytes turn out to be
      const bytes = new Uint8Array(buffer);
      // .xlsx / .pptx are ZIP containers: "PK". Anything else is refused, never handed over under that name.
      if (!(bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b)) {
        await report(`non_${spec.ext}_response`);
        return NextResponse.json({ error: "Conversion failed. Please try again." }, { status: 502 });
      }
      const outName = file.name.replace(/\.[^.]+$/, "") + "." + spec.ext;
      return fileResponse(bytes, { "Content-Type": spec.mime, "Content-Disposition": `attachment; filename="${outName.replace(/"/g, "")}"` }, staged);
    } catch (err) {
      if (err instanceof ConvertApiError && (err as any).billed) await guard.commit(null);
      else await guard.release();
      if (err instanceof ConvertApiError) {
        const mapped = ERRORS[(err as any).code] || ERRORS.upstream_error;
        if (mapped.alert) await report(`${(err as any).code} (HTTP ${(err as any).httpStatus ?? "n/a"})`);
        return NextResponse.json({ error: mapped.message }, { status: mapped.status });
      }
      await report("unexpected_error");
      return NextResponse.json({ error: "Conversion failed. Please try again." }, { status: 500 });
    }
  }

  return async function POST(req: NextRequest) {
    if (!ENABLED()) return NextResponse.json({ error: `PDF to ${spec.label} is temporarily unavailable. Please try again later.` }, { status: 503 });
    if (isStagedRequest(req)) return respondStaged(req, spec.ext, (file) => convert(req, file, true));
    let file: File;
    try {
      const form = await req.formData();
      const uploaded = form.get("file");
      if (!uploaded || !(uploaded instanceof File)) return NextResponse.json({ error: "No file provided." }, { status: 400 });
      file = uploaded;
    } catch {
      return NextResponse.json({ error: "Invalid multipart/form-data request." }, { status: 400 });
    }
    return convert(req, file);
  };
}
