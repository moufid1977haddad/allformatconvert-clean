import { NextResponse } from 'next/server';
import { mintTicket, readConfig, validateRequest } from '@/lib/media/ticket';
import { incrementCounter, decrementCounter } from '@/lib/quota/counters';
import { currentUtcHourKey, currentUtcDayKey, secondsUntilNextUtcHour, secondsUntilNextUtcDay } from '@/lib/quota/period';
import { hashIp, getClientIp } from '@/lib/quota/ipHash';
import { MAX_OFFICE_STAGED_BYTES } from '@/lib/quota/limits';

// Issues a one-job upload ticket for the media-processing service. The file
// itself never comes through here: only this small JSON does.
export async function POST(req) {
  const cfg = readConfig();
  if (!cfg.ok) {
    // Names only, never values.
    console.error('[media/ticket] not configured, missing:', cfg.missing.join(', '));
    return NextResponse.json({ error: 'not_configured', message: 'The video service is not configured yet.' }, { status: 503 });
  }

  let body;
  try { body = await req.json(); } catch { body = null; }
  // Documents (op 'stage') have their own, measured ceiling and their own rate buckets.
  const isStage = body && body.op === 'stage';
  const maxBytes = isStage ? Math.min(cfg.maxBytes, MAX_OFFICE_STAGED_BYTES) : cfg.maxBytes;
  const bucket = isStage ? 'office_rate' : 'media_rate';
  const v = validateRequest(body, maxBytes);
  if (!v.ok) return NextResponse.json({ error: 'bad_request', message: v.error }, { status: v.status });

  // Own buckets, separate from the paid-tool bucket (ip_rate:*): a visitor
  // converting videos must not use up their AI-tool allowance, and vice versa.
  const ip = getClientIp(req);
  const hash = ip ? hashIp(ip) : 'unknown-ip';
  const hourKey = currentUtcHourKey();
  const dayKey = currentUtcDayKey();
  try {
    const hour = await incrementCounter(`${bucket}:hour:${hash}`, hourKey, 1, cfg.perHour);
    if (!hour.allowed) {
      return NextResponse.json({ error: 'rate_limited', message: 'Too many conversions from your connection this hour. Please try again later.' }, { status: 429, headers: { 'Retry-After': String(secondsUntilNextUtcHour()) } });
    }
    const day = await incrementCounter(`${bucket}:day:${hash}`, dayKey, 1, cfg.perDay);
    if (!day.allowed) {
      await decrementCounter(`${bucket}:hour:${hash}`, hourKey, 1);
      return NextResponse.json({ error: 'rate_limited', message: 'Daily conversion limit reached for your connection. Please try again tomorrow.' }, { status: 429, headers: { 'Retry-After': String(secondsUntilNextUtcDay()) } });
    }
  } catch (e) {
    console.error('[media/ticket] rate-limit backend failed:', e && e.message);
    return NextResponse.json({ error: 'unavailable', message: 'The video service is temporarily unavailable. Please try again shortly.' }, { status: 503 });
  }

  const t = mintTicket({ secret: cfg.secret, op: v.op, maxBytes });
  return NextResponse.json({ jid: t.jid, ticket: t.ticket, expiresAt: t.expiresAt }, { headers: { 'Cache-Control': 'no-store' } });
}
