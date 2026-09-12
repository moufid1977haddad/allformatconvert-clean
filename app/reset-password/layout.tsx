import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Reset Your OnlineConverTools Password" },
  description: "Choose a new password for your OnlineConverTools account using the secure link sent to your email.",
  alternates: { canonical: "https://www.onlineconvertools.com/reset-password" },
  openGraph: {
    title: "Reset Your OnlineConverTools Password",
    description: "Choose a new password for your OnlineConverTools account using the secure link sent to your email.",
    url: "https://www.onlineconvertools.com/reset-password",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
