export const faqs = [
          { q: "Is TOML to JSON free to use?", a: "Yes, it's completely free with no signup required." },
          { q: "Does it support nested tables, like [section.subsection]?", a: "Yes — dotted and nested table headers convert into properly nested JSON objects at any depth." },
          { q: "Does it support TOML arrays or date/time values?", a: "Yes — arrays (including arrays of tables) convert to JSON arrays, and TOML's native date/time literals convert to ISO 8601 date strings in the JSON output." },
          { q: "Can I download the JSON as a file?", a: "No, there's only a 'Copy' button — paste the copied text into a file yourself if you need one." }
        ];

// One source for this page's search content (visible FAQ, example and links in page.jsx; metadata and structured data
// in layout.tsx). 29/09 (croissance-29-09, point 4): the pages ranked first for "toml to json" (transform.tools,
// DevToolsDaily, small converters) are paste-in tools; ours parses with smol-toml, which passes most of the official
// toml-test suite (its README), and reports the line of a syntax error.
export const SEO = {
  name: 'TOML to JSON',
  path: '/tools/developer-tools/toml-to-json',
  category: { name: 'Developer Tools', path: '/tools/developer-tools' },
  applicationCategory: 'DeveloperApplication',
  title: 'TOML to JSON Converter — Nested Tables, Arrays & Dates',
  description: 'Convert TOML to JSON online: nested and dotted tables, arrays of tables, dates and numbers parsed by a spec-following TOML parser, with the line of any syntax error. Free, in your browser, nothing uploaded.',
  faqs: [
    ...faqs,
    { q: 'Can I convert a Cargo.toml or pyproject.toml?', a: 'Yes — they are ordinary TOML files: paste their content and the tables ([package], [dependencies], [tool.poetry]…) become nested JSON objects.' },
  ],
  example: {
    caption: 'A small TOML file and the JSON the tool returns:',
    inputLabel: 'TOML',
    input: 'title = "Demo"\n\n[server]\nport = 8080\ntags = ["a", "b"]',
    outputLabel: 'JSON',
    output: '{\n  "title": "Demo",\n  "server": {\n    "port": 8080,\n    "tags": [\n      "a",\n      "b"\n    ]\n  }\n}',
  },
  related: [
    { href: '/tools/developer-tools/json-to-toml', label: 'JSON to TOML', note: 'the other way.' },
    { href: '/tools/developer-tools/yaml-to-json', label: 'YAML to JSON', note: 'the same for YAML files.' },
    { href: '/tools/developer-tools/json-formatter', label: 'JSON Formatter', note: 'indent, validate and minify JSON.' },
  ],
};
