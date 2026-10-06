import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "PDF to Excel Converter — Tables to an Editable XLSX Free" },
  description: "Extract the tables of a PDF into an editable .xlsx workbook with real numbers and dates. ConvertAPI does it; a PDF with no table is laid out line by line.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-excel" },
  openGraph: {
    title: "PDF to Excel Converter — Tables to an Editable XLSX Free",
    description: "Extract the tables of a PDF into an editable .xlsx workbook with real numbers and dates. ConvertAPI does it; a PDF with no table is laid out line by line.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-excel",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-to-excel">{children}</ToolSeo>;
}
