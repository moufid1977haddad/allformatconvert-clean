import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Unit Converter — Convert Between Units Across Six Categories" },
  description: "Unit Converter converts between units across six categories — Length, Weight, Temperature, Speed, Area, and Volume — entirely in your browser, with results…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/converter-tools/unit-converter" },
  openGraph: {
    title: "Unit Converter — Convert Between Units Across Six Categories",
    description: "Unit Converter converts between units across six categories — Length, Weight, Temperature, Speed, Area, and Volume — entirely in your browser, with results…",
    url: "https://www.onlineconvertools.com/tools/converter-tools/unit-converter",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
