import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "PDF to PowerPoint — Each Page as an Editable PPTX Slide" },
  description: "Convert every page of a PDF into a slide of an editable .pptx presentation. ConvertAPI does the work, and text stays editable where the PDF has real text.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-ppt" },
  openGraph: {
    title: "PDF to PowerPoint — Each Page as an Editable PPTX Slide",
    description: "Convert every page of a PDF into a slide of an editable .pptx presentation. ConvertAPI does the work, and text stays editable where the PDF has real text.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-ppt",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-to-ppt">{children}</ToolSeo>;
}
