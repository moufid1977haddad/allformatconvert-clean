import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Forms — Read the Existing Fillable Fields Online Free" },
  description: "PDF Forms reads the existing fillable fields from a PDF you upload and lets you type a value into each one, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-forms" },
  openGraph: {
    title: "PDF Forms — Read the Existing Fillable Fields Online Free",
    description: "PDF Forms reads the existing fillable fields from a PDF you upload and lets you type a value into each one, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-forms",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
