'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { dotenvToJson, jsonToDotenv } from '../../../lib/dotenv';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';
export default function EnvToJsonPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useToolError('');
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
            <div><label className="block text-sm text-neutral-500 mb-1">Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" placeholder="KEY=value..." value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Output</label><TextArea aria-label="Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-48 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="env.json" /></div>
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
        description={".env to JSON converts a .env file into a JSON object, and a JSON object back into .env lines. It follows the rules of the dotenv library: an optional export, KEY=value or KEY: value, single quotes kept literally, double quotes turning \\n into a line break, backticks, quoted values over several lines and # comments outside quotes. By default every value stays a string; options give typed numbers, true, false and null, and expand ${VAR} references. Lines that are not variables are listed by number. Both directions run in your browser."}
        example={{"caption":"A .env file with export, a comment, an inline comment and a line that is not a variable, converted with both options unticked; the line under the JSON is the note the page shows:","inputLabel":".env","input":"export APP_NAME=\"My App\"\nPORT=3000\n# database\nDB_URL=postgres://localhost/app # local only\nGREETING=\"Hello\\nWorld\"\nRAW='$HOME stays'\nnot a variable","outputLabel":"JSON","output":"{\n  \"APP_NAME\": \"My App\",\n  \"PORT\": \"3000\",\n  \"DB_URL\": \"postgres://localhost/app\",\n  \"GREETING\": \"Hello\\nWorld\",\n  \"RAW\": \"$HOME stays\"\n}\n\n5 variables — line 7 is not KEY=value and was skipped"}}
        howToTitle="How to convert a .env file to JSON"
        howTo={[
          "Paste your .env content, or a JSON object, into \"Input\".",
          "Tick \"Convert numbers, true/false and null to JSON types\" or \"Expand ${VAR} references\" if you need them.",
          "Click \".env to JSON\", or \"JSON to .env\" for the other direction.",
          "Click \"Copy\", or \"Download\": the file is named env.json in both directions.",
        ]}
        specs={[
          { label: "Input", value: ".env text, or a JSON object" },
          { label: "Output", value: "JSON object with two-space indentation, or .env lines" },
          { label: "Repeated keys", value: "the last definition wins" },
        ]}
        privacy={"Both directions run in your browser; the variables you paste, secrets included, are not uploaded, and the result is only shown on this page. If an error occurs, for example invalid JSON, its wording is reported to us with quoted text masked, with the tool name and browser version, so keep secrets out of key names."}
        faqs={[
          { q: "Does it expand ${OTHER_VAR} references?", a: "Yes, when \"Expand ${VAR} references\" is ticked: ${VAR}, ${VAR:-default} and $VAR take the value of a variable defined earlier in the file, as dotenv-expand does, and \\$ keeps a literal dollar sign. With the option ticked, single-quoted values are expanded too." },
          { q: "Are numbers and booleans typed?", a: "No, not by default, since .env values are text. Tick \"Convert numbers, true/false and null to JSON types\" and 3000 becomes a number and true, false and null become JSON values, while 007 and 1.10 stay strings because a number would change them." },
          { q: "Are comments kept?", a: "No. A line starting with #, or # after an unquoted value, is a comment and is dropped, so JSON to .env cannot restore it; a # inside quotes stays part of the value. A line that is neither a comment nor a variable is reported by its number." },
          { q: "Can JSON to .env handle nested objects?", a: "Yes. A nested object or array is written as JSON text inside quotes, and each value gets the quoting that makes dotenv read it back unchanged; a value mixing ', \", \\ and ` together is refused, since no .env quoting can hold it, and null gives an empty value. Keys may use only letters, digits, _, . and -." },
        ]}
      />
    </div>
  );
}