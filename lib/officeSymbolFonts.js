// Wingdings, Wingdings 2, Wingdings 3, and Webdings are proprietary
// Microsoft dingbat/icon fonts that our LibreOffice-based conversion
// service (Gotenberg) cannot legally embed -- Wingdings was never freely
// redistributable, and Webdings's old free-redistribution terms forbade
// commercial use, which this site doesn't satisfy. When a document
// references one of these fonts, the specific characters that use it
// render as blank boxes in the converted PDF. That's a permanent,
// confirmed limitation of the conversion pipeline, not a bug -- this
// module exists to detect (not fix) the situation, so the API route and
// frontend can disclose it to the user rather than silently handing back
// a PDF that's missing icons with no explanation.
import JSZip from 'jszip';

const TARGET_FONTS = ['Wingdings', 'Wingdings 2', 'Wingdings 3', 'Webdings'];
const TARGET_FONTS_LOWER = new Map(TARGET_FONTS.map((f) => [f.toLowerCase(), f]));

// Which XML parts inside each OOXML (docx/pptx/xlsx) zip can carry a font
// reference, per format. Matched against JSZip's flat entry paths (there's
// no real filesystem walk to glob against). Deliberately narrower than
// "every XML part" -- e.g. theme XML is skipped, since a theme merely
// defines a font slot a document part may or may not actually use.
const PART_PATTERNS = {
  docx: [
    /^word\/document\.xml$/,
    /^word\/numbering\.xml$/,
    /^word\/styles\.xml$/,
    /^word\/footnotes\.xml$/,
    /^word\/endnotes\.xml$/,
    /^word\/header\d*\.xml$/,
    /^word\/footer\d*\.xml$/,
  ],
  // Slide layouts/masters matter as much as slides themselves: a bullet
  // font is very commonly set once on a layout/master and inherited by
  // every slide that uses it, never repeated in the slide's own XML.
  pptx: [
    /^ppt\/slides\/slide\d+\.xml$/,
    /^ppt\/slideLayouts\/slideLayout\d+\.xml$/,
    /^ppt\/slideMasters\/slideMaster\d+\.xml$/,
    /^ppt\/notesSlides\/.*\.xml$/,
  ],
  xlsx: [/^xl\/styles\.xml$/, /^xl\/sharedStrings\.xml$/],
};

// Font-family references, as they actually appear in real OOXML:
//   w:ascii="...", w:hAnsi="...", w:cs="...", w:eastAsia="..."  (docx/pptx run font refs)
//   typeface="..."                                              (pptx/docx theme + run font refs)
//   w:font="..." inside <w:sym .../>                            (docx explicit symbol-character inserts)
//   <name val="..."/>                                           (xlsx font table entries)
const FONT_NAME_REGEXES = [
  /w:(?:ascii|hAnsi|cs|eastAsia)="([^"]*)"/g,
  /typeface="([^"]*)"/g,
  /w:font="([^"]*)"/g,
  /<name\s+val="([^"]*)"/gi,
];

// Extracts font-family names from one XML part's raw text and returns the
// subset that are exact (case-insensitive, trimmed) matches for one of the
// 4 target fonts -- never a substring match, so e.g. a hypothetical font
// named "MyWingdingsClone" does not count as "Wingdings".
function extractTargetFonts(xml) {
  const found = new Set();
  for (const re of FONT_NAME_REGEXES) {
    re.lastIndex = 0;
    let match;
    while ((match = re.exec(xml)) !== null) {
      const canonical = TARGET_FONTS_LOWER.get(match[1].trim().toLowerCase());
      if (canonical) found.add(canonical);
    }
  }
  return found;
}

/**
 * Scans an uploaded Office file for references to the 4 proprietary
 * dingbat fonts that can't legally be reproduced by our conversion
 * service. Returns the subset actually referenced, in the fixed order
 * above -- [] if none are found.
 *
 * docx/xlsx/pptx are ZIP archives of XML (OOXML), which this function
 * unzips and scans. Legacy binary formats (doc/xls/ppt) and csv are NOT
 * ZIP/XML at all, so this function makes no attempt to scan them and
 * simply returns [] for those extensions -- a known, disclosed scope
 * boundary, not an oversight.
 *
 * @param {Buffer} buffer - raw bytes of the uploaded file
 * @param {string} extension - lowercase extension without the dot ("docx", "xlsx", "pptx", ...)
 * @returns {Promise<string[]>}
 */
async function detectProprietarySymbolFonts(buffer, extension) {
  const patterns = PART_PATTERNS[extension];
  if (!patterns) return [];

  let zip;
  try {
    zip = await JSZip.loadAsync(buffer);
  } catch {
    // Not actually a valid zip -- e.g. a legacy .doc uploaded with a
    // mistaken .docx extension. Fail open: no crash, and no claim either
    // way about fonts we couldn't actually inspect.
    return [];
  }

  const found = new Set();
  for (const path of Object.keys(zip.files)) {
    const entry = zip.files[path];
    if (entry.dir || !patterns.some((re) => re.test(path))) continue;
    let xml;
    try {
      xml = await entry.async('string');
    } catch {
      continue;
    }
    for (const font of extractTargetFonts(xml)) found.add(font);
  }

  return TARGET_FONTS.filter((f) => found.has(f));
}

export { detectProprietarySymbolFonts };
