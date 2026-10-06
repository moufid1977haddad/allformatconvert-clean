'use client';
import { useState } from 'react';
import SeoContent from '../../../components/SeoContent';
import { jsonToCode } from '../../../lib/jsonCodegen';
import { TextDownload } from '../../../components/FileDownload';
import { useToolError } from '../../../lib/useToolError';
import TextArea from '@/app/components/TextArea';
export default function JsonToCsharpPage() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useToolError('');
  const convert = async () => {
    try {
      setOutput(await jsonToCode(input, 'csharp'));
      setError('');
    } catch(e) { setOutput(''); setError('Invalid JSON: ' + e.message); }
  };
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-2">JSON to C# Class</h1>
        <p className="text-neutral-500 text-center mb-8">Generate C# classes from JSON</p>
        <div className="bg-white border border-neutral-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-sm text-neutral-500 mb-1">JSON Input</label><TextArea className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" placeholder='{"name":"John","age":30}' value={input} onChange={e => setInput(e.target.value)} /></div>
            <div><label className="block text-sm text-neutral-500 mb-1">C# Output</label><TextArea aria-label="C# Output" className="w-full bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-sm h-64 resize-none font-mono" value={output} readOnly />
            <TextDownload text={output} name="Model.cs" /></div>
          </div>
          {error && <p className="text-red-400 text-center">{error}</p>}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={convert} disabled={!input} className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Convert</button>
            <button onClick={() => navigator.clipboard.writeText(output)} disabled={!output} className="bg-green-600 hover:bg-green-500 disabled:bg-neutral-200 disabled:text-gray-600 rounded-xl py-3 font-semibold transition text-white">Copy</button>
          </div>
        </div>
      </div>
      <SeoContent
        title={"JSON to C# Class"}
        description={"JSON to C# Class writes C# model classes from a JSON sample with quicktype-core, inside your browser. The code sits in namespace App with the System.Text.Json usings; each nested object gets a public partial class, properties are PascalCase, and a [JsonPropertyName] attribute keeps every original key. Whole numbers are long, decimals double, and arrays become arrays such as Item[]. Properties missing from some array elements are nullable and carry a [JsonIgnore] attribute for null values. It targets System.Text.Json only, with no Newtonsoft attributes and no records. A value with two types, such as a number in one item and text in another, adds a union struct and the JsonConverter classes it needs."}
        example={{
          caption: "An order with line items; note appears in only one item, so it becomes nullable.",
          inputLabel: "JSON Input",
          input: "{\"orderId\": 1001, \"total\": 49.90, \"paid\": true,\n \"items\": [{\"sku\": \"A1\", \"qty\": 2}, {\"sku\": \"B7\", \"qty\": 1, \"note\": \"gift\"}]}",
          outputLabel: "C# Output",
          output: "namespace App\n{\n    using System;\n    using System.Collections.Generic;\n\n    using System.Text.Json;\n    using System.Text.Json.Serialization;\n    using System.Globalization;\n\n    public partial class Root\n    {\n        [JsonPropertyName(\"orderId\")]\n        public long OrderId { get; set; }\n\n        [JsonPropertyName(\"total\")]\n        public double Total { get; set; }\n\n        [JsonPropertyName(\"paid\")]\n        public bool Paid { get; set; }\n\n        [JsonPropertyName(\"items\")]\n        public Item[] Items { get; set; }\n    }\n\n    public partial class Item\n    {\n        [JsonPropertyName(\"sku\")]\n        public string Sku { get; set; }\n\n        [JsonPropertyName(\"qty\")]\n        public long Qty { get; set; }\n\n        [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]\n        [JsonPropertyName(\"note\")]\n        public string? Note { get; set; }\n    }\n}",
        }}
        howToTitle={"How to generate C# classes from JSON"}
        howTo={[
          "Paste a JSON sample into \"JSON Input\".",
          "Click \"Convert\" to get the classes in \"C# Output\".",
          "Replace the namespace App line with the namespace of your project.",
          "Click \"Copy\" or \"Download\" to keep the code as \"Model.cs\".",
        ]}
        specs={[
          { label: "Input", value: "JSON object or array of objects, as text" },
          { label: "Output", value: "C# classes in namespace App, saved as Model.cs" },
          { label: "Serializer", value: "System.Text.Json: [JsonPropertyName] on every property, [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)] on optional ones" },
          { label: "Types", value: "long, double, bool, string and arrays (T[]); object for a key that is null in every sample; a union struct when a value has two types" },
        ]}
        privacyTitle={"Where your JSON is processed"}
        privacy={"Classes are generated by JavaScript running on your own device; the JSON you paste and the C# you get are never uploaded. The quicktype library loads when you first press Convert. When the page displays an error, our error log receives its text, cleaned of quoted fragments, long numbers and web or e-mail addresses, with the tool's name and your browser's name and version."}
        faqs={[
          { q: "Does it work with Newtonsoft.Json (Json.NET)?", a: "No. The generated attributes belong to System.Text.Json: [JsonPropertyName] for names and [JsonIgnore] for optional values. To use the classes with Newtonsoft.Json, replace them with its own [JsonProperty] attribute by hand." },
          { q: "Will the classes deserialize my JSON as they are?", a: "Yes, when every key keeps one type: JsonSerializer.Deserialize maps each property to its original key through [JsonPropertyName]. When a value mixes types, pass Converter.Settings, which the output then contains, as the second argument. The types come only from your sample, so check them against more data." },
          { q: "Is a property typed object when its value is always null?", a: "Yes. When a key is null in every element of your sample, no type can be inferred, so it becomes object. Paste an example where the key holds a real value, or set the type yourself, for example string? for an optional text." },
          { q: "Can I use int instead of long?", a: "Yes. Whole numbers are always typed long so that large values fit; if your values are small, change long to int by hand, and the attribute and the key mapping keep working." },
        ]}
        tips={[
          "Paste an array with several items so that properties which are sometimes absent become nullable.",
        ]}
      />
    </div>
  );
}