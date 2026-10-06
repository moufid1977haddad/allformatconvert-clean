import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Hex, Binary & Octal Converter — Prefixes and BigInt Values" },
  description: "Convert hex, binary, octal and decimal as you type. Paste 0xFF, 0b1010 or 0o17 with _ separators and get exact results beyond 2^64.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/number-base-converter" },
  openGraph: {
    title: "Hex, Binary & Octal Converter — Prefixes and BigInt Values",
    description: "Convert hex, binary, octal and decimal as you type. Paste 0xFF, 0b1010 or 0o17 with _ separators and get exact results beyond 2^64.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/number-base-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/number-base-converter">{children}</ToolSeo>;
}
