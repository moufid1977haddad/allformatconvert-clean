import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });

    const openaiForm = new FormData();
    openaiForm.append("file", file);
    openaiForm.append("model", "whisper-1");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: openaiForm,
    });

    const data = await response.json();
    if (!response.ok) {
      if (response.status === 429) {
        await sendAlert("openai", data.error?.code || "429");
        return NextResponse.json(
          { error: "This tool is temporarily at capacity. Please try again later." },
          { status: 503 }
        );
      }
      return NextResponse.json({ error: data.error?.message || "API error" }, { status: 500 });
    }
    return NextResponse.json({ text: data.text });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}