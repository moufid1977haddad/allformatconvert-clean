import Link from 'next/link';

export const metadata = {
  title: 'About - AllFormatConvert',
  description: 'Learn more about AllFormatConvert - your all-in-one free online tools platform.',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">

        <h1 className="text-4xl font-bold text-center mb-2 text-neutral-800">About Us</h1>
        <p className="text-neutral-500 text-center mb-10">Who we are and what we do</p>

        <div className="bg-white border border-neutral-200 rounded-xl p-8 mb-5">
          <h2 className="text-xl font-bold text-neutral-800 mb-3">What is AllFormatConvert?</h2>
          <p className="text-neutral-600 text-sm leading-relaxed">
            AllFormatConvert is a free, all-in-one platform offering 200+ online tools for converting,
            compressing, and editing files — including PDFs, images, videos, audio, and more.
            Everything runs locally in your browser, so your files never leave your device.
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-8 mb-5">
          <h2 className="text-xl font-bold text-neutral-800 mb-3">Our Mission</h2>
          <p className="text-neutral-600 text-sm leading-relaxed">
            We believe powerful tools should be free and accessible to everyone. No sign-up required,
            no watermarks, no limits — just fast, reliable tools that work right in your browser.
          </p>
        </div>

        <div className="bg-white border border-neutral-200 rounded-xl p-8 mb-5">
          <h2 className="text-xl font-bold text-neutral-800 mb-4">What we offer</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {['PDF Tools', 'Image Tools', 'Video Tools', 'Audio Tools', 'Text Tools', 'AI Tools', 'Developer Tools', 'File Tools', 'GIF Tools'].map((item) => (
              <div key={item} className="bg-neutral-100 rounded-lg px-3 py-2 text-sm text-neutral-700 text-center">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="text-center mt-8">
          <Link href="/tools" className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-6 py-3 rounded-lg transition">
            Explore All Tools
          </Link>
        </div>

      </div>
    </div>
  );
}
