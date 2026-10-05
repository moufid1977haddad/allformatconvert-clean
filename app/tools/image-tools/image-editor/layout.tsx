import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Image Editor — Free Photo Editor in Your Browser" },
  description: "Image Editor is a free, full-featured photo editor that runs entirely in your browser — no upload, no signup, and no software to install.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-editor" },
  openGraph: {
    title: "Image Editor — Free Photo Editor in Your Browser",
    description: "Image Editor is a free, full-featured photo editor that runs entirely in your browser — no upload, no signup, and no software to install.",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-editor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/image-tools/image-editor">{children}</ToolSeo>;
}
