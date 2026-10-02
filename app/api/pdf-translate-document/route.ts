import { NextRequest, NextResponse } from "next/server";
import { PDFDocument } from "@cantoo/pdf-lib";
import { alertServerError } from "@/lib/quota/errorAlerts";
import { logUsageEvent } from "@/lib/quota/logEvent";
import { buildServerToolError, insertToolError } from "@/lib/reportError";
import { reservePdfTranslate, pagesPerIpPerDay, PDF_TRANSLATE_MAX_PAGES } from "@/lib/quota/pdfTranslate";
import { translatePdf, configured, GoogleTranslateError } from "@/lib/providers/googleTranslate";
import { isStagedRequest, respondStaged, fileResponse } from "@/lib/media/stagedRoute";
import { contentDisposition } from "@/lib/contentDisposition";
import { GOOGLE_DOC_LANGUAGES } from "@/app/lib/translateLanguages";

// P25 (03/10, E3): PDF Translate, WHOLE document with its layout (Google Cloud Translation, lib/providers/
// googleTranslate.js). Spending is bounded by its OWN limits (lib/quota/pdfTranslate.js: 30 $ a month, 20 pages per
// visitor per day, 20 pages per document), not by the shared guard. Without GOOGLE_TRANSLATE_SERVICE_ACCOUNT the
// feature is OFF: GET says so and the page does not offer it; a POST is a plain 503, never a fallback.
export const maxDuration = 300;

const ROUTE = "pdf-translate-document";
const TOOL = "pdf-translate";
const MAX_BYTES = 20 * 1024 * 1024; // Google's online limit

// Offered only when the translated PDF can be handed back through the media service: a result can be much larger than
// its source (fonts of another script) and would not fit a direct response once Google has billed it (review 03/10).
const available = () => configured() && Boolean(process.env.NEXT_PUBLIC_MEDIA_SERVICE_URL);

export async function GET() {
  return NextResponse.json({ available: available(), maxPages: PDF_TRANSLATE_MAX_PAGES, pagesPerDay: pagesPerIpPerDay() }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: NextRequest) {
  if (!available()) return NextResponse.json({ error: "Whole-document translation is not available yet." }, { status: 503 });
  if (isStagedRequest(req)) return respondStaged(req, "pdf", (file, body) => translate(req, file, body?.target, body?.source, true));
  let file: File, target: unknown, source: unknown;
  try {
    const form = await req.formData();
    const f = form.get("file");
    if (!(f instanceof File)) return NextResponse.json({ error: "No file provided." }, { status: 400 });
    file = f; target = form.get("target"); source = form.get("source");
  } catch {
    return NextResponse.json({ error: "Invalid multipart/form-data request." }, { status: 400 });
  }
  return translate(req, file, target, source);
}

async function translate(req: NextRequest, file: File, target: unknown, source: unknown, staged = false): Promise<NextResponse> {
  if (typeof target !== "string" || !GOOGLE_DOC_LANGUAGES.has(target)) return NextResponse.json({ error: "Choose the language to translate into." }, { status: 400 });
  if (source !== null && source !== undefined && source !== "" && (typeof source !== "string" || !GOOGLE_DOC_LANGUAGES.has(source))) return NextResponse.json({ error: "Unknown source language." }, { status: 400 });
  if (!file.size) return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Whole-document translation takes PDFs up to 20 MB." }, { status: 413 });
  const original = Buffer.from(await file.arrayBuffer());
  if (original.subarray(0, 5).toString("latin1") !== "%PDF-") return NextResponse.json({ error: "This file is not a PDF." }, { status: 400 });

  // The page count decides the price: read here, never taken from the browser. And Google receives EXACTLY the
  // pages that were counted (independent review 03/10, two passes): pdf-lib and the other readers can disagree on a
  // crafted file (duplicate objects, page-tree nodes without /Type: pdf-lib 1 page, pdf.js 25). The document sent is
  // REBUILT from the pages pdf-lib counted (a fresh page tree, nothing else carried over), then counted again.
  let pages: number;
  let bytes: Buffer;
  try {
    const doc = await PDFDocument.load(original, { ignoreEncryption: true, updateMetadata: false });
    if (doc.isEncrypted) return NextResponse.json({ error: "This PDF is password-protected. Remove the password first (our Unlock PDF tool), then translate it." }, { status: 400 });
    pages = doc.getPageCount();
    const fresh = await PDFDocument.create();
    for (const page of await fresh.copyPages(doc, doc.getPageIndices())) fresh.addPage(page);
    bytes = Buffer.from(await fresh.save({ useObjectStreams: false }));
    const again = await PDFDocument.load(bytes, { updateMetadata: false });
    if (again.getPageCount() !== pages) return NextResponse.json({ error: "This PDF could not be read reliably. Try our Repair PDF tool first." }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "This PDF could not be read. It may be damaged: try our Repair PDF tool first." }, { status: 400 });
  }
  if (bytes.length > MAX_BYTES) return NextResponse.json({ error: "Whole-document translation takes PDFs up to 20 MB." }, { status: 413 });
  if (pages < 1) return NextResponse.json({ error: "This PDF has no pages." }, { status: 400 });
  if (pages > PDF_TRANSLATE_MAX_PAGES) {
    return NextResponse.json({ error: `This PDF has ${pages} pages; whole-document translation takes up to ${PDF_TRANSLATE_MAX_PAGES} pages at a time. Split it with our Split PDF tool and translate the parts.` }, { status: 400 });
  }

  let own: Awaited<ReturnType<typeof reservePdfTranslate>>;
  try {
    own = await reservePdfTranslate(req, { pages });
  } catch (err) {
    // The counters could not be read: nothing is spent without a reservation.
    await alertServerError(ROUTE, "reservation failed: " + ((err as Error)?.message || String(err)));
    return NextResponse.json({ error: "The translation failed. Please try again." }, { status: 503 });
  }
  if (!own.ok) {
    await logUsageEvent({ route: ROUTE, tool: TOOL, outcome: own.status === 429 ? "denied_ip_day" : "denied_global_spend" });
    return NextResponse.json({ error: own.error }, { status: own.status, headers: { "Retry-After": String(own.retryAfter) } });
  }

  // Once Google has answered with a translation it is billed: nothing is given back after this point, whatever fails.
  let billed = false;
  try {
    const out = await translatePdf(bytes, { target, source: typeof source === "string" && source ? source : undefined });
    billed = true;
    await logUsageEvent({ route: ROUTE, tool: TOOL, outcome: "accepted", estimatedCostMicros: own.costMicros });
    const outName = (file.name || "document.pdf").replace(/\.[^.]+$/, "") + `-${target}.pdf`;
    return fileResponse(out.pdf, {
      "Content-Type": "application/pdf",
      "Content-Disposition": contentDisposition(outName),
      "X-Pages": String(pages),
      ...(out.detectedLanguage ? { "X-Detected-Language": String(out.detectedLanguage).replace(/[^A-Za-z-]/g, "").slice(0, 12) } : {}),
    }, staged);
  } catch (err) {
    const e = err instanceof GoogleTranslateError ? err : null;
    // A clear refusal from Google (an error answer): nothing billed, pages and money back. No answer at all (timeout,
    // network): Google may still bill, so only the visitor's pages come back. An answer received: nothing back.
    if (!billed && e && !e.billed) {
      try { if (e.maybeBilled) await own.releasePagesOnly(); else await own.release(); } catch (releaseErr) {
        await alertServerError(ROUTE, "release failed (counters over-count): " + ((releaseErr as Error)?.message || String(releaseErr)));
      }
    }
    const code = e?.code || "unexpected_error";
    const visitorFault = code === "unsupported" || code === "too_large";
    if (!visitorFault) {
      await alertServerError(ROUTE, `${code} (HTTP ${e?.httpStatus ?? "n/a"})`);
      await insertToolError(buildServerToolError({ tool: TOOL, file, error: new Error(`google_${code}`), userAgent: req.headers.get("user-agent"), headers: req.headers }));
    }
    const message = code === "rate_limited" ? "The translation service is busy. Please try again in a minute."
      : code === "timeout" ? "The translation took too long. Try a shorter PDF."
      : code === "too_large" ? "This PDF is too large for whole-document translation (20 MB; 20 pages when it is a scan)."
      : code === "unsupported" ? "This PDF could not be translated (the service refused it). If it is a scan, try our PDF OCR first."
      : "The translation failed. Please try again.";
    return NextResponse.json({ error: message }, { status: visitorFault ? 422 : 502 });
  }
}
