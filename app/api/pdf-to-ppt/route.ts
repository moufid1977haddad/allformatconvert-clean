import { makePdfToOfficeHandler } from "@/lib/pdfToOfficeRoute";
import { convertPdfToPptx } from "@/lib/providers/convertApi";

export const maxDuration = 300;

export const POST = makePdfToOfficeHandler({
  tool: "pdf-to-ppt",
  label: "PowerPoint",
  ext: "pptx",
  mime: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  convert: convertPdfToPptx,
});
