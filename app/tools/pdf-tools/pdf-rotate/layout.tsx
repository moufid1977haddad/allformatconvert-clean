import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Rotate — Rotate Every Page Online Free" },
  description: "PDF Rotate rotates every page of a PDF by a fixed angle you choose — 90°, 180°, or 270° — using the pdf-lib library entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-rotate" },
  openGraph: {
    title: "PDF Rotate — Rotate Every Page Online Free",
    description: "PDF Rotate rotates every page of a PDF by a fixed angle you choose — 90°, 180°, or 270° — using the pdf-lib library entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-rotate",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
