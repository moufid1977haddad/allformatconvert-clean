import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "File to Base64 — Data URL or Raw Base64 for Any File" },
  description: "Turn any file into a Base64 data URL or a raw Base64 string for HTML, CSS or JSON. The file is read in your browser and is not uploaded.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/base64-encoder" },
  openGraph: {
    title: "File to Base64 — Data URL or Raw Base64 for Any File",
    description: "Turn any file into a Base64 data URL or a raw Base64 string for HTML, CSS or JSON. The file is read in your browser and is not uploaded.",
    url: "https://www.onlineconvertools.com/tools/file-tools/base64-encoder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/file-tools/base64-encoder">{children}</ToolSeo>;
}
