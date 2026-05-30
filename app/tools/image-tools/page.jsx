'use client';
import Link from 'next/link';

const tools = [
  { icon: '🗜️', title: 'Image Compressor', description: 'Compress images without losing quality', href: '/tools/image-tools/image-compressor' },
  { icon: '🔄', title: 'Image Converter', description: 'Convert between image formats', href: '/tools/image-tools/image-converter' },
  { icon: '📐', title: 'Image Resizer', description: 'Resize images to specific dimensions', href: '/tools/image-tools/image-resizer' },
  { icon: '✂️', title: 'Image Cropper', description: 'Crop images with aspect ratio presets', href: '/tools/image-tools/image-cropper' },
  { icon: '🔃', title: 'Image Rotate', description: 'Rotate images by any angle', href: '/tools/image-tools/image-rotate' },
  { icon: '🔁', title: 'Image Flip', description: 'Flip images horizontally or vertically', href: '/tools/image-tools/image-flip' },
  { icon: '⬜', title: 'Round Corners', description: 'Add rounded corners to images', href: '/tools/image-tools/round-corners' },
  { icon: '✏️', title: 'Add Text to Image', description: 'Overlay text on images', href: '/tools/image-tools/add-text-to-image' },
  { icon: '🖼️', title: 'Image Editor', description: 'Edit and enhance your images', href: '/tools/image-tools/image-editor' },
  { icon: '🔲', title: 'Add Border to Image', description: 'Add decorative borders to images', href: '/tools/image-tools/add-border-to-image' },
  { icon: '☀️', title: 'Brightness and Contrast', description: 'Adjust image brightness and contrast', href: '/tools/image-tools/brightness-contrast' },
  { icon: '🔍', title: 'Image Comparison', description: 'Compare images with slider', href: '/tools/image-tools/image-comparison' },
  { icon: '🔎', title: 'Duplicate Image Finder', description: 'Find similar images', href: '/tools/image-tools/duplicate-image-finder' },
  { icon: '⚫', title: 'Grayscale Converter', description: 'Convert images to grayscale', href: '/tools/image-tools/grayscale-converter' },
  { icon: '💧', title: 'Image Blur', description: 'Add blur effect to images', href: '/tools/image-tools/image-blur' },
  { icon: '🔀', title: 'Image Inverter', description: 'Invert image colors', href: '/tools/image-tools/image-inverter' },
  { icon: '🟫', title: 'Sepia Filter', description: 'Apply sepia tone effect', href: '/tools/image-tools/sepia-filter' },
  { icon: '📊', title: 'Image Metadata Viewer', description: 'View and remove EXIF data', href: '/tools/image-tools/image-metadata' },
  { icon: '🟦', title: 'Image Pixelator', description: 'Pixelate/mosaic effect', href: '/tools/image-tools/image-pixelator' },
  { icon: '🌫️', title: 'Add Noise', description: 'Add film grain effect', href: '/tools/image-tools/add-noise' },
  { icon: '🔵', title: 'Add Vignette', description: 'Add vignette effect', href: '/tools/image-tools/add-vignette' },
  { icon: '📱', title: 'HEIC to JPG', description: 'Convert iPhone HEIC photos to JPG', href: '/tools/image-tools/heic-to-jpg' },
  { icon: '📱', title: 'HEIC to PNG', description: 'Convert iPhone HEIC photos to PNG', href: '/tools/image-tools/heic-to-png' },
  { icon: '🌐', title: 'WebP to PNG', description: 'Convert WebP images to PNG', href: '/tools/image-tools/webp-to-png' },
  { icon: '🌐', title: 'WebP to JPG', description: 'Convert WebP images to JPG', href: '/tools/image-tools/webp-to-jpg' },
  { icon: '🖼️', title: 'PNG to JPG', description: 'Convert PNG to JPG with quality control', href: '/tools/image-tools/png-to-jpg' },
  { icon: '🖼️', title: 'JPG to PNG', description: 'Convert JPG to lossless PNG', href: '/tools/image-tools/jpg-to-png' },
  { icon: '📐', title: 'SVG to PNG', description: 'Rasterize SVG vectors to PNG', href: '/tools/image-tools/svg-to-png' },
  { icon: '🎯', title: 'PNG to ICO', description: 'Create favicon from PNG', href: '/tools/image-tools/png-to-ico' },
  { icon: '🌐', title: 'JPG to WebP', description: 'Convert JPG to modern WebP', href: '/tools/image-tools/jpg-to-webp' },
  { icon: '🌐', title: 'PNG to WebP', description: 'Convert PNG to modern WebP', href: '/tools/image-tools/png-to-webp' },
  { icon: '🎞️', title: 'GIF to PNG', description: 'Extract first frame from GIF', href: '/tools/image-tools/gif-to-png' },
  { icon: '🖼️', title: 'BMP to PNG', description: 'Convert BMP to compressed PNG', href: '/tools/image-tools/bmp-to-png' },
  { icon: '🖼️', title: 'TIFF to PNG', description: 'Convert TIFF images to PNG', href: '/tools/image-tools/tiff-to-png' },
  { icon: '🖼️', title: 'TIFF to JPG', description: 'Convert TIFF images to JPG', href: '/tools/image-tools/tiff-to-jpg' },
  { icon: '🎯', title: 'ICO to PNG', description: 'Convert ICO files to PNG', href: '/tools/image-tools/ico-to-png' },
  { icon: '💾', title: 'Image to Base64', description: 'Convert image to Base64 data URI', href: '/tools/image-tools/image-to-base64' },
];

export default function ImageToolsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2">🖼️ Image Tools</h1>
        <p className="text-neutral-500 text-center mb-10">All your image tools in one place - {tools.length} tools</p>
        <div className="flex flex-wrap gap-4 justify-center">
          {tools.map((tool) => (
            <Link key={tool.href} href={tool.href} className="bg-white border border-neutral-200 hover:border-indigo-300 hover:shadow-md rounded-xl p-5 transition group flex flex-col items-center text-center w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
              <div className="text-3xl mb-3">{tool.icon}</div>
              <h2 className="font-bold text-lg mb-1 text-neutral-800 group-hover:text-indigo-600 transition">{tool.title}</h2>
              <p className="text-neutral-500 text-sm">{tool.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}