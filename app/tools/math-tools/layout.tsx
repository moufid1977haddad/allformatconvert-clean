import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Math Tools — Number Conversion, Percentage Calculator Online" },
  description: "Math Tools is a free online calculator suite that helps students, professionals, and educators solve complex mathematical problems instantly.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/math-tools" },
  openGraph: {
    title: "Math Tools — Number Conversion, Percentage Calculator Online",
    description: "Math Tools is a free online calculator suite that helps students, professionals, and educators solve complex mathematical problems instantly.",
    url: "https://www.onlineconvertools.com/tools/math-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
