import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "JWT Decoder — Split a JWT Online Free" },
  description: "JWT Decoder splits a JWT into its header and payload, decodes each, and pretty-prints the resulting JSON, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/jwt-decoder" },
  openGraph: {
    title: "JWT Decoder — Split a JWT Online Free",
    description: "JWT Decoder splits a JWT into its header and payload, decodes each, and pretty-prints the resulting JSON, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/jwt-decoder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
