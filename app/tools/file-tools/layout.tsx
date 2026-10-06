import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "File Tools: Open Archives, Create ZIPs, Encrypt, Split Files" },
  description: "Open ZIP, RAR, 7Z and TAR archives, create password-protected ZIPs, encrypt, split and compare files, and read a file's real format, in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/file-tools" },
  openGraph: {
    title: "File Tools: Open Archives, Create ZIPs, Encrypt, Split Files",
    description: "Open ZIP, RAR, 7Z and TAR archives, create password-protected ZIPs, encrypt, split and compare files, and read a file's real format, in your browser.",
    url: "https://www.onlineconvertools.com/tools/file-tools",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
