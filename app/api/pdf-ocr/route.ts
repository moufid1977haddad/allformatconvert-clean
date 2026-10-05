import { NextRequest } from "next/server";
import { alertServerError } from "@/lib/quota/errorAlerts";
import { checkPdfOcrRateLimit } from "@/lib/quota/pdfOcrRateLimit";
import { openStaged } from "@/lib/media/staged";
import { handlePdfOcr, ocrClientKey } from "@/lib/pdfOcr";
import { getClientIp } from "@/lib/quota/ipHash";

// P33 (05/10): one PDF page recognized by our pdf-tools service (Tesseract) for an iPhone / iPad that could not
// recognize it itself (lib/pdfOcr.js has the rules and limits; app/lib/serverPageOcr.js the page side).
// P35: a page may wait in the service's OCR line (up to 200 s) before its recognition (up to 50 s)
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  return handlePdfOcr(req, {
    env: process.env,
    rateLimit: (r: Request) => checkPdfOcrRateLimit(r as NextRequest),
    openStaged,
    // the service's per-visitor slot: a keyed hash of the IPv4 address or IPv6 /64 (lib/pdfOcr.js), never the IP
    clientKey: (r: Request) => ocrClientKey(getClientIp(r), process.env.PDFTOOLS_API_KEY),
    reportFailure: (detail: string) => alertServerError("pdf-ocr", detail),
  });
}
