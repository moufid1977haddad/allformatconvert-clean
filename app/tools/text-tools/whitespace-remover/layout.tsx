import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Whitespace Remover — Offer Four Ways Online Free" },
  description: "Whitespace Remover offers four ways to clean up spacing in your text — collapse all whitespace, collapse only spaces and tabs, trim leading spaces per line…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/whitespace-remover" },
  openGraph: {
    title: "Whitespace Remover — Offer Four Ways Online Free",
    description: "Whitespace Remover offers four ways to clean up spacing in your text — collapse all whitespace, collapse only spaces and tabs, trim leading spaces per line…",
    url: "https://www.onlineconvertools.com/tools/text-tools/whitespace-remover",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
