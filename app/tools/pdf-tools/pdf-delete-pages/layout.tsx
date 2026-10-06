import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Delete Pages from PDF — Type Pages or Ranges" },
  description: "Remove unwanted pages from a PDF by typing their numbers or ranges, such as 1, 3, 5-7 or 10-. The file is edited in your browser and saved as a copy.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-delete-pages" },
  openGraph: {
    title: "Delete Pages from PDF — Type Pages or Ranges",
    description: "Remove unwanted pages from a PDF by typing their numbers or ranges, such as 1, 3, 5-7 or 10-. The file is edited in your browser and saved as a copy.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-delete-pages",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-delete-pages">{children}</ToolSeo>;
}
