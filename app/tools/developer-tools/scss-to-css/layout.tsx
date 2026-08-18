import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "SCSS to CSS — Be a Very Lightweight Text Transform, Not" },
  description: "SCSS to CSS is a very lightweight text transform, not a real Sass compiler: it strips // comments and rewrites simple &:hover / &.class parent-selector…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/scss-to-css" },
  openGraph: {
    title: "SCSS to CSS — Be a Very Lightweight Text Transform, Not",
    description: "SCSS to CSS is a very lightweight text transform, not a real Sass compiler: it strips // comments and rewrites simple &:hover / &.class parent-selector…",
    url: "https://www.onlineconvertools.com/tools/developer-tools/scss-to-css",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
