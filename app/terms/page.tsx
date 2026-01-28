export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100/30 py-16">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 md:p-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8 text-center">
            Terms of Service
          </h1>
          
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 mb-6">
              By accessing and using Nisapoti, you accept and agree to be bound by the terms and provision of this agreement.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Use License</h2>
            <p className="text-gray-600 mb-6">
              Permission is granted to temporarily download one copy of the materials on Nisapoti for personal, non-commercial transitory viewing only.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Creator Responsibilities</h2>
            <p className="text-gray-600 mb-6">
              Creators are responsible for the content they post and must ensure it complies with our community guidelines. 
              All wishlist items and content must be legitimate and legal.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">4. Supporter Responsibilities</h2>
            <p className="text-gray-600 mb-6">
              Supporters are responsible for their own financial decisions. All support transactions are final and non-refundable.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">5. Privacy Policy</h2>
            <p className="text-gray-600 mb-6">
              Your privacy is important to us. Please review our Privacy Policy, which also governs your use of the service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">6. Prohibited Uses</h2>
            <p className="text-gray-600 mb-6">
              You may not use our service for any unlawful purpose or to solicit others to perform unlawful acts.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">7. Disclaimer</h2>
            <p className="text-gray-600 mb-6">
              The materials on Nisapoti are provided on an &apos;as is&apos; basis. Nisapoti makes no warranties, expressed or implied.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">8. Limitations</h2>
            <p className="text-gray-600 mb-6">
              In no event shall Nisapoti or its suppliers be liable for any damages arising out of the use or inability to use the materials on Nisapoti.
            </p>

            <h2 className="text-2xl font-semibold text-gray-800 mb-4">9. Contact Information</h2>
            <p className="text-gray-600 mb-6">
              If you have any questions about these Terms of Service, please contact us at support@nisapoti.com
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
