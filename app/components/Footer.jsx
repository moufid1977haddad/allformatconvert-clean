import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white text-neutral-600 border-t border-neutral-200 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-black text-xl mb-3 bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent notranslate">AllFormatConvert</h3>
            <p className="text-sm text-neutral-400 leading-relaxed font-light">200+ free online tools for converting, compressing and editing files. No sign-up required.</p>
          </div>
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-neutral-400 mb-3">Tools</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tools/pdf-tools" className="hover:text-indigo-600 transition font-medium">PDF Tools</Link></li>
              <li><Link href="/tools/image-tools" className="hover:text-indigo-600 transition font-medium">Image Tools</Link></li>
              <li><Link href="/tools/media-tools" className="hover:text-indigo-600 transition font-medium">Media Tools</Link></li>
              <li><Link href="/tools/ai-tools" className="hover:text-indigo-600 transition font-medium">AI Tools</Link></li>
              <li><Link href="/tools/developer-tools" className="hover:text-indigo-600 transition font-medium">Developer Tools</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-neutral-400 mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-indigo-600 transition font-medium">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-indigo-600 transition font-medium">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-indigo-600 transition font-medium">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-indigo-600 transition font-medium">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold text-sm uppercase tracking-widest text-neutral-400 mb-3">Popular Tools</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tools/pdf-tools/pdf-merge" className="hover:text-indigo-600 transition font-medium">Merge PDF</Link></li>
              <li><Link href="/tools/image-tools/image-compressor" className="hover:text-indigo-600 transition font-medium">Image Compressor</Link></li>
              <li><Link href="/tools/ai-tools/background-remover" className="hover:text-indigo-600 transition font-medium">Background Remover</Link></li>
              <li><Link href="/tools/ai-tools/grammar-fixer" className="hover:text-indigo-600 transition font-medium">Grammar Fixer</Link></li>
              <li><Link href="/tools/qr-barcodes-tools/qr-generator" className="hover:text-indigo-600 transition font-medium">QR Generator</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-neutral-200 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-neutral-400 font-light tracking-wide">© 2025 AllFormatConvert. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="hover:text-indigo-600 transition font-medium">Privacy</Link>
            <Link href="/terms" className="hover:text-indigo-600 transition font-medium">Terms</Link>
            <Link href="/contact" className="hover:text-indigo-600 transition font-medium">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
