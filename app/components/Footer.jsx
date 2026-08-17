import Link from 'next/link';
import { Poppins } from 'next/font/google';
import { getToolCounts } from '@/lib/toolCounts';

const poppinsMedium = Poppins({ weight: '500', subsets: ['latin'] });

export default function Footer() {
  const { total } = getToolCounts();
  return (
    <footer className="bg-white text-neutral-600 border-t border-neutral-200">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] xl:grid-cols-[3fr_1fr_1fr_1fr] gap-8 md:gap-6">
          <div>
            <h3 className={`${poppinsMedium.className} text-xl mb-3 text-black dark:text-white notranslate`}>
              <span className="text-[#185fa5] dark:text-[#85b7eb]">O</span>nline<span className="text-[#185fa5] dark:text-[#85b7eb]">C</span>onver<span className="text-[#185fa5] dark:text-[#85b7eb]">T</span>ools
            </h3>
            <p className="text-sm text-neutral-800 dark:text-neutral-400 leading-relaxed font-normal">
              {total} free online tools for converting<br />
              compressing &amp; editing files<br />
              No sign-up required
            </p>
          </div>
          <div>
            <h4 className="font-bold text-base uppercase tracking-widest text-black dark:text-white mb-3">Tools</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tools/pdf-tools" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">PDF Tools</Link></li>
              <li><Link href="/tools/image-tools" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">Image Tools</Link></li>
              <li><Link href="/tools/video-tools" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">Video Tools</Link></li>
              <li><Link href="/tools/ai-tools" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">AI Tools</Link></li>
              <li><Link href="/tools/developer-tools" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">Developer Tools</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-base uppercase tracking-widest text-black dark:text-white mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-base uppercase tracking-widest text-black dark:text-white mb-3">Popular Tools</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tools/pdf-tools/pdf-merge" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">Merge PDF</Link></li>
              <li><Link href="/tools/image-tools/image-compressor" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">Image Compressor</Link></li>
              <li><Link href="/tools/ai-tools/background-remover" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">Background Remover</Link></li>
              <li><Link href="/tools/ai-tools/grammar-fixer" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">Grammar Fixer</Link></li>
              <li><Link href="/tools/qr-barcodes-tools/qr-generator" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">QR Generator</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-neutral-200 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-neutral-700 dark:text-neutral-400 font-light tracking-wide">© 2026 OnlineConverTools. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">Privacy</Link>
            <Link href="/terms" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">Terms</Link>
            <Link href="/contact" className="hover:text-[#185fa5] dark:hover:text-[#85b7eb] transition font-medium">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

