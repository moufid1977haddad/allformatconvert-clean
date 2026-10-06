import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "ZIP Creator — Zip Files in Your Browser, AES-256 Option" },
  description: "Bundle files into a ZIP in your browser, choose the compression level and add an optional AES-256 password. Up to 700 MB, or 100 MB on phones and tablets.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/zip-creator" },
  openGraph: {
    title: "ZIP Creator — Zip Files in Your Browser, AES-256 Option",
    description: "Bundle files into a ZIP in your browser, choose the compression level and add an optional AES-256 password. Up to 700 MB, or 100 MB on phones and tablets.",
    url: "https://www.onlineconvertools.com/tools/file-tools/zip-creator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/file-tools/zip-creator">{children}</ToolSeo>;
}
