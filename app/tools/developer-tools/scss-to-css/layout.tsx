import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "SCSS to CSS — Lightweight SCSS to CSS Transform Online Free" },
  description: "SCSS to CSS is a lightweight text transform, not a real Sass compiler: it strips comments and rewrites simple parent-selector patterns.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/scss-to-css" },
  openGraph: {
    title: "SCSS to CSS — Lightweight SCSS to CSS Transform Online Free",
    description: "SCSS to CSS is a lightweight text transform, not a real Sass compiler: it strips comments and rewrites simple parent-selector patterns.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/scss-to-css",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/scss-to-css">{children}</ToolSeo>;
}
