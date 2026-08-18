import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF Unlock — Decrypt a Password-protected PDF Online Free" },
  description: "PDF Unlock decrypts a password-protected PDF using the password you provide, via the @cantoo/pdf-lib library's standard PDF security handler entirely in your…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-unlock" },
  openGraph: {
    title: "PDF Unlock — Decrypt a Password-protected PDF Online Free",
    description: "PDF Unlock decrypts a password-protected PDF using the password you provide, via the @cantoo/pdf-lib library's standard PDF security handler entirely in your…",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-unlock",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
