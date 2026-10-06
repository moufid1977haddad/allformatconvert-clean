import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Split PDF — Ranges, Every N Pages, Bookmarks, ZIP" },
  description: "Cut a PDF into separate files by page ranges, every N pages, single pages, odd and even pages or bookmarks, and download each part or one ZIP.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-split" },
  openGraph: {
    title: "Split PDF — Ranges, Every N Pages, Bookmarks, ZIP",
    description: "Cut a PDF into separate files by page ranges, every N pages, single pages, odd and even pages or bookmarks, and download each part or one ZIP.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-split",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-split">{children}</ToolSeo>;
}
