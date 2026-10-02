import { NextRequest, NextResponse } from "next/server";
import { alertServerError } from "@/lib/quota/errorAlerts";
import { buildServerToolError, insertToolError } from "@/lib/reportError";
import { checkUrlPdfRateLimit } from "@/lib/quota/urlPdfRateLimit";
import { URL_PDF_RATE_LIMIT_PER_HOUR, URL_PDF_RATE_LIMIT_PER_DAY } from "@/lib/quota/config";
import { snapshotPage } from "@/lib/urlFetch/snapshot.mjs";
import { FetchRefused, checkUrl } from "@/lib/urlFetch/safeFetch";
import { pageSetupCss, PAPER_MM } from "@/app/lib/pageSetup";

// P25 (03/10, E4): HTML to PDF from a URL. The page is fetched and made self-contained HERE under the SSRF rules
// (lib/urlFetch/safeFetch.js, lib/urlFetch/snapshot.mjs); Gotenberg only receives the finished document, locked by a
// Content-Security-Policy, and loads nothing itself.
export const maxDuration = 120;

const SIZES = new Set(["auto", "A4", "Letter", "Legal", "A3", "A5"]);
const MARGINS = new Set(["auto", "0", "10mm", "20mm", "30mm"]);
const VIEWS = new Set([0, 390, 768, 1024, 1440, 1920]); // 0 = the paper width itself (no scaling)

// The screen width the page is laid out at, as iLovePDF's "screen size": the page is printed at the scale that fits
// that width on the paper (Chromium lays it out at printable width / scale).
function scaleFor(view: number, size: string, landscape: boolean, margin: string): number {
  if (!view) return 1;
  // Gotenberg's defaults when the page leaves them: Letter, 0.39 in margins
  const [w, h] = PAPER_MM[size as keyof typeof PAPER_MM] || PAPER_MM.Letter;
  const marginMm = margin === "auto" ? 0.39 * 25.4 : parseFloat(margin) || 0;
  const printablePx = (((landscape ? h : w) - 2 * marginMm) / 25.4) * 96;
  return Math.min(1, Math.max(0.1, Math.round((printablePx / view) * 1000) / 1000));
}

export async function POST(req: NextRequest) {
  // One deadline for the whole request (review 03/10): fetching gets up to 40 s, Gotenberg what is left of 110 s.
  const deadline = Date.now() + 110_000;
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const url = typeof body?.url === "string" ? body.url.trim() : "";
  const size = SIZES.has(body?.size) ? body.size : "A4";
  const margin = MARGINS.has(body?.margin) ? body.margin : "10mm";
  const landscape = body?.landscape === true;
  const view = VIEWS.has(Number(body?.view)) ? Number(body.view) : 1440;
  const singlePage = body?.singlePage === true;
  const media = body?.media === "print" ? "print" : "screen";
  if (!url || url.length > 2048) return NextResponse.json({ error: "Type the address of a web page (up to 2,048 characters)." }, { status: 400 });

  const gotenbergUrl = process.env.GOTENBERG_URL;
  const gotenbergUsername = process.env.GOTENBERG_USERNAME;
  const gotenbergPassword = process.env.GOTENBERG_PASSWORD;
  if (!gotenbergUrl || !gotenbergUsername || !gotenbergPassword) {
    return NextResponse.json({ error: "Conversion service is not configured." }, { status: 500 });
  }

  // A malformed or plainly forbidden address is refused before it counts against the visitor's limit.
  try { checkUrl(url); } catch (err: any) {
    if (err instanceof FetchRefused) return NextResponse.json({ error: err.message, code: err.code }, { status: 422 });
    throw err;
  }

  let rate;
  try {
    rate = await checkUrlPdfRateLimit(req);
  } catch (err: any) {
    console.error("convert-url-to-pdf rate-limit check failed:", err?.message);
    return NextResponse.json({ error: "The service is busy. Please try again in a minute." }, { status: 503 });
  }
  if (!rate.allowed) {
    const message = rate.layer === "global"
      ? "Many pages are being converted from addresses right now. Please try again in a while."
      : `You have converted many pages ${rate.layer === "hour" ? "this hour" : "today"} (${rate.layer === "hour" ? URL_PDF_RATE_LIMIT_PER_HOUR : URL_PDF_RATE_LIMIT_PER_DAY} at most). Please try again later.`;
    return NextResponse.json(
      { error: message },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  let snap;
  try {
    snap = await snapshotPage(url, { signal: req.signal, deadline: Date.now() + 55_000, extraCss: pageSetupCss({ size, landscape, margin }) });
  } catch (err: any) {
    if (err instanceof FetchRefused) {
      const message = err.code === "timeout" ? "The site took too long to answer."
        : err.code === "too_large" ? "This page or its images are larger than can be converted here."
        : err.code === "network" ? "The site could not be reached. Check the address in your browser."
        : err.message;
      return NextResponse.json({ error: message, code: err.code }, { status: 422 });
    }
    // A page nested so deeply that the serializer overflows: the page's fault, not a failure of the tool (no row).
    if (err instanceof RangeError) return NextResponse.json({ error: "This page is too complex to be converted here." }, { status: 422 });
    console.error("convert-url-to-pdf snapshot failed:", err?.message || "unknown error");
    await insertToolError(buildServerToolError({ tool: "html-to-pdf", file: null, error: err, userAgent: req.headers.get("user-agent"), headers: req.headers }));
    return NextResponse.json({ error: "The page could not be prepared for conversion." }, { status: 502 });
  }

  const form = new FormData();
  form.append("files", new Blob([snap.html], { type: "text/html; charset=utf-8" }), "index.html");
  form.append("preferCssPageSize", "true");
  form.append("printBackground", "true");
  form.append("emulatedMediaType", media);
  form.append("scale", String(scaleFor(view, size, landscape, margin)));
  if (singlePage) form.append("singlePage", "true");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), Math.max(10_000, deadline - Date.now()));
  let res: Response;
  try {
    res = await fetch(`${gotenbergUrl.replace(/\/+$/, "")}/forms/chromium/convert/html`, {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(`${gotenbergUsername}:${gotenbergPassword}`).toString("base64") },
      body: form,
      signal: controller.signal,
    });
  } catch (err: any) {
    if (err?.name === "AbortError") return NextResponse.json({ error: "Conversion timed out." }, { status: 504 });
    console.error("Gotenberg request failed:", err?.message || "unknown error");
    await alertServerError("convert-url-to-pdf", `unreachable: ${err?.message || "unknown error"}`);
    return NextResponse.json({ error: "Could not reach the conversion service." }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("Gotenberg conversion error:", res.status, text.slice(0, 300));
    await alertServerError("convert-url-to-pdf", `service_error_${res.status}`);
    await insertToolError(buildServerToolError({ tool: "html-to-pdf", file: null, error: new Error(`url_service_error_${res.status}`), userAgent: req.headers.get("user-agent"), headers: req.headers }));
    return NextResponse.json({ error: "Conversion failed." }, { status: 502 });
  }
  const pdf = await res.arrayBuffer();
  if (String.fromCharCode(...new Uint8Array(pdf.slice(0, 5))) !== "%PDF-") {
    await alertServerError("convert-url-to-pdf", "non_pdf_response");
    return NextResponse.json({ error: "Conversion service returned an unexpected response." }, { status: 502 });
  }
  const s = snap.stats;
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="page.pdf"`,
      // What the visitor should know about this page (read by the tool page): scripts not run, resources missing.
      "X-Snapshot": JSON.stringify({ scriptHeavy: s.scriptHeavy, scripts: s.scripts, failed: s.failed, skipped: s.skipped, host: new URL(snap.finalUrl).hostname }),
      "Cache-Control": "no-store",
    },
  });
}
