import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Cron Expression Explainer — Paste, Check, See Next Runs" },
  description: "Paste a cron expression or a whole crontab line to read it in plain English, see its next five run times in your time zone and spot invalid fields.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/cron-expression" },
  openGraph: {
    title: "Cron Expression Explainer — Paste, Check, See Next Runs",
    description: "Paste a cron expression or a whole crontab line to read it in plain English, see its next five run times in your time zone and spot invalid fields.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/cron-expression",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/cron-expression">{children}</ToolSeo>;
}
