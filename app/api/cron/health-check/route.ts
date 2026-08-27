import { NextRequest, NextResponse } from "next/server";
import { sendAlert } from "@/lib/alert";

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

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const checks: Record<string, CheckResult> = {
    gotenberg: await checkGotenberg(),
    openai: await checkOpenAI(),
    "remove.bg": await checkRemoveBg(),
    resend: await checkResend(),
    "supabase-auth": await checkSupabaseAuth(),
  };

  for (const [service, result] of Object.entries(checks)) {
    if (!result.ok) await sendAlert(service, result.detail);
  }

  return NextResponse.json({ checks });
}
