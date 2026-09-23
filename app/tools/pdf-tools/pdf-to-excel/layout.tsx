import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "PDF to Excel — Convert PDF Tables to Editable Excel" },
  description: "Convert the tables of a PDF into an editable Excel spreadsheet (.xlsx). Free, no signup, files up to 99 MB.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-excel" },
  openGraph: {
    title: "PDF to Excel — Convert PDF Tables to Editable Excel",
    description: "Convert the tables of a PDF into an editable Excel spreadsheet (.xlsx). Free, no signup, files up to 99 MB.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-to-excel",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
