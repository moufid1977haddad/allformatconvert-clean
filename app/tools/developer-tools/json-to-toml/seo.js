// One source for this page's search content (visible FAQ, example and links in page.jsx; metadata and structured data
// in layout.tsx). 29/09 (croissance-29-09, point 4): the pages ranked first for "json to toml" (TableConvert,
// transform.tools, CodeBeautify) are paste-in converters; ours writes nested tables and arrays of tables with smol-toml
// and says what TOML cannot hold (null, a top-level array).
// P36 (06/10): the title, description and FAQ moved to layout.tsx and page.jsx (read there by scripts/p36/content-verify.mjs);
// this object keeps the path, the example (output produced by the tool's own code) and the links.
export const SEO = {
  name: "JSON to TOML",
  path: "/tools/developer-tools/json-to-toml",
  category: {name: "Developer Tools",path: "/tools/developer-tools"},
  applicationCategory: "DeveloperApplication",
  example: {
    caption: "A JSON object with a date string, an ID too large for TOML, an array of objects and a null, and what the tool returns; the last line is the notice shown under the boxes, not part of the TOML:",
    inputLabel: "JSON",
    input: "{\n  \"title\": \"Demo\",\n  \"released\": \"2024-01-15\",\n  \"owner\": {\"name\": \"Ann\", \"id\": 12345678901234567890},\n  \"servers\": [{\"host\": \"a\", \"port\": 8080}, {\"host\": \"b\", \"port\": 8081}],\n  \"note\": null\n}",
    outputLabel: "TOML",
    output: "title = \"Demo\"\nreleased = \"2024-01-15\"\n\n[owner]\nname = \"Ann\"\nid = \"12345678901234567890\"\n\n[[servers]]\nhost = \"a\"\nport = 8080\n\n[[servers]]\nhost = \"b\"\nport = 8081\n\nBeyond what TOML numbers hold (integers up to 9,223,372,036,854,775,807, floats up to about 1.8e308): owner.id written as text (in quotes) to keep every digit.",
  },
  related: [
    { href: "/tools/developer-tools/toml-to-json", label: "TOML to JSON", note: "the other way." },
    { href: "/tools/developer-tools/json-to-yaml", label: "JSON to YAML", note: "the same object as YAML." },
    { href: "/tools/developer-tools/json-formatter", label: "JSON Formatter", note: "check your JSON is valid before converting." },
  ],
};
