import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Sign PDF — Draw, Type or Upload Your Signature" },
  description: "Add a drawn, typed or scanned signature to a PDF on the last, first, every or a chosen page, in a corner or dragged to the exact spot you want.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-sign" },
  openGraph: {
    title: "Sign PDF — Draw, Type or Upload Your Signature",
    description: "Add a drawn, typed or scanned signature to a PDF on the last, first, every or a chosen page, in a corner or dragged to the exact spot you want.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-sign",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-sign">{children}</ToolSeo>;
}
