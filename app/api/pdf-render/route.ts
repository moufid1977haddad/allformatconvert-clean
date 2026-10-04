import { NextRequest } from "next/server";
import { alertServerError } from "@/lib/quota/errorAlerts";
import { checkPdfRenderRateLimit } from "@/lib/quota/pdfRenderRateLimit";
import { openStaged } from "@/lib/media/staged";
import { handlePdfRender } from "@/lib/pdfRender";

// P32 (04/10): one PDF page drawn by our pdf-tools service for an iPhone / iPad that could not draw it itself
// (lib/pdfRender.js has the rules and limits; app/lib/serverPageRender.js the page side).
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  return handlePdfRender(req, {
    env: process.env,
    rateLimit: (r: Request) => checkPdfRenderRateLimit(r as NextRequest),
    openStaged,
    reportFailure: (detail: string) => alertServerError("pdf-render", detail),
  });
}
