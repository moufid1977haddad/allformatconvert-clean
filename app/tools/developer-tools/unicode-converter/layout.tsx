import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Unicode Converter — Text to \\uXXXX Escapes and Back" },
  description: "Turn text into JavaScript \\uXXXX escapes, or read \\uXXXX, \\u{1F600} and U+1F600 back as text. Emoji above U+FFFF become surrogate pairs.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/unicode-converter" },
  openGraph: {
    title: "Unicode Converter — Text to \\uXXXX Escapes and Back",
    description: "Turn text into JavaScript \\uXXXX escapes, or read \\uXXXX, \\u{1F600} and U+1F600 back as text. Emoji above U+FFFF become surrogate pairs.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/unicode-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/unicode-converter">{children}</ToolSeo>;
}
