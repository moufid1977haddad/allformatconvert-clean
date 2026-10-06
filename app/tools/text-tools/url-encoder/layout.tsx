import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "URL Encoder & Decoder — Make Text Safe for Web Links" },
  description: "Turn spaces, accents and symbols into %XX codes for a link, or read a garbled %20 address as plain words again. Nothing leaves your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/url-encoder" },
  openGraph: {
    title: "URL Encoder & Decoder — Make Text Safe for Web Links",
    description: "Turn spaces, accents and symbols into %XX codes for a link, or read a garbled %20 address as plain words again. Nothing leaves your browser.",
    url: "https://www.onlineconvertools.com/tools/text-tools/url-encoder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/text-tools/url-encoder">{children}</ToolSeo>;
}
