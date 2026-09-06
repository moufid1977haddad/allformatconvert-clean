import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF OCR — Extract Text from Scanned PDFs Online" },
  description: "Runs real OCR (Tesseract.js) on scanned PDFs and photographed pages of text, entirely in your browser in English or French — your file is never uploaded. Works best on a straight, clean scan; skewed or low-quality images will need proofreading.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-ocr" },
  openGraph: {
    title: "PDF OCR — Extract Text from Scanned PDFs Online",
    description: "Runs real OCR (Tesseract.js) on scanned PDFs and photographed pages of text, entirely in your browser in English or French — your file is never uploaded. Works best on a straight, clean scan; skewed or low-quality images will need proofreading.",
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
