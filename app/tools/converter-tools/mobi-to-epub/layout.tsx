import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "MOBI to EPUB Converter — Also AZW3, AZW and PRC, No Upload" },
  description: "Turn a DRM-free MOBI, AZW, AZW3 or PRC ebook into an EPUB 3 file with its chapters, images, cover and table of contents, rebuilt in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/converter-tools/mobi-to-epub" },
  openGraph: {
    title: "MOBI to EPUB Converter — Also AZW3, AZW and PRC, No Upload",
    description: "Turn a DRM-free MOBI, AZW, AZW3 or PRC ebook into an EPUB 3 file with its chapters, images, cover and table of contents, rebuilt in your browser.",
    url: "https://www.onlineconvertools.com/tools/converter-tools/mobi-to-epub",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/converter-tools/mobi-to-epub">{children}</ToolSeo>;
}
