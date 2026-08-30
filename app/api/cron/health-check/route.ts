import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";
import { supabaseAdmin } from "@/lib/quota/supabaseAdmin";
import { GLOBAL_SPEND_CAP_MICROS, ADOBE_TX_CAP } from "@/lib/quota/config";
import { currentUtcMonthKey, currentUtcDayKey } from "@/lib/quota/period";

export const maxDuration = 30;

type CheckResult = { ok: boolean; detail: string };

async function checkGotenberg(): Promise<CheckResult> {
  const url = process.env.GOTENBERG_URL;
  if (!url) return { ok: false, detail: "not_configured" };
  try {
    const res = await fetch(`${url.replace(/\/+$/, "")}/health`, { signal: AbortSignal.timeout(8000) });
    return { ok: res.ok, detail: String(res.status) };
  } catch {
    return { ok: false, detail: "unreachable" };
  }
}

async function checkOpenAI(): Promise<CheckResult> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return { ok: false, detail: "not_configured" };
  try {
    const res = await fetch("https://api.openai.com/v1/models", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    return { ok: res.ok, detail: String(res.status) };
  } catch {
    return { ok: false, detail: "unreachable" };
  }
}

// remove.bg's /account endpoint doesn't consume credits -- it's the free
// way to confirm both reachability and remaining balance in one call.
async function checkRemoveBg(): Promise<CheckResult> {
  const key = process.env.REMOVEBG_API_KEY;
  if (!key) return { ok: false, detail: "not_configured" };
  try {
    const res = await fetch("https://api.remove.bg/v1.0/account", {
      headers: { "X-Api-Key": key },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return { ok: false, detail: String(res.status) };
    const data = await res.json();
    const remaining = data?.data?.attributes?.credits?.total;
    if (typeof remaining === "number" && remaining < 5) {
      return { ok: false, detail: `low_credits_${remaining}` };
    }
    return { ok: true, detail: String(res.status) };
  } catch {
    return { ok: false, detail: "unreachable" };
  }
}

async function checkResend(): Promise<CheckResult> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, detail: "not_configured" };
  try {
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(8000),
    });
    return { ok: res.ok, detail: String(res.status) };
  } catch {
    return { ok: false, detail: "unreachable" };
  }
}

// Checks the pdf-tools service's own /health, which in turn reports whether
// Ghostscript, qpdf, and veraPDF are all actually runnable inside its
// container -- not just that the process is up.
async function checkPdfTools(): Promise<CheckResult> {
  const url = process.env.PDFTOOLS_SERVICE_URL;
  if (!url) return { ok: false, detail: "not_configured" };
  try {
    const res = await fetch(`${url.replace(/\/+$/, "")}/health`, { signal: AbortSignal.timeout(8000) });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.ok) {
      const failing = data?.binaries
        ? Object.entries(data.binaries).filter(([, v]: any) => !v.ok).map(([k]) => k).join(",")
        : "unknown";
      return { ok: false, detail: `unhealthy_${failing || res.status}` };
    }
    return { ok: true, detail: String(res.status) };
  } catch {
    return { ok: false, detail: "unreachable" };
  }
}

// GoTrue's dedicated health route -- the piece signup/signin/reset actually
// depend on, checked for free with no auth flow or row read.
async function checkSupabaseAuth(): Promise<CheckResult> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return { ok: false, detail: "not_configured" };
  try {
    const res = await fetch(`${url.replace(/\/+$/, "")}/auth/v1/health`, {
      headers: { apikey: anonKey },
      signal: AbortSignal.timeout(8000),
    });
    return { ok: res.ok, detail: String(res.status) };
  } catch {
    return { ok: false, detail: "unreachable" };
  }
}

async function buildDailyDigest() {
  const monthKey = currentUtcMonthKey();
  const dayStart = `${currentUtcDayKey()}T00:00:00.000Z`;

  const { data: spendRow, error: spendErr } = await supabaseAdmin
    .from("usage_counters").select("value")
    .eq("bucket_key", "global_spend_microusd").eq("period_key", monthKey).maybeSingle();
  if (spendErr) console.error("health-check digest: global_spend_microusd read failed (non-fatal):", spendErr.message);
  const { data: adobeRow, error: adobeErr } = await supabaseAdmin
    .from("usage_counters").select("value")
    .eq("bucket_key", "adobe_tx").eq("period_key", monthKey).maybeSingle();
  if (adobeErr) console.error("health-check digest: adobe_tx read failed (non-fatal):", adobeErr.message);

  const { data: monthEvents, error: monthEventsErr } = await supabaseAdmin
    .from("usage_events").select("tool")
    .eq("outcome", "accepted").gte("created_at", `${monthKey}-01T00:00:00.000Z`);
  if (monthEventsErr) console.error("health-check digest: monthly usage_events read failed (non-fatal):", monthEventsErr.message);
  const toolCounts: Record<string, number> = {};
  for (const row of monthEvents || []) {
    if (!row.tool) continue;
    toolCounts[row.tool] = (toolCounts[row.tool] || 0) + 1;
  }
  const topTools = Object.entries(toolCounts).sort((a, b) => b[1] - a[1]).slice(0, 3);

  const { data: todaysDenials, error: denialsErr } = await supabaseAdmin
    .from("usage_events").select("outcome").gte("created_at", dayStart)
    .in("outcome", ["denied_ip_hour", "denied_ip_day", "denied_global_spend", "denied_adobe_cap", "denied_user_quota"]);
  if (denialsErr) console.error("health-check digest: today's denials read failed (non-fatal):", denialsErr.message);
  const denialCounts: Record<string, number> = {};
  for (const row of todaysDenials || []) {
    denialCounts[row.outcome] = (denialCounts[row.outcome] || 0) + 1;
  }

  const spendUsd = ((spendRow?.value || 0) / 1_000_000).toFixed(2);
  const capUsd = (GLOBAL_SPEND_CAP_MICROS / 1_000_000).toFixed(2);
  const adobeUsed = adobeRow?.value || 0;
  const topToolsStr = topTools.length ? topTools.map(([t, c]) => `${t}(${c})`).join(", ") : "none";
  const ipHourDenials = (denialCounts.denied_ip_hour || 0) + (denialCounts.denied_ip_day || 0);
  const capDenials = (denialCounts.denied_global_spend || 0) + (denialCounts.denied_adobe_cap || 0);
  const quotaDenials = denialCounts.denied_user_quota || 0;

  // A capped-out global spend or Adobe counter is informational here, never
  // a dependency failure -- see spec §5, "Voluntary caps never read as
  // outages." This digest is a separate, unconditional daily message, not
  // routed through the per-dependency sendAlert(service, status) failure
  // path above.
  return `spend $${spendUsd}/$${capUsd}, adobe ${adobeUsed}/${ADOBE_TX_CAP}, top tools: ${topToolsStr}, refusals today: ip=${ipHourDenials} cap=${capDenials} quota=${quotaDenials}`;
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Lets the alert channel itself be verified on demand, without waiting
  // for (or faking) a real dependency failure.
  if (new URL(request.url).searchParams.get("test") === "true") {
    await sendAlert("test", "manual_trigger");
    return NextResponse.json({ sent: true });
  }

  const checks: Record<string, CheckResult> = {
    gotenberg: await checkGotenberg(),
    openai: await checkOpenAI(),
    "remove.bg": await checkRemoveBg(),
    resend: await checkResend(),
    "supabase-auth": await checkSupabaseAuth(),
    "pdf-tools": await checkPdfTools(),
  };

  for (const [service, result] of Object.entries(checks)) {
    if (!result.ok) await sendAlert(service, result.detail);
  }

  const digest = await buildDailyDigest();
  await sendAlert("daily-digest", digest);

  // Housekeeping: fixed-window counter rows and event-log rows both grow
  // unbounded without pruning (spec §8).
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
  const { error: ipRateDeleteErr } = await supabaseAdmin
    .from("usage_counters").delete().like("bucket_key", "ip_rate:%").lt("updated_at", twoDaysAgo);
  if (ipRateDeleteErr) console.error("health-check housekeeping: ip_rate counter prune failed (non-fatal):", ipRateDeleteErr.message);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
  const { error: eventsDeleteErr } = await supabaseAdmin
    .from("usage_events").delete().lt("created_at", ninetyDaysAgo);
  if (eventsDeleteErr) console.error("health-check housekeeping: usage_events prune failed (non-fatal):", eventsDeleteErr.message);

  return NextResponse.json({ checks });
}
