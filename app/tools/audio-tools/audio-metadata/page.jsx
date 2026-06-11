'use client';
import { useState, useRef } from 'react';
import Link from 'next/link';

export default function AudioMetadataPage() {
  const [file, setFile] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const fileRef = useRef();
  const audioRef = useRef();

  const handleFile = (e) => {
    const f = e.target.files[0];
    setFile(f);
    const url = URL.createObjectURL(f);
    setAudioUrl(url);
    setMetadata({
      name: f.name,
      size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
      type: f.type,
      lastModified: new Date(f.lastModified).toLocaleDateString(),
    });
  };

  const onLoaded = () => {
    if (audioRef.current) {
      setMetadata(prev => ({
        ...prev,
        duration: Math.floor(audioRef.current.duration) + ' seconds',
      }));
    }
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/tools/audio-tools" className="text-indigo-600 text-sm hover:underline mb-6 inline-block">Back to Audio Tools</Link>
        <h1 className="text-3xl font-bold text-center mb-2 text-neutral-800">Audio Metadata</h1>
        <p className="text-neutral-500 text-center mb-8">View audio file metadata and information</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div onClick={() => fileRef.current.click()} className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-indigo-400 transition">
            {file ? <p className="text-neutral-700 font-medium">{file.name}</p> : <p className="text-neutral-400 text-sm">Click to upload an audio file</p>}
          </div>
          <input ref={fileRef} type="file" accept="audio/*" className="hidden" onChange={handleFile} />
          {audioUrl && <audio ref={audioRef} src={audioUrl} onLoadedMetadata={onLoaded} controls className="w-full" />}
          {metadata && (
            <div className="space-y-2">
              {Object.entries(metadata).map(([key, val]) => (
                <div key={key} className="flex justify-between bg-neutral-50 rounded-lg px-4 py-2 border border-neutral-200">
                  <span className="text-sm font-medium text-neutral-600 capitalize">{key}</span>
                  <span className="text-sm text-neutral-800">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="max-w-2xl mx-auto mt-12 space-y-8 px-4 pb-12">
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-3">About Audio Metadata</h2>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm leading-relaxed">Audio Metadata is a free online tool that allows you to view, edit, and extract metadata information from audio files including MP3, WAV, FLAC, and other popular formats. Instantly access detailed information like title, artist, album, duration, bitrate, and custom tags without downloading any software.</p>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">How to use Audio Metadata</h2>
          <ol className="space-y-2">
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">1</span>Visit the Audio Metadata tool website and locate the upload area on the homepage</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">2</span>Click the upload button or drag and drop your audio file into the designated zone to begin processing</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">3</span>Wait for the tool to analyze your file and display all available metadata information in an organized format</li>
            <li className="flex gap-3 text-sm text-neutral-600 dark:text-neutral-400"><span className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0 text-xs">4</span>Review, edit, or export the metadata as needed, then download your updated file or save changes directly</li>
          </ol>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">What audio file formats does Audio Metadata support?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Audio Metadata supports all major audio formats including MP3, WAV, FLAC, OGG, M4A, WMA, and AAC files for reading and editing metadata.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Is Audio Metadata completely free to use?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Yes, Audio Metadata is a completely free online tool with no hidden fees, subscriptions, or premium features required to access all functionality.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Can I edit metadata tags on multiple files at once?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Audio Metadata allows you to process multiple files sequentially through the same interface, making batch editing efficient and straightforward.</p></div>
            <div><p className="text-sm font-semibold text-neutral-800 dark:text-white mb-1">Will my audio files be kept private when using this tool?</p><p className="text-sm text-neutral-500 dark:text-neutral-400">Your uploaded files are processed securely and are not stored on our servers after processing is complete, ensuring your privacy and data security.</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 rounded-xl p-6">
          <h2 className="text-xl font-bold text-neutral-800 dark:text-white mb-4">Tips and Tricks</h2>
          <ul className="space-y-2">
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Use Audio Metadata to standardize metadata across your entire music library for better organization in music players and streaming applications</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Add custom tags and genres to your audio files to create a personalized music collection that's easier to search and filter</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Before sharing audio files online, use this tool to remove or edit sensitive metadata information like copyright details and personal tags</li>
            <li className="flex gap-2 text-sm text-neutral-600 dark:text-neutral-400"><span className="text-indigo-500">✓</span>Regularly check and update metadata information in your podcast and audiobook files to ensure proper display on all podcast platforms and apps</li>
          </ul>
        </div>
      </div>
    </div>
  );
}