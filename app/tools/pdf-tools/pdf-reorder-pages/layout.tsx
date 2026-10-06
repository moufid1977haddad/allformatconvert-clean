import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Reorder PDF Pages — Type the New Page Order" },
  description: "Rearrange PDF pages by typing their new order, with ranges such as 5-1 to reverse, presets for reverse or odd-then-even, and repeated pages allowed.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-reorder-pages" },
  openGraph: {
    title: "Reorder PDF Pages — Type the New Page Order",
    description: "Rearrange PDF pages by typing their new order, with ranges such as 5-1 to reverse, presets for reverse or odd-then-even, and repeated pages allowed.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-reorder-pages",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-reorder-pages">{children}</ToolSeo>;
}
