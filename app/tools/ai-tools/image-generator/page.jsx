export default function ImageGeneratorPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-2 text-neutral-800">AI Image Generator</h1>
        <p className="text-neutral-500 mb-10">Generate stunning images with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-10 space-y-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div className="text-indigo-500 text-xl font-bold">Coming Soon</div>
          <p className="text-neutral-500 text-sm">We are integrating advanced AI image generation. Stay tuned for updates!</p>
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Image Generator</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Image Generator is a free online tool that creates high-quality images using artificial intelligence technology. Simply enter your text descriptions and instantly generate unique, customizable images for any purpose.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Image Generator</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Image Generator website and click the 'Create Image' button to get started</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Enter a detailed text description of the image you want to generate in the input field</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Customize settings like image style, size, and quality to match your preferences</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Click 'Generate' and wait for the AI to create your image, then download the result</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Image Generator completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Image Generator is 100% free with no hidden fees or premium requirements for basic image generation.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What file formats can I download my images in?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Generated images can be downloaded in PNG, JPG, and WebP formats for maximum compatibility and file size options.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I use generated images for commercial purposes?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, all images created with Image Generator can be used for personal and commercial projects without restrictions.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">How long does it take to generate an image?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Most images are generated within 10-30 seconds depending on complexity and current server demand.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use specific and descriptive text prompts for better quality results, including details about style, lighting, and composition</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Experiment with different keywords and descriptors to refine your image until it matches your vision perfectly</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Try using artistic style modifiers like 'oil painting', 'watercolor', or 'photorealistic' to achieve desired aesthetics</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Save your favorite prompts in a document so you can quickly regenerate or modify similar images in the future</li>
          </ul>
        </div>
      </div>
    </div>
  );
}