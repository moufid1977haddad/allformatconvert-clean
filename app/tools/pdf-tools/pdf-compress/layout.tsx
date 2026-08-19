import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Compress — Rewrite Your Pdf's Internal Structure" },
  description: "PDF Compress rewrites your PDF's internal structure entirely in your browser, condensing its objects into compact object streams.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-compress" },
  openGraph: {
    title: "PDF Compress — Rewrite Your Pdf's Internal Structure",
    description: "PDF Compress rewrites your PDF's internal structure entirely in your browser, condensing its objects into compact object streams.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-compress",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
