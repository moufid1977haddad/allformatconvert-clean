import Link from 'next/link';
import { getToolCounts } from '@/lib/toolCounts';
import SiteName from './SiteName';
import PrivacyChoicesLink from './PrivacyChoicesLink';
import { SITE_CATEGORIES } from '@/app/lib/siteCategories';

export default function Footer() {
  const { total, counts } = getToolCounts();
  return (
    <footer className="bg-white text-neutral-600 border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] xl:grid-cols-[3fr_1fr_1fr_1fr] gap-8 md:gap-6">
          <div>
            <h2 className="text-xl mb-3 notranslate">
              <SiteName className="font-semibold text-black dark:text-white" />
            </h2>
            <p className="text-sm text-neutral-800 dark:text-neutral-400 leading-relaxed font-normal">
              {total} free online tools for converting<br />
              compressing &amp; editing files<br />
              No sign-up required
            </p>
          </div>
          <div>
            <h3 className="font-bold text-base uppercase tracking-widest text-black dark:text-white mb-3">Tools</h3>
            {/* P27: every category (12), not 5 -- the market's footers list all their tool families (Smallpdf, iLovePDF) */}
            <ul className="grid grid-cols-2 md:grid-cols-1 gap-x-4 gap-y-2 text-sm">
              {SITE_CATEGORIES.map((c) => (
                <li key={c.slug}><Link href={c.href} className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">{c.name}{counts[c.slug] ? <span className="text-neutral-500 dark:text-neutral-400 font-normal"> ({counts[c.slug]})</span> : null}</Link></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-base uppercase tracking-widest text-black dark:text-white mb-3">Company</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">Terms of Service</Link></li>
              <PrivacyChoicesLink className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium text-start" />
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-base uppercase tracking-widest text-black dark:text-white mb-3">Popular Tools</h3>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tools/pdf-tools/pdf-merge" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">Merge PDF</Link></li>
              <li><Link href="/tools/image-tools/image-compressor" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">Image Compressor</Link></li>
              <li><Link href="/tools/ai-tools/background-remover" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">Background Remover</Link></li>
              <li><Link href="/tools/ai-tools/grammar-fixer" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">Grammar Fixer</Link></li>
              <li><Link href="/tools/qr-barcodes-tools/qr-generator" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">QR Generator</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-neutral-200 mt-10 pt-6 flex justify-center items-center">
          <p className="text-sm text-neutral-700 dark:text-neutral-400 font-light tracking-wide">© 2026 OnlineConverTools. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

