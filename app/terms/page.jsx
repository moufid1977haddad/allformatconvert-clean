export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-2 text-neutral-800">Terms of Service</h1>
        <p className="text-neutral-500 text-center mb-10">Last updated: May 31, 2025</p>
        <div className="space-y-6">

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">1. Acceptance of Terms</h2>
            <p className="text-neutral-600 text-sm leading-relaxed">By accessing and using AllFormatConvert ("Service"), you confirm that you are at least 13 years of age and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our service.</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">2. Description of Service</h2>
            <p className="text-neutral-600 text-sm leading-relaxed">AllFormatConvert provides free online tools for converting, compressing, and editing files including PDFs, images, videos, audio, and more. Some features are powered by third-party AI services. The service is provided "as is" and may be updated, modified, or discontinued at any time.</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">3. Permitted Use</h2>
            <p className="text-neutral-600 text-sm leading-relaxed mb-3">You may use AllFormatConvert for personal and commercial purposes. You agree NOT to:</p>
            <ul className="text-neutral-600 text-sm leading-relaxed space-y-2 list-disc pl-5">
              <li>Use the service for any unlawful purpose</li>
              <li>Upload or process illegal, harmful, or offensive content</li>
              <li>Attempt to reverse engineer, hack, or disrupt the service</li>
              <li>Use automated bots or scrapers without written permission</li>
              <li>Violate any intellectual property rights</li>
              <li>Process content that violates third-party rights</li>
            </ul>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">4. Intellectual Property</h2>
            <p className="text-neutral-600 text-sm leading-relaxed">The content, features, design, and functionality of AllFormatConvert are owned by AllFormatConvert and protected by international copyright, trademark, and other intellectual property laws. You retain all rights to files you process through our service.</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">5. Third-Party Services</h2>
            <p className="text-neutral-600 text-sm leading-relaxed">Some features use third-party APIs including OpenAI and Remove.bg. By using AI-powered tools, you agree to the respective terms of service of these providers. AllFormatConvert is not responsible for the performance or availability of third-party services.</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">6. Advertising</h2>
            <p className="text-neutral-600 text-sm leading-relaxed">AllFormatConvert may display advertisements provided by Google AdSense and other advertising networks. These advertisements help us keep the service free. By using our service, you consent to the display of such advertisements.</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">7. Disclaimer of Warranties</h2>
            <p className="text-neutral-600 text-sm leading-relaxed">AllFormatConvert is provided on an "as is" and "as available" basis without warranties of any kind, either express or implied. We do not warrant that the service will be uninterrupted, error-free, secure, or free of viruses or other harmful components.</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">8. Limitation of Liability</h2>
            <p className="text-neutral-600 text-sm leading-relaxed">To the maximum extent permitted by law, AllFormatConvert shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use the service, including but not limited to loss of data or profits.</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">9. Age Requirement</h2>
            <p className="text-neutral-600 text-sm leading-relaxed">You must be at least 13 years old to use this service. If you are under 18, you must have parental consent. We do not knowingly collect information from children under 13 years of age.</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">10. Governing Law</h2>
            <p className="text-neutral-600 text-sm leading-relaxed">These Terms shall be governed by and construed in accordance with the laws of Quebec, Canada, without regard to its conflict of law provisions. Any disputes shall be resolved in the courts of Quebec, Canada.</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">11. Changes to Terms</h2>
            <p className="text-neutral-600 text-sm leading-relaxed">We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the service after changes constitutes acceptance of the modified terms. We will notify users of significant changes via email when possible.</p>
          </div>

          <div className="bg-white border border-neutral-200 rounded-xl p-8">
            <h2 className="text-xl font-bold text-neutral-800 mb-3">12. Contact Us</h2>
            <p className="text-neutral-600 text-sm leading-relaxed">If you have any questions about these Terms of Service, please contact us at:<br /><br />
            <strong>Email:</strong> <a href="mailto:contact@allformatconvert.com" className="text-indigo-600 hover:underline">contact@allformatconvert.com</a><br />
            <strong>Website:</strong> <a href="/contact" className="text-indigo-600 hover:underline">allformatconvert.com/contact</a></p>
          </div>

        </div>
      </div>
    </div>
  );
}
