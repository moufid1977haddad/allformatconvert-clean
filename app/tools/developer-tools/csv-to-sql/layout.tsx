import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "CSV to SQL — Generate a CREATE TABLE Statement Online Free" },
  description: "CSV to SQL generates a CREATE TABLE statement and one INSERT statement per row from pasted CSV text, entirely in your browser — nothing is uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/csv-to-sql" },
  openGraph: {
    title: "CSV to SQL — Generate a CREATE TABLE Statement Online Free",
    description: "CSV to SQL generates a CREATE TABLE statement and one INSERT statement per row from pasted CSV text, entirely in your browser — nothing is uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/csv-to-sql",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
