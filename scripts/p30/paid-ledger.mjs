// P30 (04/10) — the ONLY way a bench may make a real paid call (ConvertAPI, OpenAI, Pangram...) on www.
// Rule (claude/plan-de-travail.md, "Règle permanente — crédits des fournisseurs"): benches simulate by default
// (scripts/p26/e1/fake-providers.mjs locally; previews hold no paid token; the code refuses real ConvertAPI calls
// outside Vercel production). A real call is counted BEFORE it is sent, in docs/audit/depenses-fournisseurs.jsonl
// (committed), against the budget the owner gave the chantier: past it, the bench stops.
//   import { reservePaid } from './paid-ledger.mjs';
//   await reservePaid({ chantier: 'P30', budgetUsd: 0.05, provider: 'convertapi', usd: 0.01, what: 'word-to-pdf word-omml.docx' });
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const LEDGER = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'docs', 'audit', 'depenses-fournisseurs.jsonl');

export function spent(chantier, provider) {
  if (!fs.existsSync(LEDGER)) return 0;
  return fs.readFileSync(LEDGER, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
    .filter((e) => e.chantier === chantier && (!provider || e.provider === provider))
    .reduce((s, e) => s + e.usd, 0);
}

/** Records the call before it is made; throws (and records nothing) if it would exceed the chantier's budget. */
export function reservePaid({ chantier, budgetUsd, provider, usd, what }) {
  if (!chantier || !(budgetUsd >= 0) || !provider || !(usd > 0) || !what) throw new Error('reservePaid: chantier, budgetUsd, provider, usd, what are required');
  const before = spent(chantier, provider);
  if (before + usd > budgetUsd + 1e-9) {
    throw new Error(`paid call refused: ${chantier} ${provider} would reach ${(before + usd).toFixed(3)} $ (budget ${budgetUsd} $, already ${before.toFixed(3)} $)`);
  }
  fs.appendFileSync(LEDGER, JSON.stringify({ at: new Date().toISOString(), chantier, provider, usd, what }) + '\n');
  return before + usd;
}

/**
 * A reserved call the provider certainly did not count is recorded back as 0 $. P31 (03/10): for ConvertAPI that is a
 * refusal before processing (401, 402/403 no conversions left, 429/503 busy) or a request our route never sent; a
 * request ConvertAPI processed and failed (HTTP 500...) IS counted ("whether or not the conversion succeeds",
 * convertapi.com/terms) and must not be refunded.
 */
export function refundPaid({ chantier, provider, usd, what }) {
  fs.appendFileSync(LEDGER, JSON.stringify({ at: new Date().toISOString(), chantier, provider, usd: -usd, what: `refund (not billed): ${what}` }) + '\n');
}
