import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Excel to JSON — Each Sheet as an Array of Row Objects" },
  description: "Convert an .xlsx, .xls, .ods or .csv file to JSON: one array per sheet, first row as keys, dates as ISO text and empty cells as null. In your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/excel-to-json" },
  openGraph: {
    title: "Excel to JSON — Each Sheet as an Array of Row Objects",
    description: "Convert an .xlsx, .xls, .ods or .csv file to JSON: one array per sheet, first row as keys, dates as ISO text and empty cells as null. In your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/excel-to-json",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/excel-to-json">{children}</ToolSeo>;
}
