'use client';

import { Badge } from '@/components/ui/badge';
import { UserPlus, Share2, DollarSign, TrendingUp, Upload, Users, Zap, Heart } from 'lucide-react';

export default function HowItWorksSection() {
  const steps = [
    {
      icon: UserPlus,
      title: "Create Your Page",
      description: "Sign up and customize your creator profile in under 60 seconds. Add your bio, photos, and set your support goals.",
      step: "Step 1",
      visualIcon: Upload
    },
    {
      icon: Users,
      title: "Share Your Link",
      description: "Share your unique Nisapoti link across your social media, videos, and content to let fans discover you.",
      step: "Step 2",
      visualIcon: Users
    },
    {
      icon: Zap,
      title: "Receive Support",
      description: "Fans can easily support you with Mobile Money, bank transfers, and other local payment methods.",
      step: "Step 3",
      visualIcon: Zap
    },
    {
      icon: Heart,
      title: "Grow & Thrive",
      description: "Use our analytics to understand your audience and grow your supporter community over time.",
      step: "Step 4",
      visualIcon: Share2
    }
  ];

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-white to-orange-50/50 relative">
      {/* Top Gradient Overlay */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-orange-200/30 to-transparent z-5" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 mb-6 px-6 py-2 text-xs font-semibold tracking-widest">
            HOW IT WORKS
          </Badge>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Start Earning in
            <span className="bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-transparent bg-clip-text">
              {" "}4 Simple Steps
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            From setup to success - here&apos;s how thousands of creators are building sustainable income on Nisapoti.
          </p>
        </div>

        {/* Main Container Card */}
        <div className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="relative group text-center"
              >
                {/* Visual Icon with Background Effects */}
                <div className="relative mb-6">
                  {/* Background Circles */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-orange-100/30 animate-pulse"></div>
                    <div className="absolute w-20 h-20 rounded-full bg-orange-200/20"></div>
                  </div>
                  
                  {/* Main Icon */}
                  <div className="relative flex items-center justify-center w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-[#FF6A1A] to-[#FF9A3C] shadow-lg">
                    <step.visualIcon className="h-8 w-8 text-white" />
                  </div>
                </div>
                
                {/* Step Number */}
                <div className="text-[#FF6A1A] font-bold text-sm mb-2">
                  {step.step}
                </div>
                
                {/* Title */}
                <h3 className="text-lg font-bold text-gray-800 mb-3 group-hover:text-[#FF6A1A] transition-colors">
                  {step.title}
                </h3>
                
                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}