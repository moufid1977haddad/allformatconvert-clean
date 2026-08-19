import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "QR Code Scanner — Decode Any QR Code Image Directly Online" },
  description: "QR Code Scanner decodes any QR code image directly in your browser — no software installation, no registration, no image ever leaves your device.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/qr-barcodes-tools/qr-scanner" },
  openGraph: {
    title: "QR Code Scanner — Decode Any QR Code Image Directly Online",
    description: "QR Code Scanner decodes any QR code image directly in your browser — no software installation, no registration, no image ever leaves your device.",
    url: "https://www.onlineconvertools.com/tools/qr-barcodes-tools/qr-scanner",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
