import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Sign — Let You Draw a Signature Online Free" },
  description: "Sign a PDF free: draw your signature, type it or upload an image, then drag it anywhere on any page. Nothing is uploaded, it all happens in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-sign" },
  openGraph: {
    title: "PDF Sign — Let You Draw a Signature Online Free",
    description: "Sign a PDF free: draw your signature, type it or upload an image, then drag it anywhere on any page. Nothing is uploaded, it all happens in your browser.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-sign",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
