"use client";

import Link from "next/link";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F8F5EF] text-[#3F2D1D]">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="text-xs uppercase tracking-widest text-amber-700 font-bold hover:text-amber-900 transition-colors">
            ← Back to DivyaDrishti
          </Link>
          <h1 className="mt-6 text-4xl font-serif font-light tracking-wide">Privacy Policy</h1>
          <p className="mt-2 text-sm text-[#3F2D1D]/60">Effective date: July 6, 2026</p>
        </div>

        <div className="prose prose-sm max-w-none text-[#3F2D1D]/85 space-y-8 leading-relaxed">

          <section>
            <h2 className="text-lg font-serif font-semibold text-[#3F2D1D] mb-3">1. Who We Are</h2>
            <p>
              DivyaDrishti (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is a Vedic astrology guidance application available on the web and as a mobile app. We are operated by an independent developer. For questions, contact us at <a href="mailto:telangrahul2026@gmail.com" className="text-amber-700 underline">telangrahul2026@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif font-semibold text-[#3F2D1D] mb-3">2. Information We Collect</h2>
            <p className="mb-2">We collect the following information when you use DivyaDrishti:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Account information:</strong> name, email address, and password hash (never stored in plain text).</li>
              <li><strong>Birth details:</strong> date of birth, time of birth, and birth location (city/coordinates) used to calculate your Vedic birth chart. This data is essential to the service.</li>
              <li><strong>Daily reflections:</strong> voluntary energy and stress logs you submit. Notes are capped at 300 characters and stored encrypted at rest.</li>
              <li><strong>Chat messages:</strong> questions you ask the AI pundit are processed to generate responses. We may retain recent conversation turns server-side solely to maintain conversation context within a session.</li>
              <li><strong>Device information:</strong> basic device type and operating system for crash reporting and compatibility.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-serif font-semibold text-[#3F2D1D] mb-3">3. How We Use Your Information</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To calculate your Vedic birth chart and deliver personalized astrological guidance.</li>
              <li>To authenticate you securely using signed JWT tokens.</li>
              <li>To display your reflection history and weekly rhythm analysis.</li>
              <li>To improve the accuracy of AI responses over time (in aggregate, not individually linked).</li>
              <li>To send you transactional emails (e.g., ritual reminders) if you opt in.</li>
            </ul>
            <p className="mt-3">We do <strong>not</strong> sell your personal data to third parties. We do not use your data for advertising.</p>
          </section>

          <section>
            <h2 className="text-lg font-serif font-semibold text-[#3F2D1D] mb-3">4. Data Storage and Security</h2>
            <p>
              Your data is stored in a PostgreSQL database hosted on Neon (a cloud database provider). We use industry-standard encryption for data in transit (TLS) and at rest. Passwords are hashed using a strong one-way algorithm and are never stored or transmitted in plain text. JWT authentication tokens are signed using HMAC-SHA256 and expire after 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif font-semibold text-[#3F2D1D] mb-3">5. Third-Party Services</h2>
            <p>DivyaDrishti uses the following third-party services:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Vercel</strong> — web application hosting (web app only).</li>
              <li><strong>Neon / PostgreSQL</strong> — database hosting.</li>
              <li><strong>DeepSeek, Groq, Google Gemini</strong> — AI language model providers used to generate personalized guidance. Your chat questions are sent to these APIs. They are governed by their own privacy policies. We do not send your name or birth details to AI providers — only the astrological context required to generate a response.</li>
              <li><strong>SwissEph (WebAssembly)</strong> — open-source astronomical calculation library, runs locally on our servers with no data sharing.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-serif font-semibold text-[#3F2D1D] mb-3">6. Your Rights</h2>
            <p>You may at any time:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Request access</strong> to the personal data we hold about you.</li>
              <li><strong>Request deletion</strong> of your account and all associated data by emailing <a href="mailto:telangrahul2026@gmail.com" className="text-amber-700 underline">telangrahul2026@gmail.com</a>. We will action requests within 30 days.</li>
              <li><strong>Correct</strong> inaccurate birth details via the app's onboarding flow.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-serif font-semibold text-[#3F2D1D] mb-3">7. Children&apos;s Privacy</h2>
            <p>
              DivyaDrishti is not directed at children under 13 years of age. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us and we will delete it promptly.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif font-semibold text-[#3F2D1D] mb-3">8. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy in the app or by email. Continued use of the app after changes are posted constitutes your acceptance of the revised policy.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-serif font-semibold text-[#3F2D1D] mb-3">9. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy or how we handle your data, please contact us at <a href="mailto:telangrahul2026@gmail.com" className="text-amber-700 underline">telangrahul2026@gmail.com</a>.
            </p>
          </section>

        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-[#F1E7D0] flex items-center justify-between text-[10px] uppercase tracking-widest text-[#3F2D1D]/40">
          <span>DivyaDrishti</span>
          <Link href="/terms" className="hover:text-amber-700 transition-colors">Terms of Service →</Link>
        </div>
      </div>
    </div>
  );
}
