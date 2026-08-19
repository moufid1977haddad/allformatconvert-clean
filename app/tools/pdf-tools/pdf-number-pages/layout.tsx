import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Number Pages — Stamp a “current / Total” Label (e.g" },
  description: "PDF Number Pages stamps a current/total label onto every page of your PDF, entirely in your browser — your file is never uploaded.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-number-pages" },
  openGraph: {
    title: "PDF Number Pages — Stamp a “current / Total” Label (e.g",
    description: "PDF Number Pages stamps a current/total label onto every page of your PDF, entirely in your browser — your file is never uploaded.",
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
