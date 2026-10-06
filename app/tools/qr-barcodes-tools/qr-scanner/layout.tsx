import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "QR Code Scanner — Camera, Photo or Screenshot; Barcodes Too" },
  description: "Read a QR code with your camera, or QR codes and barcodes from a photo or a pasted screenshot, up to 20 in one picture, read on your device.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/qr-barcodes-tools/qr-scanner" },
  openGraph: {
    title: "QR Code Scanner — Camera, Photo or Screenshot; Barcodes Too",
    description: "Read a QR code with your camera, or QR codes and barcodes from a photo or a pasted screenshot, up to 20 in one picture, read on your device.",
    url: "https://www.onlineconvertools.com/tools/qr-barcodes-tools/qr-scanner",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/qr-barcodes-tools/qr-scanner">{children}</ToolSeo>;
}
