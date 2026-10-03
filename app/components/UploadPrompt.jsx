// P27: the upload area says what the visitor can do ON THIS DEVICE, like the market's tools (iLovePDF "Select PDF
// files / or drop PDFs here" on a computer, "Select PDF files" on a phone; Smallpdf "Choose files or drop files
// here" / "Choose files"): with a mouse or trackpad, click or drop; on a touch screen, where there is nothing to drop
// and no "click", choose. Decided by the primary pointer (CSS `pointer`), so no script and no flash: an iPad with a
// trackpad says "click or drop", a phone says "choose".
//   <UploadPrompt what="a PDF" />  ->  "Click or drop a PDF here"  |  "Choose a PDF"
export default function UploadPrompt({ what }) {
  return (
    <>
      <span className="upload-prompt-fine">Click or drop {what} here</span>
      <span className="upload-prompt-coarse">Choose {what}</span>
    </>
  );
}
