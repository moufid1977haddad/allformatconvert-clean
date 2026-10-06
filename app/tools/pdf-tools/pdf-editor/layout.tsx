import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "PDF Editor — Add Text, Images, Pen and Highlights" },
  description: "Add text, PNG or JPEG pictures, pen strokes and highlights to PDF pages, reorder, rotate or delete pages, and extract a selection in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-editor" },
  openGraph: {
    title: "PDF Editor — Add Text, Images, Pen and Highlights",
    description: "Add text, PNG or JPEG pictures, pen strokes and highlights to PDF pages, reorder, rotate or delete pages, and extract a selection in your browser.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-editor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-editor">{children}</ToolSeo>;
}
