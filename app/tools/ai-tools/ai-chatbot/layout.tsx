import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "AI Chatbot — Free GPT-4o mini Chat That Keeps the Thread" },
  description: "Ask questions and get answers from OpenAI's GPT-4o mini. Recent turns go along with each message, so follow-up questions are understood.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/ai-chatbot" },
  openGraph: {
    title: "AI Chatbot — Free GPT-4o mini Chat That Keeps the Thread",
    description: "Ask questions and get answers from OpenAI's GPT-4o mini. Recent turns go along with each message, so follow-up questions are understood.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/ai-chatbot",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/ai-tools/ai-chatbot">{children}</ToolSeo>;
}
