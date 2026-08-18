import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "QR & Barcodes — Generate and Scan QR Codes and Barcodes" },
  description: "QR Barcodes Tools is a free online platform that allows you to generate, decode, and manage QR codes and barcodes instantly without any software installation.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/qr-barcodes-tools" },
  openGraph: {
    title: "QR & Barcodes — Generate and Scan QR Codes and Barcodes",
    description: "QR Barcodes Tools is a free online platform that allows you to generate, decode, and manage QR codes and barcodes instantly without any software installation.",
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
