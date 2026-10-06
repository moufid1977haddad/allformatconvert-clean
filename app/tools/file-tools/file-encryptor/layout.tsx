import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "File Encryptor — AES-256 Password Encryption in Your Browser" },
  description: "Encrypt any file with a password using AES-256-GCM, or decrypt a .encrypted file, in your browser. The key comes from PBKDF2 with 600,000 iterations.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools/file-encryptor" },
  openGraph: {
    title: "File Encryptor — AES-256 Password Encryption in Your Browser",
    description: "Encrypt any file with a password using AES-256-GCM, or decrypt a .encrypted file, in your browser. The key comes from PBKDF2 with 600,000 iterations.",
    url: "https://www.onlineconvertools.com/tools/file-tools/file-encryptor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/file-tools/file-encryptor">{children}</ToolSeo>;
}
