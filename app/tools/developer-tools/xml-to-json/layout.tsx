import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "XML to JSON — Convert XML Into JSON Online Free" },
  description: "XML to JSON converts XML into JSON using the browser's built-in XML parser (DOMParser), entirely in your browser — nothing is uploaded to a server.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/xml-to-json" },
  openGraph: {
    title: "XML to JSON — Convert XML Into JSON Online Free",
    description: "XML to JSON converts XML into JSON using the browser's built-in XML parser (DOMParser), entirely in your browser — nothing is uploaded to a server.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/xml-to-json",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
