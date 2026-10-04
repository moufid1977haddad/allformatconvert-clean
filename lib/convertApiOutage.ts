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

/**
 * P31: ConvertAPI stayed busy (HTTP 503/429: our plan runs one conversion at a time) for the whole wait budget of
 * lib/providers/convertApi.js -- other files were being converted. Not an outage: the visitor is told to retry soon.
 */
export function convertApiBusy(err: unknown): boolean {
  return err instanceof ConvertApiError && !err.billed && err.code === "rate_limited";
}

export function convertApiBusyMessage(tool: string): string {
  return `${tool} is busy converting other files right now and yours could not start in time. Please try again in a minute.`;
}

export function convertApiUnavailableMessage(label: string): string {
  return `PDF to ${label} is temporarily unavailable: the conversion engine it uses is not responding right now, and we have no backup that keeps the layout as well. Please try again later.`;
}

/**
 * Alerting for one ConvertAPI failure: a provider failure goes to the incident tracker (once per incident); any other
 * failure (the file, the request) keeps exactly the per-route hourly alert it had before P30 -- `routeAlert` is the
 * route's own "alert" flag for that code (false for an unsupported format, as before).
 */
export async function alertConvertApiFailure(route: string, err: ConvertApiError, routeAlert: boolean): Promise<void> {
  const failure = { httpStatus: err.httpStatus, code: err.code };
  if (err.code === "not_production") return; // our own refusal outside production (P30), not an incident
  if (classifyProviderFailure(failure)) await reportProviderFailure("convertapi", failure);
  else if (routeAlert) await alertServerError(route, `${err.code} (HTTP ${err.httpStatus ?? "n/a"})`);
}

export const convertApiSucceeded = () => reportProviderSuccess("convertapi");
