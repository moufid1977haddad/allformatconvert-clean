import { NextRequest } from "next/server";
import { alertServerError } from "@/lib/quota/errorAlerts";
import { checkHourDayRateLimit } from "@/lib/quota/hourDayRateLimit";
import { PDF_RENDER_PAGES_PER_HOUR, PDF_RENDER_PAGES_PER_DAY } from "@/lib/quota/config";
import { openStaged } from "@/lib/media/staged";
import { handlePdfRender } from "@/lib/pdfRender";

// P32 (04/10): one PDF page drawn by our pdf-tools service for an iPhone / iPad that could not draw it itself
// (lib/pdfRender.js has the rules and limits; app/lib/serverPageRender.js the page side).
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  return handlePdfRender(req, {
    env: process.env,
    rateLimit: (r: Request) => checkHourDayRateLimit(r as NextRequest, { prefix: "pdf_render", perHour: PDF_RENDER_PAGES_PER_HOUR, perDay: PDF_RENDER_PAGES_PER_DAY }),
    openStaged,
    reportFailure: (detail: string) => alertServerError("pdf-render", detail),
  });
}
