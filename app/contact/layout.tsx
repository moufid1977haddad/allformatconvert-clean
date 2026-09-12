import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Contact OnlineConverTools — Report a Bug or Ask Us" },
  description: "Contact OnlineConverTools to report a bug, request a new tool, or ask a question. Attach a screenshot and we'll reply to you by email.",
  alternates: { canonical: "https://www.onlineconvertools.com/contact" },
  openGraph: {
    title: "Contact OnlineConverTools — Report a Bug or Ask Us",
    description: "Contact OnlineConverTools to report a bug, request a new tool, or ask a question. Attach a screenshot and we'll reply to you by email.",
    url: "https://www.onlineconvertools.com/contact",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
