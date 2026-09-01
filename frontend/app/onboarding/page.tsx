'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import gsap from 'gsap';
import { Observer } from 'gsap/Observer';
import { Button } from '@/components/ui/Button';

gsap.registerPlugin(Observer);

/** localStorage key marking that this browser has completed (or skipped) onboarding. */
export const ONBOARDED_KEY = 'rf_onboarded';

function markOnboarded() {
  try {
    localStorage.setItem(ONBOARDED_KEY, '1');
  } catch {
    // localStorage unavailable (e.g. private browsing) — worst case onboarding shows again.
  }
}

const SLIDES = [
  {
    key: 'lost',
    title: 'Lost Something?',
    description: 'Report your lost item and let our smart matching system find it for you on campus.',
    image: '/img/onboarding1.png',
  },
  {
    key: 'found',
    title: 'Found Something?',
    description: 'Help reunite items with their owners. Report what you found and we handle the rest — safely and privately.',
    image: '/img/onboarding2.png',
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const slideAreaRef = useRef<HTMLDivElement>(null);
  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];

  const handleNext = () => {
    if (isLast) {
      markOnboarded();
      router.push('/register');
    } else {
      setStep((s) => s + 1);
    }
  };

  const handleSkip = () => {
    markOnboarded();
    router.push('/login');
  };

  // Swipe left/right to navigate — a lighter alternative to a full Draggable
  // setup, since onboarding only needs directional intent, not a dragged element.
  useEffect(() => {
    const observer = Observer.create({
      target: slideAreaRef.current,
      type: 'touch,pointer',
      tolerance: 12,
      preventDefault: true,
      onLeft: () => handleNext(),
      onRight: () => { if (step > 0) setStep((s) => s - 1); },
    });
    return () => observer.kill();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- re-registers each step so the handlers see current state
  }, [step]);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="flex justify-end px-5 pt-5 md:px-10 md:pt-8">
        <button
          onClick={handleSkip}
          className="text-sm font-semibold text-gray-400 hover:text-gray-600 transition-colors"
        >
          Skip
        </button>
      </div>

      <div ref={slideAreaRef} className="flex-1 flex flex-col items-center justify-center px-6 md:px-10 pb-10">
        <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center">
          <div className="relative w-full max-w-[280px] aspect-square mb-8 animate-fade-in" key={slide.key}>
            <Image src={slide.image} alt={slide.title} fill className="object-contain" priority={step === 0} />
          </div>
          <h1 className="text-2xl font-extrabold text-[#111827] mb-3">{slide.title}</h1>
          <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{slide.description}</p>
        </div>
      </div>

      <div className="flex flex-col items-center gap-6 px-6 pb-10 md:pb-14">
        <div className="flex items-center gap-1.5">
          {SLIDES.map((s, i) => (
            <span
              key={s.key}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-[#F97316]' : 'w-1.5 bg-gray-200'}`}
            />
          ))}
        </div>
        <div className="w-full max-w-sm">
          <Button fullWidth size="lg" onClick={handleNext}>
            {isLast ? 'Get Started' : 'Next'}
          </Button>
        </div>
      </div>
    </div>
  );
}
