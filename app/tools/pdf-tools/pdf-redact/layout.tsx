import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Redact PDF — Black Out Words, Emails, Phones, Cards" },
  description: "Permanently black out chosen words, e-mail addresses, phone and card numbers in a PDF; matched pages become images, the rest keep their text.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-redact" },
  openGraph: {
    title: "Redact PDF — Black Out Words, Emails, Phones, Cards",
    description: "Permanently black out chosen words, e-mail addresses, phone and card numbers in a PDF; matched pages become images, the rest keep their text.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/pdf-redact",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/pdf-tools/pdf-redact">{children}</ToolSeo>;
}
