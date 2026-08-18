import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Image to Base64 — Read an Image File Online Free" },
  description: "Image to Base64 reads an image file and encodes it as a Base64 data URI, entirely in your browser using the FileReader API — your file is never uploaded…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/image-tools/image-to-base64" },
  openGraph: {
    title: "Image to Base64 — Read an Image File Online Free",
    description: "Image to Base64 reads an image file and encodes it as a Base64 data URI, entirely in your browser using the FileReader API — your file is never uploaded…",
    url: "https://www.onlineconvertools.com/tools/image-tools/image-to-base64",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
