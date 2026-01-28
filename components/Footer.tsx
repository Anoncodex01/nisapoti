'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          {/* Logo and Copyright */}
          <div className="flex items-center space-x-2 mb-6 md:mb-0">
            <span className="text-2xl font-bold bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] bg-clip-text text-transparent">
              N
            </span>
            <span className="text-gray-500 text-sm">© 2025 Nisapoti. All rights reserved.</span>
          </div>
          
          {/* Footer Links */}
          <div className="flex items-center space-x-8">
            <Link href="/privacy" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
              Privacy
            </Link>
            <Link href="/terms" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
              Terms
            </Link>
            <Link href="/contact" className="text-gray-500 hover:text-gray-700 text-sm transition-colors">
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}