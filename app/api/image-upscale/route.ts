import { NextRequest, NextResponse } from "next/server";
import { alertServerError } from "@/lib/quota/errorAlerts";
import { openStaged, discard } from "@/lib/media/staged";

// AI Image Upscaler (x2 / x4). The image is staged on the media service by the browser; this route only
// checks the visitor's ticket and hands the job id and a server ticket to the AI service
// (services/background-removal, /upscale-staged), which reads the image and deposits the PNG there
// itself -- a 16-megapixel PNG never crosses this function (docs/audit/RAPPORT-ecarts-marche.md §3c).
// Abuse is bounded by the per-IP limits of /api/media/ticket.
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const serviceUrl = process.env.BG_REMOVAL_SERVICE_URL;
  const apiKey = process.env.BG_REMOVAL_API_KEY;
  if (!serviceUrl || !apiKey) return NextResponse.json({ ok: false, error: "The upscaler is not configured." }, { status: 500 });

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  const scale = Number(body?.scale);
  if (scale !== 2 && scale !== 4) return NextResponse.json({ ok: false, error: "Choose 2x or 4x." }, { status: 400 });
  const h: any = openStaged(body);
  if (!h.ok) return NextResponse.json({ ok: false, error: h.error }, { status: h.status });

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), 290_000);
  let res: Response;
  try {
    res = await fetch(`${serviceUrl.replace(/\/+$/, "")}/upscale-staged`, {
      method: "POST",
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({ jid: h.jid, ticket: h.serverTicket, scale }),
      signal: controller.signal,
    });
  } catch (err: any) {
    await discard(h);
    if (err?.name === "AbortError") return NextResponse.json({ ok: false, error: "Upscaling took too long. Try a smaller image." }, { status: 504 });
    await alertServerError("image-upscale", `unreachable: ${err?.message || "unknown error"}`);
    return NextResponse.json({ ok: false, error: "Could not reach the upscaling service." }, { status: 502 });
  } finally {
    clearTimeout(t);
  }
  const j = await res.json().catch(() => ({ ok: false, error: "Upscaling failed. Please try again." }));
  if (!res.ok || !j.ok) {
    await discard(h);
    if (res.status >= 500) await alertServerError("image-upscale", `service_error_${res.status}`);
  }
  return NextResponse.json(j, { status: res.ok ? 200 : res.status, headers: { "Cache-Control": "no-store" } });
}
