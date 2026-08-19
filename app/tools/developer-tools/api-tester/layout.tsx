import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "API Tester — Send HTTP Requests Directly Online Free" },
  description: "API Tester sends HTTP requests directly from your browser to the endpoint you specify, and shows the response status and body.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/api-tester" },
  openGraph: {
    title: "API Tester — Send HTTP Requests Directly Online Free",
    description: "API Tester sends HTTP requests directly from your browser to the endpoint you specify, and shows the response status and body.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/api-tester",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
