import React, { useState, useEffect } from 'react';
import { Heart, Search, Coffee, Wallet, Shield, ArrowRight } from 'lucide-react';

function App() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const getCardStyle = (position: 'left' | 'right') => {
    const baseTranslate = -scrollY * 0.15;
    const opacity = Math.max(0, 1 - scrollY / 1000);
    const translateX = position === 'left' ? -scrollY * 0.08 : scrollY * 0.08;
    const rotate = position === 'left' ? -3 : 3;

    return {
      transform: `translateY(${baseTranslate}px) translateX(${translateX}px) rotate(${rotate}deg)`,
      opacity,
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 via-white to-orange-50 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-gradient-to-br from-orange-200/20 to-pink-200/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -right-48 w-96 h-96 bg-gradient-to-bl from-yellow-200/20 to-orange-200/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-gradient-to-tr from-orange-200/10 to-yellow-200/10 rounded-full blur-3xl" />
      </div>

      {/* Updated Nav with better blur */}
      <nav className="border-b border-orange-100/20 bg-white/70 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo on the left */}
            <div className="flex items-center space-x-2 hover:scale-105 transition-transform cursor-pointer">
              <Heart className="w-8 h-8 text-orange-500 animate-pulse" />
              <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500">
                Nisapoti
              </span>
            </div>

            {/* Right side items - Search visible only on desktop */}
            <div className="flex items-center space-x-4">
              {/* Search - Hidden on mobile */}
              <div className="hidden md:block relative group">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-hover:text-orange-500 transition-colors" />
                <input
                  type="text"
                  placeholder="Search creators"
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all w-48 group-hover:w-56"
                />
              </div>

              {/* Login/Signup Buttons */}
              <a href="http://studio.nisapoti.com/auth/login.php">
                <button className="text-gray-800 font-medium hover:text-orange-500 transition-colors">
                  Log in
                </button>
              </a>
              <a href="http://studio.nisapoti.com/auth/username.php">
                <button className="bg-gradient-to-r from-yellow-400 to-orange-400 px-6 py-2 rounded-full font-medium hover:from-yellow-500 hover:to-orange-500 transition-all transform hover:scale-105 hover:shadow-lg text-gray-900">
                  Sign up
                </button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      <main className="relative overflow-hidden">
        {/* Main Content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-16 pb-12 relative z-10">
          <div className="relative mb-16">
            <div className="flex justify-center items-center space-x-2 text-green-500">
              {'★★★★★'.split('').map((star, i) => (
                <span key={i} className="text-2xl animate-pulse" 
                  style={{ 
                    animationDelay: `${i * 150}ms`,
                    textShadow: '0 0 15px rgba(34, 197, 94, 0.3)'
                  }}>
                  {star}
                </span>
              ))}
            </div>
            <p className="text-gray-600 mt-2">Loved by 500,000+ creators</p>
          </div>

          <h1 className="text-6xl md:text-7xl font-bold mb-8 leading-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-orange-950 to-gray-900">
            Support Your Favorite
            <br /> Creators Globally
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
          Love what you do and make money too
            <span className="block mt-2 text-gray-500">Empower creators across Tanzania to share their art, music, and content while earning support from their community.</span>
          </p>
          <a href="http://studio.nisapoti.com/auth/username.php">
            <button className="bg-gradient-to-r from-yellow-400 via-orange-400 to-orange-500 px-12 py-4 rounded-full text-lg font-semibold hover:from-yellow-500 hover:via-orange-500 hover:to-orange-600 transition-all transform hover:scale-105 hover:shadow-[0_8px_30px_rgb(251,146,60,0.2)] text-white">
              Start my page
            </button>
          </a>
          <p className="text-gray-500 mt-4">
            It's free and takes less than a minute!
          </p>
        </div>

        {/* Creator Cards Layout - Hide on mobile */}
        <div className="absolute top-0 left-0 right-0 h-screen pointer-events-none hidden md:block">
          {/* Left Side Cards */}
          <div 
            className="fixed left-8 lg:left-16 xl:left-24 top-48 space-y-4"
            style={getCardStyle('left')}
          >
            <FloatingCreatorCard
              name="Mcinika Lamar"
              description="is building a new platform for artists"
              supporters={8780}
              image="assets/images/1.jpeg"
              imageType="avatar"
              variant="dark"
            />
            <FloatingCreatorCard
              name="Gilsant"
              description="is creating indoor cycling and strength workouts"
              supporters={4488}
              image="assets/images/3.jpeg"
              imageType="avatar"
              variant="gradient"
            />
          </div>

          {/* Right Side Cards */}
          <div 
            className="fixed right-8 lg:right-16 xl:right-24 top-48 space-y-4"
            style={getCardStyle('right')}
          >
            <FloatingCreatorCard
              name="Baraka Mafole"
              description="is creating thrifting videos"
              supporters={112}
              image="assets/images/4.jpeg"
              imageType="avatar"
              variant="default"
            />
            <FloatingCreatorCard
              name="Gabby"
              description="is a Dinky Little Podcast"
              supporters={1805}
              image="assets/images/5.jpeg"
              imageType="avatar"
              variant="clean"
            />
          </div>
        </div>

        {/* Support Section - Mobile Responsive */}
        <section className="bg-gradient-to-b from-white to-orange-50/30 pt-8 sm:pt-12 pb-16 sm:pb-20 relative z-10">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Main Container Box */}
            <div className="bg-white rounded-[1.5rem] sm:rounded-[2rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] p-6 sm:p-12 relative overflow-hidden">
              {/* Background Decoration */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-16 -right-16 w-48 sm:w-72 h-48 sm:h-72 bg-gradient-to-br from-orange-100/30 to-transparent rounded-full blur-3xl" />
                <div className="absolute -bottom-16 -left-16 w-48 sm:w-72 h-48 sm:h-72 bg-gradient-to-tr from-orange-50/50 to-transparent rounded-full blur-3xl" />
              </div>

              {/* Content */}
              <div className="relative">
                <div className="text-center mb-8 sm:mb-12">
                  {/* Animated Support Badge */}
                  <span className="text-orange-600 uppercase tracking-wider font-medium bg-orange-50 px-3 py-1 rounded-full text-xs sm:text-sm
                    inline-block animate-fadeIn hover:scale-105 transition-transform cursor-default
                    before:content-[''] before:absolute before:inset-0 before:bg-orange-100/50 before:rounded-full before:animate-ping before:opacity-75">
                    SUPPORT
                  </span>

                  {/* Animated Heading */}
                  <h2 className="text-3xl sm:text-4xl font-bold mt-4 mb-3 sm:mb-4 animate-slideUp">
                    Give your audience
                    <br />
                    <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500
                      animate-gradientFlow bg-[length:200%_auto] hover:animate-gradientPause">
                      an easy way to say thanks.
                    </span>
                  </h2>

                  {/* Animated Description */}
                  <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4 sm:px-0
                    opacity-0 animate-fadeInUp animation-delay-300">
                    Nisapoti makes supporting fun and easy. In just a couple of taps, your fans can make a contribution and leave a message.
                  </p>
                </div>

                {/* Support Card Demo - Mobile Responsive */}
                <div className="relative max-w-[280px] xs:max-w-sm sm:max-w-md mx-auto">
                  {/* Support Card */}
                  <div className="bg-white rounded-2xl sm:rounded-3xl shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] p-4 sm:p-6 border border-gray-100">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4 sm:mb-6">
                      <div className="flex items-center space-x-3 sm:space-x-4">
                        <div className="w-8 sm:w-10 h-8 sm:h-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Wallet className="w-4 sm:w-5 h-4 sm:h-5 text-orange-500" />
                        </div>
                        <div>
                          <h3 className="text-base sm:text-lg font-semibold">Nisapoti</h3>
                          <p className="text-xs text-gray-500">@nisapoti</p>
                        </div>
                      </div>
                      <span className="text-orange-500 font-bold">💯</span>
                    </div>

                    {/* Support Selection */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-3 mb-4 sm:mb-6">
                      <Shield className="w-6 sm:w-8 h-6 sm:h-8 text-orange-500" />
                      <div className="flex flex-wrap gap-2">
                        {[5000, 15000, 25000].map((amount) => (
                          <div
                            key={amount}
                            className={`px-2 sm:px-3 py-1 sm:py-1.5 rounded-full ${
                              amount === 5000
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-100 text-gray-700'
                            } text-xs sm:text-sm font-medium select-none`}
                          >
                            {amount.toLocaleString()}
                          </div>
                        ))}
                        <div className="px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium select-none">
                          Custom
                        </div>
                      </div>
                    </div>

                    {/* Name Input */}
                    <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3 mb-2 sm:mb-3">
                      <div className="w-full bg-transparent text-gray-600 select-none text-sm">
                        Your name
                      </div>
                    </div>

                    {/* Message Input */}
                    <div className="bg-gray-50 rounded-lg sm:rounded-xl p-2 sm:p-3 mb-3 sm:mb-4">
                      <div className="w-full bg-transparent text-gray-600 select-none text-sm">
                        Say something nice...
                      </div>
                    </div>

                    {/* Support Button */}
                    <button className="w-full bg-orange-500 text-white py-2 sm:py-3 rounded-full text-xs sm:text-sm font-semibold hover:bg-orange-600 transition-colors">
                      Nisapoti
                    </button>
                  </div>

                  {/* Support Messages - Hidden on mobile, visible on larger screens */}
                  <div className="absolute -left-48 top-1/4 space-y-3 hidden md:block">
                    <SupportMessage
                      name="Alex"
                      message="Keep up the amazing work! 🙌"
                      amount={25000}
                      type="supporter"
                    />
                    <SupportMessage
                      name="Anie"
                      message=""
                      amount={10000}
                      type="supporter"
                    />
                  </div>

                  <div className="absolute -right-48 top-1/3 space-y-3 hidden md:block">
                    <SupportMessage
                      name="John Evance"
                      message="Love your content!"
                      amount={5000}
                      type="supporter"
                    />
                    <SupportMessage
                      name="Cathy G"
                      message="Thanks for being awesome! ❤️"
                      amount={15000}
                      type="supporter"
                    />
                  </div>

                  {/* Mobile Support Messages - Only visible on mobile */}
                  <div className="mt-6 space-y-3 md:hidden">
                    <SupportMessage
                      name="Alex"
                      message="Keep up the amazing work! 🙌"
                      amount={25000}
                      type="supporter"
                    />
                    <SupportMessage
                      name="Tony Steel"
                      message="Love your content!"
                      amount={5000}
                      type="supporter"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Add this new section before the FAQ section */}
        <section className="py-24 bg-gradient-to-b from-orange-50 to-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl font-bold mb-6">
                Support Your Favorite Creator
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-600">
                  in 1 Minute
                </span>
              </h2>
              
              <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
                Join thousands of creators and supporters on Nisapoti. Start your journey today!
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <button className="bg-orange-500 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-orange-600 transition-all transform hover:scale-105 hover:shadow-lg flex items-center gap-2">
                  <ArrowRight className="w-5 h-5" />
                  Explore
                </button>
                
               
              </div>

              {/* Optional: Add some stats or social proof */}
              <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-500 mb-2">500K+</div>
                  <div className="text-gray-600">Active Creators</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-500 mb-2">1M+</div>
                  <div className="text-gray-600">Happy Supporters</div>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-500 mb-2">Tsh10M+</div>
                  <div className="text-gray-600">Creator Earnings</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-24 bg-gradient-to-b from-white to-orange-50/30">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center mb-16">
              <span className="text-orange-500 uppercase tracking-wider font-medium bg-orange-50 px-4 py-1.5 rounded-full">
                FAQ
              </span>
              <h2 className="text-4xl font-bold mt-6 mb-4">
                Common Questions
              </h2>
              <p className="text-gray-600">
                Everything you need to know about Nisapoti
              </p>
            </div>

            {/* FAQ Items */}
            <div className="space-y-4">
              <FaqItem
                question="What is Nisapoti?"
                answer="Nisapoti helps creators make an income from your biggest fans. Whether you're an artist, streamer, tiktoker, comedian or any kind of creator you can accept tips."
              />
              <FaqItem
                question="How does Nisapoti work?"
                answer="It's simple! Create a free Nisapoti page, share it with your fans, and start earning in just a few minutes! Nisapoti has everything you need to create, share and make money in one place."
              />
              <FaqItem
                question="Does Nisapoti take a fee?"
                answer="Nisapoti takes a creator friendly 0-10% platform fee. There's no monthly fee so we only make money when you do."
              />
              <FaqItem
                question="Can I use Nisapoti if I'm just starting out?"
                answer="Absolutely! Nisapoti is perfect for creators of all sizes. We're all about letting you do your thing, at your pace – no need to rush or churn out content to a schedule. Grow your support at your own pace without the pressure."
              />
              <FaqItem
                question="How do I get paid on Nisapoti?"
                answer="You get paid directly into your own Mobile Money Number or bank account.  waiting 1-12 hours for payouts! Supporters can pay you via Mobile Money, and loads of local payment methods."
              />
            </div>
          </div>
        </section>

        {/* Updated CTA Section */}
        <section className="py-24 bg-[#F8FAFC]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h2 className="text-5xl font-bold mb-8">
                Make money<br />
                doing what you love
              </h2>
              
              {/* URL Input Box */}
              <div className="max-w-2xl mx-auto mb-4">
                <div className="flex items-center bg-white rounded-full shadow-[0_2px_12px_rgba(0,0,0,0.08)] p-2">
                  <span className="text-gray-500 pl-4">nisapoti.com/</span>
                  <input
                    type="text"
                    placeholder="MyPage"
                    className="flex-1 px-2 py-2 bg-transparent border-none focus:ring-0 text-gray-900 placeholder-gray-400"
                  />
                  <button className="bg-black text-white px-6 py-2 rounded-sfull text-sm font-medium hover:bg-gray-800 transition-colors">
                    Claim
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Links */}
            <div className="mt-24 grid grid-cols-4 gap-8">
              {/* About Column */}
              <div className="col-span-4 md:col-span-1">
                <h2 className="text-2xl font-bold mb-4">About Nisapoti</h2>
                <p className="text-gray-600 mb-6 leading-relaxed">
                  Nisapoti helps creators make an income from your biggest fans. Whether you're an artist, streamer, tiktoker, comedian or any kind of creator you can accept tips.
                </p>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Use Nisapoti with</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><a href="#" className="hover:text-gray-900">Instagram</a></li>
                  <li><a href="#" className="hover:text-gray-900">TikTok</a></li>
                  <li><a href="#" className="hover:text-gray-900">X/</a></li>
                  <li><a href="#" className="hover:text-gray-900">Facebook</a></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4">Help & Support</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><a href="#" className="hover:text-gray-900">Nisapoti blog</a></li>
                  <li><a href="#" className="hover:text-gray-900">Help</a></li>
                  <li><a href="#" className="hover:text-gray-900">WordPress plugin</a></li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold mb-4">About Nisapoti</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li><a href="#" className="hover:text-gray-900">We're hiring!</a></li>
                  <li><a href="#" className="hover:text-gray-900">Terms</a></li>
                  <li><a href="#" className="hover:text-gray-900">Privacy</a></li>
                </ul>
              </div>
            </div>

          
          </div>
        </section>
      </main>
    </div>
  );
}

interface CreatorCardProps {
  name: string;
  description?: string;
  supporters: number;
  image: string;
  imageType?: string;
  variant?: 'default' | 'clean' | 'dark' | 'gradient';
  category?: string;
}

function FloatingCreatorCard({ name, description, supporters, image, imageType, variant = 'default' }: CreatorCardProps) {
  const cardStyles = {
    default: "bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg p-5 w-60 transform hover:-translate-y-1 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300",
    clean: "bg-gradient-to-br from-white/95 to-white/80 backdrop-blur-sm rounded-2xl shadow-md p-5 w-60 transform hover:scale-102 transition-all duration-300",
    dark: "bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-xl p-5 w-60 transform hover:shadow-2xl transition-all duration-300",
    gradient: "bg-gradient-to-br from-orange-50 via-white to-orange-50/50 rounded-2xl shadow-lg p-5 w-60 transform hover:-translate-y-1 transition-all duration-300"
  };

  const imageContainerStyles = {
    default: "ring-4 ring-white shadow-lg",
    clean: "ring-4 ring-white/80 shadow-md",
    dark: "ring-4 ring-gray-700 shadow-xl",
    gradient: "ring-4 ring-orange-100 shadow-lg"
  };

  const textStyles = {
    default: "text-black",
    clean: "text-gray-800",
    dark: "text-white",
    gradient: "text-orange-900"
  };

  const descriptionStyles = {
    default: "text-gray-700",
    clean: "text-gray-600",
    dark: "text-gray-300",
    gradient: "text-gray-700"
  };

  return (
    <div className={cardStyles[variant]}>
      <div className="text-center">
        {imageType === 'logo' ? (
          <div className={`w-14 h-14 ${variant === 'dark' ? 'bg-white' : 'bg-black'} rounded-full flex items-center justify-center mx-auto mb-4 ${imageContainerStyles[variant]}`}>
            <span className={`text-2xl font-bold ${variant === 'dark' ? 'text-black' : 'text-white'}`}>
              {name.charAt(0)}
            </span>
          </div>
        ) : (
          <img
            src={image}
            alt={name}
            className={`w-14 h-14 rounded-full mx-auto mb-4 object-cover ${imageContainerStyles[variant]}`}
          />
        )}
        <p className="font-medium text-base mb-3">
          <span className={`font-bold ${textStyles[variant]}`}>
            {name}
          </span>{' '}
          <span className={descriptionStyles[variant]}>
            {description}
          </span>
        </p>
        <div className={`flex items-center justify-center ${descriptionStyles[variant]} mt-2`}>
          <Heart className={`w-4 h-4 mr-1 ${variant === 'dark' ? 'text-white' : ''}`} />
          <span className="text-sm">{supporters.toLocaleString()} supporters</span>
        </div>
      </div>
    </div>
  );
}

// Add this new component for support messages
interface SupportMessageProps {
  name: string;
  message: string;
  amount: number;
  type: 'buyer' | 'supporter';
}

function SupportMessage({ name, message, amount, type }: SupportMessageProps) {
  return (
    <div className="bg-white rounded-2xl shadow-[0_15px_40px_-15px_rgba(0,0,0,0.1)] p-4 max-w-xs transform hover:-translate-y-1 transition-transform border border-gray-50">
      <div className="flex items-center space-x-3 mb-2">
        <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
          <span className="text-sm font-medium text-orange-600">
            {name.charAt(0)}
          </span>
        </div>
        <div>
          <p className="text-sm font-medium">
            {name} {type === 'buyer' ? 'support you' : 'support you'} {amount} {amount === 1 ? '' : ''}
          </p>
        </div>
      </div>
      {message && (
        <p className="text-sm text-gray-600">
          {message}
        </p>
      )}
    </div>
  );
}

// Update the CreatorCard component to match the interface
function CreatorCard({ name, image, category = '', supporters }: CreatorCardProps) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
      {/* Image Container */}
      <div className="relative">
        <img
          src={image}
          alt={name}
          className="w-full aspect-square object-cover"
        />
        
        {/* Top Badges */}
        <div className="absolute top-4 left-4">
          <div className="bg-white rounded-full px-4 py-1.5 text-sm">
            {category}
          </div>
        </div>
        
        <div className="absolute top-4 right-4">
          <div className="bg-white rounded-full px-4 py-1.5 text-sm flex items-center gap-1.5">
            <Heart className="w-4 h-4 text-orange-500" fill="currentColor" />
            <span>{supporters}+</span>
          </div>
        </div>
      </div>

      {/* Creator Info */}
      <div className="p-6">
        <h3 className="text-xl font-semibold mb-1">{name}</h3>
        <p className="text-gray-500 text-sm">{category}</p>
      </div>

      {/* Support Button */}
      <div className="px-6 pb-6">
        <button className="w-full bg-white border-2 border-gray-900 text-gray-900 rounded-full py-2 font-medium 
          hover:bg-gray-900 hover:text-white transition-colors">
          Support
        </button>
      </div>
    </div>
  );
}

// Update the CategoryPill component
function CategoryPill({ label, icon, isPopular, isActive }: CategoryPillProps) {
  return (
    <button 
      className={`
        flex items-center gap-2 px-4 py-2 rounded-full
        transition-all duration-200
        ${isActive 
          ? 'bg-gray-900 text-white' 
          : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-100'
        }
      `}
    >
      <span>{icon}</span>
      <span className="font-medium whitespace-nowrap">{label}</span>
      {isPopular && (
        <span className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full ml-1">
          Popular
        </span>
      )}
    </button>
  );
}

interface CategoryPillProps {
  label: string;
  icon: string;
  isPopular?: boolean;
  isActive?: boolean;
}

// Add the FaqItem component
function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-5 flex items-center justify-between text-left"
      >
        <h3 className="font-semibold text-lg text-gray-900 pr-8">
          {question}
        </h3>
        <div className={`
          flex-shrink-0 ml-2 w-5 h-5 rounded-full 
          ${isOpen ? 'bg-orange-500' : 'bg-gray-100'} 
          relative transition-colors duration-300
        `}>
          <span className={`
            absolute inset-0 flex items-center justify-center transition-transform duration-300
            ${isOpen ? 'rotate-180' : ''}
          `}>
            <svg 
              width="10" 
              height="6" 
              viewBox="0 0 10 6" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                d="M1 1L5 5L9 1" 
                stroke={isOpen ? '#fff' : '#666'} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </svg>
          </span>
        </div>
      </button>
      <div className={`
        overflow-hidden transition-all duration-300 ease-in-out
        ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
      `}>
        <div className="px-6 pb-5 text-gray-600">
          {answer}
        </div>
      </div>
    </div>
  );
}

export default App;
