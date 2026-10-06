import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "SQL Formatter — 12 Dialects, Uppercase Keywords" },
  description: "Format SQL queries for MySQL, PostgreSQL, SQL Server, Oracle, SQLite, BigQuery and more: keywords uppercased, clauses indented, in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/sql-formatter" },
  openGraph: {
    title: "SQL Formatter — 12 Dialects, Uppercase Keywords",
    description: "Format SQL queries for MySQL, PostgreSQL, SQL Server, Oracle, SQLite, BigQuery and more: keywords uppercased, clauses indented, in your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/sql-formatter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/sql-formatter">{children}</ToolSeo>;
}
