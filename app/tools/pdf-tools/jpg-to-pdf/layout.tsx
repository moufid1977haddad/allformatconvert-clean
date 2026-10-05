import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "JPG to PDF — Combine Images Into One PDF Online Free" },
  description: "JPG to PDF is a one-shot batch converter: select your JPG, PNG, HEIC or other images, and pdf-lib stitches them into a single PDF in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/jpg-to-pdf" },
  openGraph: {
    title: "JPG to PDF — Combine Images Into One PDF Online Free",
    description: "JPG to PDF is a one-shot batch converter: select your JPG, PNG, HEIC or other images, and pdf-lib stitches them into a single PDF in your browser.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/jpg-to-pdf",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/jpg-to-pdf">{children}</ToolSeo>;
}
