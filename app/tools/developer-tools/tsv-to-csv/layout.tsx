import type { Metadata } from 'next';
import { SEO } from './seo';
import ToolSeo from '@/app/components/ToolSeo';

// P36 (06/10): title and description written here, where the content checks read them; seo.js keeps the path, example and links.
const url = 'https://www.onlineconvertools.com' + SEO.path;

export const metadata: Metadata = {
  title: { absolute: "TSV to CSV Converter — Paste Cells from Excel or Sheets" },
  description: "Paste tab-separated text, such as cells copied from Excel or Google Sheets, and get CSV with commas, quotes and line breaks handled. In your browser.",
  alternates: { canonical: url },
  openGraph: { title: "TSV to CSV Converter — Paste Cells from Excel or Sheets", description: "Paste tab-separated text, such as cells copied from Excel or Google Sheets, and get CSV with commas, quotes and line breaks handled. In your browser.", url },
};

// The page is a 'use client' component and can't export metadata itself; this layout hosts it. Its structured data is
// rendered by SeoContent from the page's visible texts since P35 (ToolSeo: related tools + JSON-LD).
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSeo path="/tools/developer-tools/tsv-to-csv">{children}</ToolSeo>
    </>
  );
}
