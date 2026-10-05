import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Password Generator — Build a Random Password Online Free" },
  description: "Password Generator builds a random password from the character sets you select, using a cryptographically secure random number source.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/password-generator" },
  openGraph: {
    title: "Password Generator — Build a Random Password Online Free",
    description: "Password Generator builds a random password from the character sets you select, using a cryptographically secure random number source.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/password-generator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/password-generator">{children}</ToolSeo>;
}
