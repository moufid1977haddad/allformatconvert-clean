'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { jsonToPhpArray, jsonToPhpClass } from '../../../lib/jsonToPhp';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';
export default function JsonToPhpPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useToolError('');
  const [mode, setMode] = useState('array');
  const convert = () => {
    try {
      setOutput(mode === 'array' ? jsonToPhpArray(input) : jsonToPhpClass(input));
      setError('');
    } catch(e) { setOutput(''); setError(e instanceof SyntaxError ? 'Invalid JSON: ' + e.message : e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to PHP Class</h1>
        <p className="text-neutral-500 text-center mb-8">Turn JSON into a PHP array or typed PHP 8 classes</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">PHP Output</label><TextArea aria-label="PHP Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="data.php" /></div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm" role="radiogroup" aria-label="Output">
            <label className="flex items-center gap-2"><input type="radio" name="php-mode" checked={mode === 'array'} onChange={() => setMode('array')} /> PHP array (the data, as json_decode($json, true) returns it)</label>
            <label className="flex items-center gap-2"><input type="radio" name="php-mode" checked={mode === 'class'} onChange={() => setMode('class')} /> PHP classes (typed, PHP 8+)</label>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title={"JSON to PHP Class"}
        description={"JSON to PHP Class turns JSON into PHP code in two ways. PHP array, selected by default, writes your data as a $data = [ ... ]; literal in short array syntax, matching what json_decode($json, true) returns: strings escaped, numbers as written (1.10 stays 1.10), integers above PHP_INT_MAX kept as strings. PHP classes writes final PHP 8 classes, one per nested object, with typed promoted properties, nullable types for keys that are missing or sometimes null, and a fromArray() factory that reads the original keys. This page does not use quicktype: the converter is the site's own code, run in your browser."}
        example={{
          caption: "PHP array output; the id is larger than PHP_INT_MAX, so it is kept as a string.",
          inputLabel: "JSON Input",
          input: "{\"name\": \"Ada\", \"roles\": [\"admin\", \"dev\"], \"price\": 1.10, \"id\": 12345678901234567890}",
          outputLabel: "PHP Output",
          output: "<?php\n\n// Integers beyond PHP_INT_MAX are written as strings, as json_decode() does with JSON_BIGINT_AS_STRING; as a float they would lose digits.\n$data = [\n    'name' => 'Ada',\n    'roles' => [\n        'admin',\n        'dev',\n    ],\n    'price' => 1.10,\n    'id' => '12345678901234567890',\n];",
        }}
        howToTitle={"How to convert JSON to a PHP array or class"}
        howTo={[
          "Paste the JSON object or array you want as PHP into \"JSON Input\".",
          "Keep \"PHP array\" to get your values, or pick \"PHP classes\" to get typed classes.",
          "Click \"Convert\" to fill \"PHP Output\".",
          "Click \"Copy\", or \"Download\" to save it as \"data.php\".",
        ]}
        specs={[
          { label: "Output modes", value: "PHP array (default) or PHP classes" },
          { label: "Input", value: "JSON text; class mode needs an object or an array of objects" },
          { label: "PHP version", value: "Array: 5.4 or later. Classes: 8.0 or later (constructor promotion, named arguments, mixed)" },
          { label: "Large integers", value: "PHP array: values above PHP_INT_MAX are written as strings, with a comment. PHP classes: typed string, no comment; the json_decode call shown in the Usage line needs JSON_BIGINT_AS_STRING to keep the digits" },
        ]}
        privacyTitle={"Where your JSON is processed"}
        privacy={"This converter is plain JavaScript executed by your browser, with no library to download, and the JSON never leaves your computer. If a message such as Invalid JSON or the class-mode warning is displayed, that message, stripped of quoted text, long numbers and addresses, is reported to our error log, along with the tool's name and your browser's name and version."}
        faqs={[
          { q: "Can I get a PHP array with my actual data?", a: "Yes. Keep \"PHP array\" selected: the output is $data = [ 'key' => value, ... ]; with nested arrays for nested objects. For a config file that must return an array, replace $data = with return." },
          { q: "Which PHP version do the classes need?", a: "8.0 or later. They use constructor property promotion, named arguments in fromArray() and the mixed type, all introduced in PHP 8.0. The array output only needs short array syntax, available since PHP 5.4." },
          { q: "What happens to very large integers?", a: "In the PHP array output they become strings: a JSON integer above PHP_INT_MAX would lose digits as a PHP float, so it is written in quotes, as json_decode does with JSON_BIGINT_AS_STRING, and a comment says so. In class mode the property is typed string with no comment; decode with JSON_BIGINT_AS_STRING to keep the digits." },
          { q: "Can class mode convert a list of numbers?", a: "No. Classes need an object or an array of objects. For a list of numbers or strings, or a single value, the page shows a message asking you to use the array output instead." },
        ]}
        tips={[
          "In class mode, paste several array elements: keys present in only some of them become nullable properties.",
          "Keys such as first-name become camelCase properties (firstName), while fromArray() still reads the original key.",
        ]}
      />
    </div>
  );
}