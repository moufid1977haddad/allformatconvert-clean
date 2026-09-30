import { NextRequest, NextResponse } from "next/server";
import { alertServerError } from "@/lib/quota/errorAlerts";
import { reserveAiDetect } from "@/lib/quota/aiDetect";
import { logUsageEvent } from "@/lib/quota/logEvent";
import {
  requirePangramKey, detectWithPangram, countBillableWords, billedWords, pangramCostMicros,
  AI_DETECT_MAX_WORDS, AI_DETECT_MIN_WORDS, AI_DETECT_MAX_CHARS,
} from "@/lib/ai/pangram";

// AI Detector through Pangram (docs/audit/RAPPORT-ai-detector-30-09.md, RAPPORT-p17-30-09.md). Spending is bounded
// by the detector's OWN limits (lib/quota/aiDetect.js: $50 a month, 2,000 words per visitor per day), not by the
// shared guard: the site-wide $20 cap of the other paid tools is never touched. Without PANGRAM_API_KEY every call is
// a loud 503 and an alert, never a silent fallback to another method.
export const maxDuration = 60;

const ROUTE = "ai-detect";
const TOOL = "ai-detector";

export async function POST(req: NextRequest) {
  let apiKey: string;
  try {
    apiKey = requirePangramKey();
  } catch (e) {
    await alertServerError(ROUTE, (e as Error).message);
    return NextResponse.json({ error: "The AI detector is not available: its detection service is not configured." }, { status: 503 });
  }
  let text: unknown;
  try {
    ({ text } = await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  if (typeof text !== "string" || !text.trim()) return NextResponse.json({ error: "No text provided" }, { status: 400 });
  const clean = text.trim();
  if (clean.length > AI_DETECT_MAX_CHARS) {
    return NextResponse.json({ error: `Up to ${AI_DETECT_MAX_CHARS.toLocaleString("en-US")} characters per analysis (this text has ${clean.length.toLocaleString("en-US")}).` }, { status: 400 });
  }
  const words = countBillableWords(clean);
  if (words < AI_DETECT_MIN_WORDS) return NextResponse.json({ error: `Paste at least ${AI_DETECT_MIN_WORDS} words (this text has ${words}).` }, { status: 400 });
  if (words > AI_DETECT_MAX_WORDS) return NextResponse.json({ error: `Up to ${AI_DETECT_MAX_WORDS} words per analysis (this text has ${words}).` }, { status: 400 });
  const costMicros = pangramCostMicros(words);

  let own: Awaited<ReturnType<typeof reserveAiDetect>>;
  try {
    own = await reserveAiDetect(req, { words: billedWords(words), costMicros });
  } catch (err) {
    // The counters could not be read: nothing is spent without a reservation.
    await alertServerError(ROUTE, "reservation failed: " + ((err as Error)?.message || String(err)));
    return NextResponse.json({ error: "The AI detector failed. Please try again." }, { status: 503 });
  }
  if (!own.ok) {
    // usage_events only accepts its existing outcomes (no schema change here): the detector's own monthly budget is
    // logged as a spend-cap refusal, told apart from the site-wide one by route "ai-detect".
    await logUsageEvent({ route: ROUTE, tool: TOOL, outcome: own.status === 429 ? "denied_ip_day" : "denied_global_spend" });
    return NextResponse.json({ error: own.error }, { status: own.status, headers: { "Retry-After": String(own.retryAfter) } });
  }

  try {
    const result = await detectWithPangram(clean, { apiKey });
    await logUsageEvent({ route: ROUTE, tool: TOOL, outcome: "accepted", estimatedCostMicros: costMicros });
    return NextResponse.json({ ...result, words });
  } catch (err) {
    const e = err as Error & { billed?: boolean; status?: number };
    // billed === false only when Pangram refused to create the task; anything later may have been charged, so the
    // reservation stays counted (an over-count, never an under-count).
    if (e?.billed === false) {
      // A failed give-back leaves the counters too high (safe direction), but must be visible: retried once, then alerted.
      try {
        await own.release();
      } catch {
        try {
          await own.release();
        } catch (releaseErr) {
          await alertServerError(ROUTE, "release failed (counters over-count, nothing was spent): " + ((releaseErr as Error)?.message || String(releaseErr)));
        }
      }
      await logUsageEvent({ route: ROUTE, tool: TOOL, outcome: "provider_failed" });
    } else {
      await logUsageEvent({ route: ROUTE, tool: TOOL, outcome: "accepted", estimatedCostMicros: costMicros });
    }
    await alertServerError(ROUTE, e?.message || String(err));
    const busy = e?.status === 429;
    return NextResponse.json(
      { error: busy ? "The AI detector is temporarily at capacity. Please try again later." : "The AI detector failed. Please try again." },
      { status: busy ? 503 : 502 }
    );
  }
}
