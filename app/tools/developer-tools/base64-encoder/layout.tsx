import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Base64 Encode and Decode — UTF-8 Text, URL-Safe Option" },
  description: "Encode text to Base64 or decode it back. UTF-8 keeps accents and emoji intact, and a URL-safe option fits JWTs, all inside your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/base64-encoder" },
  openGraph: {
    title: "Base64 Encode and Decode — UTF-8 Text, URL-Safe Option",
    description: "Encode text to Base64 or decode it back. UTF-8 keeps accents and emoji intact, and a URL-safe option fits JWTs, all inside your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/base64-encoder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/base64-encoder">{children}</ToolSeo>;
}
