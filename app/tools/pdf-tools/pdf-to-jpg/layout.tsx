import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "PDF to JPG — Every Page as a JPG, or Its Embedded Images" },
  description: "Save each PDF page as a JPG at Normal, High or Screen resolution, or extract the photos inside as JPG files, with High or Medium quality.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-jpg" },
  openGraph: {
    title: "PDF to JPG — Every Page as a JPG, or Its Embedded Images",
    description: "Save each PDF page as a JPG at Normal, High or Screen resolution, or extract the photos inside as JPG files, with High or Medium quality.",
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
