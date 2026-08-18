import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Barcode Generator — Generate Barcodes Online Free" },
  description: "Barcode Generator is a free online tool that creates scannable barcodes directly in your browser — no software installation, no signup, and no data ever…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/qr-barcodes-tools/barcode-generator" },
  openGraph: {
    title: "Barcode Generator — Generate Barcodes Online Free",
    description: "Barcode Generator is a free online tool that creates scannable barcodes directly in your browser — no software installation, no signup, and no data ever…",
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
