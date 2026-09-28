export const faqs = [
          { q: "Is JSON to TOML free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it convert JSON arrays correctly?", a: "Yes — array values become proper TOML array syntax, e.g. tags = [\"a\", \"b\"], at any nesting depth." },
          { q: "Does it handle deeply nested JSON?", a: "Yes — nested objects convert into TOML tables (or tables of tables, using dotted section headers) at any depth, not just one level." },
          { q: "What happens to a JSON null value?", a: "A null value on an object key is simply omitted from the output, since TOML has no null type. A null inside an array isn't representable at all and produces an error instead of silently corrupting the array — remove it from your JSON first." },
          { q: "Why do I get an error even though my JSON is valid?", a: "TOML documents are key/value tables at the top level, so the JSON you paste must be an object ({...}), not a top-level array or a bare string/number." },
          { q: "Is my data uploaded to a server?", a: "No, conversion happens entirely in your browser." }
        ];

// One source for this page's search content (visible FAQ, example and links in page.jsx; metadata and structured data
// in layout.tsx). 29/09 (croissance-29-09, point 4): the pages ranked first for "json to toml" (TableConvert,
// transform.tools, CodeBeautify) are paste-in converters; ours writes nested tables and arrays of tables with smol-toml
// and says what TOML cannot hold (null, a top-level array).
export const SEO = {
  name: 'JSON to TOML',
  path: '/tools/developer-tools/json-to-toml',
  category: { name: 'Developer Tools', path: '/tools/developer-tools' },
  applicationCategory: 'DeveloperApplication',
  title: 'JSON to TOML Converter — Nested Tables & Arrays, Online Free',
  description: 'Convert JSON to TOML online: nested objects become tables, arrays of objects become arrays of tables, numbers, booleans and dates keep their types, and nulls are explained. Free, in your browser, nothing uploaded.',
  faqs,
  example: {
    caption: 'A small JSON object and the TOML the tool returns:',
    inputLabel: 'JSON',
    input: '{\n  "title": "Demo",\n  "server": { "port": 8080, "tags": ["a", "b"] }\n}',
    outputLabel: 'TOML',
    output: 'title = "Demo"\n\n[server]\nport = 8080\ntags = [ "a", "b" ]',
  },
  related: [
    { href: '/tools/developer-tools/toml-to-json', label: 'TOML to JSON', note: 'the other way.' },
    { href: '/tools/developer-tools/json-to-yaml', label: 'JSON to YAML', note: 'the same object as YAML.' },
    { href: '/tools/developer-tools/json-formatter', label: 'JSON Formatter', note: 'check your JSON is valid before converting.' },
  ],
};
