import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Text Repeater — Repeat a Word or Line up to 100 Times" },
  description: "Repeat any text from 1 to 100 times, joined by a new line, a space, a comma or nothing, then copy it or save it as a .txt file.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/text-repeater" },
  openGraph: {
    title: "Text Repeater — Repeat a Word or Line up to 100 Times",
    description: "Repeat any text from 1 to 100 times, joined by a new line, a space, a comma or nothing, then copy it or save it as a .txt file.",
    url: "https://www.onlineconvertools.com/tools/text-tools/text-repeater",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/text-tools/text-repeater">{children}</ToolSeo>;
}
