import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Diff Viewer — Compare Two Texts Line by Line Online Free" },
  description: "Diff Viewer compares two texts line by line, entirely in your browser — nothing is uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/diff-viewer" },
  openGraph: {
    title: "Diff Viewer — Compare Two Texts Line by Line Online Free",
    description: "Diff Viewer compares two texts line by line, entirely in your browser — nothing is uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/diff-viewer",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
