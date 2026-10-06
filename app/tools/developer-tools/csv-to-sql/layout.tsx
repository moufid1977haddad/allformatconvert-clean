import type { Metadata } from 'next';
import { SEO } from './seo';
import ToolSeo from '@/app/components/ToolSeo';

// P36 (06/10): title and description written here, where the content checks read them; seo.js keeps the path, example and links.
const url = 'https://www.onlineconvertools.com' + SEO.path;

export const metadata: Metadata = {
  title: { absolute: "CSV to SQL — CREATE TABLE and INSERT for MySQL, SQL Server" },
  description: "Turn a CSV file or pasted CSV into CREATE TABLE plus one INSERT per row, quoted for PostgreSQL, SQLite, MySQL or SQL Server, with no database connection.",
  alternates: { canonical: url },
  openGraph: { title: "CSV to SQL — CREATE TABLE and INSERT for MySQL, SQL Server", description: "Turn a CSV file or pasted CSV into CREATE TABLE plus one INSERT per row, quoted for PostgreSQL, SQLite, MySQL or SQL Server, with no database connection.", url },
};

// The page is a 'use client' component and can't export metadata itself; this layout hosts it. Its structured data is
// rendered by SeoContent from the page's visible texts since P35 (ToolSeo: related tools + JSON-LD).
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSeo path="/tools/developer-tools/csv-to-sql">{children}</ToolSeo>
    </>
  );
}
