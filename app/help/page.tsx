'use client';

import { useState } from 'react';
import { Search, ChevronRight, Mail, ArrowLeft, Rocket, TrendingUp, HandHeart, ShoppingBag, DollarSign, Users, User, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface FAQCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  articleCount: number;
  articles: FAQArticle[];
}

interface FAQArticle {
  id: string;
  title: string;
  content: string;
  category: string;
}

const faqCategories: FAQCategory[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    description: 'What is Nisapoti, creating an account, facts, and more',
    icon: Rocket,
    articleCount: 8,
    articles: [
      {
        id: 'what-is-nisapoti',
        title: 'What is Nisapoti?',
        content: 'Nisapoti is a platform that empowers creators to earn from their passion by connecting them with supporters who can purchase digital products from their shop or send direct support. Whether you\'re an artist, writer, musician, or content creator, Nisapoti provides the tools you need to monetize your creativity.',
        category: 'getting-started'
      },
      {
        id: 'create-account',
        title: 'How to create an account',
        content: 'To create an account on Nisapoti, visit our homepage at nisapoti.com and click "Claim" to register your unique username. Enter your desired username (this will be your page URL: nisapoti.com/yourname), provide your email address, and create a secure password. You\'ll receive a verification email to confirm your account.',
        category: 'getting-started'
      },
      {
        id: 'choosing-username',
        title: 'How to choose the perfect username',
        content: 'Your username becomes your unique URL (nisapoti.com/yourname), so choose wisely! Keep it short, memorable, and related to your brand or real name. Avoid special characters and numbers if possible. Once chosen, your username cannot be changed.',
        category: 'getting-started'
      },
      {
        id: 'profile-setup',
        title: 'Setting up your profile',
        content: 'After creating your account, complete your profile by adding a profile picture, bio, category, and website link. A complete profile builds trust with potential supporters and helps them understand who you are and what you create.',
        category: 'getting-started'
      },
      {
        id: 'dashboard-overview',
        title: 'Understanding your dashboard',
        content: 'Your creator dashboard shows your earnings, supporter count, and page views with interactive charts. You can track your performance over different time periods and access all creator tools from the sidebar navigation.',
        category: 'getting-started'
      },
      {
        id: 'platform-fees',
        title: 'Understanding Nisapoti fees',
        content: 'Nisapoti charges a 18% platform fee on all transactions, which is deducted when you receive payouts. This fee helps us maintain the platform, provide customer support, and continue developing new features. There are no setup fees, monthly fees, or listing fees.',
        category: 'getting-started'
      }
    ]
  },
  {
    id: 'growing-supporters',
    title: 'Growing your Supporters',
    description: 'Read more to discover effective strategies for growing your supporter base',
    icon: TrendingUp,
    articleCount: 6,
    articles: [
      {
        id: 'attract-supporters',
        title: 'How to attract more supporters',
        content: 'Share your unique Nisapoti link on social media platforms where your audience is most active. Create quality digital products in your shop, engage with your audience regularly, and provide value through your content and offerings.',
        category: 'growing-supporters'
      },
      {
        id: 'social-media-strategy',
        title: 'Social media promotion strategies',
        content: 'Share your Nisapoti link in your bio on Instagram, Twitter, TikTok, and other platforms. Create posts that showcase your products and include your Nisapoti link. Use relevant hashtags to reach new audiences.',
        category: 'growing-supporters'
      },
      {
        id: 'referral-program',
        title: 'Using the referral program',
        content: 'Nisapoti offers a referral program where you can earn commissions by referring new creators to the platform. Share your referral link and earn from successful referrals.',
        category: 'growing-supporters'
      }
    ]
  },
  {
    id: 'supporter-management',
    title: 'Managing Supporters',
    description: 'Track and engage with your supporters effectively',
    icon: HandHeart,
    articleCount: 4,
    articles: [
      {
        id: 'supporter-dashboard',
        title: 'Understanding your supporters page',
        content: 'The supporters page in your creator dashboard shows you who has supported you, when they supported you, and how much they contributed. You can track supporter activity and engagement over time.',
        category: 'supporter-management'
      },
      {
        id: 'supporter-communication',
        title: 'Communicating with supporters',
        content: 'Engage with your supporters through your public profile page. Respond to their messages and show appreciation for their support. Building relationships with supporters encourages repeat purchases and referrals.',
        category: 'supporter-management'
      }
    ]
  },
  {
    id: 'setting-up-shop',
    title: 'Setting up your Shop',
    description: 'Expert tips to set up your Shop and start earning by selling',
    icon: ShoppingBag,
    articleCount: 18,
    articles: [
      {
        id: 'complete-shop-guide',
        title: 'A complete guide to Nisapoti Shop',
        content: 'Nisapoti allows creators to set up a Shop where they can sell services, digital products, or physical items. Setting up takes just minutes, and with a simple link, you can share your shop with customers. This guide covers everything from setup to sales management.',
        category: 'setting-up-shop'
      },
      {
        id: 'shop-setup-basics',
        title: 'How to set up your shop',
        content: 'Log into your Nisapoti account and navigate to the Shop section. Choose from predefined themes or start from scratch. Add your shop name and description that clearly describes what you\'re selling. The only prerequisite is having your payout information set up.',
        category: 'setting-up-shop'
      },
      {
        id: 'adding-products',
        title: 'Adding products to your shop',
        content: 'Click "Add Product" and fill in the product name, description, and price. Upload high-quality images (recommended 1080x1080 pixels). For digital products, upload the files for immediate download. For services, set up redirect links or confirmation messages.',
        category: 'setting-up-shop'
      },
      {
        id: 'product-images',
        title: 'Product images and presentation',
        content: 'Use high-quality images that show your product from different angles. Include lifestyle images or mockups when possible. Multiple images perform better than single images. Keep images at 1080x1080 pixels for optimal display across all devices.',
        category: 'setting-up-shop'
      },
      {
        id: 'digital-product-delivery',
        title: 'How to deliver digital products',
        content: 'For digital products, upload files directly so customers can download immediately after purchase. For link-based access, set up redirects. Always include confirmation messages with download instructions or access details.',
        category: 'setting-up-shop'
      },
      {
        id: 'product-categories',
        title: 'Organizing products with categories',
        content: 'If you have multiple products, create categories to help customers find what they want quickly. For example, if selling wallpapers, create categories like "Nature," "Animals," or "Abstract." This keeps your shop organized and user-friendly.',
        category: 'setting-up-shop'
      },
      {
        id: 'shop-compliance',
        title: 'Ensuring shop compliance',
        content: 'Review Nisapoti\'s product guidelines before listing items. Certain products are prohibited. Ensure your products comply with our terms and payment partner requirements. This is mandatory for shop approval.',
        category: 'setting-up-shop'
      },
      {
        id: 'customer-questions',
        title: 'Using the "Ask a Question" feature',
        content: 'Enable this feature if you need specific information from customers before fulfilling orders, such as shipping details for physical products, customization preferences, or sizing information.',
        category: 'setting-up-shop'
      },
      {
        id: 'inventory-management',
        title: 'Managing inventory and stock limits',
        content: 'Use the "Limit Slots" feature to create urgency or control stock levels. Once the limit is reached, items are marked as sold out. This works well for limited editions or time-sensitive offers.',
        category: 'setting-up-shop'
      },
      {
        id: 'wishlist-integration',
        title: 'Using wishlist for product ideas',
        content: 'Check your wishlist page to see what products your supporters are requesting. This gives you valuable insights into what digital products to create and sell in your shop.',
        category: 'setting-up-shop'
      }
    ]
  },
  {
    id: 'getting-paid',
    title: 'Getting paid',
    description: 'Read more to know what steps you should follow to get paid in no time',
    icon: DollarSign,
    articleCount: 8,
    articles: [
      {
        id: 'withdraw-earnings',
        title: 'How to withdraw your earnings',
        content: 'Use the withdraw page in your creator dashboard to request payouts of your earnings. Set up your payment method and bank account details to receive your funds. Minimum withdrawal amounts may apply.',
        category: 'getting-paid'
      },
      {
        id: 'earnings-tracking',
        title: 'Tracking your earnings',
        content: 'View detailed earnings reports in your dashboard. Track income from shop sales and direct support over different time periods. The dashboard shows charts and statistics to help you understand your revenue patterns.',
        category: 'getting-paid'
      },
      {
        id: 'payment-methods',
        title: 'Setting up payment methods',
        content: 'Configure your preferred payment method for receiving withdrawals. Ensure your payment information is accurate to avoid delays. You can update payment methods anytime in your account settings.',
        category: 'getting-paid'
      }
    ]
  },
  {
    id: 'for-supporters',
    title: 'For Supporters',
    description: 'Everything supporters need to know about using Nisapoti',
    icon: Users,
    articleCount: 6,
    articles: [
      {
        id: 'how-to-support',
        title: 'How to support creators',
        content: 'Visit a creator\'s Nisapoti page to see their profile and shop. You can purchase digital products from their shop or send direct support. Each purchase helps creators continue their work.',
        category: 'for-supporters'
      },
      {
        id: 'shopping-guide',
        title: 'Shopping from creators',
        content: 'Browse a creator\'s shop to see their digital products like e-books, tutorials, music, or courses. Read descriptions carefully and complete your purchase. Digital products are delivered immediately after payment.',
        category: 'for-supporters'
      },
      {
        id: 'checkout-process',
        title: 'Understanding the checkout process',
        content: 'When you purchase a product, you\'ll be taken to a secure checkout page. Enter your details, complete payment, and you\'ll receive access to your digital product immediately. You\'ll also receive a confirmation email.',
        category: 'for-supporters'
      }
    ]
  },
  {
    id: 'account-content',
    title: 'Account and Content Management',
    description: 'Getting your account approved for payouts and managing your content',
    icon: User,
    articleCount: 12,
    articles: [
      {
        id: 'identity-verification',
        title: 'How to Complete Identity Verification (KYC)',
        content: 'To ensure uninterrupted access to your account features, complete identity verification by the designated deadline. This process helps maintain a secure platform. Upload government-issued ID (passport, driver\'s license, or national ID). Verification typically takes a few minutes but can take up to 24 hours if additional information is required.',
        category: 'account-content'
      },
      {
        id: 'verification-documents',
        title: 'What documents are accepted for verification?',
        content: 'Government-issued IDs such as passports, driver\'s licenses, or national ID cards are accepted. Documents must be clear, valid, and match the name on your account. Ensure all corners and text are visible in your uploaded images.',
        category: 'account-content'
      },
      {
        id: 'verification-timeline',
        title: 'How long does verification take?',
        content: 'Verification typically takes a few minutes but can occasionally take up to 24 hours if additional information is required. You\'ll receive an email notification once verification is complete.',
        category: 'account-content'
      },
      {
        id: 'account-approval',
        title: 'Getting approved for payouts',
        content: 'Complete your profile information, verify your identity, add payment details, and ensure your content complies with our guidelines. Once approved, you can receive payments from supporters and shop sales.',
        category: 'account-content'
      },
      {
        id: 'content-guidelines',
        title: 'Content guidelines and policies',
        content: 'Review Nisapoti\'s content guidelines to ensure your posts, products, and profile comply with our community standards. Prohibited content includes illegal items, adult content, hate speech, and copyright violations.',
        category: 'account-content'
      },
      {
        id: 'account-security',
        title: 'Keeping your account secure',
        content: 'Use a strong, unique password for your Nisapoti account. Enable two-factor authentication if available. Never share your login credentials. Monitor your account regularly for any unauthorized activity.',
        category: 'account-content'
      }
    ]
  },
  {
    id: 'platform-features',
    title: 'Platform Features',
    description: 'Understanding Nisapoti\'s current features and capabilities',
    icon: Sparkles,
    articleCount: 6,
    articles: [
      {
        id: 'explore-page',
        title: 'Using the explore page',
        content: 'The explore page helps you discover other creators on Nisapoti. Browse different categories and find inspiration from successful creators in your niche.',
        category: 'platform-features'
      },
      {
        id: 'wishlist-feature',
        title: 'Managing your wishlist',
        content: 'Your wishlist page shows product requests from supporters. Use this valuable feedback to understand what digital products your audience wants you to create.',
        category: 'platform-features'
      },
      {
        id: 'mobile-experience',
        title: 'Using Nisapoti on mobile',
        content: 'Access Nisapoti through your mobile browser for a responsive experience. The mobile interface is optimized for managing your account and interacting with supporters on the go.',
        category: 'platform-features'
      }
    ]
  }
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<FAQArticle | null>(null);

  const filteredCategories = faqCategories.filter(category =>
    category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedCategoryData = selectedCategory 
    ? faqCategories.find(cat => cat.id === selectedCategory)
    : null;

  if (selectedArticle) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-orange-400 to-orange-500 text-white">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-orange-500 font-bold text-lg">N</span>
                </div>
                <span className="text-xl font-semibold">Nisapoti Help</span>
              </div>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/20"
                onClick={() => setSelectedArticle(null)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Help
              </Button>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="mb-6">
              <nav className="text-sm text-gray-500 mb-4">
                <Link href="/help" className="hover:text-orange-500">All Collections</Link>
                <span className="mx-2">></span>
                <button 
                  onClick={() => {
                    setSelectedArticle(null);
                    setSelectedCategory(selectedArticle.category);
                  }}
                  className="hover:text-orange-500"
                >
                  {selectedCategoryData?.title}
                </button>
                <span className="mx-2">></span>
                <span>{selectedArticle.title}</span>
              </nav>
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                {selectedArticle.title}
              </h1>
            </div>
            
            <div className="prose max-w-none">
              <p className="text-gray-700 leading-relaxed text-lg">
                {selectedArticle.content}
              </p>
            </div>

            {/* Feedback Section */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Did this answer your question?</h3>
              <div className="flex space-x-4">
                <button className="text-2xl hover:scale-110 transition-transform">😞</button>
                <button className="text-2xl hover:scale-110 transition-transform">😐</button>
                <button className="text-2xl hover:scale-110 transition-transform">😊</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedCategory && selectedCategoryData) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-gradient-to-r from-orange-400 to-orange-500 text-white">
          <div className="max-w-4xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                  <span className="text-orange-500 font-bold text-lg">N</span>
                </div>
                <span className="text-xl font-semibold">Nisapoti Help</span>
              </div>
              <Button 
                variant="ghost" 
                className="text-white hover:bg-white/20"
                onClick={() => setSelectedCategory(null)}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Help
              </Button>
            </div>
            
            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                type="text"
                placeholder="Search for articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/90 border-0 rounded-lg text-gray-800 placeholder-gray-500"
              />
            </div>
          </div>
        </header>

        {/* Category Articles */}
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="mb-8">
            <nav className="text-sm text-gray-500 mb-4">
              <button onClick={() => setSelectedCategory(null)} className="hover:text-orange-500">
                All Collections
              </button>
              <span className="mx-2">></span>
              <span>{selectedCategoryData.title}</span>
            </nav>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {selectedCategoryData.title}
            </h1>
            <p className="text-gray-600">{selectedCategoryData.description}</p>
          </div>

          <div className="space-y-4">
            {selectedCategoryData.articles.map((article) => (
              <button
                key={article.id}
                onClick={() => setSelectedArticle(article)}
                className="w-full bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow text-left border border-gray-200 hover:border-orange-200"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{article.title}</h3>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-orange-400 to-orange-500 text-white">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
                <span className="text-orange-500 font-bold text-lg">N</span>
              </div>
              <span className="text-xl font-semibold">Nisapoti Help</span>
            </div>
            <div className="text-sm">
              🌐 English
            </div>
          </div>
          
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">Need assistance? Email support@nisapoti.com</h1>
          </div>
          
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search for articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/90 border-0 rounded-lg text-gray-800 placeholder-gray-500"
            />
          </div>
        </div>
      </header>

      {/* FAQ Categories Grid */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCategories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow text-left border border-gray-200 hover:border-orange-200 group"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-100 to-orange-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <category.icon className="w-6 h-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-orange-600">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {category.description}
                  </p>
                  <span className="text-xs text-gray-500">
                    {category.articleCount} articles
                  </span>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-6 h-6 bg-orange-500 rounded flex items-center justify-center">
              <span className="text-white font-bold text-sm">N</span>
            </div>
            <span className="text-gray-800 font-semibold">Nisapoti</span>
          </div>
          
          <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
            <Link href="/help" className="hover:text-orange-500">FAQ</Link>
            <button className="hover:text-orange-500 flex items-center space-x-1">
              <Mail className="w-4 h-4" />
              <span>Email support</span>
            </button>
            <Link href="/" className="hover:text-orange-500">Go back to Nisapoti</Link>
          </div>
          
          <div className="flex items-center justify-center space-x-4 mt-4">
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
              </svg>
            </button>
            <button className="text-gray-400 hover:text-gray-600">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
