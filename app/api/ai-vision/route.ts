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

      // Release/commit boundary: release() only when OpenAI never actually
      // responded (nothing could have been billed). Once a response
      // exists, any failure to read it (including here, where the body
      // fails to parse) must never release -- a 2xx response means the
      // call was very likely already billed, so an unreadable body is
      // treated as a real, unknown cost via commit(null), never as zero.
      let data: any;
      try {
        data = await response.json();
      } catch (parseErr: any) {
        if (response.ok) {
          await guard.commit(null);
          await alertServerError("ai-vision", "response.ok but body failed to parse: " + (parseErr?.message || parseErr));
        } else {
          await guard.release();
          await alertServerError("ai-vision", "error response body failed to parse: " + (parseErr?.message || parseErr));
        }
        return NextResponse.json({ error: "API error" }, { status: 500 });
      }

      if (!response.ok) {
        await guard.release();
        if (response.status === 429) {
          await sendAlert("openai", data?.error?.code || "429");
          return NextResponse.json(
            { error: "This tool is temporarily at capacity. Please try again later." },
            { status: 503 }
          );
        }
        return NextResponse.json({ error: data?.error?.message || "API error" }, { status: 500 });
      }
      // `data?.` everywhere below: response.json() can resolve without
      // throwing to a non-object value (e.g. a literal `null` body) --
      // that's not a parse failure, so it skips the catch above, but
      // `data.usage` etc. would still throw before guard.commit() ever
      // runs, landing in the outer catch's release() and undercounting a
      // response.ok call that was almost certainly already billed. `?.`
      // makes actualAiCostMicros() see `undefined` and return null, which
      // guard.commit(null) already treats as a real, unknown cost -- never
      // released.
      await guard.commit(actualAiCostMicros(data?.usage));
      const text = data?.choices?.[0]?.message?.content || "";
      return NextResponse.json({ text });
    } catch (err: any) {
      // Reaches here only when fetch() itself throws (network failure,
      // DNS, timeout) before OpenAI ever responds -- no response ever
      // existed, so nothing could have been billed. Any failure *after* a
      // response exists (including an unparseable body) is handled above,
      // specifically to keep that release() here always true to "nothing
      // was billed" -- see the boundary comment above the inner try/catch.
      // (If commit() above already settled the reservation before this
      // catch is somehow still reached, guard.release() below is a safe
      // no-op -- see guard.js's `settled` flag.)
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
