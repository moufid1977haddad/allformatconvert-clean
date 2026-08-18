import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Converter Tools — Convert Units, Colors, and Currencies" },
  description: "Converter Tools is a free online utility that instantly converts between multiple file formats, units of measurement, and data types without requiring any…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/converter-tools" },
  openGraph: {
    title: "Converter Tools — Convert Units, Colors, and Currencies",
    description: "Converter Tools is a free online utility that instantly converts between multiple file formats, units of measurement, and data types without requiring any…",
    url: "https://www.onlineconvertools.com/tools/converter-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
