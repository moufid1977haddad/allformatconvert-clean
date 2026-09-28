// PDF to Excel: ConvertAPI finds no table in a PDF made only of text (measured 28/09: HTTP 500, its code 5001, not
// billed; 5004 is its documented "no tables"). The route answers with this exact message and the page then builds
// the sheet itself from the PDF's text, as the reference converters do (app/lib/pdfTextToSheet.js).
export const PDF_NO_TABLES_MESSAGE = 'No table was found in this PDF.';
export const PDF_NO_TABLES_CODES = [5001, 5004];
