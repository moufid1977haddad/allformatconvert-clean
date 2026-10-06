import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Fill PDF Forms — Text, Checkboxes, Lists, Flatten" },
  description: "Fill the existing fields of a PDF form, from text boxes to radio buttons and lists, keep it fillable or flatten it, then save the completed copy.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-forms" },
  openGraph: {
    title: "Fill PDF Forms — Text, Checkboxes, Lists, Flatten",
    description: "Fill the existing fields of a PDF form, from text boxes to radio buttons and lists, keep it fillable or flatten it, then save the completed copy.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-forms",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-forms">{children}</ToolSeo>;
}
