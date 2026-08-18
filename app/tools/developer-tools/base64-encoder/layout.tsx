import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Base64 Encoder — Convert Text Online Free" },
  description: "Base64 Encoder converts text to and from Base64 directly in your browser using the built-in btoa()/atob() functions — nothing is uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/base64-encoder" },
  openGraph: {
    title: "Base64 Encoder — Convert Text Online Free",
    description: "Base64 Encoder converts text to and from Base64 directly in your browser using the built-in btoa()/atob() functions — nothing is uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/base64-encoder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
