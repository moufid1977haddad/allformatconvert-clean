import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Text File Converter — TXT to UTF-8, JSON, CSV or HTML" },
  description: "Re-save a text file as UTF-8 TXT, wrap it in JSON, turn tab-separated lines into CSV, or escape it into an HTML page, all in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/file-converter" },
  openGraph: {
    title: "Text File Converter — TXT to UTF-8, JSON, CSV or HTML",
    description: "Re-save a text file as UTF-8 TXT, wrap it in JSON, turn tab-separated lines into CSV, or escape it into an HTML page, all in your browser.",
    url: "https://www.onlineconvertools.com/tools/file-tools/file-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/file-tools/file-converter">{children}</ToolSeo>;
}
