const { supabaseAdmin } = require('./supabaseAdmin');

// Never throws -- a logging failure must not break the guarded request.
async function logUsageEvent({ route, tool, outcome, estimatedCostMicros = 0, accountId = null }) {
  try {
    const { error } = await supabaseAdmin.from('usage_events').insert({
      route, tool: tool || null, outcome, estimated_cost_micros: estimatedCostMicros, account_id: accountId,
    });
    if (error) console.error('Failed to log usage event (non-fatal):', error.message);
  } catch (err) {
    console.error('Failed to log usage event (non-fatal):', err.message);
  }
}

module.exports = { logUsageEvent };
