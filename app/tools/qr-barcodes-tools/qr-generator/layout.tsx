import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "QR Code Generator — URL, Wi-Fi, vCard, Logo; PNG, SVG, PDF" },
  description: "Create a static QR code for a link, Wi-Fi network, contact card, SMS or map location, with colors and a logo, checked by a QR reader before download.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/qr-barcodes-tools/qr-generator" },
  openGraph: {
    title: "QR Code Generator — URL, Wi-Fi, vCard, Logo; PNG, SVG, PDF",
    description: "Create a static QR code for a link, Wi-Fi network, contact card, SMS or map location, with colors and a logo, checked by a QR reader before download.",
    url: "https://www.onlineconvertools.com/tools/qr-barcodes-tools/qr-generator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/qr-barcodes-tools/qr-generator">{children}</ToolSeo>;
}
