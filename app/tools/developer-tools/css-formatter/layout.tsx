import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "CSS Formatter and Minifier — js-beautify and CSSO" },
  description: "Beautify CSS with 2-space indentation, or minify it with CSSO, which merges duplicate rules and shortens colors, with both engines running on your device.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/css-formatter" },
  openGraph: {
    title: "CSS Formatter and Minifier — js-beautify and CSSO",
    description: "Beautify CSS with 2-space indentation, or minify it with CSSO, which merges duplicate rules and shortens colors, with both engines running on your device.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/css-formatter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/css-formatter">{children}</ToolSeo>;
}
