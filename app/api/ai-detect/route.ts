import { NextRequest, NextResponse } from "next/server";
import { guardPaidRoute } from "@/lib/quota/guard";
import { alertServerError } from "@/lib/quota/errorAlerts";
import {
  requirePangramKey, detectWithPangram, countWords, pangramCostMicros, AI_DETECT_MAX_WORDS, AI_DETECT_MIN_WORDS,
} from "@/lib/ai/pangram";

// AI Detector through Pangram -- PREPARED, NOT IN SERVICE (docs/audit/RAPPORT-ai-detector-30-09.md). The page
// (app/tools/ai-tools/ai-detector/page.jsx) does not call this route yet. Without PANGRAM_API_KEY every call is a
// loud 503 and an alert, never a silent fallback to another method.
export async function POST(req: NextRequest) {
  let apiKey: string;
  try {
    apiKey = requirePangramKey();
  } catch (e) {
    await alertServerError("ai-detect", (e as Error).message);
    return NextResponse.json({ error: "The AI detector is not available: its detection service is not configured." }, { status: 503 });
  }
  let text: unknown;
  try {
    ({ text } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof text !== "string" || !text.trim()) return NextResponse.json({ error: "No text provided" }, { status: 400 });
  const words = countWords(text);
  if (words < AI_DETECT_MIN_WORDS) return NextResponse.json({ error: `Paste at least ${AI_DETECT_MIN_WORDS} words (this text has ${words}).` }, { status: 400 });
  if (words > AI_DETECT_MAX_WORDS) return NextResponse.json({ error: `Up to ${AI_DETECT_MAX_WORDS} words per analysis (this text has ${words}).` }, { status: 400 });

  const guard = await guardPaidRoute(req, { route: "ai-detect", tool: "ai-detector" });
  if (!guard.ok) return guard.response;
  try {
    const result = await detectWithPangram(text.trim(), { apiKey });
    await guard.commit(pangramCostMicros(words));
    return NextResponse.json({ ...result, words });
  } catch (err) {
    const e = err as Error & { billed?: boolean; status?: number };
    // billed === false only when Pangram refused to create the task; anything later may have been charged.
    if (e?.billed === false) await guard.release();
    else await guard.commit(null);
    await alertServerError("ai-detect", e?.message || String(err));
    const busy = e?.status === 429;
    return NextResponse.json(
      { error: busy ? "The AI detector is temporarily at capacity. Please try again later." : "The AI detector failed. Please try again." },
      { status: busy ? 503 : 502 }
    );
  }
}
