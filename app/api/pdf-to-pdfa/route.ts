import { NextRequest, NextResponse } from "next/server";

// Give the pdf-tools-service round-trip (up to SERVICE_TIMEOUT_MS below)
// enough headroom inside the function's own execution budget.
export const maxDuration = 90;

const SERVICE_TIMEOUT_MS = 65_000;

// Deliberately stricter than the service's own MAX_FILE_SIZE_BYTES so this
// route fails fast with a clear message rather than uploading a doomed
// request to the service first.
const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const serviceUrl = process.env.PDFTOOLS_SERVICE_URL;
  const apiKey = process.env.PDFTOOLS_API_KEY;

  if (!serviceUrl || !apiKey) {
    return NextResponse.json({ ok: false, error: "PDF/A service is not configured." }, { status: 500 });
  }

  let file: File;
  let conformance = "2b";
  try {
    const formData = await req.formData();
    const uploaded = formData.get("file");
    if (!uploaded || !(uploaded instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided." }, { status: 400 });
    }
    file = uploaded;
    const requested = formData.get("conformance");
    if (typeof requested === "string" && /^[0-9][ab]$/i.test(requested)) {
      conformance = requested.toLowerCase();
    }
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid multipart/form-data request." }, { status: 400 });
  }

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
  serviceForm.append("conformance", conformance);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), SERVICE_TIMEOUT_MS);

  let serviceResponse: Response;
  try {
    serviceResponse = await fetch(`${serviceUrl.replace(/\/+$/, "")}/v1/pdfa`, {
      method: "POST",
      headers: { "X-API-Key": apiKey },
      body: serviceForm,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return NextResponse.json({ ok: false, error: "Conversion timed out. Try a smaller file." }, { status: 504 });
    }
    console.error("pdf-tools-service request failed:", err?.message || "unknown error");
    return NextResponse.json({ ok: false, error: "Could not reach the PDF/A service." }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }

  const body = await serviceResponse.text();
  if (!serviceResponse.ok && serviceResponse.status !== 422) {
    console.error("pdf-tools-service /v1/pdfa error:", serviceResponse.status, body.slice(0, 500));
  }

  return new NextResponse(body, {
    status: serviceResponse.status,
    headers: { "Content-Type": "application/json" },
  });
}
