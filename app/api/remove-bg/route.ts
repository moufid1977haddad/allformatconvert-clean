import { NextRequest, NextResponse } from "next/server";
import { guardPaidRoute } from "@/lib/quota/guard";
import { MAX_REMOVEBG_UPLOAD_BYTES } from "@/lib/quota/limits";
import { alertServerError } from "@/lib/quota/errorAlerts";
import { buildServerToolError, insertToolError } from "@/lib/reportError";

// Give the background-removal service round-trip (up to SERVICE_TIMEOUT_MS
// below) enough headroom inside the function's own execution budget --
// same 60s-service / 90s-function ratio as app/api/pdf-repair/route.ts.
// Vercel Hobby allows up to 300s (confirmed live against Vercel's docs,
// 2026-09-14): this is nowhere near that ceiling. It is sized against the
// worst case actually measured -- a cold Railway wake-up plus a large
// image processed roughly 9-10s end to end (docs/audit/RAPPORT-detourage-phase1.md,
// docs/audit/RAPPORT-detourage-phase2.md) -- with several times that in
// slack, not against the plan limit.
export const maxDuration = 90;

const SERVICE_TIMEOUT_MS = 60_000;

export async function POST(req: NextRequest) {
  const serviceUrl = process.env.BG_REMOVAL_SERVICE_URL;
  const apiKey = process.env.BG_REMOVAL_API_KEY;

  if (!serviceUrl || !apiKey) {
    console.error("BG_REMOVAL_SERVICE_URL/BG_REMOVAL_API_KEY are not configured.");
    return NextResponse.json({ error: "Background removal is not configured." }, { status: 500 });
  }

  try {
    const { image, tool } = await req.json();
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    // This is the browser-resized copy (see page.jsx), never the visitor's
    // original file -- should always be small. A defensive ceiling against
    // Vercel's own ~4.4-4.7MB measured serverless payload limit (see
    // docs/audit/RAPPORT-pieces-jointes-contact.md), not the visitor-facing
    // size limit (that's MAX_REMOVEBG_ORIGINAL_BYTES, enforced client-side
    // in page.jsx before the resize ever happens).
    const imageBytes = Buffer.byteLength(image, "base64");
    if (imageBytes > MAX_REMOVEBG_UPLOAD_BYTES) {
      return NextResponse.json({ error: "The resized image is unexpectedly large. Try a different photo." }, { status: 400 });
    }

    const guard = await guardPaidRoute(req, { route: "remove-bg", tool });
    if (!guard.ok) return guard.response;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SERVICE_TIMEOUT_MS);

    let serviceResponse: Response;
    try {
      // ?output=mask: additive mode on the Railway service (default response
      // there is still the full composited cutout, unchanged, for any other
      // caller) -- see docs/audit/RAPPORT-detourage-taille-fichiers.md.
      serviceResponse = await fetch(`${serviceUrl.replace(/\/+$/, "")}/remove-background?output=mask`, {
        method: "POST",
        headers: {
          "X-API-Key": apiKey,
          "Content-Type": "application/octet-stream",
        },
        body: Buffer.from(image, "base64"),
        signal: controller.signal,
      });
    } catch (err: any) {
      await guard.release();
      if (err?.name === "AbortError") {
        await alertServerError("remove-bg", "timeout");
        await insertToolError(buildServerToolError({
          tool: "background-remover",
          file: null,
          error: new Error("timeout"),
          userAgent: req.headers.get("user-agent"),
        }));
        return NextResponse.json({ error: "Background removal timed out. Please try again." }, { status: 504 });
      }
      console.error("background-removal service request failed:", err?.message || "unknown error");
      await alertServerError("remove-bg", `unreachable: ${err?.message || "unknown error"}`);
      await insertToolError(buildServerToolError({
        tool: "background-remover",
        file: null,
        error: err,
        userAgent: req.headers.get("user-agent"),
      }));
      return NextResponse.json({ error: "Could not reach the background removal service." }, { status: 502 });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!serviceResponse.ok) {
      await guard.release();

      // 400 (invalid_image / empty_request) is the visitor's upload, not an
      // incident -- surfaced directly, no alert, no tool_errors row.
      if (serviceResponse.status === 400) {
        return NextResponse.json(
          { error: "The uploaded image could not be processed." },
          { status: 400 }
        );
      }

      console.error("background-removal service error:", serviceResponse.status);
      await alertServerError("remove-bg", `service_error_${serviceResponse.status}`);
      await insertToolError(buildServerToolError({
        tool: "background-remover",
        file: null,
        error: new Error(`service_error_${serviceResponse.status}`),
        userAgent: req.headers.get("user-agent"),
      }));

      if (serviceResponse.status === 429) {
        return NextResponse.json(
          { error: "This tool is temporarily at capacity. Please try again later." },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: "Background removal failed. Please try again." }, { status: 500 });
    }

    // The Railway service's compute cost is a flat monthly hosting cost, not
    // a metered per-call price -- same "no reconciliation" shape remove.bg
    // had (flat, deterministic cost per call), so commit() takes no argument.
    await guard.commit();
    const buffer = await serviceResponse.arrayBuffer();
    const base64 = Buffer.from(buffer).toString("base64");
    // This is the alpha MASK (grayscale PNG), not a composited image -- the
    // service only ever sees a resized copy of the visitor's photo, so it
    // cannot produce a full-resolution cutout itself. The caller (page.jsx)
    // recomposites this mask against the visitor's original full-resolution
    // file entirely client-side. See docs/audit/RAPPORT-detourage-taille-fichiers.md.
    return NextResponse.json({ mask: base64 });
  } catch (e: any) {
    console.error("Unhandled error in /api/remove-bg:", e?.message || e);
    await alertServerError("remove-bg", e?.message || String(e));
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
