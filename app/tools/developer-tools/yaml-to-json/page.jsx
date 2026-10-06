'use client';
import { useState } from 'react';
import { yamlToJson } from '../../../lib/yamlJson';
import SeoContent from '../../../components/SeoContent';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';
export default function YamlToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useToolError('');
  const convert = () => {
    try {
      setOutput(yamlToJson(input));
      setError('');
    } catch(e) { setError('Invalid YAML: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">YAML to JSON</h1>
        <p className="text-neutral-500 text-center mb-8">Convert YAML to JSON format</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">YAML Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder="name: John&#10;age: 30" value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Output</label><TextArea aria-label="JSON Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="data.json" /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title="YAML to JSON"
        description={"YAML to JSON parses pasted YAML with js-yaml, using the YAML 1.2 rules for booleans and null, then writes JSON indented by two spaces. Mappings become objects and - item lists become arrays; anchors and aliases are expanded and merge keys are applied; several --- documents become one JSON array. Only true and false are booleans, so yes and no stay strings, and dates stay text. Integers keep every digit, but decimals become JSON numbers: an unquoted 1.10 is written 1.1. Custom tags such as !Ref are not supported. js-yaml does all of this inside your browser tab."}
        example={{"caption":"A configuration with an anchor, a merge key, an unquoted and a quoted version, and the JSON the tool returns:","inputLabel":"YAML","input":"defaults: &base\n  retries: 3\n  debug: no\nprod:\n  <<: *base\n  host: example.com\n  version: 1.10\n  tag: \"1.10\"\n  build: 0012","outputLabel":"JSON","output":"{\n  \"defaults\": {\n    \"retries\": 3,\n    \"debug\": \"no\"\n  },\n  \"prod\": {\n    \"retries\": 3,\n    \"debug\": \"no\",\n    \"host\": \"example.com\",\n    \"version\": 1.1,\n    \"tag\": \"1.10\",\n    \"build\": 12\n  }\n}"}}
        howToTitle="How to convert YAML to JSON"
        howTo={[
          "Paste YAML into \"YAML Input\".",
          "Click \"Convert\".",
          "Read the JSON in \"JSON Output\", or the error, with its line and column when the YAML syntax is wrong.",
          "Click \"Copy\" for the clipboard, or \"Download\" for a data.json file.",
        ]}
        specs={[
          { label: "Input", value: "YAML text, one or more documents" },
          { label: "Output", value: "JSON (two-space indent), saved as data.json" },
          { label: "Not supported", value: "custom tags (!Ref, !Sub), !!binary, !!timestamp" },
          { label: "Refused values", value: ".inf and .nan, which JSON cannot hold" },
        ]}
        privacy={"js-yaml runs in your browser to read the YAML, and the content you paste is not uploaded, so configuration files with internal host names stay with you. When an error occurs, its message with quoted fragments removed is reported to us, along with the tool name and your browser and its version."}
        faqs={[
          { q: "Is a version like 1.10 kept?", a: "No, unless it is quoted. Unquoted, 1.10 is a YAML number and is written 1.1 in JSON; in quotes it stays the string 1.10, as in the example. In the same way 0012 becomes 12." },
          { q: "Are yes and no converted to booleans?", a: "No. Under YAML 1.2, which this tool follows, only true and false are booleans (True and TRUE count too), so yes, no, on and off stay strings. Write true or false if you need booleans." },
          { q: "Does it support anchors and merge keys?", a: "Yes. An alias such as *base copies the anchored value, and <<: *base merges its keys into the mapping, as Docker Compose and GitLab CI files use it; keys written next to the merge win." },
          { q: "Can I convert a CloudFormation template?", a: "No, not one that uses short tags. !Ref, !Sub and other custom tags stop the conversion with an unknown tag error, as do !!binary and !!timestamp. Templates written with the long form, such as Ref: MyBucket, convert normally." },
        ]}
      />
    </div>
  );
}
