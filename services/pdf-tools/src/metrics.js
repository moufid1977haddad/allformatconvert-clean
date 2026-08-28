// Structured, content-free usage logging. One JSON line per request to
// stdout -- Railway captures stdout as that service's log stream, which
// doubles as the audit trail this is meant to be. Deliberately never
// includes a filename, file content, or the raw API key.
function logMetric({ apiKeyName, endpoint, bytesIn, bytesOut, durationMs, verdict }) {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    apiKey: apiKeyName,
    endpoint,
    bytesIn,
    bytesOut: bytesOut ?? null,
    durationMs,
    verdict,
  }));
}

module.exports = { logMetric };
