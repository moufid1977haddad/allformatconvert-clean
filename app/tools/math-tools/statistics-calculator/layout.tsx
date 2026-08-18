import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Statistics Calculator — Compute Count, Sum, Mean, Median," },
  description: "Statistics Calculator computes count, sum, mean, median, mode, standard deviation, variance, range, minimum, and maximum from a comma-separated list…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/math-tools/statistics-calculator" },
  openGraph: {
    title: "Statistics Calculator — Compute Count, Sum, Mean, Median,",
    description: "Statistics Calculator computes count, sum, mean, median, mode, standard deviation, variance, range, minimum, and maximum from a comma-separated list…",
    url: "https://www.onlineconvertools.com/tools/math-tools/statistics-calculator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
