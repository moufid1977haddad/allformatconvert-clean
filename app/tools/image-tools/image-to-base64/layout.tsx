import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Image to Base64 Encoder — Data URI, img Tag, CSS or JSON" },
  description: "Encode an image file as Base64 text: a data URI, plain Base64, an HTML img tag, a CSS background rule or JSON. Copy it or download name.base64.txt.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-to-base64" },
  openGraph: {
    title: "Image to Base64 Encoder — Data URI, img Tag, CSS or JSON",
    description: "Encode an image file as Base64 text: a data URI, plain Base64, an HTML img tag, a CSS background rule or JSON. Copy it or download name.base64.txt.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-to-base64",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/image-to-base64">{children}</ToolSeo>;
}
