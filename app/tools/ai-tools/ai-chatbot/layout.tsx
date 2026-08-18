import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "AI Chatbot — Use Openai's Gpt-4o Mini Model Online Free" },
  description: "AI Chatbot is a free online tool that uses OpenAI's GPT-4o mini model to provide instant answers and conversational assistance for a wide range of questions.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/ai-tools/ai-chatbot" },
  openGraph: {
    title: "AI Chatbot — Use Openai's Gpt-4o Mini Model Online Free",
    description: "AI Chatbot is a free online tool that uses OpenAI's GPT-4o mini model to provide instant answers and conversational assistance for a wide range of questions.",
    url: "https://www.onlineconvertools.com/tools/ai-tools/ai-chatbot",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
