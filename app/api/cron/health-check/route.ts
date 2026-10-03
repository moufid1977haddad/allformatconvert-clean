import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";
import { supabaseAdmin } from "@/lib/quota/supabaseAdmin";
import { GLOBAL_SPEND_CAP_MICROS, TOOL_ERROR_ALERT_THRESHOLD_PER_DAY, TOOL_MESSAGE_ALERT_THRESHOLD_PER_DAY } from "@/lib/quota/config";
import { currentUtcMonthKey, currentUtcDayKey } from "@/lib/quota/period";
import { checkStateTransition } from "@/lib/quota/alertState";
import { AI_DETECT_MONTHLY_BUDGET_MICROS } from "@/lib/quota/aiDetect";

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

// P30: Gotenberg's /health no longer covers Chromium, which runs in its own Railway project behind gotenberg-v2
// (services/gotenberg/edge): one tiny HTML conversion through the whole chain, the way our HTML tools call it.
async function checkGotenbergChromium(): Promise<CheckResult> {
  const url = process.env.GOTENBERG_URL;
  const user = process.env.GOTENBERG_USERNAME;
  const pass = process.env.GOTENBERG_PASSWORD;
  if (!url || !user || !pass) return { ok: false, detail: "not_configured" };
  try {
    const form = new FormData();
    form.append("files", new Blob(["<!doctype html><html><body><p>health check</p></body></html>"], { type: "text/html" }), "index.html");
    const res = await fetch(`${url.replace(/\/+$/, "")}/forms/chromium/convert/html`, {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(`${user}:${pass}`).toString("base64") },
      body: form,
      signal: AbortSignal.timeout(20000),
    });
    const head = Buffer.from(await res.arrayBuffer()).subarray(0, 5).toString();
    return { ok: res.ok && head === "%PDF-", detail: res.ok ? (head === "%PDF-" ? "200" : "non_pdf") : String(res.status) };
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

async function checkBackgroundRemoval(): Promise<CheckResult> {
  const url = process.env.BG_REMOVAL_SERVICE_URL;
  if (!url) return { ok: false, detail: "not_configured" };
  try {
    const res = await fetch(`${url.replace(/\/+$/, "")}/health`, { signal: AbortSignal.timeout(8000) });
    return { ok: res.ok, detail: String(res.status) };
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
  // The AI Detector's own budget (lib/quota/aiDetect.js, P17), separate from the site-wide cap.
  const { data: aiDetectRow, error: aiDetectErr } = await supabaseAdmin
    .from("usage_counters").select("value")
    .eq("bucket_key", "aidetect_spend_micros").eq("period_key", monthKey).maybeSingle();
  if (aiDetectErr) console.error("health-check digest: aidetect_spend_micros read failed (non-fatal):", aiDetectErr.message);

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
    .from("usage_events").select("outcome, route").gte("created_at", dayStart)
    .in("outcome", ["denied_ip_hour", "denied_ip_day", "denied_global_spend", "denied_user_quota"]);
  if (denialsErr) console.error("health-check digest: today's denials read failed (non-fatal):", denialsErr.message);
  const denialCounts: Record<string, number> = {};
  for (const row of todaysDenials || []) {
    // The AI Detector logs its own budget's refusals as denied_global_spend (existing outcomes only): counted apart.
    const key = row.route === "ai-detect" && row.outcome === "denied_global_spend" ? "ai_detect_budget" : row.outcome;
    denialCounts[key] = (denialCounts[key] || 0) + 1;
  }

  const spendUsd = ((spendRow?.value || 0) / 1_000_000).toFixed(2);
  const capUsd = (GLOBAL_SPEND_CAP_MICROS / 1_000_000).toFixed(2);
  const topToolsStr = topTools.length ? topTools.map(([t, c]) => `${t}(${c})`).join(", ") : "none";
  const ipHourDenials = (denialCounts.denied_ip_hour || 0) + (denialCounts.denied_ip_day || 0);
  const capDenials = denialCounts.denied_global_spend || 0;
  const quotaDenials = denialCounts.denied_user_quota || 0;
  const aiDetectUsd = ((aiDetectRow?.value || 0) / 1_000_000).toFixed(2);
  const aiDetectCapUsd = (AI_DETECT_MONTHLY_BUDGET_MICROS / 1_000_000).toFixed(2);

  // A capped-out global spend is informational here, never a dependency
  // failure -- see spec §5, "Voluntary caps never read as outages." This
  // digest is a separate, unconditional daily message, not routed through
  // the per-dependency sendAlert(service, status) failure path above.
  return `spend $${spendUsd}/$${capUsd}, top tools: ${topToolsStr}, refusals today: ip=${ipHourDenials} cap=${capDenials} quota=${quotaDenials}; ai-detector $${aiDetectUsd}/$${aiDetectCapUsd} (budget refusals today: ${denialCounts.ai_detect_budget || 0})`;
}

// Distinguishes an isolated one-off failure from a tool that's
// systematically broken (see docs/audit/RAPPORT-remontee-erreurs.md):
// counts tool_errors rows per tool over the trailing 24h and alerts once
// per tool on crossing into "problem" state, using the same
// checkStateTransition machinery the per-dependency health checks above
// already use -- so a tool that's still over-threshold on tomorrow's run
// stays silent, and a matching "recovered" alert fires once it drops back
// under. Runs once per (daily) cron invocation, not a new scheduled job.
async function checkToolErrorRates() {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { data, error } = await supabaseAdmin
    .from("tool_errors").select("tool, error_type").gte("created_at", since);
  if (error) {
    console.error("health-check: tool_errors read failed (non-fatal):", error.message);
    return;
  }

  // P25 (03/10): messages a tool shows (error_type "ToolMessage", often a visitor's own mistake) are counted apart
  // from thrown failures and flagged at their own, higher bar; either one over its bar puts the tool in "problem".
  const counts: Record<string, number> = {};
  const shown: Record<string, number> = {};
  for (const row of data || []) {
    if (!row.tool) continue;
    if (row.error_type === "ToolMessage") { shown[row.tool] = (shown[row.tool] || 0) + 1; if (!(row.tool in counts)) counts[row.tool] = 0; }
    else counts[row.tool] = (counts[row.tool] || 0) + 1;
  }

  // Every tool that was over threshold on a PRIOR run and has since fallen
  // silent (zero rows today) needs its own transition check too, so a
  // recovery still fires -- not just tools present in today's counts.
  const { data: activeProblems, error: activeErr } = await supabaseAdmin
    .from("usage_counters").select("bucket_key")
    .like("bucket_key", "alert_state:tool-error-rate:%").eq("value", 1);
  if (activeErr) console.error("health-check: active tool-error-rate state read failed (non-fatal):", activeErr.message);
  for (const row of activeProblems || []) {
    const tool = row.bucket_key.replace("alert_state:tool-error-rate:", "");
    if (!(tool in counts)) counts[tool] = 0;
  }

  for (const [tool, count] of Object.entries(counts)) {
    const messages = shown[tool] || 0;
    const isProblem = count >= TOOL_ERROR_ALERT_THRESHOLD_PER_DAY || messages >= TOOL_MESSAGE_ALERT_THRESHOLD_PER_DAY;
    const transition = await checkStateTransition(`tool-error-rate:${tool}`, isProblem);
    if (transition.alert) {
      await sendAlert(
        "tool-error-rate",
        transition.recovered ? `recovered: ${tool}` : `${tool}: ${count} failures and ${messages} error messages shown in the last 24h (thresholds ${TOOL_ERROR_ALERT_THRESHOLD_PER_DAY} and ${TOOL_MESSAGE_ALERT_THRESHOLD_PER_DAY})`
      );
    }
  }
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
    "gotenberg-chromium": await checkGotenbergChromium(),
    openai: await checkOpenAI(),
    "background-removal": await checkBackgroundRemoval(),
    resend: await checkResend(),
    "supabase-auth": await checkSupabaseAuth(),
    "pdf-tools": await checkPdfTools(),
  };

  // P30: what each dependency answered (statuses only), readable in the function log after a manual run.
  console.log("[health-check]", Object.entries(checks).map(([k, v]) => `${k}=${v.ok ? "ok" : "FAIL"}:${v.detail}`).join(" "));

  // One alert per incident, not one per cron run: a service that's still
  // down on the next run stays silent, and a matching alert fires once it
  // comes back. State persists in usage_counters via checkStateTransition.
  for (const [service, result] of Object.entries(checks)) {
    const transition = await checkStateTransition(`health:${service}`, !result.ok);
    if (transition.alert) {
      await sendAlert(service, transition.recovered ? "recovered" : result.detail);
    }
  }

  await checkToolErrorRates();

  const digest = await buildDailyDigest();
  await sendAlert("daily-digest", digest);

  // Housekeeping: fixed-window counter rows and event-log rows both grow
  // unbounded without pruning (spec §8).
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString();
  const { error: ipRateDeleteErr } = await supabaseAdmin
    .from("usage_counters").delete().like("bucket_key", "ip_rate:%").lt("updated_at", twoDaysAgo);
  if (ipRateDeleteErr) console.error("health-check housekeeping: ip_rate counter prune failed (non-fatal):", ipRateDeleteErr.message);
  // P30: the 10-minute provider failure buckets (lib/providerIncident.js) are only read for 20 minutes.
  const { error: providerFailDeleteErr } = await supabaseAdmin
    .from("usage_counters").delete().like("bucket_key", "provider_fail:%").lt("updated_at", twoDaysAgo);
  if (providerFailDeleteErr) console.error("health-check housekeeping: provider_fail counter prune failed (non-fatal):", providerFailDeleteErr.message);
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
  const { error: eventsDeleteErr } = await supabaseAdmin
    .from("usage_events").delete().lt("created_at", ninetyDaysAgo);
  if (eventsDeleteErr) console.error("health-check housekeeping: usage_events prune failed (non-fatal):", eventsDeleteErr.message);
  const { error: toolErrorsDeleteErr } = await supabaseAdmin
    .from("tool_errors").delete().lt("created_at", ninetyDaysAgo);
  if (toolErrorsDeleteErr) console.error("health-check housekeeping: tool_errors prune failed (non-fatal):", toolErrorsDeleteErr.message);

  return NextResponse.json({ checks });
}
