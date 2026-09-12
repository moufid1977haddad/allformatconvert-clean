import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Sign In to OnlineConverTools" },
  description: "Sign in to your OnlineConverTools account to access your free online file conversion and editing tools.",
  alternates: { canonical: "https://www.onlineconvertools.com/signin" },
  openGraph: {
    title: "Sign In to OnlineConverTools",
    description: "Sign in to your OnlineConverTools account to access your free online file conversion and editing tools.",
    url: "https://www.onlineconvertools.com/signin",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
