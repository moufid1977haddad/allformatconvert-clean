import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF OCR — Despite Its Name, This Tool Does Not Online Free" },
  description: "Despite its name, this tool does not perform optical character recognition on scanned images — it extracts a PDF's existing text layer entirely in your…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-ocr" },
  openGraph: {
    title: "PDF OCR — Despite Its Name, This Tool Does Not Online Free",
    description: "Despite its name, this tool does not perform optical character recognition on scanned images — it extracts a PDF's existing text layer entirely in your…",
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
