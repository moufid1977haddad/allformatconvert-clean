import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";
import { guardPaidRoute } from "@/lib/quota/guard";
import { checkPromptLength } from "@/lib/quota/limits";
import { actualAiCostMicros } from "@/lib/quota/config";

export async function POST(req: NextRequest) {
  try {
    const { system, prompt, tool } = await req.json();
    if (!prompt) return NextResponse.json({ error: "No prompt provided" }, { status: 400 });

    const promptCheck = checkPromptLength(prompt);
    if (!promptCheck.ok) return NextResponse.json({ error: promptCheck.message }, { status: 400 });

    const guard = await guardPaidRoute(req, { route: "ai", tool });
    if (!guard.ok) return guard.response;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        max_tokens: 1000,
        messages: [
          { role: "system", content: system || "You are a helpful assistant." },
          { role: "user", content: prompt },
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
