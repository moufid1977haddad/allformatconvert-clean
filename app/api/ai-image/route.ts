import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";
import { guardPaidRoute } from "@/lib/quota/guard";
import { actualImageCostMicros } from "@/lib/quota/config";
import { reserveImageGen } from "@/lib/quota/imageGen";
import { alertServerError } from "@/lib/quota/errorAlerts";

// AI Image Generator (docs/audit/RAPPORT-ecarts-marche.md §3d). Everything that costs money is decided HERE:
// model, quality, number of images. The browser sends only the prompt and one of three sizes.
const MODEL = "gpt-image-2";
const QUALITY = "low";
const SIZES = ["1024x1024", "1024x1536", "1536x1024"];
const MAX_IMAGE_PROMPT_CHARS = 1000;
const FORBIDDEN = ["model", "quality", "n", "moderation", "system", "output_format", "background"];

export const maxDuration = 120;

export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }
  const bad = FORBIDDEN.find((f) => body && Object.prototype.hasOwnProperty.call(body, f));
  if (bad) return NextResponse.json({ error: `The "${bad}" field is decided by the server and cannot be sent.` }, { status: 400 });
  const prompt = typeof body?.prompt === "string" ? body.prompt.trim() : "";
  if (!prompt) return NextResponse.json({ error: "Describe the image you want." }, { status: 400 });
  if (prompt.length > MAX_IMAGE_PROMPT_CHARS) {
    return NextResponse.json({ error: `Descriptions are limited to ${MAX_IMAGE_PROMPT_CHARS} characters.` }, { status: 400 });
  }
  const size = SIZES.includes(body?.size) ? body.size : null;
  if (!size) return NextResponse.json({ error: "Unsupported size." }, { status: 400 });

  // 1) the generator's own limits (per visitor per day, own monthly budget), then 2) the shared guard.
  const own = await reserveImageGen(req);
  if (!own.ok) return NextResponse.json({ error: own.error }, { status: own.status, headers: { "Retry-After": String(own.retryAfter) } });
  const guard = await guardPaidRoute(req, { route: "ai-image", tool: "image-generator" });
  if (!guard.ok) {
    await own.release();
    return guard.response;
  }

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify({ model: MODEL, prompt, size, quality: QUALITY, n: 1, output_format: "webp", output_compression: 90, moderation: "auto" }),
    });
  } catch (err: any) {
    // No response at all: nothing can have been billed.
    await guard.release();
    await own.release();
    await alertServerError("ai-image", err?.message || String(err));
    return NextResponse.json({ error: "The image service could not be reached. Please try again." }, { status: 502 });
  }

  let data: any;
  try {
    data = await response.json();
  } catch (e: any) {
    if (response.ok) {
      await guard.commit(null);
      await own.settle(null);
    } else {
      await guard.release();
      await own.release();
    }
    await alertServerError("ai-image", "unreadable response: " + (e?.message || e));
    return NextResponse.json({ error: "Image generation failed. Please try again." }, { status: 500 });
  }

  if (!response.ok) {
    await guard.release();
    await own.release();
    const code = data?.error?.code || "";
    if (code === "moderation_blocked" || /safety|moderation/i.test(data?.error?.message || "")) {
      return NextResponse.json({ error: "This description was refused by the safety filter. Please describe something else." }, { status: 400 });
    }
    if (response.status === 429) {
      await sendAlert("openai", code || "429");
      return NextResponse.json({ error: "The image generator is busy. Please try again in a minute." }, { status: 503 });
    }
    await alertServerError("ai-image", `provider_${response.status}_${code}`);
    return NextResponse.json({ error: "Image generation failed. Please try again." }, { status: 502 });
  }

  const cost = actualImageCostMicros(data?.usage);
  await guard.commit(cost);
  await own.settle(cost);
  const b64 = data?.data?.[0]?.b64_json;
  if (typeof b64 !== "string" || !b64) {
    await alertServerError("ai-image", "2xx without image");
    return NextResponse.json({ error: "Image generation failed. Please try again." }, { status: 502 });
  }
  const bytes = Buffer.from(b64, "base64");
  // Never hand over something that is not the image we asked for (RIFF....WEBP).
  if (bytes.length < 100 || bytes.toString("latin1", 0, 4) !== "RIFF" || bytes.toString("latin1", 8, 12) !== "WEBP") {
    await alertServerError("ai-image", "unexpected image format");
    return NextResponse.json({ error: "Image generation failed. Please try again." }, { status: 502 });
  }
  return new NextResponse(bytes, { status: 200, headers: { "Content-Type": "image/webp", "Cache-Control": "no-store" } });
}
