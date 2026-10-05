import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Email Generator — Generate Emails Online Free" },
  description: "Email Generator uses an AI language model to draft a complete email — subject, greeting, body, and closing — from a short description.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/email-generator" },
  openGraph: {
    title: "Email Generator — Generate Emails Online Free",
    description: "Email Generator uses an AI language model to draft a complete email — subject, greeting, body, and closing — from a short description.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/email-generator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/ai-tools/email-generator">{children}</ToolSeo>;
}
