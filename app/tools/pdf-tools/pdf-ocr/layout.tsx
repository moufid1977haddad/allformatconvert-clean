import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF OCR — Extract Text from Scanned PDFs Online" },
  description: "Runs real OCR (Tesseract) on scanned PDFs and photographed pages of text in 100+ languages, up to three at once, and gives the text plus a searchable PDF. In your browser on a computer; on iPhone or iPad, a page the device cannot read goes to our own OCR service, then is deleted.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-ocr" },
  openGraph: {
    title: "PDF OCR — Extract Text from Scanned PDFs Online",
    description: "Runs real OCR (Tesseract) on scanned PDFs and photographed pages of text in 100+ languages, up to three at once, and gives the text plus a searchable PDF. In your browser on a computer; on iPhone or iPad, a page the device cannot read goes to our own OCR service, then is deleted.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-ocr",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
