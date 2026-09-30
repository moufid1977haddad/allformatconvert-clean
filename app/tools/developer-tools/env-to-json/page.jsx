'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { dotenvToJson, jsonToDotenv } from '../../../lib/dotenv';
export default function EnvToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [types, setTypes] = useState(false);
  const [expandVars, setExpandVars] = useState(false);
  const toJson = () => {
    const { json, ignored, count } = dotenvToJson(input, { types, expandVars });
    setOutput(json);
    setError('');
    setNote(`${count} variable${count === 1 ? '' : 's'}` + (ignored.length ? ` — line${ignored.length === 1 ? '' : 's'} ${ignored.join(', ')} ${ignored.length === 1 ? 'is' : 'are'} not KEY=value and ${ignored.length === 1 ? 'was' : 'were'} skipped` : ''));
  };
  const toEnv = () => {
    try {
      setOutput(jsonToDotenv(input));
      setError('');
      setNote('');
    } catch(e) { setOutput(''); setNote(''); setError(e instanceof SyntaxError ? 'Invalid JSON: ' + e.message : e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">.env to JSON</h1>
        <p className="text-neutral-500 text-center mb-8">Convert .env files to JSON and back</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><textarea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="KEY=value..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><textarea aria-label="Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly /></div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <label className="flex items-center gap-2"><input type="checkbox" checked={types} onChange={e => setTypes(e.target.checked)} /> Convert numbers, true/false and null to JSON types</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={expandVars} onChange={e => setExpandVars(e.target.checked)} /> Expand ${'{'}VAR{'}'} references</label>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          {note && <p className="text-neutral-500 text-center text-sm">{note}</p>}
          <div className="grid grid-cols-3 gap-3">
            <button onClick={toJson} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">.env to JSON</button>
            <button onClick={toEnv} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">JSON to .env</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title={".env to JSON"}
        description={".env to JSON parses a .env file into a JSON object, and converts a JSON object back into .env lines, entirely in your browser — nothing is uploaded to a server. It follows the rules of dotenv, the parser used by Node.js, Next.js and Vite: an optional export prefix, KEY=value or KEY: value, single quotes kept literally, double quotes expanding \\n, backtick quotes, values spanning several lines inside quotes, and # comments (a # inside quotes is kept). Options convert numbers, booleans and null to JSON types (a value with a leading zero such as 007 stays text) and expand ${VAR} references like dotenv-expand. Lines that aren't KEY=value are reported, not silently dropped."}
        howTo={[
          "Paste your .env content into the input box, or a JSON object to convert the other way.",
          "Optionally tick 'Convert numbers…' to get typed JSON values, or 'Expand ${VAR}' to resolve references to earlier variables.",
          "Click '.env to JSON' or 'JSON to .env'.",
          "Click 'Copy' to copy the result."
        ]}
        faqs={[
          { q: "Is .env to JSON free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "What .env syntax does it understand?", a: "The dotenv syntax: export KEY=value, KEY=value and KEY: value, # comments on their own line or after an unquoted value, single, double and backtick quotes, \\n in double quotes, and multi-line values inside quotes. Blank lines and comments are ignored; any other line that isn't a variable is listed under the result." },
          { q: "Does it expand variable references like ${OTHER_VAR}?", a: "Yes, if you tick 'Expand ${VAR} references': ${VAR}, ${VAR:-default} and $VAR are replaced by variables defined earlier in the file, as dotenv-expand does. A backslash before $ keeps a literal dollar sign." },
          { q: "Are values converted to numbers and booleans?", a: "Only if you tick the option. .env values are text by nature, so by default every value stays a string; with the option, 42, 3.5, true, false and null become JSON types, while 007 or 1.10 stay text so nothing is altered." },
          { q: "Is my data uploaded to a server?", a: "No, parsing and conversion happen entirely in your browser." }
        ]}
        tips={[
          "JSON to .env quotes a value whenever it's needed (spaces, #, quotes, line breaks) so dotenv reads back exactly the same text; nested objects or arrays are written as JSON text.",
          "When a variable is defined twice, the last definition wins in the JSON.",
          "Comments are dropped when converting .env to JSON, so JSON to .env won't reproduce them.",
          "Since output may contain secrets like API keys, avoid pasting it somewhere it could be logged or committed to version control."
        ]}
      />
    </div>
  );
}