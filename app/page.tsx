import Header from '@/components/Header';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import HowItWorksSection from '@/components/HowItWorksSection';
import SupportSection from '@/components/SupportSection';
import CreatorShowcase from '@/components/CreatorShowcase';
import StatsSection from '@/components/StatsSection';
import TrustSection from '@/components/TrustSection';
import FAQSection from '@/components/FAQSection';
import ClaimSection from '@/components/ClaimSection';
import Footer from '@/components/Footer';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      <Header />
      <HeroSection />
      {/* <FeaturesSection /> */}
      <HowItWorksSection />
     {/*  <SupportSection /> */}
      <CreatorShowcase />
      {/* <StatsSection /> */}
    {/*  <TrustSection /> */}
      <FAQSection />
      <ClaimSection />
      <Footer />
    </div>
  );
}