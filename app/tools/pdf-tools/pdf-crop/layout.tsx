import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Crop PDF — Trim Page Margins in Points" },
  description: "Trim the margins of PDF pages by typing top, bottom, left and right values in points, for all pages or a page list, without uploading the file.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-crop" },
  openGraph: {
    title: "Crop PDF — Trim Page Margins in Points",
    description: "Trim the margins of PDF pages by typing top, bottom, left and right values in points, for all pages or a page list, without uploading the file.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-crop",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-crop">{children}</ToolSeo>;
}
