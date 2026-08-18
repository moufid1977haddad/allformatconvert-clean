import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Percentage Calculator — Offer Three Independent Instant" },
  description: "Percentage Calculator offers three independent instant calculations — what X% of Y is, what percent X is of Y, and the percentage change from X to Y — all…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/math-tools/percentage-calculator" },
  openGraph: {
    title: "Percentage Calculator — Offer Three Independent Instant",
    description: "Percentage Calculator offers three independent instant calculations — what X% of Y is, what percent X is of Y, and the percentage change from X to Y — all…",
    url: "https://www.onlineconvertools.com/tools/math-tools/percentage-calculator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
