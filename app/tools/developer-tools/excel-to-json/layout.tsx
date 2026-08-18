import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Excel to JSON — Read an Uploaded .xlsx, .xls, or .csv Online" },
  description: "Excel to JSON reads an uploaded .xlsx, .xls, or .csv file using the xlsx library and converts every sheet to an array of row objects, entirely in your…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/excel-to-json" },
  openGraph: {
    title: "Excel to JSON — Read an Uploaded .xlsx, .xls, or .csv Online",
    description: "Excel to JSON reads an uploaded .xlsx, .xls, or .csv file using the xlsx library and converts every sheet to an array of row objects, entirely in your…",
    url: "https://www.onlineconvertools.com/tools/developer-tools/excel-to-json",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
