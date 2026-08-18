import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Text Encryptor — Encrypt Text Online Free" },
  description: "Text Encryptor obfuscates text with a password-based XOR cipher and Base64 encoding, entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/text-encryptor" },
  openGraph: {
    title: "Text Encryptor — Encrypt Text Online Free",
    description: "Text Encryptor obfuscates text with a password-based XOR cipher and Base64 encoding, entirely in your browser.",
    url: "https://www.onlineconvertools.com/tools/text-tools/text-encryptor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
