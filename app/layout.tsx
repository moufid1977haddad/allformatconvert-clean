import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
<<<<<<< HEAD
import Navbar from "./components/Navbar";
=======
>>>>>>> fecb1eb1c2dc3ded98dd81b3d1b9d08424c1d704

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
<<<<<<< HEAD
  title: {
    default: "AllFormatConvert - Free Online Tools",
    template: "%s | AllFormatConvert",
  },
  description: "200+ free online tools for converting, compressing and editing PDFs, images, videos, audio and more. No sign-up, no watermarks, 100% local.",
  keywords: ["pdf converter", "image converter", "video converter", "free online tools", "file converter", "compress pdf", "compress image"],
  authors: [{ name: "AllFormatConvert" }],
  creator: "AllFormatConvert",
  metadataBase: new URL("https://allformatconvert.com"),
  openGraph: {
    title: "AllFormatConvert - Free Online Tools",
    description: "200+ free online tools for converting, compressing and editing files. No sign-up required.",
    url: "https://allformatconvert.com",
    siteName: "AllFormatConvert",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AllFormatConvert - Free Online Tools",
    description: "200+ free online tools for converting, compressing and editing files.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
=======
  title: "allformatconvert",
  description: "Convertisseurs tout-en-un 100% local",
>>>>>>> fecb1eb1c2dc3ded98dd81b3d1b9d08424c1d704
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
<<<<<<< HEAD
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Navbar />
=======
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
>>>>>>> fecb1eb1c2dc3ded98dd81b3d1b9d08424c1d704
        {children}
      </body>
    </html>
  );
}