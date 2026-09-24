import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "QR Code Generator — Instantly Turns Any Text or URL Online" },
  description: "Free QR codes for links, Wi-Fi, contacts, SMS and more — colours, logo, up to 2000 px, PNG, SVG or PDF, each one scanned back before download. In your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/qr-barcodes-tools/qr-generator" },
  openGraph: {
    title: "QR Code Generator — Instantly Turns Any Text or URL Online",
    description: "Free QR codes for links, Wi-Fi, contacts, SMS and more — colours, logo, up to 2000 px, PNG, SVG or PDF, each one scanned back before download. In your browser.",
    url: "https://www.onlineconvertools.com/tools/qr-barcodes-tools/qr-generator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
