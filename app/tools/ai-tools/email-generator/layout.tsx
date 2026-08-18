import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Email Generator — Generate Emails Online Free" },
  description: "Email Generator is a free online tool that uses OpenAI's GPT-4o mini model to draft a complete email — subject line, greeting, body, and closing —…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/email-generator" },
  openGraph: {
    title: "Email Generator — Generate Emails Online Free",
    description: "Email Generator is a free online tool that uses OpenAI's GPT-4o mini model to draft a complete email — subject line, greeting, body, and closing —…",
    url: "https://www.onlineconvertools.com/tools/ai-tools/email-generator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
