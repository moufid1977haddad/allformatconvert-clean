'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { jsonToCode } from '../../../lib/jsonCodegen';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';
export default function JsonToRustPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useToolError('');
  const convert = async () => {
    try {
      setOutput(await jsonToCode(input, 'rust'));
      setError('');
    } catch(e) { setOutput(''); setError('Invalid JSON: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to Rust Struct</h1>
        <p className="text-neutral-500 text-center mb-8">Generate Rust structs from JSON</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">Rust Struct Output</label><TextArea aria-label="Rust Struct Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="model.rs" /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title={"JSON to Rust Struct"}
        description={"JSON to Rust Struct generates structs for serde from a JSON sample, with quicktype-core running in your browser. Every struct derives Debug, Clone, Serialize and Deserialize. Fields are snake_case, and #[serde(rename_all = \"camelCase\")] or #[serde(rename = \"...\")] keeps the JSON keys, so serde_json reads and writes them unchanged. Whole numbers are i64, decimals f64, arrays Vec, and a key missing from some elements is an Option with skip_serializing_if, so None is not written back. A top-level array also gets a type alias such as pub type Root = Vec<RootElement>."}
        example={{
          caption: "Only the first user has a bio, so bio becomes an Option.",
          inputLabel: "JSON Input",
          input: "[{\"userName\": \"ada\", \"followers\": 120, \"bio\": \"Hi\"},\n {\"userName\": \"lin\", \"followers\": 3}]",
          outputLabel: "Rust Struct Output",
          output: "use serde::{Serialize, Deserialize};\n\npub type Root = Vec<RootElement>;\n\n#[derive(Debug, Clone, Serialize, Deserialize)]\n#[serde(rename_all = \"camelCase\")]\npub struct RootElement {\n    pub user_name: String,\n\n    pub followers: i64,\n\n    #[serde(skip_serializing_if = \"Option::is_none\")]\n    pub bio: Option<String>,\n}",
        }}
        howToTitle={"How to convert JSON to Rust structs"}
        howTo={[
          "Paste a JSON sample, ideally an array of several records, into \"JSON Input\".",
          "Click \"Convert\"; the structs appear in \"Rust Struct Output\".",
          "Add serde with the derive feature, and serde_json, to your Cargo.toml.",
          "Click \"Copy\" or \"Download\" (\"model.rs\") to put the code in your crate.",
        ]}
        specs={[
          { label: "Input", value: "JSON text; arrays are merged element by element" },
          { label: "Output", value: "Rust structs with derives and serde attributes, saved as model.rs" },
          { label: "Types", value: "i64, f64, bool, String, Vec<T> and Option<T>; an untagged enum when a value has two types; serde_json::Value when no type can be inferred (a key that is always null, an empty array)" },
          { label: "Dependencies", value: "serde with the derive feature; serde_json to parse, also named in the code for a key that is null in every sample" },
        ]}
        privacyTitle={"Where your JSON is processed"}
        privacy={"Quicktype is downloaded at the first conversion and turns your JSON into Rust inside the browser tab, without uploading the sample. When the page shows an error, the error text is reported to our error log, together with the tool name and your browser's name and version, after quoted fragments, long numbers and addresses are removed."}
        faqs={[
          { q: "How are camelCase or hyphenated keys handled?", a: "Fields are renamed to snake_case. When all keys of a struct follow camelCase, one #[serde(rename_all = \"camelCase\")] covers it; other keys get their own #[serde(rename = \"...\")]. serde_json therefore reads and writes the original keys." },
          { q: "Does a key missing from some items become an Option?", a: "Yes, and so does a key that is null in some items. Each gets a skip_serializing_if attribute set to Option::is_none, so a field holding None is left out when you serialize, as it was absent in the original JSON." },
          { q: "Which integer type does it use?", a: "i64 for whole numbers, and f64 for any number written with a decimal point or an exponent, including 10.0. Change i64 to u32 or another type by hand if you know the range of your values." },
          { q: "Which crates does the generated code need?", a: "Two at most: serde with the derive feature, for the derives and rename attributes, and serde_json, which you need to parse JSON anyway and which the code names directly when a key is null in every sample." },
        ]}
        tips={[
          "Rename RootElement and Root after pasting; those names come from the tool, not from your JSON.",
        ]}
      />
    </div>
  );
}