import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "File to Base64 — Instantly Converts Any File Online Free" },
  description: "File to Base64 is a free online tool that instantly converts any file into a Base64-encoded data URL, right in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/base64-encoder" },
  openGraph: {
    title: "File to Base64 — Instantly Converts Any File Online Free",
    description: "File to Base64 is a free online tool that instantly converts any file into a Base64-encoded data URL, right in your browser.",
    url: "https://www.onlineconvertools.com/tools/file-tools/base64-encoder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
