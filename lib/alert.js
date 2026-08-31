// Dual-channel alert dispatch: ntfy.sh (push) and email via Resend, always
// both, never one instead of the other. Each channel is isolated -- a
// failure in one must never block or suppress the other. Content is
// deliberately limited to a service name, a status/error code, and a
// timestamp -- no user data, no message bodies, no secrets. ntfy.sh's free
// tier isn't end-to-end encrypted and the topic name is its only access
// control, so nothing sensitive belongs in either payload.
import { Resend } from 'resend';

const NTFY_TIMEOUT_MS = 5_000;

const SERVICE_NAMES = {
  openai: 'OpenAI',
  gotenberg: 'Gotenberg',
  'remove.bg': 'remove.bg',
  resend: 'Resend',
  'supabase-auth': 'Supabase Auth',
  'pdf-tools': 'PDF Tools service',
  global_spend: 'Global spend cap',
  adobe_tx: 'Adobe transaction cap',
  'quota-cost-unknown': 'Quota cost unknown',
  'server-error': 'Unhandled server error',
};

function humanServiceName(service) {
  return SERVICE_NAMES[service] || service;
}

// Best-effort human formatting of (service, status) into a subject readable
// at a glance on a phone, plus a body with enough to act on. Falls back to a
// still-informative default for status shapes this doesn't specifically
// recognize -- sendAlert must never fail to compose a message just because
// a caller passed an unfamiliar status string.
function formatAlert(service, status, timestamp) {
  const when = new Date(timestamp).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';

  if (status === 'recovered') {
    return {
      subject: `✅ OnlineConverTools — ${humanServiceName(service)} back to normal`,
      text: `Service: ${service}\nStatus: recovered\nTime: ${when}`,
    };
  }

  if (service === 'test') {
    return {
      subject: `🧪 OnlineConverTools — test alert`,
      text: `This is a manually triggered test alert. If you're reading this by email, the email channel works.\nStatus: ${status}\nTime: ${when}`,
    };
  }

  if (service === 'daily-digest') {
    return {
      subject: `📊 OnlineConverTools — daily digest`,
      text: `${status}\n\nTime: ${when}`,
    };
  }

  const thresholdMatch = /^(\d+)pct_of_cap_(-?[\d.]+)_of_(-?[\d.]+)$/.exec(status);
  if (thresholdMatch) {
    const [, threshold, value, cap] = thresholdMatch;
    const severity = Number(threshold) >= 100 ? '🚨' : Number(threshold) >= 80 ? '⚠️' : 'ℹ️';
    let valueStr = value;
    let capStr = cap;
    if (service === 'global_spend') {
      valueStr = `$${(Number(value) / 1_000_000).toFixed(2)}`;
      capStr = `$${(Number(cap) / 1_000_000).toFixed(2)}`;
    }
    return {
      subject: `${severity} OnlineConverTools — ${humanServiceName(service)} at ${threshold}%`,
      text: `Counter: ${service}\nThreshold crossed: ${threshold}%\nValue: ${valueStr} / ${capStr}\nTime: ${when}`,
    };
  }

  return {
    subject: `🔴 OnlineConverTools — ${humanServiceName(service)}: ${status}`,
    text: `Service: ${service}\nStatus: ${status}\nTime: ${when}`,
  };
}

async function sendNtfy(service, status, timestamp) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) {
    console.error(`ntfy alert dropped (NTFY_TOPIC not configured): ${service} ${status}`);
    return;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NTFY_TIMEOUT_MS);

  try {
    await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: { Title: `OnlineConverTools alert: ${service}` },
      body: `${service} - ${status} - ${new Date(timestamp).toISOString()}`,
      signal: controller.signal,
    });
  } catch (err) {
    console.error('Failed to send ntfy alert:', err?.message || err);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function sendEmail(service, status, timestamp) {
  const apiKey = process.env.RESEND_API_KEY;
  const domain = process.env.RESEND_EMAIL_DOMAIN;
  const to = process.env.ALERT_EMAIL_TO;
  if (!apiKey || !domain || !to) {
    console.error(
      `email alert dropped (missing ${[!apiKey && 'RESEND_API_KEY', !domain && 'RESEND_EMAIL_DOMAIN', !to && 'ALERT_EMAIL_TO'].filter(Boolean).join(', ')}): ${service} ${status}`
    );
    return;
  }

  const { subject, text } = formatAlert(service, status, timestamp);
  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from: `OnlineConverTools Alerts <alerts@${domain}>`,
      to: [to],
      subject,
      text,
    });
  } catch (err) {
    console.error('Failed to send email alert:', err?.message || err);
  }
}

export async function sendAlert(service, status) {
  const timestamp = Date.now();
  await Promise.allSettled([
    sendNtfy(service, status, timestamp),
    sendEmail(service, status, timestamp),
  ]);
}
