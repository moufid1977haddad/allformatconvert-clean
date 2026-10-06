import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Remove Duplicate Lines — Keep the First, Same Order" },
  description: "Delete repeated lines from a list and keep the first copy of each, in order. Options ignore case or edge spaces and drop empty lines.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/duplicate-remover" },
  openGraph: {
    title: "Remove Duplicate Lines — Keep the First, Same Order",
    description: "Delete repeated lines from a list and keep the first copy of each, in order. Options ignore case or edge spaces and drop empty lines.",
    url: "https://www.onlineconvertools.com/tools/text-tools/duplicate-remover",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/text-tools/duplicate-remover">{children}</ToolSeo>;
}
