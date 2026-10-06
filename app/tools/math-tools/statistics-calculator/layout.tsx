import type { Metadata } from 'next';
import ToolSeo from '@/app/components/ToolSeo';

export const metadata: Metadata = {
  title: { absolute: "Statistics Calculator — SD, Quartiles, Skewness, Outliers" },
  description: "Paste a list of numbers to get the mean, median, mode, sample and population standard deviation, quartiles, IQR, skewness, kurtosis and outliers.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/math-tools/statistics-calculator" },
  openGraph: {
    title: "Statistics Calculator — SD, Quartiles, Skewness, Outliers",
    description: "Paste a list of numbers to get the mean, median, mode, sample and population standard deviation, quartiles, IQR, skewness, kurtosis and outliers.",
    url: "https://www.onlineconvertools.com/tools/math-tools/statistics-calculator",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior, except ToolSeo (P35): the page's related tools and structured data.
export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolSeo path="/tools/math-tools/statistics-calculator">{children}</ToolSeo>;
}
