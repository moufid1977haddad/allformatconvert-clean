import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "TAR Extractor — Extract TAR Online Free" },
  description: "TAR Extractor is a free online tool that extracts files from TAR, TAR.GZ, and TGZ archives directly in your browser — no software or upload required.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/tar-extractor" },
  openGraph: {
    title: "TAR Extractor — Extract TAR Online Free",
    description: "TAR Extractor is a free online tool that extracts files from TAR, TAR.GZ, and TGZ archives directly in your browser — no software or upload required.",
    url: "https://www.onlineconvertools.com/tools/file-tools/tar-extractor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/file-tools/tar-extractor">{children}</ToolSeo>;
}
