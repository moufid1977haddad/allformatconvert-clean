'use client';
import { useState } from 'react';
import { jsonToYaml } from '../../../lib/yamlJson';
import SeoContent from '../../../components/SeoContent';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';
export default function JsonToYamlPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useToolError('');
  const convert = () => {
    try {
      setOutput(jsonToYaml(input));
      setError('');
    } catch(e) { setError('Invalid JSON: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to YAML</h1>
        <p className="text-neutral-500 text-center mb-8">Convert JSON to YAML format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name": "John"}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">YAML Output</label><TextArea aria-label="YAML Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="data.yaml" /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="JSON to YAML"
        description={"JSON to YAML rewrites pasted JSON as YAML, the format of Kubernetes, Docker Compose and GitHub Actions files. Objects become indented mappings and arrays become lists of - items, at any depth; empty objects and arrays are written {} and []. Numbers are copied exactly as in the JSON, so 1.10 and a 20-digit ID are not changed. A string that a YAML reader could take for something else, such as yes, no, 123, a date or text containing a colon followed by a space, is put in single quotes. Long lines are never folded, and the work happens in your browser with js-yaml."}
        example={{"caption":"A small JSON configuration and the YAML the tool returns (note the quoted version, yes and colon strings):","inputLabel":"JSON","input":"{\n  \"name\": \"api\",\n  \"version\": \"1.10\",\n  \"debug\": false,\n  \"id\": 12345678901234567890,\n  \"answer\": \"yes\",\n  \"ports\": [80, 443],\n  \"note\": \"Time: 10:30\"\n}","outputLabel":"YAML","output":"name: api\nversion: '1.10'\ndebug: false\nid: 12345678901234567890\nanswer: 'yes'\nports:\n  - 80\n  - 443\nnote: 'Time: 10:30'\n"}}
        howToTitle="How to convert JSON to YAML"
        howTo={[
          "Paste JSON into \"JSON Input\".",
          "Click \"Convert\"; invalid JSON shows the parse error from your browser instead.",
          "Read the YAML in \"YAML Output\".",
          "Click \"Copy\", or \"Download\" to get the same YAML as data.yaml.",
        ]}
        specs={[
          { label: "Input", value: "JSON text" },
          { label: "Output", value: "YAML in block style, two-space indentation, file data.yaml" },
          { label: "Key order", value: "as in the JSON, except keys that are whole numbers, which come first" },
        ]}
        privacy={"js-yaml converts your JSON inside the browser tab, and the pasted text is not uploaded; the YAML exists only on this page until you copy or download it. An error, such as a JSON parse error, is reported to us as text with quoted fragments replaced, together with the tool name and your browser version."}
        faqs={[
          { q: "Will yes, no or on be read as booleans?", a: "No. The tool quotes such strings, writing 'yes', 'no', 'on', 'off' and 'y', so readers that follow the older YAML 1.1 rules also keep them as text. Real JSON booleans are written true and false." },
          { q: "Do numbers keep their exact digits?", a: "Yes. A number is written with the exact digits of your JSON: 1.10 stays 1.10 and 12345678901234567890 keeps all its digits. A version stored as a JSON string is quoted in the YAML, so it stays text." },
          { q: "Can I convert the YAML back to JSON?", a: "Yes, with YAML to JSON. Its reader turns decimals into JSON numbers, so an unquoted 1.10 comes back as 1.1, but the quoted strings this tool writes come back unchanged." },
        ]}
      />
    </div>
  );
}
