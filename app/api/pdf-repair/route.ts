import { NextRequest, NextResponse } from "next/server";
import { alertServerError } from "@/lib/quota/errorAlerts";
import { buildServerToolError, insertToolError } from "@/lib/reportError";
import { MAX_PDFTOOLS_STAGED_BYTES } from "@/lib/quota/limits";
import { isStagedRequest, respondStagedPdfJson } from "@/lib/media/stagedRoute";

// Give the pdf-tools-service round-trip (up to SERVICE_TIMEOUT_MS below)
// enough headroom inside the function's own execution budget.
export const maxDuration = 300;

// Grows with the file (a large scan takes the service longer); stays under maxDuration.
function serviceTimeoutMs(bytes: number): number {
  return Math.min(240_000, 65_000 + Math.ceil(bytes / (1024 * 1024)) * 3_000);
}

// Deliberately stricter than the service's own MAX_FILE_SIZE_BYTES so this
// route fails fast with a clear message rather than uploading a doomed
// request to the service first.
const MAX_FILE_SIZE_BYTES = MAX_PDFTOOLS_STAGED_BYTES;

export async function POST(req: NextRequest) {
  const serviceUrl = process.env.PDFTOOLS_SERVICE_URL;
  const apiKey = process.env.PDFTOOLS_API_KEY;

  if (!serviceUrl || !apiKey) {
    return NextResponse.json({ ok: false, error: "Repair service is not configured." }, { status: 500 });
  }

  // Staged path (files above the Vercel body ceiling): see lib/media/stagedRoute.ts.
  if (isStagedRequest(req)) {
    return respondStagedPdfJson(req, (file) => repairFile(req, file, serviceUrl, apiKey));
  }

  let file: File;
  try {
    const formData = await req.formData();
    const uploaded = formData.get("file");
    if (!uploaded || !(uploaded instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided." }, { status: 400 });
    }
    file = uploaded;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid multipart/form-data request." }, { status: 400 });
  }
  return repairFile(req, file, serviceUrl, apiKey);
}

async function repairFile(req: NextRequest, file: File, serviceUrl: string, apiKey: string): Promise<NextResponse> {
  if (file.size === 0) {
    return NextResponse.json({ ok: false, error: "The uploaded file is empty." }, { status: 400 });
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json(
      { ok: false, error: `File is too large. Maximum size is ${MAX_FILE_SIZE_BYTES / (1024 * 1024)} MB.` },
      { status: 413 }
    );
  }

  const serviceForm = new FormData();
  serviceForm.append("file", file, file.name);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), serviceTimeoutMs(file.size));

  let serviceResponse: Response;
  try {
    serviceResponse = await fetch(`${serviceUrl.replace(/\/+$/, "")}/v1/repair`, {
      method: "POST",
      headers: { "X-API-Key": apiKey },
      body: serviceForm,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return NextResponse.json({ ok: false, error: "Repair timed out. Try a smaller file." }, { status: 504 });
    }
    console.error("pdf-tools-service request failed:", err?.message || "unknown error");
    await alertServerError("pdf-repair", `unreachable: ${err?.message || "unknown error"}`);
    await insertToolError(buildServerToolError({
      tool: "pdf-repair",
      file,
      error: err,
      userAgent: req.headers.get("user-agent"),
    }));
    return NextResponse.json({ ok: false, error: "Could not reach the repair service." }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }

  const body = await serviceResponse.text();
  if (!serviceResponse.ok && serviceResponse.status !== 422) {
    console.error("pdf-tools-service /v1/repair error:", serviceResponse.status, body.slice(0, 500));
    await alertServerError("pdf-repair", `service_error_${serviceResponse.status}`);
    await insertToolError(buildServerToolError({
      tool: "pdf-repair",
      file,
      error: new Error(`service_error_${serviceResponse.status}`),
      userAgent: req.headers.get("user-agent"),
    }));
  }

  return new NextResponse(body, {
    status: serviceResponse.status,
    headers: { "Content-Type": "application/json" },
  });
}
