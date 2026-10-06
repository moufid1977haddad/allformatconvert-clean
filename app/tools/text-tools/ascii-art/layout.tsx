import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "ASCII Art Generator — Text to FIGlet Banners in 10 Fonts" },
  description: "Type up to 60 characters and turn them into a FIGlet banner in Standard, Slant, Big, Block, ANSI Shadow or five other fonts. Copy it or save a .txt file.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/ascii-art" },
  openGraph: {
    title: "ASCII Art Generator — Text to FIGlet Banners in 10 Fonts",
    description: "Type up to 60 characters and turn them into a FIGlet banner in Standard, Slant, Big, Block, ANSI Shadow or five other fonts. Copy it or save a .txt file.",
    url: "https://www.onlineconvertools.com/tools/text-tools/ascii-art",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/text-tools/ascii-art">{children}</ToolSeo>;
}
