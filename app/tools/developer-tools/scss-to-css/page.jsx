'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
export default function ScssToCssPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const convert = () => {
    let css = input.replace(/\/\/[^\n]*/g,'').replace(/&:([\w-]+)/g,':$1').replace(/&\.([\w-]+)/g,'.$1');
    setOutput(css.trim());
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">SCSS to CSS</h1>
        <p className="text-neutral-500 text-center mb-8">Convert SCSS to CSS format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">SCSS Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste SCSS here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">CSS Output</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 rounded-xl py-3 font-semibold transition">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="SCSS to CSS"
        description="SCSS to CSS is a very lightweight text transform, not a real Sass compiler: it strips // comments and rewrites simple &:hover / &.class parent-selector patterns, entirely in your browser. It does not flatten nested rule blocks, resolve $variables, expand mixins, or evaluate math — nested SCSS selectors are passed through as literally nested braces, which is not valid CSS."
        howTo={[
          "Paste simple, mostly-flat SCSS into the input box.",
          "Click 'Convert' to strip comments and simplify basic & parent-selector patterns.",
          "Check the output carefully — nested rules, variables, and mixins won't be resolved.",
          "Click 'Copy' to copy the result to your clipboard."
        ]}
        faqs={[
          { q: "Does this tool fully compile SCSS, like the real Sass compiler?", a: "No — it only strips comments and rewrites a couple of & selector patterns. Nesting, $variables, @mixin, @import, and Sass math aren't processed at all." },
          { q: "Is SCSS to CSS free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What happens to nested selectors, like .parent { .child { ... } }?", a: "They're left as literally nested braces in the output, which isn't valid CSS — nesting isn't flattened by this tool." },
          { q: "Is my code uploaded to a server?", a: "No, processing happens entirely in your browser." }
        ]}
        tips={[
          "This tool works best on SCSS that's already close to flat CSS, using only & for pseudo-classes or chained class selectors.",
          "For real SCSS features — nesting, variables, mixins, imports, math — use an actual Sass compiler (like the sass npm package or Dart Sass), not this tool.",
          "Since comment-stripping isn't string-aware, a // sequence inside a url() value (like a URL) could be stripped incorrectly — check the output for such cases.",
          "Always review the output for validity before shipping it, since this isn't a full CSS/Sass parser."
        ]}
      />
    </div>
  );
}