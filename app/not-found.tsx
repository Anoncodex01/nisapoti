'use client';

import Link from 'next/link';
import { ArrowLeft, Home, Search } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full text-center">
        <div className="mx-auto mb-6 h-20 w-20 rounded-3xl bg-gradient-to-br from-[#FF6A1A] to-[#FF9A3C] text-white flex items-center justify-center shadow-xl">
          <Search className="h-10 w-10" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-3">Page not found</h1>
        <p className="text-base sm:text-lg text-gray-600 mb-8">
          We couldn&apos;t find the page you were looking for. Try the options below.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] hover:from-orange-500 hover:to-orange-300 transition-all duration-200 shadow-lg"
          >
            <Home className="h-5 w-5" />
            Go to Home
          </Link>
          <Link
            href="/creator/explore"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-gray-900 bg-white border border-gray-200 hover:border-orange-300 hover:text-orange-600 transition-all duration-200 shadow-md"
          >
            <ArrowLeft className="h-5 w-5" />
            Explore Creators
          </Link>
        </div>
      </div>
    </div>
  );
}
