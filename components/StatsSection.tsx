'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export default function StatsSection() {
  return (
    <section className="relative py-24 px-4 bg-gradient-to-b from-orange-50/50 to-white overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 800 400">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#FF6A1A" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="800" height="400" fill="url(#grid)"/>
        </svg>
      </div>
      
      <div className="relative z-10 flex flex-col items-center">
        <h2 className="text-4xl md:text-6xl font-extrabold text-center mb-6">
          Support Your Favorite Creator
          <br />
          <span className="text-[#FF6A1A]">in 1 Minute</span>
        </h2>
        
        <p className="text-gray-600 text-center max-w-2xl mb-12 text-lg">
          Join thousands of creators and supporters on Nisapoti. Start your journey today!
        </p>
        
        <Button className="inline-flex items-center gap-3 bg-[#FF6A1A] hover:bg-[#FF5A0A] text-white font-bold text-xl px-12 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 mb-16">
          <ArrowRight className="h-6 w-6" />
          Explore
        </Button>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-full max-w-4xl">
          <div className="flex flex-col items-center text-center">
            <span className="text-5xl font-extrabold text-[#FF6A1A] mb-3">1000+</span>
            <span className="text-gray-600 text-lg">Active Creators</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-5xl font-extrabold text-[#FF6A1A] mb-3">400+</span>
            <span className="text-gray-600 text-lg">Happy Supporters</span>
          </div>
          <div className="flex flex-col items-center text-center">
            <span className="text-5xl font-extrabold text-[#FF6A1A] mb-3">Tsh1M+</span>
            <span className="text-gray-600 text-lg">Creator Earnings</span>
          </div>
        </div>
      </div>
    </section>
  );
}