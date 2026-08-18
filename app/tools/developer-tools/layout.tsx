import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Developer Tools — Json, Base64, URL Encoding, and More" },
  description: "Developer Tools is a comprehensive free online suite designed to help programmers, web developers, and tech professionals streamline their workflow…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools" },
  openGraph: {
    title: "Developer Tools — Json, Base64, URL Encoding, and More",
    description: "Developer Tools is a comprehensive free online suite designed to help programmers, web developers, and tech professionals streamline their workflow…",
    url: "https://www.onlineconvertools.com/tools/developer-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
