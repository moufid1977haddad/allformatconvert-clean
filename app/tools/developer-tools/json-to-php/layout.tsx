import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "JSON to PHP Array or Class Converter — PHP 8 Classes" },
  description: "Convert JSON to a PHP array literal with your exact values, or to typed PHP 8 classes with a fromArray() factory, written by our own code in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/json-to-php" },
  openGraph: {
    title: "JSON to PHP Array or Class Converter — PHP 8 Classes",
    description: "Convert JSON to a PHP array literal with your exact values, or to typed PHP 8 classes with a fromArray() factory, written by our own code in your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/json-to-php",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/json-to-php">{children}</ToolSeo>;
}
