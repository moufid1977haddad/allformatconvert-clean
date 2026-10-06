import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Code Minifier — JavaScript, TypeScript, CSS and HTML" },
  description: "Minify JS or TS with Terser, CSS with CSSO, and HTML by removing comments and extra spaces, all in your browser, and count the characters removed.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/code-minifier" },
  openGraph: {
    title: "Code Minifier — JavaScript, TypeScript, CSS and HTML",
    description: "Minify JS or TS with Terser, CSS with CSSO, and HTML by removing comments and extra spaces, all in your browser, and count the characters removed.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/code-minifier",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/code-minifier">{children}</ToolSeo>;
}
