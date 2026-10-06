import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Excel to PDF — XLSX, XLS, CSV & ODS, One Page per Sheet" },
  description: "Convert an Excel, CSV or OpenDocument spreadsheet to PDF with LibreOffice on our server. One checkbox fits each wide sheet onto a single page.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/excel-to-pdf" },
  openGraph: {
    title: "Excel to PDF — XLSX, XLS, CSV & ODS, One Page per Sheet",
    description: "Convert an Excel, CSV or OpenDocument spreadsheet to PDF with LibreOffice on our server. One checkbox fits each wide sheet onto a single page.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/excel-to-pdf",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/excel-to-pdf">{children}</ToolSeo>;
}
