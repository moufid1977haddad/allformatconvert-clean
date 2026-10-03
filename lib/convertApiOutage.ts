// P30 (04/10): what the four ConvertAPI routes (Word to PDF for .docx, PDF to Word / Excel / PowerPoint) do when
// ConvertAPI itself refuses or fails -- as opposed to the visitor's file being refused.
//  - The owner is told once per incident (lib/providerIncident.js: ntfy + email, then "recovered").
//  - Word to PDF converts the .docx with our own LibreOffice (Gotenberg) instead and the page says so
//    (app/api/convert-to-pdf/route.ts). The three PDF-to-Office tools have no backup of the same quality (layout
//    reconstruction is what ConvertAPI is paid for), so they say plainly to try again later.
import { ConvertApiError } from "@/lib/providers/convertApi";
import { reportProviderFailure, reportProviderSuccess, classifyProviderFailure } from "@/lib/providerIncident";
import { alertServerError } from "@/lib/quota/errorAlerts";

/** ConvertAPI is unavailable (no credit, key refused, overloaded, down, unreachable), and nothing was billed. */
export function convertApiUnavailable(err: unknown): boolean {
  if (!(err instanceof ConvertApiError) || err.billed) return false;
  if (["quota_exceeded", "rate_limited", "invalid_token", "not_production"].includes(err.code)) return true;
  // No answer at all (network) or a 5xx that is not one of ConvertAPI's documented file errors (those have their
  // own codes: corrupted_file, timeout).
  return err.code === "upstream_error" && (err.httpStatus === undefined || err.httpStatus >= 500);
}

export function convertApiUnavailableMessage(label: string): string {
  return `PDF to ${label} is temporarily unavailable: the conversion engine it uses is not responding right now, and we have no backup that keeps the layout as well. Please try again later.`;
}

/**
 * Alerting for one ConvertAPI failure: a provider failure goes to the incident tracker (once per incident); a failure
 * the tracker does not treat as the provider's (a corrupted file) keeps the per-route hourly alert it had before.
 */
export async function alertConvertApiFailure(route: string, err: ConvertApiError): Promise<void> {
  const failure = { httpStatus: err.httpStatus, code: err.code };
  if (err.code === "not_production") return; // our own refusal outside production (P30), not an incident
  if (classifyProviderFailure(failure)) await reportProviderFailure("convertapi", failure);
  else await alertServerError(route, `${err.code} (HTTP ${err.httpStatus ?? "n/a"})`);
}

export const convertApiSucceeded = () => reportProviderSuccess("convertapi");
