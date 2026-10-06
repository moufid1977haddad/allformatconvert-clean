// One source for this page's search content (visible FAQ, example and links in page.jsx; metadata and structured data
// in layout.tsx). 29/09 (croissance-29-09, point 4): the pages ranked first for "toml to json" (transform.tools,
// DevToolsDaily, small converters) are paste-in tools; ours parses with smol-toml, which passes most of the official
// toml-test suite (its README), and reports the line of a syntax error.
// P36 (06/10): the title, description and FAQ moved to layout.tsx and page.jsx (read there by scripts/p36/content-verify.mjs);
// this object keeps the path, the example (output produced by the tool's own code) and the links.
export const SEO = {
  name: "TOML to JSON",
  path: "/tools/developer-tools/toml-to-json",
  category: {name: "Developer Tools",path: "/tools/developer-tools"},
  applicationCategory: "DeveloperApplication",
  example: {
    caption: "A Cargo-style TOML file with an inline table, a large integer and a date-time, and the JSON the tool returns:",
    inputLabel: "TOML",
    input: "[package]\nname = \"demo\"\nversion = \"0.1.0\"\n\n[dependencies]\nserde = { version = \"1.0\", features = [\"derive\"] }\n\n[limits]\nmax_id = 9007199254740993\nstarted = 2024-01-15T09:30:00Z",
    outputLabel: "JSON",
    output: "{\n  \"package\": {\n    \"name\": \"demo\",\n    \"version\": \"0.1.0\"\n  },\n  \"dependencies\": {\n    \"serde\": {\n      \"version\": \"1.0\",\n      \"features\": [\n        \"derive\"\n      ]\n    }\n  },\n  \"limits\": {\n    \"max_id\": 9007199254740993,\n    \"started\": \"2024-01-15T09:30:00.000Z\"\n  }\n}",
  },
  related: [
    { href: "/tools/developer-tools/json-to-toml", label: "JSON to TOML", note: "the other way." },
    { href: "/tools/developer-tools/yaml-to-json", label: "YAML to JSON", note: "the same for YAML files." },
    { href: "/tools/developer-tools/json-formatter", label: "JSON Formatter", note: "indent, validate and minify JSON." },
  ],
};
