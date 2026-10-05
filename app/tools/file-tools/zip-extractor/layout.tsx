import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "ZIP Extractor — Extract ZIP Online Free" },
  description: "Open ZIP, RAR, 7Z, TAR, GZ, ISO and 40+ other archive formats in your browser with 7-Zip and zip.js — password-protected and split archives included, nothing uploaded, no software to install.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/zip-extractor" },
  openGraph: {
    title: "ZIP Extractor — Extract ZIP Online Free",
    description: "Open ZIP, RAR, 7Z, TAR, GZ, ISO and 40+ other archive formats in your browser with 7-Zip and zip.js — password-protected and split archives included, nothing uploaded, no software to install.",
    url: "https://www.onlineconvertools.com/tools/file-tools/zip-extractor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/file-tools/zip-extractor">{children}</ToolSeo>;
}
