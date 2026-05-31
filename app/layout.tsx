import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-US" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <div id="google_translate_element" style={{ display: 'none' }} />
        <Navbar />
        {children}
        <Footer />
        <Script
          src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
          strategy="afterInteractive"
        />
        <Script id="google-translate-init" strategy="afterInteractive">
          {`
            function googleTranslateElementInit() {
              new google.translate.TranslateElement({
                pageLanguage: 'en',
                includedLanguages: 'en,fr,es,zh-CN,ar,de,pt,ja,ru,it,ko,hi,tr',
                autoDisplay: false,
              }, 'google_translate_element');
            }
          `}
        </Script>
      </body>
    </html>
  );
}
