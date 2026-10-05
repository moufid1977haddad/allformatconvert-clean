import { NextRequest } from "next/server";
import { alertServerError } from "@/lib/quota/errorAlerts";
import { checkPdfOcrRateLimit } from "@/lib/quota/pdfOcrRateLimit";
import { openStaged } from "@/lib/media/staged";
import { handlePdfOcr } from "@/lib/pdfOcr";

// P33 (05/10): one PDF page recognized by our pdf-tools service (Tesseract) for an iPhone / iPad that could not
// recognize it itself (lib/pdfOcr.js has the rules and limits; app/lib/serverPageOcr.js the page side).
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  return handlePdfOcr(req, {
    env: process.env,
    rateLimit: (r: Request) => checkPdfOcrRateLimit(r as NextRequest),
    openStaged,
    reportFailure: (detail: string) => alertServerError("pdf-ocr", detail),
  });
}
