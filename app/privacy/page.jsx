import { adsEnabled } from '@/app/lib/ads';

export const metadata = {
  title: { absolute: "OnlineConverTools Privacy Policy — Your Data & Files" },
  description: "What each tool sends, or never sends, to a server; cookies; the services we use; your rights. Most tools process files entirely in your browser.",
  alternates: { canonical: "https://www.onlineconvertools.com/privacy" },
  openGraph: {
    title: "OnlineConverTools Privacy Policy — Your Data & Files",
    description: "What each tool sends, or never sends, to a server; cookies; the services we use; your rights. Most tools process files entirely in your browser.",
    url: "https://www.onlineconvertools.com/privacy",
  },
};

// Every list below was checked against the code on 30/09/2026 (which tool calls which server: app/lib/mediaJob.js,
// app/lib/officeUpload.js, app/lib/opusService.js, app/lib/aiClient.js and the app/api routes). When a tool starts or
// stops sending files somewhere, this page must change in the same commit.
const card = "bg-white border border-neutral-200 rounded-xl p-8";
const h2 = "text-xl font-bold text-neutral-800 mb-3";
const p = "text-neutral-600 text-sm leading-relaxed";
const ul = "text-neutral-600 text-sm leading-relaxed space-y-2 list-disc pl-5";
const a = "text-indigo-600 underline hover:no-underline"; // links in running text are underlined, not colour alone (WCAG 1.4.1)

function Ext({ href, children }) {
  return <a href={href} className={a} target="_blank" rel="noopener noreferrer">{children}</a>;
}

export default function PrivacyPage() {
  const ads = adsEnabled();
  let n = 0; // section numbers follow the sections shown (the Advertising section only exists while ads are on)
  const num = () => ++n;
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-neutral-800">Privacy Policy</h1>
        <p className="text-neutral-500 text-center mb-10">Last updated: September 30, 2026</p>
        <div className="space-y-6">

          <div className={card}>
            <h2 className={h2}>{num()}. Introduction</h2>
            <p className={p}>OnlineConverTools ("we", "us", or "our") operates the website www.onlineconvertools.com. This policy explains what information we collect, what each tool does with your files, which services we rely on, and your rights. The short version: <strong>most tools never send your file anywhere</strong> — it is processed by your own browser, on your device. The tools that need a server are listed by name below.</p>
          </div>

          <div className={card}>
            <h2 className={h2}>{num()}. Your files: what stays on your device and what is sent</h2>
            <p className={`${p} mb-3`}><strong>Processed entirely in your browser (nothing is uploaded):</strong> every tool not named in this section — for example Merge, Split, Rotate, Protect, Sign, Edit and OCR for PDF files; the image converters, compressor, resizer and filters; the GIF maker and compressor; audio trimming, joining and conversion to formats other than Opus; ZIP/RAR/7z extraction; all text, math, QR/barcode and developer tools. You can check it yourself: open your browser's developer tools, "Network" tab, and use the tool — no request carries your file. Some of these tools download program code, language data or fonts from a public server (jsDelivr) the first time you use them; nothing about you or your file is sent with those downloads.</p>
            <p className={`${p} mb-3`}><strong>Sent to our own servers</strong> (hosted by us on Railway, not shared with any other company), processed, then deleted:</p>
            <ul className={ul}>
              <li><strong>Documents:</strong> Excel to PDF, PowerPoint to PDF, HTML to PDF, EPUB to PDF, MOBI to PDF, Word to PDF for .doc files, PDF Repair, PDF to PDF/A, PDF Compress.</li>
              <li><strong>Video:</strong> Video Compressor, Video Converter, Video Filter, Video Resizer; Video Rotator in its default "Compatible everywhere" mode (the "Instant, lossless" mode stays in your browser); Video Merger when the clips differ in size or format; Video Trimmer in "Precise cut" mode for longer or larger clips; Screen Recorder only if you ask for an MP4 copy; Video, MP4, MOV, AVI and WebM to GIF.</li>
              <li><strong>Audio:</strong> Audio Converter, Audio Booster, Audio Splitter, Audio Compressor and Audio Merger when the output format is Opus.</li>
              <li><strong>Images:</strong> Background Remover; AI Image Upscaler, except when your browser can run the model on your device (WebGPU), in which case nothing is sent.</li>
              <li><strong>Large files on their way to a tool below:</strong> files over 4&nbsp;MB for the ConvertAPI and transcription tools transit through our own storage server, where they are deleted after processing.</li>
            </ul>
            <p className={`${p} mt-3 mb-3`}><strong>Sent to a specialised provider</strong>, through our server (see Section 5 for each provider's policy):</p>
            <ul className={ul}>
              <li><strong>ConvertAPI</strong> (Lithuania): Word to PDF for .docx files, PDF to Word, PDF to Excel, PDF to PowerPoint. Files are sent with storage disabled and are not kept by ConvertAPI.</li>
              <li><strong>OpenAI</strong> (USA): the text you enter in AI Chatbot, AI Writer, AI Paraphraser, AI Translator, Grammar Fixer, Text Summarizer, Keyword Extractor, Sentiment Analyzer, Data Extractor and Email Generator; the text of your PDF in PDF AI Summary and PDF Translate; your image in Image Captioner; your description in Image Generator; your audio in Audio Transcriber and Audio to Text.</li>
              <li><strong>Pangram Labs</strong> (USA): the text you paste into AI Detector.</li>
            </ul>
            <p className={`${p} mt-3`}>We never sell your files or text, never use them to train any model, and never look at them. On our servers, the file you send is deleted as soon as processing ends, and the result right after you download it (or automatically after a short time if you never do); nothing about a file — name, content or metadata — is written to our logs. Two tools contact other services at your request only: Currency Converter downloads exchange rates (open.er-api.com) without sending anything about you, and API Tester sends the request you write to the address you type.</p>
          </div>

          <div className={card}>
            <h2 className={h2}>{num()}. Other information we collect</h2>
            <ul className={ul}>
              <li><strong>Visit statistics:</strong> we use Google Analytics to count visits and see which pages are used (pages viewed, approximate location from your IP address, browser and device type, time of visit). Google Analytics sets cookies (Section 4).</li>
              <li><strong>Server logs:</strong> our hosting provider (Vercel) keeps technical logs of requests, including IP addresses, for security and operation.</li>
              <li><strong>Usage metrics and abuse limits:</strong> to stay within our providers' budgets and prevent abuse, we record which paid or server tool was used, when, and an estimated processing cost. For per-visitor limits we record a one-way cryptographic hash of your IP address, never the address itself. We never record file contents or the text you submit.</li>
              <li><strong>Failure reports:</strong> when a tool fails, we record an anonymous report so we can fix it: the tool's name, the file extension, a coarse size range (e.g. "1-10MB"), the error type and a cleaned error message, a coarse browser name and version (e.g. "Chrome 129"), and the time. Never your file, its content, its real name, or your IP address. Nothing is sent when a tool succeeds.</li>
              <li><strong>Contact form:</strong> your name, email address and message, stored in our database and emailed to us (through our email provider, Resend). If you attach images (PNG, JPEG, GIF or WebP, up to 3 files and 4&nbsp;MB), they are only included in that email — never stored in our database or any file storage.</li>
              <li><strong>Account (optional):</strong> if you create an account, your name and email address, managed by our authentication provider (Supabase). No tool requires an account.</li>
            </ul>
          </div>

          <div className={card}>
            <h2 className={h2}>{num()}. Cookies and local storage</h2>
            <ul className={ul}>
              <li><strong>Google Analytics</strong> (<code>_ga</code>, <code>_ga_&lt;id&gt;</code>): visit statistics, up to 2 years.</li>
              <li><strong>Google Translate</strong> (<code>googtrans</code>): set only if you choose a language in the menu, to keep the page translated; Google's translation script is loaded only after that choice.</li>
              {ads && <li><strong>Advertising</strong> (Google AdSense and its partners): see Section 6. In the European Economic Area, the United Kingdom and Switzerland, advertising cookies are used only if you agree in the consent message.</li>}
              <li><strong>Local storage in your browser</strong> (never sent to us): your light/dark mode choice, notes and settings you save in some tools, and — if you sign in — your session.</li>
            </ul>
            <p className={`${p} mt-3`}>You can delete cookies and local storage at any time in your browser's settings{ads ? ', and change your advertising choices with the "Privacy choices" link at the bottom of every page' : ''}.</p>
          </div>

          <div className={card}>
            <h2 className={h2}>{num()}. Services we use</h2>
            <ul className={ul}>
              <li><strong>Vercel</strong> (hosting): <Ext href="https://vercel.com/legal/privacy-policy">Vercel Privacy Policy</Ext>.</li>
              <li><strong>Railway</strong> (hosts our own processing servers): <Ext href="https://railway.com/legal/privacy">Railway Privacy Policy</Ext>.</li>
              <li><strong>ConvertAPI</strong>: <Ext href="https://www.convertapi.com/privacy-policy">ConvertAPI Privacy Policy</Ext>.</li>
              <li><strong>OpenAI</strong>: <Ext href="https://openai.com/policies/privacy-policy">OpenAI Privacy Policy</Ext>. Data sent through OpenAI's API is not used to train their models.</li>
              <li><strong>Pangram Labs</strong>: <Ext href="https://www.pangram.com/privacy-policy">Pangram Privacy Policy</Ext>.</li>
              <li><strong>Supabase</strong> (database and accounts): <Ext href="https://supabase.com/privacy">Supabase Privacy Policy</Ext>.</li>
              <li><strong>Resend</strong> (email): <Ext href="https://resend.com/legal/privacy-policy">Resend Privacy Policy</Ext>.</li>
              <li><strong>Google</strong> (Analytics, Translate{ads ? ', AdSense' : ''}): <Ext href="https://policies.google.com/privacy">Google Privacy Policy</Ext> and <Ext href="https://policies.google.com/technologies/partner-sites">how Google uses information from sites that use its services</Ext>.</li>
            </ul>
            <p className={`${p} mt-3`}>Some of these providers are located outside your country, including in the United States; they process data only to provide their service to us.</p>
          </div>

          {ads && (
            <div className={card}>
              <h2 className={h2}>{num()}. Advertising</h2>
              <p className={`${p} mb-3`}>We show ads served by Google AdSense to keep the tools free. Ads are never placed inside a tool's working area.</p>
              <ul className={ul}>
                <li>Third-party vendors, including Google, use cookies to serve ads based on your prior visits to this website or other websites.</li>
                <li>Google's use of advertising cookies enables it and its partners to serve ads to you based on your visits to this site and/or other sites on the Internet.</li>
                <li>You may opt out of personalised advertising by visiting <Ext href="https://www.google.com/settings/ads">Google Ads Settings</Ext>, or opt out of some third-party vendors' use of cookies for personalised advertising at <Ext href="https://www.aboutads.info/choices/">www.aboutads.info</Ext>.</li>
                <li>In the European Economic Area, the United Kingdom and Switzerland, a consent message (Google's certified consent platform, IAB Transparency &amp; Consent Framework) asks for your choice before any advertising cookie is used; you can change it at any time with the "Privacy choices" link at the bottom of every page. Without consent, only non-personalised or limited ads are shown.</li>
              </ul>
            </div>
          )}

          <div className={card}>
            <h2 className={h2}>{num()}. How we use your information</h2>
            <ul className={ul}>
              <li>To run the tools you use and return their results</li>
              <li>To answer your messages and provide support</li>
              <li>To understand which pages are used and improve the site</li>
              <li>To keep costs under control and prevent abuse</li>
              <li>To detect and fix technical problems</li>
              {ads && <li>To show advertising, as described above</li>}
            </ul>
          </div>

          <div className={card}>
            <h2 className={h2}>{num()}. Your rights (GDPR, UK GDPR, Quebec Law 25, CCPA)</h2>
            <p className={`${p} mb-3`}>Depending on where you live, you may have the right to:</p>
            <ul className={ul}>
              <li><strong>Access</strong> the personal data we hold about you, and receive a copy;</li>
              <li><strong>Correct</strong> inaccurate data;</li>
              <li><strong>Delete</strong> your data, including your account;</li>
              <li><strong>Object</strong> to or restrict some processing, and <strong>withdraw consent</strong> at any time;</li>
              <li><strong>Opt out</strong> of the "sale" or "sharing" of personal data (California). We do not sell personal data.</li>
            </ul>
            <p className={`${p} mt-3`}>To exercise any of these rights, write to <a href="mailto:contact@onlineconvertools.com" className={a}>contact@onlineconvertools.com</a>; the site owner is the person responsible for the protection of personal information. You may also complain to your data protection authority.</p>
          </div>

          <div className={card}>
            <h2 className={h2}>{num()}. Data retention</h2>
            <p className={p}>Files processed on our servers: deleted after processing (Section 2). Usage metrics and failure reports: 90 days. Hashed-IP rate-limit records: 2 days. Contact messages: as long as needed to answer and follow up. Account data: until you delete your account or ask us to. Google Analytics data: kept by Google for the retention period set in our account (at most 14 months).</p>
          </div>

          <div className={card}>
            <h2 className={h2}>{num()}. Children's privacy</h2>
            <p className={p}>Our service is not directed to children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal data, please contact us.</p>
          </div>

          <div className={card}>
            <h2 className={h2}>{num()}. Changes to this policy</h2>
            <p className={p}>We update this policy whenever a tool starts or stops sending data somewhere, and change the "Last updated" date above.</p>
          </div>

          <div className={card}>
            <h2 className={h2}>{num()}. Contact us</h2>
            <p className={p}>Questions about this policy:<br /><br />
            <strong>Email:</strong> <a href="mailto:contact@onlineconvertools.com" className={a}>contact@onlineconvertools.com</a><br />
            <strong>Website:</strong> <a href="/contact" className={a}>www.onlineconvertools.com/contact</a></p>
          </div>

        </div>
      </div>
    </div>
  );
}
