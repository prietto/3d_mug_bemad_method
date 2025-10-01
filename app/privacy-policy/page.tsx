import React from 'react'
import Navigation from '../components/Navigation'
import Footer from '../components/Footer'

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      <main className="flex-grow py-16">
        <div className="mx-auto max-w-4xl px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
          <div className="prose prose-lg max-w-none text-gray-700">
            <p className="mb-6">
              <strong>Last updated: September 29, 2025</strong>
            </p>
            
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
            <p className="mb-4">
              When you use our 3D mug designer and submit your contact information, we collect:
            </p>
            <ul className="mb-6">
              <li><strong>Personal Information:</strong> Name, email address, phone number (optional)</li>
              <li><strong>Project Details:</strong> Custom design preferences, project description</li>
              <li><strong>Usage Data:</strong> Interactions with our 3D designer tool, engagement metrics</li>
              <li><strong>Technical Data:</strong> Device type, browser information, session data</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="mb-4">We use your information to:</p>
            <ul className="mb-6">
              <li>Provide quotes for custom mug orders</li>
              <li>Follow up on your design inquiries</li>
              <li>Improve our 3D design experience</li>
              <li>Send marketing communications (with your consent)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. Your Rights (GDPR)</h2>
            <p className="mb-4">You have the right to:</p>
            <ul className="mb-6">
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Delete your data</li>
              <li>Object to processing</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Legal Basis for Processing</h2>
            <p className="mb-6">
              We process your data based on your consent for marketing communications and legitimate interest for providing our services and improving user experience.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Data Retention</h2>
            <p className="mb-6">
              We retain your data for as long as necessary to provide our services or as required by law. Lead data is retained for 2 years unless you request deletion.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Contact Us</h2>
            <p className="mb-4">
              For privacy-related questions or to exercise your rights, contact us at:
            </p>
            <p className="mb-2">
              <strong>Email:</strong> privacy@custommugs3d.com
            </p>
            <p className="mb-6">
              <strong>Response time:</strong> We will respond within 30 days as required by GDPR.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
