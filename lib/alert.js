// Minimal ntfy.sh alert helper. Content is deliberately limited to a
// service name, a status/error code, and a timestamp -- no user data, no
// message bodies, no secrets. ntfy.sh's free tier isn't end-to-end
// encrypted and the topic name is its only access control, so nothing
// sensitive belongs in the payload.
const NTFY_TIMEOUT_MS = 5_000;

export async function sendAlert(service, status) {
  const topic = process.env.NTFY_TOPIC;
  if (!topic) {
    console.error(`Alert dropped (NTFY_TOPIC not configured): ${service} ${status}`);
    return;
  }

  const timestamp = new Date().toISOString();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), NTFY_TIMEOUT_MS);

  try {
    await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: { Title: `OnlineConverTools alert: ${service}` },
      body: `${service} - ${status} - ${timestamp}`,
      signal: controller.signal,
    });
  } catch (err) {
    console.error('Failed to send ntfy alert:', err?.message || err);
  } finally {
    clearTimeout(timeoutId);
  }
}
