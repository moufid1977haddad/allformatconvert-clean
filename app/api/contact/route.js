import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { sendAlert } from '@/lib/alert';

export async function POST(request) {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
  const resend = new Resend(process.env.RESEND_API_KEY);

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { name, email, subject, message } = body || {};

  if (!name || !email || !subject || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const { error: dbError } = await supabaseAdmin
    .from('contact_messages')
    .insert({ name, email, subject, message });

  if (dbError) {
    console.error('Failed to store contact message', dbError);
    return NextResponse.json({ error: 'Failed to save your message' }, { status: 500 });
  }

  // The message is already durably saved at this point -- everything below
  // is best-effort notification, and nothing here is allowed to turn the
  // success response the visitor already earned back into a failure.
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
        text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
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
