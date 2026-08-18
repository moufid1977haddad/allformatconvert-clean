import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "CSV to Excel — Build an .xlsx Workbook Online Free" },
  description: "CSV to Excel builds an .xlsx workbook from a CSV file (or pasted CSV text) using the xlsx library entirely in your browser, then triggers a download — your…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/csv-to-excel" },
  openGraph: {
    title: "CSV to Excel — Build an .xlsx Workbook Online Free",
    description: "CSV to Excel builds an .xlsx workbook from a CSV file (or pasted CSV text) using the xlsx library entirely in your browser, then triggers a download — your…",
    url: "https://www.onlineconvertools.com/tools/developer-tools/csv-to-excel",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
