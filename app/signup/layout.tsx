import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Sign Up for OnlineConverTools" },
  description: "Create a free OnlineConverTools account. It is optional: every tool works without one.",
  alternates: { canonical: "https://www.onlineconvertools.com/signup" },
  openGraph: {
    title: "Sign Up for OnlineConverTools",
    description: "Create a free OnlineConverTools account. It is optional: every tool works without one.",
    url: "https://www.onlineconvertools.com/signup",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
