import { LandingHeader } from '@/components/landing/LandingHeader';
import { Hero } from '@/components/landing/Hero';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { StatsBand } from '@/components/landing/StatsBand';
import { Footer } from '@/components/layout/Footer';
import { SmoothScrollWrapper } from '@/components/landing/SmoothScrollWrapper';

/** Public marketing landing page shown to logged-out visitors. */
export default function LandingPage() {
  return (
    <SmoothScrollWrapper header={<LandingHeader />}>
      <div className="min-h-screen bg-white">
        <Hero />
        <HowItWorks />
        <StatsBand />
        <Footer />
      </div>
    </SmoothScrollWrapper>
  );
}
