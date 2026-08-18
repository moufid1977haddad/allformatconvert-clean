import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "ASCII Art Generator — Turn Short Typed Text Online Free" },
  description: "ASCII Art Generator turns short typed text into large block-letter banners built from # and space characters, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/ascii-art" },
  openGraph: {
    title: "ASCII Art Generator — Turn Short Typed Text Online Free",
    description: "ASCII Art Generator turns short typed text into large block-letter banners built from # and space characters, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/text-tools/ascii-art",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
