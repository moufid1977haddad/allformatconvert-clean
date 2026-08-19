import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "File Encryptor — Obfuscate Any File Online Free" },
  description: "File Encryptor is a free online tool that obfuscates any file with a password-based XOR cipher, entirely in your browser — no upload, no software installation.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/file-encryptor" },
  openGraph: {
    title: "File Encryptor — Obfuscate Any File Online Free",
    description: "File Encryptor is a free online tool that obfuscates any file with a password-based XOR cipher, entirely in your browser — no upload, no software installation.",
    url: "https://www.onlineconvertools.com/tools/file-tools/file-encryptor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
