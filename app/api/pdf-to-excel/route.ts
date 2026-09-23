import { makePdfToOfficeHandler } from "@/lib/pdfToOfficeRoute";
import { convertPdfToXlsx } from "@/lib/providers/convertApi";

export const maxDuration = 300;

export const POST = makePdfToOfficeHandler({
  tool: "pdf-to-excel",
  label: "Excel",
  ext: "xlsx",
  mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  convert: convertPdfToXlsx,
});
