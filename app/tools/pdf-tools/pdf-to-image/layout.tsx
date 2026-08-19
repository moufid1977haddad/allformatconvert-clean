import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF to Image — Render Every Page Online Free" },
  description: "PDF to Image renders every page of your PDF onto a canvas at 2x scale and exports each as a separate PNG, in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-image" },
  openGraph: {
    title: "PDF to Image — Render Every Page Online Free",
    description: "PDF to Image renders every page of your PDF onto a canvas at 2x scale and exports each as a separate PNG, in your browser.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-image",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
