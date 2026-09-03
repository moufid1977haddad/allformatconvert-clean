export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-neutral-800">Privacy Policy</h1>
        <p className="text-neutral-500 text-center mb-10">Last updated: August 30, 2026</p>
        <div className="space-y-6">

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">1. Introduction</h2>
            <p className="text-neutral-600 text-sm leading-relaxed">OnlineConverTools ("we", "us", or "our") operates the website www.onlineconvertools.com. This Privacy Policy explains how we collect, use, and protect your information when you use our service. By using OnlineConverTools, you agree to the collection and use of information in accordance with this policy.</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">2. Information We Collect</h2>
            <p className="text-neutral-600 text-sm leading-relaxed mb-3">We collect several types of information for various purposes:</p>
            <ul className="text-neutral-600 text-sm leading-relaxed space-y-2 list-disc pl-5">
              <li><strong>Usage Data:</strong> We automatically collect information about how you interact with our website, including your IP address, browser type, browser version, pages visited, time and date of visit, and other diagnostic data.</li>
              <li><strong>Cookies:</strong> We use cookies to remember your preferences such as dark mode settings. These cookies do not contain personal information.</li>
              <li><strong>File Processing:</strong> Most tools process your files entirely in your browser — nothing is uploaded to any server. A few tools require server-side processing for fidelity or capability reasons in-browser processing cannot reach; for those, your file is transmitted over HTTPS, processed, and deleted immediately afterward — never stored, logged, or kept:
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  <li>Word to PDF, Excel to PDF, PowerPoint to PDF, EPUB to PDF, MOBI to PDF, PDF Repair, PDF to PDF/A: processed on our own servers (self-hosted, not shared with a third party).</li>
                  <li>Audio Transcriber / Audio to Text: your audio is sent to OpenAI for processing — see Section 3.</li>
                  <li>Background Remover: your image is sent to Remove.bg for processing — see Section 3.</li>
                </ul>
              </li>
              <li><strong>Account Information:</strong> If you create an account, we collect your name and email address.</li>
              <li><strong>Usage Metrics:</strong> To operate fairly within our provider budgets and prevent abuse, we record which tool was used, when, an estimated processing cost, and — for the small number of tools that require an account — your account identifier. We never record file contents or the text you submit. For abuse-rate-limiting on tools that don't require an account, we record a one-way cryptographic hash of your IP address, never the address itself.</li>
            </ul>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">3. Third-Party Services</h2>
            <p className="text-neutral-600 text-sm leading-relaxed mb-3">We use the following third-party services that may collect your data:</p>
            <ul className="text-neutral-600 text-sm leading-relaxed space-y-2 list-disc pl-5">
              <li><strong>OpenAI:</strong> Used for AI-powered tools. Your text input is sent to OpenAI for processing. See <a href="https://openai.com/privacy" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">OpenAI Privacy Policy</a>.</li>
              <li><strong>Remove.bg:</strong> Used for background removal. Your images are sent to remove.bg for processing. See <a href="https://www.remove.bg/privacy" className="text-indigo-600 hover:underline" target="_blank" rel="noopener noreferrer">Remove.bg Privacy Policy</a>.</li>
              <li><strong>Vercel:</strong> Our hosting provider may collect server logs including IP addresses.</li>
            </ul>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">4. How We Use Your Information</h2>
            <ul className="text-neutral-600 text-sm leading-relaxed space-y-2 list-disc pl-5">
              <li>To provide and maintain our service</li>
              <li>To notify you about changes to our service</li>
              <li>To provide customer support</li>
              <li>To gather analysis to improve our service</li>
              <li>To monitor the usage of our service</li>
              <li>To detect, prevent and address technical issues</li>
            </ul>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">5. Your Rights (GDPR / CCPA)</h2>
            <p className="text-neutral-600 text-sm leading-relaxed mb-3">Depending on your location, you may have the following rights:</p>
            <ul className="text-neutral-600 text-sm leading-relaxed space-y-2 list-disc pl-5">
              <li><strong>Right to Access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate personal data.</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data.</li>
              <li><strong>Right to Opt-Out:</strong> Opt out of the sale of your personal data (California residents).</li>
            </ul>
            <p className="text-neutral-600 text-sm leading-relaxed mt-3">To exercise any of these rights, please contact us at <a href="mailto:contact@onlineconvertools.com" className="text-indigo-600 hover:underline">contact@onlineconvertools.com</a>.</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">6. Data Retention</h2>
            <p className="text-neutral-600 text-sm leading-relaxed">We retain your personal data only for as long as necessary to provide the service. Usage metrics (described in Section 2) are kept for 90 days. Hashed-IP rate-limit records are kept for 2 days.</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">7. Children's Privacy</h2>
            <p className="text-neutral-600 text-sm leading-relaxed">Our service is not directed to children under the age of 13. We do not knowingly collect personally identifiable information from children under 13. If you are a parent or guardian and believe your child has provided us with personal data, please contact us immediately.</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">8. Changes to This Policy</h2>
            <p className="text-neutral-600 text-sm leading-relaxed">We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date.</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">9. Contact Us</h2>
            <p className="text-neutral-600 text-sm leading-relaxed">If you have any questions about this Privacy Policy, please contact us at:<br /><br />
            <strong>Email:</strong> <a href="mailto:contact@onlineconvertools.com" className="text-indigo-600 hover:underline">contact@onlineconvertools.com</a><br />
            <strong>Website:</strong> <a href="/contact" className="text-indigo-600 hover:underline">www.onlineconvertools.com/contact</a></p>
          </div>

        </div>
      </div>
    </div>
  );
}
