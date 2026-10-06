import type { Metadata } from 'next';
import { SEO } from './seo';
import ToolSeo from '@/app/components/ToolSeo';

// P36 (06/10): title and description written here, where the content checks read them; seo.js keeps the path, example and links.
const url = 'https://www.onlineconvertools.com' + SEO.path;

export const metadata: Metadata = {
  title: { absolute: "CSV to TSV Converter — Semicolon or Comma CSV to Tabs" },
  description: "Turn comma, semicolon or pipe CSV into tab-separated TSV. Open a .csv or .txt file or paste text; quoted fields stay whole and values unchanged.",
  alternates: { canonical: url },
  openGraph: { title: "CSV to TSV Converter — Semicolon or Comma CSV to Tabs", description: "Turn comma, semicolon or pipe CSV into tab-separated TSV. Open a .csv or .txt file or paste text; quoted fields stay whole and values unchanged.", url },
};

// The page is a 'use client' component and can't export metadata itself; this layout hosts it. Its structured data is
// rendered by SeoContent from the page's visible texts since P35 (ToolSeo: related tools + JSON-LD).
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSeo path="/tools/developer-tools/csv-to-tsv">{children}</ToolSeo>
    </>
  );
}
