import { NextResponse } from 'next/server';
import { mintTicket, readConfig, validateRequest } from '@/lib/media/ticket';
import { checkHourDayRateLimit } from '@/lib/quota/hourDayRateLimit';
import { MAX_OFFICE_STAGED_BYTES, MAX_PDF_COMPRESS_STAGED_BYTES, MAX_PDFTOOLS_STAGED_BYTES } from '@/lib/quota/limits';

// Documents whose tool has its own measured ceiling (allow-list; anything else gets the Office one).
// 'pdf-render' (P32): a PDF whose pages an iPhone / iPad could not draw, drawn by pdf-tools (/api/pdf-render).
// 'pdf-ocr' (P33): a PDF whose pages an iPhone / iPad could not recognize, recognized by pdf-tools (/api/pdf-ocr).
const STAGE_PURPOSE_CAPS = { 'pdf-compress': MAX_PDF_COMPRESS_STAGED_BYTES, 'pdf-render': MAX_PDFTOOLS_STAGED_BYTES, 'pdf-ocr': MAX_PDFTOOLS_STAGED_BYTES };

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
  const purposeCap = isStage && typeof body.purpose === 'string' && Object.prototype.hasOwnProperty.call(STAGE_PURPOSE_CAPS, body.purpose)
    ? STAGE_PURPOSE_CAPS[body.purpose] : MAX_OFFICE_STAGED_BYTES;
  const maxBytes = isStage ? Math.min(cfg.maxBytes, purposeCap) : cfg.maxBytes;
  const bucket = isStage ? 'office_rate' : 'media_rate';
  const v = validateRequest(body, maxBytes);
  if (!v.ok) return NextResponse.json({ error: 'bad_request', message: v.error }, { status: v.status });

  // Own buckets, separate from the paid-tool bucket (ip_rate:*): a visitor
  // converting videos must not use up their AI-tool allowance, and vice versa.
  // Hour and day are reserved together, atomically (lib/quota/hourDayRateLimit.js).
  try {
    const rl = await checkHourDayRateLimit(req, { prefix: bucket, perHour: cfg.perHour, perDay: cfg.perDay });
    if (!rl.allowed && rl.layer === 'hour') {
      return NextResponse.json({ error: 'rate_limited', message: 'Too many conversions from your connection this hour. Please try again later.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } });
    }
    if (!rl.allowed) {
      return NextResponse.json({ error: 'rate_limited', message: 'Daily conversion limit reached for your connection. Please try again tomorrow.' }, { status: 429, headers: { 'Retry-After': String(rl.retryAfterSeconds) } });
    }
  } catch (e) {
    console.error('[media/ticket] rate-limit backend failed:', e && e.message);
    return NextResponse.json({ error: 'unavailable', message: 'The video service is temporarily unavailable. Please try again shortly.' }, { status: 503 });
  }

  const t = mintTicket({ secret: cfg.secret, op: v.op, maxBytes });
  return NextResponse.json({ jid: t.jid, ticket: t.ticket, expiresAt: t.expiresAt }, { headers: { 'Cache-Control': 'no-store' } });
}
