import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Cron Expression — Turn Five Simple Text Fields Online Free" },
  description: "Cron Expression turns five simple text fields — minute, hour, day, month, weekday — into a valid cron string as you type, with six one-click presets (every…",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/cron-expression" },
  openGraph: {
    title: "Cron Expression — Turn Five Simple Text Fields Online Free",
    description: "Cron Expression turns five simple text fields — minute, hour, day, month, weekday — into a valid cron string as you type, with six one-click presets (every…",
    url: "https://www.onlineconvertools.com/tools/developer-tools/cron-expression",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
