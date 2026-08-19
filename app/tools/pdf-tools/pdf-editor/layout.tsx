import type { Metadata } from 'next';

// TODO: remove `robots: { index: false }` and swap back to a search-intent
// title once this tool ships (see page.jsx's "Coming Soon" state).
export const metadata: Metadata = {
  title: { absolute: "PDF Editor — Coming Soon" },
  description: "A full PDF Editor for adding text, images, and annotations directly onto a document is not yet available — this feature is under development.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-editor" },
  robots: { index: false, follow: true },
  openGraph: {
    title: "PDF Editor — Coming Soon",
    description: "A full PDF Editor for adding text, images, and annotations directly onto a document is not yet available — this feature is under development.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-editor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
