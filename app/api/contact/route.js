import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { sendAlert } from '@/lib/alert';
import { alertServerError } from '@/lib/quota/errorAlerts';
import { buildServerToolError, insertToolError } from '@/lib/reportError';
import { supabaseAdmin } from '@/lib/quota/supabaseAdmin';
import { checkContactRateLimit } from '@/lib/quota/contactRateLimit';
import {
  MAX_CONTACT_ATTACHMENT_BYTES, MAX_CONTACT_ATTACHMENTS_TOTAL_BYTES, MAX_CONTACT_ATTACHMENTS_COUNT,
  CONTACT_ATTACHMENT_ACCEPTED_FORMATS, CONTACT_ATTACHMENT_ACCEPTED_LABEL,
} from '@/lib/quota/limits';
import { sniffFormat } from '@/app/lib/detectFileFormat';

// Generous headroom over MAX_CONTACT_ATTACHMENTS_TOTAL_BYTES for multipart
// boundaries and the text fields -- rejecting on Content-Length lets us skip
// parsing (and holding in memory) a deliberately oversized body before any
// of the real per-file/total checks below even run.
const MAX_REQUEST_BYTES = MAX_CONTACT_ATTACHMENTS_TOTAL_BYTES + 2 * 1024 * 1024;
const ALLOWED_FIELDS = new Set(['name', 'email', 'subject', 'message', 'attachments']);

function attachmentAcceptMessage() {
  const maxMb = (MAX_CONTACT_ATTACHMENT_BYTES / (1024 * 1024)).toFixed(0);
  return `Please attach ${CONTACT_ATTACHMENT_ACCEPTED_LABEL} images only, ${maxMb} MB or smaller each.`;
}

// Content-Length can be absent (chunked transfer-encoding) or simply lied
// about by a raw client -- it's only a fast-path rejection, never the real
// limit. This counts bytes as they actually arrive off the wire and cancels
// the stream the instant the total exceeds maxBytes, so request.formData()
// below is never handed more than maxBytes of body to buffer, regardless of
// what the client claimed or which encoding it used.
async function readBodyCapped(request, maxBytes) {
  if (!request.body) return { ok: true, blob: await request.blob() };
  const reader = request.body.getReader();
  const chunks = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > maxBytes) {
      await reader.cancel().catch(() => {});
      return { ok: false };
    }
    chunks.push(value);
  }
  return { ok: true, blob: new Blob(chunks) };
}

// Never trusts the file's declared name, extension, or browser-reported MIME
// type -- only the real bytes, via the same sniffer the image tools use to
// catch a mislabeled upload (see docs/audit/RAPPORT-tiff-paint.md). Returns
// { ok: true, buffer, filename, format } or { ok: false, message }.
async function validateAttachment(file) {
  if (!(file instanceof Blob)) return { ok: false, message: 'Invalid attachment.' };
  if (file.size === 0) return { ok: false, message: attachmentAcceptMessage() };
  if (file.size > MAX_CONTACT_ATTACHMENT_BYTES) {
    const maxMb = (MAX_CONTACT_ATTACHMENT_BYTES / (1024 * 1024)).toFixed(0);
    const fileMb = (file.size / (1024 * 1024)).toFixed(1);
    return { ok: false, message: `One of your images is ${fileMb} MB — attachments are limited to ${maxMb} MB each.` };
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const detected = sniffFormat(buffer);
  if (!detected || !CONTACT_ATTACHMENT_ACCEPTED_FORMATS.includes(detected.format)) {
    return { ok: false, message: attachmentAcceptMessage() };
  }

  const filename = (typeof file.name === 'string' && file.name.trim()) || `attachment.${detected.format}`;
  return { ok: true, buffer, filename, format: detected.format };
}

export async function POST(request) {
  // Cheapest checks first -- an already-throttled or oversized request
  // should never reach formData parsing, Supabase, or Resend.
  let rateCheck;
  try {
    rateCheck = await checkContactRateLimit(request);
  } catch (err) {
    console.error('contact rate-limit check failed:', err.message);
    return NextResponse.json({ error: 'Our server had a problem. Please try again in a few minutes.' }, { status: 503 });
  }
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: "You're sending messages too quickly. Please wait a bit and try again." },
      { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
    );
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength > MAX_REQUEST_BYTES) {
    return NextResponse.json({ error: 'Your message is too large to send, mostly because of the attachments.' }, { status: 413 });
  }

  // Real enforcement: caps the body stream itself, not just the (possibly
  // absent or dishonest) header checked above.
  const capped = await readBodyCapped(request, MAX_REQUEST_BYTES);
  if (!capped.ok) {
    return NextResponse.json({ error: 'Your message is too large to send, mostly because of the attachments.' }, { status: 413 });
  }

  let formData;
  try {
    formData = await new Request(request.url, { method: 'POST', headers: request.headers, body: capped.blob }).formData();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  for (const key of formData.keys()) {
    if (!ALLOWED_FIELDS.has(key)) {
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
  }

  const name = formData.get('name');
  const email = formData.get('email');
  const subject = formData.get('subject');
  const message = formData.get('message');

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const attachmentFiles = formData.getAll('attachments').filter((f) => f instanceof Blob && f.size > 0);
  if (attachmentFiles.length > MAX_CONTACT_ATTACHMENTS_COUNT) {
    return NextResponse.json(
      { error: `You can attach up to ${MAX_CONTACT_ATTACHMENTS_COUNT} images.` },
      { status: 400 }
    );
  }

  const attachments = [];
  let totalBytes = 0;
  for (const file of attachmentFiles) {
    const result = await validateAttachment(file);
    if (!result.ok) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }
    totalBytes += result.buffer.length;
    if (totalBytes > MAX_CONTACT_ATTACHMENTS_TOTAL_BYTES) {
      const maxMb = (MAX_CONTACT_ATTACHMENTS_TOTAL_BYTES / (1024 * 1024)).toFixed(0);
      return NextResponse.json({ error: `Your attachments add up to more than ${maxMb} MB total.` }, { status: 400 });
    }
    attachments.push({ filename: result.filename, content: result.buffer });
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  // The message (never the attachments -- see privacy policy §2) is durably
  // saved here, before any email is attempted, so a Resend failure below can
  // never cost the visitor their text.
  const { error: dbError } = await supabaseAdmin
    .from('contact_messages')
    .insert({ name, email, subject, message });

  if (dbError) {
    console.error('Failed to store contact message', dbError);
    // A DB-insert failure used to be visible only in Vercel's own console
    // logs -- invisible to both the alert channel and tool_errors, the same
    // two places every other route's server-side failure surfaces. Both are
    // wired here so a recurrence (a real Supabase hiccup, a schema drift)
    // gets noticed instead of silently losing the visitor's message.
    await alertServerError('contact', `db_insert_failed: ${dbError.message}`);
    await insertToolError(buildServerToolError({
      tool: 'contact',
      file: null,
      error: new Error(dbError.message || 'db_insert_failed'),
      userAgent: request.headers.get('user-agent'),
    }));
    return NextResponse.json({ error: 'Failed to save your message' }, { status: 500 });
  }

  // Everything below is best-effort notification, and nothing here is
  // allowed to turn the success response the visitor already earned back
  // into a failure.
  let notified = true;
  const ownerEmail = process.env.CONTACT_NOTIFICATION_TO;
  if (!ownerEmail) {
    // No hardcoded fallback address: a silently-wrong destination is worse
    // than a loud, visible misconfiguration.
    console.error('Contact message stored but CONTACT_NOTIFICATION_TO is not set -- no owner notification sent');
    notified = false;
    await sendAlert('resend', 'contact_notification_to_missing');
  } else {
    try {
      await resend.emails.send({
        from: `OnlineConverTools Contact <contact@${process.env.RESEND_EMAIL_DOMAIN}>`,
        to: [ownerEmail],
        replyTo: email,
        subject: `[Contact] ${subject} — ${name}`,
        text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}${attachments.length ? `\n\n(${attachments.length} image attachment${attachments.length > 1 ? 's' : ''})` : ''}`,
        // Attachments never touch disk or storage -- read straight from the
        // request into memory (validateAttachment above) and handed to
        // Resend, then dropped once this request ends. Only the owner
        // notification carries them, never the visitor's acknowledgment
        // below.
        ...(attachments.length ? { attachments } : {}),
      });
    } catch (emailError) {
      console.error('Contact message stored but notification email failed', emailError);
      notified = false;
      await sendAlert('resend', 'send_failed');
    }

    // Best-effort acknowledgment to the visitor -- deliberately isolated
    // from `notified` (that flag is specifically about whether the OWNER
    // was reached) and from the response itself. A failure here is logged
    // only, not alerted: it doesn't block the owner from seeing and
    // answering the message above, so it isn't an operational incident.
    try {
      await resend.emails.send({
        from: `OnlineConverTools Contact <contact@${process.env.RESEND_EMAIL_DOMAIN}>`,
        to: [email],
        replyTo: ownerEmail,
        subject: "We've received your message",
        text: `Hi ${name},\n\nThanks for contacting OnlineConverTools -- we've received your message about "${subject}" and will get back to you soon.\n\nIf anything is urgent, just reply directly to this email.\n\n— OnlineConverTools`,
      });
    } catch (ackError) {
      console.error('Contact acknowledgment email to visitor failed (non-fatal)', ackError);
    }
  }

  return NextResponse.json({ success: true, notified });
}
