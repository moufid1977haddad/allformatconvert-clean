import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Barcode Generator — Generate Barcodes Online Free" },
  description: "Create 35 barcode types — Code 128, EAN/UPC, ISBN, ITF-14, GS1 DataBar, Data Matrix, PDF417, Aztec and more — in print sizes, as PNG, SVG, PDF or EPS, one at a time or thousands in a ZIP. Every code is scanned back; nothing is uploaded.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/qr-barcodes-tools/barcode-generator" },
  openGraph: {
    title: "Barcode Generator — Generate Barcodes Online Free",
    description: "Create 35 barcode types — Code 128, EAN/UPC, ISBN, ITF-14, GS1 DataBar, Data Matrix, PDF417, Aztec and more — in print sizes, as PNG, SVG, PDF or EPS, one at a time or thousands in a ZIP. Every code is scanned back; nothing is uploaded.",
    url: "https://www.onlineconvertools.com/tools/qr-barcodes-tools/barcode-generator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
