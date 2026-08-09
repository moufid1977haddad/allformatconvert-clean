import SeoContent from '../../../components/SeoContent';
import { ToolIcon } from '../../../lib/toolIcons';

export default function ImageGeneratorPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold mb-2 text-neutral-800">AI Image Generator</h1>
        <p className="text-neutral-500 mb-10">Generate stunning images with AI</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-10 space-y-4">
          <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ToolIcon slug="image-generator" className="w-8 h-8 text-indigo-500" />
          </div>
          <div className="text-indigo-500 text-xl font-bold">Coming Soon</div>
          <p className="text-neutral-500 text-sm">We are integrating advanced AI image generation. Stay tuned for updates!</p>
        </div>
      </div>
      <SeoContent
        title="Image Generator"
        description="AI Image Generator is not yet available — this feature is under development. We're working on integrating AI-powered image generation so you'll be able to create images from a text description directly in your browser. Check back soon, or explore our other free AI tools in the meantime."
      />
    </div>
  );
}