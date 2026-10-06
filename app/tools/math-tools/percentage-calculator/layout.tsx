import type { Metadata } from 'next';
import { SEO } from './seo';
import ToolSeo from '@/app/components/ToolSeo';

// Title and description come from seo.js, the same object the page renders its FAQ from.
const url = 'https://www.onlineconvertools.com' + SEO.path;

export const metadata: Metadata = {
  title: { absolute: "Percentage Calculator — % of, % Change, % Difference" },
  description: "Six percentage calculations on one page: X% of Y, X as a % of Y, % change, reverse %, increase or decrease by %, and % difference, as you type.",
  alternates: { canonical: url },
  openGraph: { title: "Percentage Calculator — % of, % Change, % Difference", description: "Six percentage calculations on one page: X% of Y, X as a % of Y, % change, reverse %, increase or decrease by %, and % difference, as you type.", url },
};

// The page is a 'use client' component and can't export metadata itself; this layout hosts it. Its structured data is
// rendered by SeoContent from the page's visible texts since P35 (ToolSeo: related tools + JSON-LD).
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <ToolSeo path="/tools/math-tools/percentage-calculator">{children}</ToolSeo>
    </>
  );
}
