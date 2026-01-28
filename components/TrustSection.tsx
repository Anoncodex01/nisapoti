'use client';

import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, CreditCard, Headphones } from 'lucide-react';

export default function TrustSection() {
  const trustPoints = [
    {
      icon: CheckCircle,
      title: "Verified Platform",
      description: "Trusted by 1000+ creators across Tanzania"
    },
    {
      icon: Clock,
      title: "24/7 Support",
      description: "Get help whenever you need it"
    },
    {
      icon: CreditCard,
      title: "Secure Payments",
      description: "Bank-grade security for all transactions"
    },
    {
      icon: Headphones,
      title: "Creator-First",
      description: "Built by creators, for creators"
    }
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-r from-orange-50 to-orange-100/50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Badge className="bg-white text-orange-600 hover:bg-white mb-6 px-6 py-2 text-xs font-semibold tracking-widest border border-orange-200">
            TRUSTED BY CREATORS
          </Badge>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
            Why Creators Choose
            <span className="bg-gradient-to-r from-[#FF6A1A] to-[#FF9A3C] text-transparent bg-clip-text">
              {" "}Nisapoti
            </span>
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {trustPoints.map((point, index) => (
            <div 
              key={index}
              className="bg-white rounded-2xl p-6 text-center shadow-lg hover:shadow-xl transition-all duration-300 border border-orange-100 hover:border-orange-200 group hover:-translate-y-1"
            >
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-100 to-orange-200 mb-4 mx-auto group-hover:scale-110 transition-transform duration-300">
                <point.icon className="h-6 w-6 text-[#FF6A1A]" />
              </div>
              <h3 className="font-bold text-gray-800 mb-2 group-hover:text-[#FF6A1A] transition-colors">
                {point.title}
              </h3>
              <p className="text-gray-600 text-sm">
                {point.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}