import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";
import { guardPaidRoute } from "@/lib/quota/guard";
import { MAX_VISION_IMAGE_BYTES } from "@/lib/quota/limits";
import { actualAiCostMicros } from "@/lib/quota/config";

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
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
