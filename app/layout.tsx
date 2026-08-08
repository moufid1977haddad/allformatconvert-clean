import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Script from "next/script";
import { getToolCounts } from "@/lib/toolCounts";
const inter = Inter({ subsets: ["latin"] });
const { total: totalTools } = getToolCounts();
export const metadata: Metadata = {
  title: {
    default: "OnlineConverTools - Free Online Tools",
    template: "%s | OnlineConverTools",
  },
  description: `${totalTools}+ free online tools to convert, compress, and edit PDFs, images, videos, audio, GIF, and more. No sign-up, no watermarks, no limits. Works on all devices.`,
  keywords: ["pdf converter", "image converter", "video converter", "free online tools", "file converter", "compress pdf", "compress image", "online converter", "free pdf tools", "resize image online", "convert video online", "audio converter", "gif maker", "qr code generator", "json formatter", "background remover", "ai tools free"],
  authors: [{ name: "OnlineConverTools" }],
  creator: "OnlineConverTools",
  metadataBase: new URL("https://www.onlineconvertools.com"),
  openGraph: {
    title: "OnlineConverTools - Free Online Tools",
    description: `${totalTools}+ free online tools for converting, compressing and editing files. No sign-up required.`,
    url: "https://www.onlineconvertools.com",
    siteName: "OnlineConverTools",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "OnlineConverTools - Free Online Tools",
    description: `${totalTools}+ free online tools for converting, compressing and editing files.`,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <div id="google_translate_element" style={{ display: "none" }} />
        <Navbar />
        {children}
        <Footer />
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-7GFHW05JLH" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', 'G-7GFHW05JLH');
        `}} />
        <Script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
        <Script id="google-translate-init" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `
          function googleTranslateElementInit() {
            new google.translate.TranslateElement({
              pageLanguage: 'en',
              includedLanguages: 'en,fr,es,zh-CN,ar,de,pt,ja,ru,it,ko,hi,tr',
              autoDisplay: false,
            }, 'google_translate_element');
          }
        `}} />
      </body>
    </html>
  );
}