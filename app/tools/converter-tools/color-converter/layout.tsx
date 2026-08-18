import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Color Converter — Convert Between Hex, RGB Online Free" },
  description: "Color Converter converts between HEX, RGB, and HSL color values live, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/converter-tools/color-converter" },
  openGraph: {
    title: "Color Converter — Convert Between Hex, RGB Online Free",
    description: "Color Converter converts between HEX, RGB, and HSL color values live, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/converter-tools/color-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
