import React from 'react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'

export default function TermsOfService() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="mb-6">
              <strong>Last updated: September 29, 2025</strong>
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="mb-6">
              By using our 3D mug design service and submitting your contact information, you agree to these Terms of Service and our Privacy Policy.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Service Description</h2>
            <p className="mb-6">
              CustomMugs3D provides an interactive 3D design tool for creating custom ceramic mugs. We collect lead information to provide quotes and follow-up services.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. User Responsibilities</h2>
            <p className="mb-4">You agree to:</p>
            <ul className="mb-6">
              <li>Provide accurate contact information</li>
              <li>Use the service for legitimate business inquiries</li>
              <li>Not upload copyrighted or inappropriate images</li>
              <li>Not abuse or overload our systems</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Usage</h2>
            <p className="mb-6">
              Your design data and contact information will be used to provide quotes and may be used for service improvement. See our Privacy Policy for full details.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Limitation of Liability</h2>
            <p className="mb-6">
              Our liability is limited to the extent permitted by law. We provide the service "as is" without warranties.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Marketing Communications</h2>
            <p className="mb-6">
              By providing your contact information and checking the consent box, you agree to receive marketing communications. You can unsubscribe at any time.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Contact Information</h2>
            <p className="mb-4">
              For questions about these terms, contact us at:
            </p>
            <p className="mb-2">
              <strong>Email:</strong> legal@custommugs3d.com
            </p>
            <p className="mb-6">
              <strong>Response time:</strong> We will respond within 5 business days.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
