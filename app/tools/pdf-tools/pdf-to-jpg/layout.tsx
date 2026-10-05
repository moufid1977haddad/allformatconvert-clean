import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "PDF to JPG — Pages or Embedded Images, Online Free" },
  description: "PDF to JPG: each page as a JPG at 72, 150 or 300 dpi, or the pictures inside the PDF extracted. Choose pages; in your browser on a computer (on iPhone or iPad, a page the device cannot draw is drawn by our PDF service, then deleted).",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-jpg" },
  openGraph: {
    title: "PDF to JPG — Pages or Embedded Images, Online Free",
    description: "PDF to JPG: each page as a JPG at 72, 150 or 300 dpi, or the pictures inside the PDF extracted. Choose pages; in your browser on a computer (on iPhone or iPad, a page the device cannot draw is drawn by our PDF service, then deleted).",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-jpg",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-to-jpg">{children}</ToolSeo>;
}
