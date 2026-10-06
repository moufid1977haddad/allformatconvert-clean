'use client';
import Link from 'next/link';
import { ToolIcon, CategoryIcon, toolTextColors, categoryColors } from '../../lib/toolIcons';

const tools = [
  { title: 'Image Compressor', description: 'Up to 20 JPG, PNG, WebP, AVIF or SVG, format kept', href: '/tools/image-tools/image-compressor', group: 'Transform' },
  { title: 'Image Converter', description: 'To WebP, PNG, JPG, AVIF, GIF, BMP, TIFF, ICO or PDF', href: '/tools/image-tools/image-converter', group: 'Transform' },
  { title: 'Image Resizer', description: 'Resize in pixels or by 25, 50 or 75%', href: '/tools/image-tools/image-resizer', group: 'Transform' },
  { title: 'Image Cropper', description: 'Crop in pixels or to a preset aspect ratio', href: '/tools/image-tools/image-cropper', group: 'Transform' },
  { title: 'Image Rotate', description: 'Rotate 90°, 180°, 270° or any angle', href: '/tools/image-tools/image-rotate', group: 'Transform' },
  { title: 'Image Flip', description: 'Mirror an image left-right, top-bottom or both', href: '/tools/image-tools/image-flip', group: 'Transform' },
  { title: 'Round Corners', description: 'Round the corners, transparent or colored', href: '/tools/image-tools/round-corners', group: 'Annotate' },
  { title: 'Add Text to Image', description: 'Write text with font, outline and shadow', href: '/tools/image-tools/add-text-to-image', group: 'Annotate' },
  { title: 'Image Editor', description: 'Adjustments, effects, border and text in one editor', href: '/tools/image-tools/image-editor', group: 'Annotate' },
  { title: 'Add Border to Image', description: 'Add a solid-color border around an image', href: '/tools/image-tools/add-border-to-image', group: 'Annotate' },
  { title: 'Brightness and Contrast', description: 'Adjust brightness, contrast and saturation', href: '/tools/image-tools/brightness-contrast', group: 'Filters & Effects' },
  { title: 'Image Comparison', description: 'Compare two images with a slider and a diff', href: '/tools/image-tools/image-comparison', group: 'Analyze & Utilities' },
  { title: 'Duplicate Image Finder', description: 'Find exact and resized copies among images', href: '/tools/image-tools/duplicate-image-finder', group: 'Analyze & Utilities' },
  { title: 'Grayscale Converter', description: 'Grayscale by a chosen method, or black and white', href: '/tools/image-tools/grayscale-converter', group: 'Filters & Effects' },
  { title: 'Image Blur', description: 'Apply a Gaussian blur to the whole image', href: '/tools/image-tools/image-blur', group: 'Filters & Effects' },
  { title: 'Image Inverter', description: 'Make a color negative, transparency kept', href: '/tools/image-tools/image-inverter', group: 'Filters & Effects' },
  { title: 'Sepia Filter', description: 'Apply a sepia tone at a chosen strength', href: '/tools/image-tools/sepia-filter', group: 'Filters & Effects' },
  { title: 'Image Metadata Viewer', description: 'Read EXIF and GPS data, save a copy without it', href: '/tools/image-tools/image-metadata', group: 'Analyze & Utilities' },
  { title: 'Image Pixelator', description: 'Pixelate the whole image into square blocks', href: '/tools/image-tools/image-pixelator', group: 'Filters & Effects' },
  { title: 'Add Noise', description: 'Add mono or color film grain', href: '/tools/image-tools/add-noise', group: 'Annotate' },
  { title: 'Add Vignette', description: 'Darken the edges with a radial vignette', href: '/tools/image-tools/add-vignette', group: 'Annotate' },
  { title: 'HEIC to JPG', description: 'iPhone HEIC or HEIF photo to JPG, quality adjustable', href: '/tools/image-tools/heic-to-jpg', group: 'Convert Format' },
  { title: 'HEIC to PNG', description: 'HEIC or HEIF photos from an iPhone to PNG', href: '/tools/image-tools/heic-to-png', group: 'Convert Format' },
  { title: 'WebP to PNG', description: 'Convert WebP to PNG, transparency kept', href: '/tools/image-tools/webp-to-png', group: 'Convert Format' },
  { title: 'WebP to JPG', description: 'Convert WebP to JPG on a background color', href: '/tools/image-tools/webp-to-jpg', group: 'Convert Format' },
  { title: 'PNG to JPG', description: 'Convert PNG to JPG with quality control', href: '/tools/image-tools/png-to-jpg', group: 'Convert Format' },
  { title: 'JPG to PNG', description: 'Save a JPG photo as a PNG file', href: '/tools/image-tools/jpg-to-png', group: 'Convert Format' },
  { title: 'SVG to PNG', description: 'Render an SVG to PNG at a chosen size', href: '/tools/image-tools/svg-to-png', group: 'Convert Format' },
  { title: 'PNG to ICO', description: 'Multi-size favicon .ico from a PNG', href: '/tools/image-tools/png-to-ico', group: 'Convert Format' },
  { title: 'JPG to WebP', description: 'Convert JPG to WebP, lossy or lossless', href: '/tools/image-tools/jpg-to-webp', group: 'Convert Format' },
  { title: 'PNG to WebP', description: 'Convert PNG to WebP, transparency kept', href: '/tools/image-tools/png-to-webp', group: 'Convert Format' },
  { title: 'GIF to PNG', description: 'First frame as PNG, or all frames in a ZIP', href: '/tools/image-tools/gif-to-png', group: 'Convert Format' },
  { title: 'BMP to PNG', description: 'Convert BMP bitmaps to PNG', href: '/tools/image-tools/bmp-to-png', group: 'Convert Format' },
  { title: 'TIFF to PNG', description: 'Convert a TIFF page to PNG', href: '/tools/image-tools/tiff-to-png', group: 'Convert Format' },
  { title: 'TIFF to JPG', description: 'Convert a TIFF page to JPG', href: '/tools/image-tools/tiff-to-jpg', group: 'Convert Format' },
  { title: 'ICO to PNG', description: 'Largest icon size, or every size, as PNG', href: '/tools/image-tools/ico-to-png', group: 'Convert Format' },
  { title: 'Image to Base64', description: 'Data URI, img tag, CSS or JSON snippet', href: '/tools/image-tools/image-to-base64', group: 'Analyze & Utilities' },
];

export default function ImageToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 flex items-center justify-center gap-2"><CategoryIcon slug="image-tools" className={`w-8 h-8 ${categoryColors['image-tools']}`} /> Image Tools</h1>
        <p className="text-neutral-500 text-center mb-10">Convert, resize, edit and inspect images - {tools.length} tools</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
              <ToolIcon slug={tool.href.split('/').pop()} className={`w-8 h-8 mb-3 ${toolTextColors[tool.href]}`} />
              <h2 className="font-bold text-lg mb-1 text-neutral-800 group-hover:text-indigo-600 transition">{tool.title}</h2>
              <p className="text-neutral-500 text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Image Tools</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Every tool on this page works on the image in your browser, with the canvas API, WebGL or WebAssembly code, so your pictures are not uploaded. Three image tools that send a picture are on the AI Tools page: Image Captioner sends it to OpenAI through our server, Background Remover to our own service, and Image Upscaler to our server unless it runs on your device. The tools fall into format converters, transforms (resize, crop, rotate, flip), effects and filters, and analysis: metadata, side-by-side comparison and duplicate search.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Image Tools</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Pick a format converter such as HEIC to JPG or PNG to WebP, a transform, an effect, or an analysis tool.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Open the image from your device; Image Compressor and Image Converter accept several at once.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Set the tool's own controls, such as the JPG quality in PNG to JPG, the free angle in Image Rotate or the blur strength in Image Blur.</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Download the result; with several images, Image Compressor and Image Converter offer them in one ZIP.</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Which image formats are supported?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">JPG, PNG, WebP, GIF, BMP, TIFF, HEIC, ICO and SVG have their own converters, and Image Converter also reads PSD and camera RAW files and writes AVIF, ICO and PDF.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Are my images uploaded?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">No. The tools listed here process images in your browser. On the AI Tools page, Image Captioner sends an image to OpenAI through our server, Background Remover sends a JPEG copy of at most 1,024 px to our own service, and Image Upscaler uses our server unless it runs on your device.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I remove the GPS location from a photo?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, for JPG, PNG and WebP files. Image Metadata Viewer shows the EXIF, GPS, IPTC and XMP data of a JPG, HEIC, TIFF, PNG, AVIF or WebP image, and saves a copy without metadata for JPG, PNG and WebP.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How many images can I process at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">20 in Image Compressor. Image Converter and Duplicate Image Finder also take several images at once, Image Comparison takes two, and the other tools take one image at a time.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Before posting an iPhone photo, convert it with HEIC to JPG: the new JPG carries no EXIF or GPS data. Check any other JPG or PNG in Image Metadata Viewer.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>PNG to JPG and WebP to JPG let you pick the color that fills transparent areas, since JPG has no transparency.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>PNG to ICO puts several icon sizes in one .ico file, ready to use as a favicon.</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use the difference image in Image Comparison to see which pixels an edit or a compression changed.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}