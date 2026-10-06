import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "PDF Translate — Translate a PDF's Text or the Whole File" },
  description: "Translate the text of a PDF's first pages with OpenAI, or, when offered, the whole PDF into a new PDF with its layout through Google Cloud Translation.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-translate" },
  openGraph: {
    title: "PDF Translate — Translate a PDF's Text or the Whole File",
    description: "Translate the text of a PDF's first pages with OpenAI, or, when offered, the whole PDF into a new PDF with its layout through Google Cloud Translation.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-translate",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-translate">{children}</ToolSeo>;
}
