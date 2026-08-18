import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Lorem Ipsum — Be a Free Online Tool Online Free" },
  description: "Lorem Ipsum is a free online tool. No sign-up, no watermarks, no limits.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/lorem-ipsum" },
  openGraph: {
    title: "Lorem Ipsum — Be a Free Online Tool Online Free",
    description: "Lorem Ipsum is a free online tool. No sign-up, no watermarks, no limits.",
    url: "https://www.onlineconvertools.com/tools/text-tools/lorem-ipsum",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
