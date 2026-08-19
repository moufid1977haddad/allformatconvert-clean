import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF to JPG — Render Every Page Online Free" },
  description: "PDF to JPG renders every page onto a canvas at 2x scale and exports each as a separate JPG at a fixed quality, in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-jpg" },
  openGraph: {
    title: "PDF to JPG — Render Every Page Online Free",
    description: "PDF to JPG renders every page onto a canvas at 2x scale and exports each as a separate JPG at a fixed quality, in your browser.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-jpg",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
