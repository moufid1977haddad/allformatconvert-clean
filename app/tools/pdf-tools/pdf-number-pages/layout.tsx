import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Number Pages — Stamp a “current / Total” Label (e.g" },
  description: "PDF Number Pages stamps a “current / total” label (e.g. “1 / 12”) onto every page of your PDF entirely in your browser using the pdf-lib library — your file…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-number-pages" },
  openGraph: {
    title: "PDF Number Pages — Stamp a “current / Total” Label (e.g",
    description: "PDF Number Pages stamps a “current / total” label (e.g. “1 / 12”) onto every page of your PDF entirely in your browser using the pdf-lib library — your file…",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-number-pages",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
