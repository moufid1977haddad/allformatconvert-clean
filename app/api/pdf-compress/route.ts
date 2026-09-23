import { NextRequest, NextResponse } from "next/server";
import { alertServerError } from "@/lib/quota/errorAlerts";
import { buildServerToolError, insertToolError } from "@/lib/reportError";
import { MAX_PLATFORM_UPLOAD_BYTES } from "@/lib/quota/limits";
import { isStagedRequest } from "@/lib/media/stagedRoute";
import { openStaged, discard } from "@/lib/media/staged";

// PDF Compress on the pdf-tools service (pikepdf + Adobe's tx, services/pdf-tools/py/compress.py).
// Small files: multipart through this function, the PDF comes back as bytes. Large files (staged): this
// function only checks the visitor's ticket and hands the job id and a server ticket to pdf-tools, which
// reads the file from the media service and deposits the result there itself -- the file never crosses
// this function, so its memory is not the ceiling (docs/audit/RAPPORT-ecarts-marche.md §3a).
export const maxDuration = 300;

const LEVELS = ["low", "recommended", "extreme"];
const SERVICE_TIMEOUT_MS = 285_000;

function config() {
  const serviceUrl = process.env.PDFTOOLS_SERVICE_URL;
  const apiKey = process.env.PDFTOOLS_API_KEY;
  if (!serviceUrl || !apiKey) return null;
  return { base: serviceUrl.replace(/\/+$/, ""), apiKey };
}

async function callService(url: string, init: RequestInit): Promise<Response | { error: NextResponse }> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), SERVICE_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (err: any) {
    if (err?.name === "AbortError") {
      return { error: NextResponse.json({ ok: false, error: "Compression timed out. Try a smaller file." }, { status: 504 }) };
    }
    await alertServerError("pdf-compress", `unreachable: ${err?.message || "unknown error"}`);
    return { error: NextResponse.json({ ok: false, error: "Could not reach the compression service." }, { status: 502 }) };
  } finally {
    clearTimeout(t);
  }
}

async function reportFailure(req: NextRequest, status: number, file?: File) {
  if (status < 500) return;
  await alertServerError("pdf-compress", `service_error_${status}`);
  await insertToolError(buildServerToolError({
    tool: "pdf-compress",
    file: file as any,
    error: new Error(`service_error_${status}`),
    userAgent: req.headers.get("user-agent"),
  }));
}

export async function POST(req: NextRequest) {
  const cfg = config();
  if (!cfg) return NextResponse.json({ ok: false, error: "Compression service is not configured." }, { status: 500 });

  if (isStagedRequest(req)) {
    let body: any = null;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
    }
    if (!LEVELS.includes(body?.level)) return NextResponse.json({ ok: false, error: "Unknown compression level." }, { status: 400 });
    const h: any = openStaged(body);
    if (!h.ok) return NextResponse.json({ ok: false, error: h.error }, { status: h.status });
    const r = await callService(`${cfg.base}/v1/compress-staged`, {
      method: "POST",
      headers: { "X-API-Key": cfg.apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ jid: h.jid, ticket: h.serverTicket, level: body.level }),
    });
    if ("error" in r) {
      await discard(h);
      return r.error;
    }
    const j = await r.json().catch(() => ({ ok: false, error: "Compression failed. Please try again." }));
    if (!r.ok || !j.ok || j.notSmaller) await discard(h);
    if (!r.ok) await reportFailure(req, r.status);
    return NextResponse.json(j, { status: r.ok ? 200 : r.status, headers: { "Cache-Control": "no-store" } });
  }

  let file: File;
  let level: string;
  try {
    const form = await req.formData();
    const uploaded = form.get("file");
    level = String(form.get("level") || "");
    if (!uploaded || !(uploaded instanceof File)) return NextResponse.json({ ok: false, error: "No file provided." }, { status: 400 });
    file = uploaded;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid multipart/form-data request." }, { status: 400 });
  }
  if (!LEVELS.includes(level)) return NextResponse.json({ ok: false, error: "Unknown compression level." }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ ok: false, error: "The uploaded file is empty." }, { status: 400 });
  if (file.size > MAX_PLATFORM_UPLOAD_BYTES) return NextResponse.json({ ok: false, error: "This file must be sent through the large-file upload." }, { status: 413 });

  const form = new FormData();
  form.append("level", level);
  form.append("file", file, file.name);
  const r = await callService(`${cfg.base}/v1/compress`, { method: "POST", headers: { "X-API-Key": cfg.apiKey }, body: form });
  if ("error" in r) return r.error;
  if (!r.ok) {
    await reportFailure(req, r.status, file);
    const j = await r.json().catch(() => ({ ok: false, error: "Compression failed. Please try again." }));
    return NextResponse.json(j, { status: r.status });
  }
  if ((r.headers.get("content-type") || "").includes("application/json")) {
    return NextResponse.json(await r.json(), { headers: { "Cache-Control": "no-store" } }); // notSmaller
  }
  return new NextResponse(await r.arrayBuffer(), {
    status: 200,
    headers: { "Content-Type": "application/pdf", "X-Compress-Stats": r.headers.get("X-Compress-Stats") || "{}", "Cache-Control": "no-store" },
  });
}
