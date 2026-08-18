import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Excel to CSV — Read an Uploaded .xlsx or .xls File Online" },
  description: "Excel to CSV reads an uploaded .xlsx or .xls file using the xlsx library and converts its first sheet to comma-separated CSV text, entirely in your browser…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/excel-to-csv" },
  openGraph: {
    title: "Excel to CSV — Read an Uploaded .xlsx or .xls File Online",
    description: "Excel to CSV reads an uploaded .xlsx or .xls file using the xlsx library and converts its first sheet to comma-separated CSV text, entirely in your browser…",
    url: "https://www.onlineconvertools.com/tools/developer-tools/excel-to-csv",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
