'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon } from '../../lib/toolIcons';

const tools = [
  { title: 'Image Compressor', description: 'Compress images without losing quality', href: '/tools/image-tools/image-compressor' },
  { title: 'Image Converter', description: 'Convert between image formats', href: '/tools/image-tools/image-converter' },
  { title: 'Image Resizer', description: 'Resize images to specific dimensions', href: '/tools/image-tools/image-resizer' },
  { title: 'Image Cropper', description: 'Crop images with aspect ratio presets', href: '/tools/image-tools/image-cropper' },
  { title: 'Image Rotate', description: 'Rotate images by any angle', href: '/tools/image-tools/image-rotate' },
  { title: 'Image Flip', description: 'Flip images horizontally or vertically', href: '/tools/image-tools/image-flip' },
  { title: 'Round Corners', description: 'Add rounded corners to images', href: '/tools/image-tools/round-corners' },
  { title: 'Add Text to Image', description: 'Overlay text on images', href: '/tools/image-tools/add-text-to-image' },
  { title: 'Image Editor', description: 'Edit and enhance your images', href: '/tools/image-tools/image-editor' },
  { title: 'Add Border to Image', description: 'Add decorative borders to images', href: '/tools/image-tools/add-border-to-image' },
  { title: 'Brightness and Contrast', description: 'Adjust image brightness and contrast', href: '/tools/image-tools/brightness-contrast' },
  { title: 'Image Comparison', description: 'Compare images with slider', href: '/tools/image-tools/image-comparison' },
  { title: 'Duplicate Image Finder', description: 'Find similar images', href: '/tools/image-tools/duplicate-image-finder' },
  { title: 'Grayscale Converter', description: 'Convert images to grayscale', href: '/tools/image-tools/grayscale-converter' },
  { title: 'Image Blur', description: 'Add blur effect to images', href: '/tools/image-tools/image-blur' },
  { title: 'Image Inverter', description: 'Invert image colors', href: '/tools/image-tools/image-inverter' },
  { title: 'Sepia Filter', description: 'Apply sepia tone effect', href: '/tools/image-tools/sepia-filter' },
  { title: 'Image Metadata Viewer', description: 'View and remove EXIF data', href: '/tools/image-tools/image-metadata' },
  { title: 'Image Pixelator', description: 'Pixelate/mosaic effect', href: '/tools/image-tools/image-pixelator' },
  { title: 'Add Noise', description: 'Add film grain effect', href: '/tools/image-tools/add-noise' },
  { title: 'Add Vignette', description: 'Add vignette effect', href: '/tools/image-tools/add-vignette' },
  { title: 'HEIC to JPG', description: 'Convert iPhone HEIC photos to JPG', href: '/tools/image-tools/heic-to-jpg' },
  { title: 'HEIC to PNG', description: 'Convert iPhone HEIC photos to PNG', href: '/tools/image-tools/heic-to-png' },
  { title: 'WebP to PNG', description: 'Convert WebP images to PNG', href: '/tools/image-tools/webp-to-png' },
  { title: 'WebP to JPG', description: 'Convert WebP images to JPG', href: '/tools/image-tools/webp-to-jpg' },
  { title: 'PNG to JPG', description: 'Convert PNG to JPG with quality control', href: '/tools/image-tools/png-to-jpg' },
  { title: 'JPG to PNG', description: 'Convert JPG to lossless PNG', href: '/tools/image-tools/jpg-to-png' },
  { title: 'SVG to PNG', description: 'Rasterize SVG vectors to PNG', href: '/tools/image-tools/svg-to-png' },
  { title: 'PNG to ICO', description: 'Create favicon from PNG', href: '/tools/image-tools/png-to-ico' },
  { title: 'JPG to WebP', description: 'Convert JPG to modern WebP', href: '/tools/image-tools/jpg-to-webp' },
  { title: 'PNG to WebP', description: 'Convert PNG to modern WebP', href: '/tools/image-tools/png-to-webp' },
  { title: 'GIF to PNG', description: 'Extract first frame from GIF', href: '/tools/image-tools/gif-to-png' },
  { title: 'BMP to PNG', description: 'Convert BMP to compressed PNG', href: '/tools/image-tools/bmp-to-png' },
  { title: 'TIFF to PNG', description: 'Convert TIFF images to PNG', href: '/tools/image-tools/tiff-to-png' },
  { title: 'TIFF to JPG', description: 'Convert TIFF images to JPG', href: '/tools/image-tools/tiff-to-jpg' },
  { title: 'ICO to PNG', description: 'Convert ICO files to PNG', href: '/tools/image-tools/ico-to-png' },
  { title: 'Image to Base64', description: 'Convert image to Base64 data URI', href: '/tools/image-tools/image-to-base64' },
];

export default function ImageToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 flex items-center justify-center gap-2"><CategoryIcon slug="image-tools" className="w-8 h-8 text-pink-500" /> Image Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your image tools in one place - {tools.length} tools</p>
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
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Image Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Image Tools is a free online suite of utilities designed to help you edit, convert, and optimize images without downloading any software. Whether you need to resize, compress, or transform your images, our user-friendly platform provides professional-grade results instantly.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Image Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Image Tools website and select the specific tool you need from our collection of image utilities.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Upload your image file by clicking the upload button or dragging and dropping your file onto the workspace.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Adjust the settings and parameters according to your requirements, such as dimensions, quality, or format preferences.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download your processed image to your device or share it directly with others using the provided links.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Image Tools completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Image Tools is 100% free with no hidden charges, registration requirements, or premium subscriptions needed to access any of our image editing features.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What image formats does Image Tools support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Image Tools supports all major image formats including JPG, PNG, GIF, WebP, BMP, TIFF, and SVG, allowing you to convert and edit virtually any image type.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is my data safe when using Image Tools?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Your privacy is our priority. All images are processed securely on our servers and are automatically deleted after a short period. We never store or share your personal images.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Do I need to install any software to use Image Tools?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No installation required. Image Tools is entirely web-based, so you can access it from any device with an internet browser without downloading anything.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Compress your images before uploading to websites to improve page load times and reduce bandwidth usage.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the batch processing feature to edit multiple images at once, saving you time on repetitive editing tasks.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Convert images to WebP format for better compression without sacrificing quality, especially for web use.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Take advantage of the resize tool to create multiple versions of your images for different platforms like social media, thumbnails, and print.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}