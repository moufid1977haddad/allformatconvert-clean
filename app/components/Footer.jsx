import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white text-neutral-600 border-t border-neutral-200 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-neutral-800 font-bold text-lg mb-3">AllFormatConvert</h3>
            <p className="text-sm text-neutral-500 leading-relaxed">200+ free online tools for converting, compressing and editing files. No sign-up required.</p>
          </div>
          <div>
            <h4 className="text-neutral-800 font-semibold mb-3">Tools</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tools/pdf-tools" className="hover:text-white transition">PDF Tools</Link></li>
              <li><Link href="/tools/image-tools" className="hover:text-white transition">Image Tools</Link></li>
              <li><Link href="/tools/media-tools" className="hover:text-white transition">Media Tools</Link></li>
              <li><Link href="/tools/ai-tools" className="hover:text-white transition">AI Tools</Link></li>
              <li><Link href="/tools/developer-tools" className="hover:text-white transition">Developer Tools</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-neutral-800 font-semibold mb-3">Company</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/about" className="hover:text-white transition">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-white transition">Contact</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition">Terms of Service</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="text-neutral-800 font-semibold mb-3">Popular Tools</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/tools/pdf-tools/pdf-merge" className="hover:text-white transition">Merge PDF</Link></li>
              <li><Link href="/tools/image-tools/image-compressor" className="hover:text-white transition">Image Compressor</Link></li>
              <li><Link href="/tools/ai-tools/background-remover" className="hover:text-white transition">Background Remover</Link></li>
              <li><Link href="/tools/ai-tools/grammar-fixer" className="hover:text-white transition">Grammar Fixer</Link></li>
              <li><Link href="/tools/qr-barcodes-tools/qr-generator" className="hover:text-white transition">QR Generator</Link></li>
            </ul>
          </div>
        </div>
        <div className="border-t border-neutral-200 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-neutral-400">© 2025 AllFormatConvert. All rights reserved.</p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacy" className="hover:text-white transition">Privacy</Link>
            <Link href="/terms" className="hover:text-white transition">Terms</Link>
            <Link href="/contact" className="hover:text-white transition">Contact</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
