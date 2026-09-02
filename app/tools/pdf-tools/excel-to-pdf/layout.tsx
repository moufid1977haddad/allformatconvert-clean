import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: { absolute: "Excel to PDF — Convert Your .xlsx, .xls, or .csv File Online" },
  description: "Excel to PDF converts your .xlsx, .xls, or .csv file into a real PDF using LibreOffice — accurate for standard fonts, except Wingdings/Webdings icons.",
  alternates: { canonical: "https://www.onlineconvertools.com/tools/pdf-tools/excel-to-pdf" },
  openGraph: {
    title: "Excel to PDF — Convert Your .xlsx, .xls, or .csv File Online",
    description: "Excel to PDF converts your .xlsx, .xls, or .csv file into a real PDF using LibreOffice — accurate for standard fonts, except Wingdings/Webdings icons.",
    url: "https://www.onlineconvertools.com/tools/pdf-tools/excel-to-pdf",
  },
};

// This layout only passes its children through -- it exists solely to host
// the static `metadata` export above, since the page.jsx/tsx it wraps is a
// 'use client' component and can't export metadata itself. It has no effect
// on rendering or behavior.
export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
