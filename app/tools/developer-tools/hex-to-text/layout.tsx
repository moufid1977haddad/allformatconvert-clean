import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Hex to Text — Convert Between Plain Text Online Free" },
  description: "Hex to Text converts between plain text and hexadecimal character codes entirely in your browser using JavaScript's built-in character-code functions…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/hex-to-text" },
  openGraph: {
    title: "Hex to Text — Convert Between Plain Text Online Free",
    description: "Hex to Text converts between plain text and hexadecimal character codes entirely in your browser using JavaScript's built-in character-code functions…",
    url: "https://www.onlineconvertools.com/tools/developer-tools/hex-to-text",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
