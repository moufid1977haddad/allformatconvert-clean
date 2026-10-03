import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Repair — Fix Damaged PDF Files Online" },
  description: "PDF Repair fixes PDFs with damaged structure, like a broken cross-reference table or a cut-off end, and checks that the repaired file keeps your text.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-repair" },
  openGraph: {
    title: "PDF Repair — Fix Damaged PDF Files Online",
    description: "PDF Repair fixes PDFs with damaged structure, like a broken cross-reference table or a cut-off end, and checks that the repaired file keeps your text.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-repair",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
