import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Forgot Your OnlineConverTools Password?" },
  description: "Forgot your OnlineConverTools password? Enter your email and we'll send you a secure link to reset it.",
  alternates: { canonical: "https://www.onlineconvertools.com/forgot-password" },
  openGraph: {
    title: "Forgot Your OnlineConverTools Password?",
    description: "Forgot your OnlineConverTools password? Enter your email and we'll send you a secure link to reset it.",
    url: "https://www.onlineconvertools.com/forgot-password",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
