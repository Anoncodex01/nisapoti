'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { ChevronDown } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
  isOpen?: boolean;
}

export default function FAQSection() {
  const [faqs, setFaqs] = useState<FAQItem[]>([
    {
      question: "What is Nisapoti?",
      answer: "Nisapoti helps creators make an income from your biggest fans. Whether you're an artist, streamer, tiktoker, comedian or any kind of creator you can accept tips.",
      isOpen: true
    },
    {
      question: "How does Nisapoti work?",
      answer: "It's simple! Create a free Nisapoti page, share it with your fans, and start earning in just a few minutes! Nisapoti has everything you need to create, share and make money in one place.",
      isOpen: false
    },
    {
      question: "Does Nisapoti take a fee?",
      answer: "Nisapoti takes a creator friendly 18% platform fee. There's no monthly fee so we only make money when you do.",
      isOpen: false
    },
    {
      question: "Can I use Nisapoti if I'm just starting out?",
      answer: "Absolutely! Nisapoti is perfect for creators of all sizes. We're all about letting you do your thing, at your pace – no need to rush or churn out content to a schedule. Grow your support at your own pace without the pressure.",
      isOpen: false
    },
    {
      question: "How do I get paid on Nisapoti?",
      answer: "You get paid directly into your own Mobile Money Number or bank account. Payouts are instant! Supporters can pay you via Mobile Money, and loads of local payment methods.",
      isOpen: false
    }
  ]);

  const toggleFAQ = (index: number) => {
    setFaqs(faqs.map((faq, i) => ({
      ...faq,
      isOpen: i === index ? !faq.isOpen : false
    })));
  };

  return (
    <section className="relative py-24 px-4 bg-gradient-to-b from-white to-orange-50/50 flex flex-col items-center">
      <Badge className="bg-orange-100 text-orange-600 hover:bg-orange-100 mb-6 px-6 py-2 text-xs font-semibold tracking-widest">
        FAQ
      </Badge>
      
      <h2 className="text-4xl md:text-5xl font-extrabold text-center mb-4">Common Questions</h2>
      <p className="text-gray-600 text-center max-w-2xl mb-16 text-lg">
        Everything you need to know about Nisapoti
      </p>
      
      <div className="w-full max-w-3xl flex flex-col gap-4">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className={`bg-white rounded-2xl shadow-lg transition-all duration-300 ${
              faq.isOpen ? 'shadow-xl border-orange-200' : 'border border-gray-100'
            }`}
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="flex justify-between items-center w-full text-left p-8 focus:outline-none group"
            >
              <span className="font-semibold text-xl text-gray-800 group-hover:text-[#FF6A1A] transition-colors">
                {faq.question}
              </span>
              <ChevronDown 
                className={`h-6 w-6 text-[#FF6A1A] transition-transform duration-300 ${
                  faq.isOpen ? 'rotate-180' : ''
                }`} 
              />
            </button>
            
            <div className={`overflow-hidden transition-all duration-300 ${
              faq.isOpen ? 'max-h-96 pb-8' : 'max-h-0'
            }`}>
              <div className="px-8 text-gray-700 text-lg leading-relaxed">
                {faq.answer}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}