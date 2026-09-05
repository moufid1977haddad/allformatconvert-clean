import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";
import { guardPaidRoute } from "@/lib/quota/guard";
import { MAX_VISION_IMAGE_BYTES } from "@/lib/quota/limits";
import { actualAiCostMicros } from "@/lib/quota/config";
import { alertServerError } from "@/lib/quota/errorAlerts";

export async function POST(req: NextRequest) {
  try {
    const { image, prompt, tool } = await req.json();
    if (!image) return NextResponse.json({ error: "No image provided" }, { status: 400 });

    const imageBytes = Buffer.byteLength(image, "base64");
    if (imageBytes > MAX_VISION_IMAGE_BYTES) {
      const maxMb = (MAX_VISION_IMAGE_BYTES / (1024 * 1024)).toFixed(0);
      return NextResponse.json({ error: `Images are limited to ${maxMb} MB.` }, { status: 400 });
    }

    const guard = await guardPaidRoute(req, { route: "ai-vision", tool });
    if (!guard.ok) return guard.response;

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          max_tokens: 500,
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: prompt || "Generate a creative caption for this image." },
                { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } },
              ],
            },
          ],
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        await guard.release();
        if (response.status === 429) {
          await sendAlert("openai", data.error?.code || "429");
          return NextResponse.json(
            { error: "This tool is temporarily at capacity. Please try again later." },
            { status: 503 }
          );
        }
        return NextResponse.json({ error: data.error?.message || "API error" }, { status: 500 });
      }
      await guard.commit(actualAiCostMicros(data.usage));
      const text = data.choices?.[0]?.message?.content || "";
      return NextResponse.json({ text });
    } catch (err: any) {
      // Anything thrown here happens before a real cost is established (or
      // after commit() has already settled the reservation, in which case
      // guard.release() below is a safe no-op -- see guard.js's `settled`
      // flag). The case this specifically fixes: fetch() itself throwing
      // (network failure, DNS, timeout) before OpenAI ever responds -- that
      // used to skip past the release() above and leak the worst-case
      // reservation for the rest of the month. Mirrors
      // convert-to-pdf/route.ts's ConvertAPI path.
      await guard.release();
      console.error("Unhandled error in /api/ai-vision (post-guard):", err?.message || err);
      await alertServerError("ai-vision", err?.message || String(err));
      return NextResponse.json({ error: err?.message || "API error" }, { status: 500 });
    }
  } catch (e: any) {
    console.error("Unhandled error in /api/ai-vision:", e?.message || e);
    await alertServerError("ai-vision", e?.message || String(e));
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
