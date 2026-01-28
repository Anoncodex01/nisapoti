'use client';

import { Badge } from '@/components/ui/badge';
import { Zap, Shield, Globe, Heart, TrendingUp, Users } from 'lucide-react';

export default function FeaturesSection() {
  const features = [
    {
      icon: Zap,
      title: "Instant Setup",
      description: "Get your creator page live in under 60 seconds. No technical skills required."
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Bank-grade security with direct payouts to your Mobile Money or bank account."
    },
    {
      icon: Globe,
      title: "Global Reach",
      description: "Accept support from fans worldwide with local payment methods."
    },
    {
      icon: Heart,
      title: "Fan Engagement",
      description: "Build deeper connections with personalized messages and supporter interactions."
    },
    {
      icon: TrendingUp,
      title: "Growth Analytics",
      description: "Track your earnings, supporter growth, and engagement metrics."
    },
    {
      icon: Users,
      title: "Community First",
      description: "Join a thriving community of creators supporting each other's success."
    }
  ];

  return (
    <section className="py-24 px-4 bg-gradient-to-b from-orange-50/30 via-white to-orange-50/20 relative">
      {/* Top Gradient Overlay */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-orange-200/30 to-transparent z-5" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 mb-6 px-6 py-2 text-xs font-semibold tracking-widest">
            FEATURES
          </Badge>
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6">
            Everything You Need to
            <br />
            <span className="bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-transparent bg-clip-text">
              Succeed as a Creator
            </span>
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Powerful tools designed specifically for Tanzanian creators to monetize their passion and build sustainable income streams.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-200"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-100 to-orange-200 mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="h-7 w-7 text-[#FF6A1A]" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3 group-hover:text-[#FF6A1A] transition-colors">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}