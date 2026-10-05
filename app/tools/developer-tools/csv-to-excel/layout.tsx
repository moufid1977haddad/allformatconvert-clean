import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "CSV to Excel — Build an .xlsx or .xls Workbook Online Free" },
  description: "CSV to Excel builds an .xlsx or legacy .xls workbook from a CSV file or pasted CSV text, entirely in your browser, with automatic delimiter detection — your data is never uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/csv-to-excel" },
  openGraph: {
    title: "CSV to Excel — Build an .xlsx or .xls Workbook Online Free",
    description: "CSV to Excel builds an .xlsx or legacy .xls workbook from a CSV file or pasted CSV text, entirely in your browser, with automatic delimiter detection — your data is never uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/csv-to-excel",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/csv-to-excel">{children}</ToolSeo>;
}
