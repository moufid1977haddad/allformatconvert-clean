import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Cron Expression Builder — Build Cron Expressions Online Free" },
  description: "Cron Expression Builder assembles a 5-field cron string live as you fill in five text boxes, with eight one-click presets to get started.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/developer-tools/cron-expression-builder" },
  openGraph: {
    title: "Cron Expression Builder — Build Cron Expressions Online Free",
    description: "Cron Expression Builder assembles a 5-field cron string live as you fill in five text boxes, with eight one-click presets to get started.",
    url: "https://www.onlineconvertools.com/tools/developer-tools/cron-expression-builder",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
