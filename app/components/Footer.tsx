import React from 'react'
import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-gray-900">
      <div className="mx-auto max-w-7xl px-6 py-12 lg:px-8 lg:py-16">
        <div className="xl:grid xl:grid-cols-3 xl:gap-8">
          {/* Brand and Description */}
          <div className="space-y-8 xl:col-span-1">
            <div className="flex items-center space-x-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600">
                <svg className="h-5 w-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
                </svg>
              </div>
              <span className="text-xl font-bold text-white">CustomMugs3D</span>
            </div>
            <p className="text-sm leading-6 text-gray-300 max-w-md">
              Create stunning, personalized mugs with our revolutionary 3D design platform. 
              Professional sublimation quality meets interactive customization.
            </p>
            <div className="flex space-x-6">
              <Link href="#" className="text-gray-400 hover:text-gray-300">
                <span className="sr-only">Facebook</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </Link>
              <Link href="#" className="text-gray-400 hover:text-gray-300">
                <span className="sr-only">Instagram</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.328-1.297C4.243 14.814 3.752 13.663 3.752 12.366s.49-2.448 1.369-3.328c.88-.88 2.031-1.297 3.328-1.297s2.448.417 3.328 1.297c.88.88 1.297 2.031 1.297 3.328s-.417 2.448-1.297 3.328c-.88.88-2.031 1.297-3.328 1.297zm7.718 0c-1.297 0-2.448-.49-3.328-1.297-.88-.88-1.297-2.031-1.297-3.328s.417-2.448 1.297-3.328c.88-.88 2.031-1.297 3.328-1.297s2.448.417 3.328 1.297c.88.88 1.297 2.031 1.297 3.328s-.417 2.448-1.297 3.328c-.88.88-2.031 1.297-3.328 1.297z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Quick Links and Legal */}
          <div className="mt-16 grid grid-cols-2 gap-8 xl:col-span-2 xl:mt-0">
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Quick Links</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <Link href="/gallery" className="text-sm leading-6 text-gray-300 hover:text-white">
                      Design Gallery
                    </Link>
                  </li>
                  <li>
                    <Link href="/how-it-works" className="text-sm leading-6 text-gray-300 hover:text-white">
                      How It Works
                    </Link>
                  </li>
                  <li>
                    <Link href="/pricing" className="text-sm leading-6 text-gray-300 hover:text-white">
                      Pricing
                    </Link>
                  </li>
                  <li>
                    <Link href="/faq" className="text-sm leading-6 text-gray-300 hover:text-white">
                      FAQ
                    </Link>
                  </li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">Support</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <Link href="/contact" className="text-sm leading-6 text-gray-300 hover:text-white">
                      Contact Us
                    </Link>
                  </li>
                  <li>
                    <Link href="/shipping" className="text-sm leading-6 text-gray-300 hover:text-white">
                      Shipping Info
                    </Link>
                  </li>
                  <li>
                    <Link href="/returns" className="text-sm leading-6 text-gray-300 hover:text-white">
                      Returns
                    </Link>
                  </li>
                  <li>
                    <Link href="/track-order" className="text-sm leading-6 text-gray-300 hover:text-white">
                      Track Order
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
            <div className="md:grid md:grid-cols-2 md:gap-8">
              <div>
                <h3 className="text-sm font-semibold leading-6 text-white">Contact Info</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li className="text-sm leading-6 text-gray-300">
                    <span className="font-medium">Email:</span><br />
                    hello@custommugs3d.com
                  </li>
                  <li className="text-sm leading-6 text-gray-300">
                    <span className="font-medium">Phone:</span><br />
                    (555) 123-MUGS
                  </li>
                  <li className="text-sm leading-6 text-gray-300">
                    <span className="font-medium">Business Hours:</span><br />
                    Mon-Fri 9AM-6PM EST
                  </li>
                </ul>
              </div>
              <div className="mt-10 md:mt-0">
                <h3 className="text-sm font-semibold leading-6 text-white">Legal</h3>
                <ul role="list" className="mt-6 space-y-4">
                  <li>
                    <Link href="/privacy-policy" className="text-sm leading-6 text-gray-300 hover:text-white">
                      Privacy Policy
                    </Link>
                  </li>
                  <li>
                    <Link href="/terms-of-service" className="text-sm leading-6 text-gray-300 hover:text-white">
                      Terms of Service
                    </Link>
                  </li>
                  <li>
                    <Link href="/cookies" className="text-sm leading-6 text-gray-300 hover:text-white">
                      Cookie Policy
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        <div className="mt-16 border-t border-gray-700 pt-8 sm:mt-20 lg:mt-24">
          <p className="text-xs leading-5 text-gray-400 text-center">
            &copy; 2025 CustomMugs3D. All rights reserved. Professional sublimation printing with interactive 3D design technology.
          </p>
        </div>
      </div>
    </footer>
  )
}
