import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";
import { guardPaidRoute } from "@/lib/quota/guard";
import { MAX_AUDIO_UPLOAD_BYTES } from "@/lib/quota/limits";
import { actualAiTranscribeCostMicros } from "@/lib/quota/config";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const tool = formData.get("tool") as string | null;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    if (file.size > MAX_AUDIO_UPLOAD_BYTES) {
      const maxMb = (MAX_AUDIO_UPLOAD_BYTES / (1024 * 1024)).toFixed(0);
      return NextResponse.json({ error: `Audio files are limited to ${maxMb} MB.` }, { status: 400 });
    }

    const guard = await guardPaidRoute(req, { route: "ai-transcribe", tool: tool || undefined });
    if (!guard.ok) return guard.response;

    const openaiForm = new FormData();
    openaiForm.append("file", file);
    openaiForm.append("model", "whisper-1");
    // verbose_json adds a real `duration` (seconds) to the response, used
    // below to reconcile the worst-case reservation down to the actual
    // cost -- `text` is still present, so the client-facing shape (only
    // `data.text` is ever returned to the browser) is unchanged.
    openaiForm.append("response_format", "verbose_json");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: openaiForm,
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
    await guard.commit(actualAiTranscribeCostMicros(data.duration));
    return NextResponse.json({ text: data.text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
