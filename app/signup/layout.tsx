import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Sign Up for OnlineConverTools" },
  description: "Create a free OnlineConverTools account to sign in and manage your access to our online file conversion and editing tools.",
  alternates: { canonical: "https://www.onlineconvertools.com/signup" },
  openGraph: {
    title: "Sign Up for OnlineConverTools",
    description: "Create a free OnlineConverTools account to sign in and manage your access to our online file conversion and editing tools.",
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
