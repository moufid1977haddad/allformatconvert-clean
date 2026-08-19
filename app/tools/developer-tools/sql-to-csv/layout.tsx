import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "SQL to CSV — Extract Data From INSERT INTO .. Online Free" },
  description: "SQL to CSV extracts data from INSERT INTO VALUES statements in pasted SQL text and turns them into CSV rows, in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/sql-to-csv" },
  openGraph: {
    title: "SQL to CSV — Extract Data From INSERT INTO .. Online Free",
    description: "SQL to CSV extracts data from INSERT INTO VALUES statements in pasted SQL text and turns them into CSV rows, in your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/sql-to-csv",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
