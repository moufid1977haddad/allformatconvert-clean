import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "QR Code and Barcode Generator and Scanner" },
  description: "Create static QR codes for links, Wi-Fi and contacts, make 37 barcode types one by one or in batches, and read codes with your camera or from an image.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/qr-barcodes-tools" },
  openGraph: {
    title: "QR Code and Barcode Generator and Scanner",
    description: "Create static QR codes for links, Wi-Fi and contacts, make 37 barcode types one by one or in batches, and read codes with your camera or from an image.",
    url: "https://www.onlineconvertools.com/tools/qr-barcodes-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
