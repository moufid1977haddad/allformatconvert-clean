import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Data Extractor — Pull Names, Dates and Prices from Text" },
  description: "Paste an invoice, a list or an email and get its names, dates, amounts and other details back as JSON or a table, written by GPT-4o mini.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/data-extractor" },
  openGraph: {
    title: "Data Extractor — Pull Names, Dates and Prices from Text",
    description: "Paste an invoice, a list or an email and get its names, dates, amounts and other details back as JSON or a table, written by GPT-4o mini.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/data-extractor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/ai-tools/data-extractor">{children}</ToolSeo>;
}
