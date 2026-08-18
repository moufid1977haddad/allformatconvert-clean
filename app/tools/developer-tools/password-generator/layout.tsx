import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Password Generator — Build a Random Password Online Free" },
  description: "Password Generator builds a random password from the character sets you select, using the browser's crypto.getRandomValues() — a cryptographically secure…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/password-generator" },
  openGraph: {
    title: "Password Generator — Build a Random Password Online Free",
    description: "Password Generator builds a random password from the character sets you select, using the browser's crypto.getRandomValues() — a cryptographically secure…",
    url: "https://www.onlineconvertools.com/tools/developer-tools/password-generator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
