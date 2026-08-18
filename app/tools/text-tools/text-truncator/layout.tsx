import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Text Truncator — Be a Free Online Tool Online Free" },
  description: "Text Truncator is a free online tool. No sign-up, no watermarks, no limits.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/text-truncator" },
  openGraph: {
    title: "Text Truncator — Be a Free Online Tool Online Free",
    description: "Text Truncator is a free online tool. No sign-up, no watermarks, no limits.",
    url: "https://www.onlineconvertools.com/tools/text-tools/text-truncator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
