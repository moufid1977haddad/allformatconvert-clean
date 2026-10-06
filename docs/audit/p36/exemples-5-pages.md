# P36 — 5 pages complètes (texte rendu, construction de production locale du 06/10)

## /tools/pdf-tools/pdf-to-word

- **Title** (54) : PDF to Word Converter — Editable DOCX, DOC or RTF Free
- **Meta description** (151) : Convert a PDF to an editable Word document in .docx, .doc (Word 97-2003) or .rtf format. ConvertAPI does the work; .doc is finished by our LibreOffice.
- **H1** : PDF to Word

**About PDF to Word**

PDF to Word turns a PDF into a Word document you can edit: .docx, Word 97-2003 .doc, or Rich Text .rtf. The conversion is done by ConvertAPI, our provider; for .doc, our own LibreOffice service then rewrites the .docx in the older format. In our test of 19 September 2026 on two PDFs exported from Word, headings, a table with a merged cell, columns, numbered lists, header and footer, an image, footnotes and a watermark came back in place. PDFs from other software, forms and scans were not tested.

**Formats and limits**

Input format PDF Output formats DOCX, DOC (Word 97-2003) or RTF Maximum file size 99 MB per file Usage limits A limit per network per hour and per day, shared with the site's other paid tools, and a monthly budget for the whole site

**Where your file is processed**

Your PDF goes over HTTPS through our server to ConvertAPI, which converts it with its file storage turned off. For .doc, the .docx that comes back is sent on to our own LibreOffice service to make the older format. A PDF over 4 MB is first uploaded in parts to our media service, which deletes it when the conversion ends and deletes the Word file as soon as this page has received it, or after a time limit.

**How to convert PDF to Word**

1. Click or drop the PDF you want to edit in Word.
2. Choose "Word (.docx)", "Word 97-2003 (.doc)" or "Rich Text (.rtf)".
3. Click the convert button, whose label follows the format you chose.
4. When "Word document ready" appears, "Download" saves the editable document in the format you chose.

**Frequently Asked Questions**

- **Will the Word file keep my formatting?** Yes for the two Word-exported PDFs we tested on 19 September 2026: after a round trip, headings, a table with a merged cell, two columns, numbered lists, header and footer, a wrapped image, footnotes and a watermark were in place. PDFs made by other software were not tested, so check the result on yours.
- **Is the .doc as good as the .docx?** Yes for ordinary text, tables and pictures: in our tests the .doc reopened in Word and LibreOffice with the same text, pages, tables and pictures. Text inside fixed-size text boxes can be cut in the older format, and the page counts such boxes for you. Choose .docx whenever your software opens it.
- **Is there a usage limit?** Yes. Each conversion is a paid call to ConvertAPI, so every network has an hourly and a daily allowance shared with the site's other paid tools, and the whole site has a monthly budget. The limit message says how long to wait, or, for the monthly budget, the date it resets.
- **Do I still get a file if the .doc step fails?** Yes: you receive the .docx that ConvertAPI already made, and a note explains that the .doc could not be produced. Word 2007 and later, LibreOffice, Pages and Google Docs open a .docx.

**Tips & Tricks**

- For a scanned PDF, run PDF OCR first to give it a text layer, then convert the result here.
- Pick Rich Text (.rtf) for WordPad or an older word processor that reads neither .docx nor .doc.

**Related tools** : Word to PDF · PDF OCR · Extract Text from PDF · PDF to Excel · PDF to PowerPoint · PDF Editor

## /tools/image-tools/image-compressor

- **Title** (60) : Image Compressor — JPG, PNG, WebP, AVIF and SVG, Format Kept
- **Meta description** (146) : Compress up to 20 images at once, each kept in its own format, by quality or to a size in KB. MozJPEG, PNG palettes and SVGO, all in your browser.
- **H1** : Image Compressor

**About Image Compressor**

Image Compressor makes JPG, PNG, WebP, AVIF and SVG files smaller without changing their format, and without changing their dimensions unless you choose to reduce an oversized image. JPGs are re-encoded with MozJPEG; a PNG keeps its transparency and gets the smallest color palette that still meets the quality you set; WebP and AVIF stay WebP and AVIF; an SVG stays vector, is minified with SVGO and is only offered if it draws the same as the original. Other images your browser can open, such as BMP, become JPG. If a result would not be smaller, you get no file, just a message. A background worker does the encoding.

**Example**

Measured on 23 September 2026 at the default setting (78), against iLoveIMG on the same files (docs/audit/RAPPORT-ecarts-marche.md, §3b). Original files Photo, JPEG, 491 KB Already compressed JPEG, 149 KB Transparent PNG, 987 KB Our result (iLoveIMG) 209,692 bytes (209,154) 145,480 bytes (144,293) 135,368 bytes (170,281)

**Formats and limits**

Input formats JPG, PNG, WebP, AVIF, SVG; other browser-readable images become JPG Images at once Up to 20 Largest image 140 megapixels on a computer, 48 on phones, iPhone and iPad; a larger one can be reduced first in the same step Refused Animated GIF, animated PNG and animated WebP, with a message pointing to GIF Compressor

**Where your file is processed**

Compression runs in a background worker of your browser, with encoders (MozJPEG, OxiPNG, libwebp, libavif) downloaded from our site the first time they are needed. Your images are not uploaded. The messages shown next to each image are not reported; a page-level error (too many files, the engine stopping) or a crash sends a cleaned report with the tool's name and your browser's name and version.

**How to compress images**

1. Click the upload area and choose up to 20 images.
2. Keep "By quality" and set the slider (78 is the recommended balance), or choose "To a size of" and type a size in KB.
3. Click "Compress image" (or "Compress" followed by the number of images) and watch each size before and after.
4. Click "Download" for each image, or "Download all" for compressed-images.zip.

**Frequently Asked Questions**

- **Can I compress an image to a size like 100 KB?** Yes. Choose "To a size of", type 100 in the KB box and compress. For JPG, WebP and AVIF the highest quality between 10 and 95 that fits is found automatically, without shrinking the picture; if even quality 10 is too big, the result says so and suggests Image Resizer. A PNG uses the slider instead.
- **Does compression lower the image quality?** Yes for JPG, WebP and AVIF, at every setting: they are always re-encoded with loss, slightly at high values. A PNG at quality 100 is repacked without any loss, and so is a PNG for which no palette reaches the chosen quality.
- **Does an SVG stay a vector file?** Yes. SVGO removes editor metadata, shortens numbers and ids and merges what it can. Both versions are then drawn and compared, with small anti-aliasing differences tolerated; if the drawing changed, a more cautious setting is tried, and if that changes it too, your original is kept.
- **Is there a limit on image size?** Yes. Up to 140 megapixels on a computer and 48 on a phone, iPhone or iPad, where a page that needs more memory gets reloaded. A larger image is named as soon as you choose it, and a button reduces it and compresses it in one step.
- **Does it keep transparency and photo orientation?** Yes. PNG, WebP, AVIF and SVG keep their transparency; images converted to JPG get a white background. Photos stay the right way up, while their EXIF details, such as GPS location and camera model, are removed.

**Tips & Tricks**

- If an image is reported as already well compressed, lower the slider and compress it again.
- On an iPhone, pick the photo through Files rather than the photo library to compress the original file; the page explains how.

**Related tools** : Image Resizer · Image Converter · JPG to WebP · Image to PDF · GIF Compressor · PDF Compression

## /tools/text-tools/word-counter

- **Title** (56) : Word Counter — Words, Characters, Reading Time, Keywords
- **Meta description** (129) : Count words, characters, sentences and paragraphs live, see reading and speaking time, and list your most used words and phrases.
- **H1** : Word Counter

**About Word Counter**

Word Counter counts the words, characters with and without spaces, sentences and paragraphs of a text as you type, and estimates reading time at 200 words a minute and speaking time at 130. Below the counts, a keyword density table lists the most frequent words, or repeated two- and three-word phrases, with their share of all words. It relies on your browser's Unicode segmentation, so Chinese, Japanese and Thai are split into words and Mr. or 3.50 do not end a sentence. It only counts, and it runs in your browser.

**Example**

Mr. and 3.50 do not end a sentence, so there are 3 sentences; $ alone is not a word. Text Mr. Smith paid $3.50 for coffee. He liked it! The next day he came back. Counts shown Words: 15 Characters: 73 No Spaces: 58 Sentences: 3 Paragraphs: 2 Min Read: 1 About 1 min to say aloud

**Formats and limits**

Counts Words, Characters, No Spaces, Sentences, Paragraphs, Min Read, speaking time Reading speed Min Read = words ÷ 200, rounded up; speaking time = words ÷ 130, rounded up Paragraphs Every non-empty line counts, so a single line break starts a new paragraph Keyword density Up to 15 rows; phrases shown only when used more than once; 56 common English words can be left out

**Where your text is processed**

Words, sentences and characters are found by Intl.Segmenter, the text segmentation built into your browser, and every count is recomputed inside the page on each keystroke. Your text is not sent or saved: reloading the page clears it. The page has no copy or download button, so the counts stay on your screen.

**How to count words in a text**

1. Paste your essay, article or post into the box, or start typing.
2. Read "Words", "Characters", "No Spaces", "Sentences", "Paragraphs" and "Min Read"; they update with each change.
3. Under the counts, switch the keyword table from "1 word" to two- or three-word phrases, or untick "Leave out common English words" to include the, and, of.
4. Click "Clear" to empty the box and start again.

**Frequently Asked Questions**

- **Does Characters include spaces and line breaks?** Yes. "Characters" counts everything you typed, spaces and line breaks included, with each emoji counted once. "No Spaces" leaves out every kind of whitespace. For letters, digits or byte size, use Character Counter.
- **How is reading time calculated?** 200 words a minute, rounded up: "Min Read" is the word count divided by 200, so any text up to 200 words shows 1. The speaking time under the counts uses 130 words a minute, rounded up the same way.
- **Is a number or a hyphenated word counted as one word?** Yes for numbers: 3.50 is one word. Hyphenated words follow the Unicode word rules of your browser, which split well-known into two words. A symbol such as $ or & alone is not a word.
- **Can I see keyword density?** Yes. The table below the counts lists up to 15 words or phrases with the number of uses and their share of all words. Two- and three-word phrases appear only when used more than once, and the, and, of and similar words can be left out.
- **Does it count the same way in every browser?** No. Firefox before version 125 has no Intl.Segmenter, so there a run of Chinese, Japanese or Thai text counts as one word and 3.50 ends a sentence. Current Chrome, Edge, Safari and Firefox give the counts described here.

**Related tools** : Character Counter · Text Truncator · Text Summarizer · Case Converter · Extract Text from PDF

## /tools/developer-tools/json-formatter

- **Title** (53) : JSON Formatter & Validator — Exact Numbers, Sort Keys
- **Meta description** (145) : Validate and beautify JSON with 2 spaces, 4 spaces or tabs, sort keys A-Z, or minify. Errors show line and column; numbers stay exactly as typed.
- **H1** : JSON Formatter

**About JSON Formatter**

JSON Formatter checks your JSON with the browser's JSON.parse, then re-indents the text you pasted instead of rebuilding it from parsed values. That is why 20-digit ids and 1.10 stay exactly as written, and so do escapes unless you sort the keys. Choose 2 spaces, 4 spaces or a tab, tick Sort keys A-Z to order the keys of every object at every depth, or use Minify for a single line. Invalid JSON is reported with its line and column, and the faulty line is shown with a caret under the problem. There is no tree view and no syntax coloring. Validation and re-indenting run in your browser.

**Example**

Format with 2 spaces: the 20-digit id and 1.10 are copied, not recalculated. Input {"id":12345678901234567890,"price":1.10,"tags":["a","b"],"meta":{}} Output { "id": 12345678901234567890, "price": 1.10, "tags": [ "a", "b" ], "meta": {} }

**Formats and limits**

Input JSON text, pasted Output Indented or one-line JSON, saved as formatted.json Indent 2 spaces, 4 spaces or a tab Sort keys A-Z Every object at every depth, by character code (capitals first); numbers kept, strings re-escaped Length The code sets no maximum; above 1,000,000 characters the boxes show only the first 20,000 characters

**Where your JSON is processed**

JSON.parse and the re-indenter are part of the page, so formatting and validation take place in your browser and your JSON is not uploaded. If an Invalid JSON message is displayed, that message, with the quoted part of your JSON, long numbers and addresses removed, is reported to our error log, together with the tool name and your browser's name and version.

**How to format and validate JSON**

1. Paste JSON into "Input".
2. Choose "2 spaces", "4 spaces" or "Tab" under Indent, and tick "Sort keys A-Z" if you want ordered keys.
3. Click "Format", or "Minify" for a single line.
4. If the JSON is invalid, read the red line under the boxes: it gives the line and column, and the block below marks the spot with ^.
5. Click "Copy", or "Download" to save "formatted.json".

**Frequently Asked Questions**

- **Does it show where my JSON is invalid?** Yes. Click "Format" and the message gives the line and column of the first error, while the box below shows that line with a caret under the problem. Trailing commas, single quotes and unquoted keys are the usual causes.
- **Will formatting change my numbers?** No. The output is built from your original text, so 12345678901234567890 and 1.10 are copied as typed, whereas re-serializing would print 12345678901234567000 and 1.1. With Sort keys A-Z, numbers stay exact but escapes such as \u00e9 are rewritten as the character.
- **Does Sort keys A-Z ignore case?** No. Keys are ordered by character code at every depth, so capitals come first: B sorts before a. If a key appears twice in one object, only its last value is kept. Arrays keep their original order.
- **Is there a tree view?** No. The output is plain text in a box, with no collapsible tree and no colors. The indentation, and the caret shown for an error, are the only guides.

**Tips & Tricks**

- A JSON file that starts with a byte order mark is rejected here as invalid; JSON Minifier and Code Formatter remove that mark first.

**Related tools** : JSON Minifier · JSON to CSV · JSON to YAML · JSON to TypeScript · XML to JSON · Code Formatter

## /tools/gif-tools/mp4-to-gif

- **Title** (52) : MP4 to GIF — Cut a Clip, Choose Width and Frame Rate
- **Meta description** (150) : Make an animated GIF from part of an MP4: set the start, the length, the width and the frame rate. ffmpeg on our server builds the GIF, without sound.
- **H1** : MP4 to GIF

**About MP4 to GIF**

MP4 to GIF cuts a clip of up to 60 seconds out of an MP4 video and turns it into an animated GIF. You decide where the clip starts, how long it lasts, how wide the GIF is and how many frames per second it keeps; the height follows the video, so portrait and square clips keep their shape. The GIF is made by ffmpeg on our server, which builds a color palette from your clip. The same picker also takes MOV, WebM, MKV, AVI and other video files. The GIF has no sound, and the tool does not crop the picture or add captions.

**Formats and limits**

Input MP4 and M4V, plus MOV, WebM, MKV, AVI and the other video types the file picker lists Output An animated GIF without sound, named after your video Clip length From 0.2 to 60 seconds, starting anywhere in the MP4 Width Between 160 and 1080 px; a narrower video is never enlarged Maximum file size 1 GB, on a computer and on a phone Usage limits Each connection may start a limited number of these server conversions per hour and per day

**Where your file is processed**

Your MP4 is sent in pieces straight to our video service (ffmpeg, hosted on Railway), using a ticket the site issues for this one job. The service deletes the MP4 as soon as processing ends and deletes the GIF once this page has fetched it; a job left unfinished is removed later by a timer. If you change "Plays" or "Compression", gifsicle applies it on this page to the GIF our server sent back.

**How to convert MP4 to GIF**

1. Choose your MP4 file, then play the preview that appears and note the second where your clip should start.
2. Type that second in "Start (seconds)" and the duration of the clip in "Length (seconds)".
3. Pick a "Width" and the "Frames per second"; change "Plays" or "Compression" only if you need to.
4. Click "Make GIF": the MP4 is uploaded and converted, and the sizes before and after appear with the preview.
5. Click "Download" to save the GIF, named after your MP4.

**Frequently Asked Questions**

- **Can I turn only part of an MP4 into a GIF?** Yes. "Start (seconds)" sets where the clip begins and "Length (seconds)" how long it lasts, from 0.2 to 60 seconds. When your browser can play the MP4, the page reads its duration and refuses a start after the end before uploading; otherwise our server refuses it with a message.
- **Is the GIF shortened if the clip runs past the end of the MP4?** Yes. If your browser has read the duration of the MP4, the length is cut to what remains and a note above the result gives the real duration. If it could not read it, the GIF simply stops where the video ends, without a note.
- **What makes a GIF heavy?** A GIF has a limited color palette and a much simpler compression than MP4, which predicts the motion between frames, so a GIF grows fast with width, frame rate and length. To make it lighter, lower "Width" or "Frames per second", shorten the clip, or set "Compression" to "Light (smaller file)".
- **Is my MP4 kept on your server?** No. Our video service deletes the MP4 when processing ends, whether it worked or not, and deletes the GIF once this page has received it. A job abandoned halfway is cleared by a timer, and file names and contents are never written to the service logs.

**Tips & Tricks**

- The page starts with a 5-second clip at 480 px and 10 frames per second; adjust "Length (seconds)" first, then the width.

**Related tools** : GIF to MP4 · Video to GIF · MOV to GIF · GIF Compressor · Video Trimmer · WebM to GIF
