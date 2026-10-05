import type { Metadata } from "next";
import { Inter, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import NewVersionBanner from "./components/NewVersionBanner";
import IosVideoFirstFrame from "./components/IosVideoFirstFrame";
import IosDownloadBridge from "./components/IosDownloadBridge";
import FileDropBridge from "./components/FileDropBridge";
import A11yBridge from "./components/A11yBridge";
import GoogleTranslateLoader from "./components/GoogleTranslateLoader";
import AdsScripts from "./components/AdsScripts";
import Analytics from "./components/Analytics";
import ToolFooterAd from "./components/AdSlot";
import Script from "next/script";
import { getToolCounts } from "@/lib/toolCounts";
const inter = Inter({ subsets: ["latin"] });
// Only used when Google Translate switches the page to Arabic (globals.css, html[dir="rtl"]): not preloaded, so the
// 166 KB font is no longer fetched at high priority on every page for every visitor (Lighthouse, 30/09/2026). The
// browser still downloads it the moment Arabic text needs it.
const notoSansArabic = Noto_Sans_Arabic({ subsets: ["arabic"], variable: "--font-arabic", preload: false });
const { total: totalTools } = getToolCounts();
export const metadata: Metadata = {
  title: {
    default: "OnlineConverTools - Free Online Tools",
    template: "%s | OnlineConverTools",
  },
  description: `${totalTools} free online tools to convert, compress, and edit PDFs, images, videos, audio, GIF, and more. No sign-up, no watermarks. Works on all devices.`,
  keywords: ["pdf converter", "image converter", "video converter", "free online tools", "file converter", "compress pdf", "compress image", "online converter", "free pdf tools", "resize image online", "convert video online", "audio converter", "gif maker", "qr code generator", "json formatter", "background remover", "ai tools free"],
  authors: [{ name: "OnlineConverTools" }],
  creator: "OnlineConverTools",
  metadataBase: new URL("https://www.onlineconvertools.com"),
  openGraph: {
    title: "OnlineConverTools - Free Online Tools",
    description: `${totalTools} free online tools for converting, compressing and editing files. No sign-up required.`,
    url: "https://www.onlineconvertools.com",
    siteName: "OnlineConverTools",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `OnlineConverTools - ${totalTools} free online tools to convert, compress & edit files`,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "OnlineConverTools - Free Online Tools",
    description: `${totalTools} free online tools for converting, compressing and editing files.`,
    images: ["/og-image.png"],
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
      <body className={`${inter.className} ${notoSansArabic.variable}`} suppressHydrationWarning>
        {/* Google Translate rewrites text nodes outside React's tracking; when a tool's
            result panel re-renders after a download, React can throw NotFoundError on
            insertBefore/removeChild against a node GT already moved, crashing to the
            default Next.js error screen. This patch makes those two DOM ops no-op/append
            instead of throwing. */}
        {/* A browser driven by a test robot (Playwright, Selenium, Puppeteer: navigator.webdriver) is marked, so
            that the errors our own tests provoke are never written to tool_errors (docs/audit/RAPPORT-global-28-09.md, 5e).
            A visitor's browser never has navigator.webdriver set: real errors are reported exactly as before. */}
        <Script id="automation-marker" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: `try { if (navigator.webdriver) document.cookie = 'oct_automation=1; path=/; max-age=86400; SameSite=Lax'; } catch (e) {}` }} />
        <Script id="google-translate-dom-patch" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: `
          (function () {
            if (typeof Node !== 'function' || !Node.prototype) return;
            var originalRemoveChild = Node.prototype.removeChild;
            Node.prototype.removeChild = function (child) {
              if (child.parentNode !== this) {
                if (typeof console !== 'undefined') console.warn('[gt-patch] removeChild called on a non-child node, ignoring', child, this);
                return child;
              }
              return originalRemoveChild.apply(this, arguments);
            };
            var originalInsertBefore = Node.prototype.insertBefore;
            Node.prototype.insertBefore = function (newNode, referenceNode) {
              if (referenceNode && referenceNode.parentNode !== this) {
                if (typeof console !== 'undefined') console.warn('[gt-patch] insertBefore reference node is not a child, appending instead', referenceNode, this);
                return this.appendChild(newNode);
              }
              return originalInsertBefore.apply(this, arguments);
            };
          })();
        `}} />
        <div id="google_translate_element" style={{ display: "none" }} />
        <Navbar />
        {/* The page's own content, as the main landmark (screen readers jump to it; Lighthouse "landmark-one-main"). */}
        <main id="main-content">{children}</main>
        {/* AdSense: renders nothing while NEXT_PUBLIC_ADSENSE_CLIENT is absent (app/lib/ads.js). */}
        <ToolFooterAd />
        <Footer />
        <AdsScripts />
        {/* Google Analytics: never in the EEA, the UK and Switzerland (nor for an unknown country) — the server decides
            from Vercel's country header; elsewhere, loaded once the page has loaded and the browser is idle (P35). */}
        <Analytics />
        {/* Google Translate: loaded on demand (language menu) or when a translation is already active. */}
        <GoogleTranslateLoader />
        <NewVersionBanner />
        <IosVideoFirstFrame />
        <IosDownloadBridge />
        <FileDropBridge />
        <A11yBridge />
      </body>
    </html>
  );
}