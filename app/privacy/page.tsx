export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100/30 py-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 text-center">
            Privacy Policy
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Information We Collect</h2>
            <p className="text-gray-600 mb-6">
              We collect information you provide directly to us, such as when you create an account, make a support payment, or contact us for support.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-600 mb-6">
              We use the information we collect to provide, maintain, and improve our services, process transactions, and communicate with you.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Information Sharing</h2>
            <p className="text-gray-600 mb-6">
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Data Security</h2>
            <p className="text-gray-600 mb-6">
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Cookies</h2>
            <p className="text-gray-600 mb-6">
              We use cookies and similar technologies to enhance your experience on our platform and to analyze how our services are used.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Your Rights</h2>
            <p className="text-gray-600 mb-6">
              You have the right to access, update, or delete your personal information. You may also opt out of certain communications from us.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Changes to This Policy</h2>
            <p className="text-gray-600 mb-6">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Contact Us</h2>
            <p className="text-gray-600 mb-6">
              If you have any questions about this Privacy Policy, please contact us at privacy@nisapoti.com
            </p>
          </div>

          <div className="mt-12 text-center">
            <a
              href="/"
              className="inline-flex items-center px-8 py-4 rounded-xl font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
