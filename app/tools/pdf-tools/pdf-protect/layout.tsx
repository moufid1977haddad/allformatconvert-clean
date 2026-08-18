import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Protect — Encrypt Your PDF Online Free" },
  description: "PDF Protect encrypts your PDF with the password you enter, using the @cantoo/pdf-lib library's standard PDF security handler entirely in your browser — your…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-protect" },
  openGraph: {
    title: "PDF Protect — Encrypt Your PDF Online Free",
    description: "PDF Protect encrypts your PDF with the password you enter, using the @cantoo/pdf-lib library's standard PDF security handler entirely in your browser — your…",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-protect",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
