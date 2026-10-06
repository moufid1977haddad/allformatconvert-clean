import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Cron Expression Builder — 8 Presets, Edit Field by Field" },
  description: "Build a cron schedule from eight presets, from every minute to weekdays at 09:00, edit each field, and copy it once the next five runs look right.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/cron-expression-builder" },
  openGraph: {
    title: "Cron Expression Builder — 8 Presets, Edit Field by Field",
    description: "Build a cron schedule from eight presets, from every minute to weekdays at 09:00, edit each field, and copy it once the next five runs look right.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/cron-expression-builder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/developer-tools/cron-expression-builder">{children}</ToolSeo>;
}
