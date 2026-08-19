import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "CSS Formatter — Format CSS Online Free" },
  description: "CSS Formatter expands or minifies CSS entirely in your browser using simple pattern-based rules, rather than a full CSS parser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/css-formatter" },
  openGraph: {
    title: "CSS Formatter — Format CSS Online Free",
    description: "CSS Formatter expands or minifies CSS entirely in your browser using simple pattern-based rules, rather than a full CSS parser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/css-formatter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
