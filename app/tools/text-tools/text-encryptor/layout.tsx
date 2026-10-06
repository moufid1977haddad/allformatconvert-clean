import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Text Encryptor — Password-Based AES-256-GCM Encryption" },
  description: "Encrypt a message with a password using AES-256-GCM and PBKDF2, then share the Base64 result. Decrypt it here with the same password.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/text-tools/text-encryptor" },
  openGraph: {
    title: "Text Encryptor — Password-Based AES-256-GCM Encryption",
    description: "Encrypt a message with a password using AES-256-GCM and PBKDF2, then share the Base64 result. Decrypt it here with the same password.",
    url: "https://www.onlineconvertools.com/tools/text-tools/text-encryptor",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/text-tools/text-encryptor">{children}</ToolSeo>;
}
