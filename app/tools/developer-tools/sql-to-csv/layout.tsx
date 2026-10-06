import type { Metadata } from 'next';
import { SEO } from './seo';
import ToolSeo from '@/app/components/ToolSeo';

// P36 (06/10): title and description written here, where the content checks read them; seo.js keeps the path, example and links.
const url = 'https://www.onlineconvertools.com' + SEO.path;

export const metadata: Metadata = {
  title: { absolute: "SQL to CSV Converter — mysqldump INSERTs to CSV Rows" },
  description: "Paste INSERT statements, mysqldump output included, and get CSV: multi-row VALUES, quoted names and escaped quotes are read, one table at a time.",
  alternates: { canonical: url },
  openGraph: { title: "SQL to CSV Converter — mysqldump INSERTs to CSV Rows", description: "Paste INSERT statements, mysqldump output included, and get CSV: multi-row VALUES, quoted names and escaped quotes are read, one table at a time.", url },
};

// The page is a 'use client' component and can't export metadata itself; this layout hosts it. Its structured data is
// rendered by SeoContent from the page's visible texts since P35 (ToolSeo: related tools + JSON-LD).
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSeo path="/tools/developer-tools/sql-to-csv">{children}</ToolSeo>
    </>
  );
}
