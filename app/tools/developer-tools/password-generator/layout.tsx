import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Password Generator — Random Passwords and EFF Passphrases" },
  description: "Generate 1 to 50 random passwords of 8 to 64 characters or passphrases from the EFF word list, made with crypto.getRandomValues, with a strength estimate.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/password-generator" },
  openGraph: {
    title: "Password Generator — Random Passwords and EFF Passphrases",
    description: "Generate 1 to 50 random passwords of 8 to 64 characters or passphrases from the EFF word list, made with crypto.getRandomValues, with a strength estimate.",
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
