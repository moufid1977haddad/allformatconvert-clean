'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { typescriptToJs } from '../../../lib/codeTools';
import { TextDownload } from '../../../components/FileDownload';
import { reportShownMessage } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';

export default function TypescriptToJsPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const convert = async () => {
    try { setOutput(await typescriptToJs(input, { jsx: /<\/?[A-Za-z][^>]*>/.test(input) && /return\s*\(?\s*</.test(input) })); } catch (e) { reportShownMessage(e); setOutput('Error: ' + (e && e.message ? e.message : String(e))); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">TypeScript to JavaScript</h1>
        <p className="text-neutral-500 text-center mb-8">Strip TypeScript types from code</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">TypeScript Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="Paste TypeScript here..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">JavaScript Output</label><TextArea aria-label="JavaScript Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="script.js" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title={"TypeScript to JavaScript"}
        description={"TypeScript to JavaScript strips TypeScript syntax with Sucrase's parser and returns the JavaScript, in your browser. Type annotations, interfaces, type aliases, generics, access modifiers, non-null assertions, as and satisfies casts and import type lines are removed; enums become JavaScript objects filled by a small function; constructor parameter properties become this assignments. Modern syntax such as optional chaining is kept, not downgraded, and the code is not type-checked. Two limits: a namespace is deleted together with any values inside it, and JSX is only recognized when a component returns it after the return keyword."}
        example={{
          caption: "An interface, a typed function and an as const cast.",
          inputLabel: "TypeScript Input",
          input: "interface User { id: number; name?: string }\n\nexport function greet(u: User): string {\n  return `Hi ${u.name ?? \"guest\"}`;\n}\n\nconst ids = [1, 2] as const;",
          outputLabel: "JavaScript Output",
          output: "\n\nexport function greet(u) {\n  return `Hi ${u.name ?? \"guest\"}`;\n}\n\nconst ids = [1, 2] ;",
        }}
        howToTitle={"How to convert TypeScript to JavaScript"}
        howTo={[
          "Paste the content of a .ts file into \"TypeScript Input\".",
          "Click \"Convert\".",
          "Read \"JavaScript Output\": it holds the code, or a line starting with Error: and the line:column of the problem.",
          "Click \"Copy\", or \"Download\" to save it as \"script.js\".",
        ]}
        specs={[
          { label: "Input", value: "TypeScript source pasted as text; JSX only when a return is followed by a tag" },
          { label: "Output", value: "JavaScript at the same syntax level, saved as script.js" },
          { label: "Removed", value: "Types, interfaces, type aliases, generics, modifiers, non-null assertions, as, satisfies, import type and unused imports" },
          { label: "Not supported", value: "Namespaces (removed with their contents), type checking, conversion to older JavaScript" },
        ]}
        privacyTitle={"Where your code is processed"}
        privacy={"Sucrase runs inside your browser and is downloaded only when you first click \"Convert\"; your TypeScript is not sent anywhere. Should the output show an error, the wording of that error, with quoted text, long numbers and addresses removed, is reported to our error log with the tool name and your browser's name and version, so we can see what failed."}
        faqs={[
          { q: "Does it check my types?", a: "No. Sucrase only removes types and never compares them, so code with type errors converts without a message. Run tsc --noEmit in your project when you need to see type errors." },
          { q: "Does it support TSX?", a: "Yes, but only when JSX is enabled, that is when the code contains a tag and the return keyword followed by one, as in return (<div>…). A component that returns JSX straight after =>, with no return, fails with an Unexpected token error." },
          { q: "Are enums kept?", a: "Yes. Each enum becomes a variable filled by a small function, so Color.Red and reverse lookups such as Color[0] still work at run time. Const enums are converted the same way." },
          { q: "Are namespaces converted?", a: "No. A namespace is removed together with everything inside it, values included, and no warning is shown. Move its functions and constants out of the namespace before converting, or compile that file with tsc." },
        ]}
        tips={[
          "Unused imports are dropped as well, but side-effect imports such as import of a stylesheet stay in the output.",
        ]}
      />
    </div>
  );
}