import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

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

  try {
    await resend.emails.send({
      from: `OnlineConverTools Contact <contact@${process.env.RESEND_EMAIL_DOMAIN}>`,
      to: ['moufid_haddad@icloud.com'],
      replyTo: email,
      subject: `[Contact] ${subject} — ${name}`,
      text: `From: ${name} <${email}>\nSubject: ${subject}\n\n${message}`,
    });
  } catch (emailError) {
    console.error('Contact message stored but notification email failed', emailError);
  }

  return NextResponse.json({ success: true });
}
