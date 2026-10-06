import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Unlock PDF — Remove a Password You Know" },
  description: "Remove the open password or the print and copy restrictions from a PDF when you know the password, keeping its bookmarks and form fields.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-unlock" },
  openGraph: {
    title: "Unlock PDF — Remove a Password You Know",
    description: "Remove the open password or the print and copy restrictions from a PDF when you know the password, keeping its bookmarks and form fields.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-unlock",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-unlock">{children}</ToolSeo>;
}
