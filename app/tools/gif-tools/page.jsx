'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon } from '../../lib/toolIcons';

const tools = [
  { title: 'Video to GIF', description: 'Convert video files to GIF frames', href: '/tools/gif-tools/video-to-gif' },
  { title: 'MP4 to GIF', description: 'Convert MP4 video to GIF', href: '/tools/gif-tools/mp4-to-gif' },
  { title: 'WEBM to GIF', description: 'Convert WEBM video to GIF', href: '/tools/gif-tools/webm-to-gif' },
  { title: 'APNG to GIF', description: 'Convert APNG to GIF format', href: '/tools/gif-tools/apng-to-gif' },
  { title: 'GIF to MP4', description: 'Convert GIF to MP4/WebM video', href: '/tools/gif-tools/gif-to-mp4' },
  { title: 'GIF to APNG', description: 'Convert GIF to APNG format', href: '/tools/gif-tools/gif-to-apng' },
  { title: 'Image to GIF', description: 'Create animated GIF from images', href: '/tools/gif-tools/image-to-gif' },
  { title: 'MOV to GIF', description: 'Convert MOV video to GIF', href: '/tools/gif-tools/mov-to-gif' },
  { title: 'AVI to GIF', description: 'Convert AVI video to GIF', href: '/tools/gif-tools/avi-to-gif' },
  { title: 'GIF Maker', description: 'Create GIF from images', href: '/tools/gif-tools/gif-maker' },
  { title: 'GIF Compressor', description: 'Compress GIF files', href: '/tools/gif-tools/gif-compressor' },
];

export default function GifToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-neutral-800 flex items-center justify-center gap-2"><CategoryIcon slug="gif-tools" className="w-8 h-8 text-purple-500" /> GIF Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your GIF tools in one place - {tools.length} tools</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
              <ToolIcon slug={tool.href.split('/').pop()} className="w-8 h-8 mb-3 text-indigo-500" />
              <h2 className="font-bold text-lg mb-1 text-neutral-800 group-hover:text-indigo-600 transition">{tool.title}</h2>
              <p className="text-neutral-500 text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Gif Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Gif Tools is a free online platform that allows users to create, edit, compress, and convert GIF files without any software installation or subscription required. Whether you need to make animated GIFs from images, resize existing GIFs, or convert video to GIF format, Gif Tools provides all the essential features in one easy-to-use web application.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Gif Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Gif Tools website and select the specific tool you need, such as GIF maker, editor, or converter from the main menu.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Upload your source files (images, video, or existing GIF) using the drag-and-drop interface or click to browse your device.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Customize your GIF by adjusting settings like frame speed, dimensions, quality, and effects using the intuitive editing panel.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Preview your GIF to ensure it meets your requirements, then click the download button to save your file to your device.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Gif Tools completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Gif Tools is 100% free with no hidden fees, registration requirements, or premium subscriptions needed to access all features.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats can I convert to GIF?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Gif Tools supports conversion from multiple formats including MP4, WebM, AVI, MOV, and image formats like JPG, PNG, and BMP.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I edit an existing GIF file?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, you can upload existing GIF files and edit them by adjusting frame speed, removing frames, adding text, applying filters, or resizing.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is there a file size limit for uploads?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Gif Tools supports files up to a generous size limit, with exact specifications available on the upload page to ensure smooth processing.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Reduce file size by compressing your GIF using the compression tool, which maintains quality while making it faster to load and share on social media.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Adjust the frame rate (speed) to 50-100ms for smooth animations and 200-500ms for slower, more dramatic effects depending on your content.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the batch processing feature to convert multiple images into a GIF simultaneously, saving time when creating animations from photo sequences.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Optimize GIF dimensions for your intended platform by resizing before finalizing, such as 600x600px for social media or 1280x720px for web content.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}