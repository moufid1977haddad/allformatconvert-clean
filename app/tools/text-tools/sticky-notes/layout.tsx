import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Sticky Notes — Let You Jot Down Quick Colored Notes Online" },
  description: "Sticky Notes lets you jot down quick colored notes right in your browser — no downloads or registration.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/sticky-notes" },
  openGraph: {
    title: "Sticky Notes — Let You Jot Down Quick Colored Notes Online",
    description: "Sticky Notes lets you jot down quick colored notes right in your browser — no downloads or registration.",
    url: "https://www.onlineconvertools.com/tools/text-tools/sticky-notes",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
