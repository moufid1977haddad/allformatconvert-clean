import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Hex to Text Converter — UTF-8 Bytes in Both Directions" },
  description: "Decode hex bytes such as 48 65 6c or 0x48,0x65 into UTF-8 text, or turn text into hex bytes. Odd digit counts and non-text bytes are flagged.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/hex-to-text" },
  openGraph: {
    title: "Hex to Text Converter — UTF-8 Bytes in Both Directions",
    description: "Decode hex bytes such as 48 65 6c or 0x48,0x65 into UTF-8 text, or turn text into hex bytes. Odd digit counts and non-text bytes are flagged.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/hex-to-text",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/hex-to-text">{children}</ToolSeo>;
}
