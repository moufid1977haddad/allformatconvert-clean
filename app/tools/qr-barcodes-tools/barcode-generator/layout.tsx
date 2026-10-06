import type { Metadata } from 'next';
import { SEO } from './seo';
import ToolSeo from '@/app/components/ToolSeo';

// Title and description come from seo.js, the same object the page renders its FAQ from.
const url = 'https://www.onlineconvertools.com' + SEO.path;

export const metadata: Metadata = {
  title: { absolute: "Barcode Generator — 37 Types: EAN-13, UPC, Code 128, SVG/PDF" },
  description: "Make 37 barcode types, from EAN-13 and Code 128 to Data Matrix, as PNG or as SVG, PDF and EPS at the exact print size, singly or by the thousand.",
  alternates: { canonical: url },
  openGraph: { title: "Barcode Generator — 37 Types: EAN-13, UPC, Code 128, SVG/PDF", description: "Make 37 barcode types, from EAN-13 and Code 128 to Data Matrix, as PNG or as SVG, PDF and EPS at the exact print size, singly or by the thousand.", url },
};

// The page is a 'use client' component and can't export metadata itself; this layout hosts it. Its structured data is
// rendered by SeoContent from the page's visible texts since P35 (ToolSeo: related tools + JSON-LD).
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSeo path="/tools/qr-barcodes-tools/barcode-generator">{children}</ToolSeo>
    </>
  );
}
