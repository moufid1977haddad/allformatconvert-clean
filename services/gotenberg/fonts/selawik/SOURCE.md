# Selawik — provenance

- Upstream: https://github.com/microsoft/Selawik (official Microsoft repository)
- Files: `selawk.ttf` (Regular) and `selawkb.ttf` (Bold), extracted unmodified from the
  official release asset `Selawik_Release.zip` of tag `1.01`
  (https://github.com/microsoft/Selawik/releases/download/1.01/Selawik_Release.zip,
  sha256 `3f62c51e05e3b5a1e6241cf92a371f0be2ea1183aa87b30718bbd40832a8d423`).
- License: SIL Open Font License 1.1, `OFL-LICENSE.txt` is the repository's own
  `LICENSE.txt` fetched from `master` on 2026-09-19 (Reserved Font Name "Selawik" —
  the files must not be modified or renamed; they are not).
- Embedding flag (OS/2 `fsType`): 0 (installable embedding) in both files.
- Metrics measured 2026-09-19 against the real Segoe UI on Windows: identical advance
  widths for 93/93 tested Latin/French glyphs, regular and bold. The upstream README does
  NOT claim metric compatibility and lists "missing kerning to match Segoe UI" as a known
  issue — see docs/audit/RAPPORT-fidelite-corrections.md (D2).
