'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';

/** localStorage key marking that this browser has completed (or skipped) onboarding. */
export const ONBOARDED_KEY = 'rf_onboarded';

function markOnboarded() {
  try {
    localStorage.setItem(ONBOARDED_KEY, '1');
  } catch {
    // localStorage unavailable (e.g. private browsing) — worst case onboarding shows again.
  }
}

function LostIllustration() {
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <defs>
        <linearGradient id="lostBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFEDD5" />
          <stop offset="100%" stopColor="#FDBA74" />
        </linearGradient>
      </defs>
      <rect width="240" height="240" rx="28" fill="url(#lostBg)" />

      {/* skyline */}
      <rect x="24" y="140" width="28" height="66" rx="3" fill="#1E293B" opacity="0.85" />
      <rect x="58" y="118" width="30" height="88" rx="3" fill="#1E293B" opacity="0.75" />
      <rect x="152" y="128" width="30" height="78" rx="3" fill="#1E293B" opacity="0.8" />
      <rect x="186" y="150" width="26" height="56" rx="3" fill="#1E293B" opacity="0.7" />
      {[0, 1, 2].map((r) => (
        <g key={r}>
          <rect x={64} y={128 + r * 18} width="6" height="6" fill="#FDBA74" />
          <rect x={76} y={128 + r * 18} width="6" height="6" fill="#FDBA74" />
        </g>
      ))}

      {/* ground */}
      <rect x="0" y="206" width="240" height="4" fill="#1E293B" opacity="0.25" />

      {/* person */}
      <g transform="translate(66 100)">
        <circle cx="20" cy="14" r="14" fill="#1E293B" />
        <path d="M2 108 Q0 60 20 54 Q40 60 38 108 Z" fill="#F97316" />
        <rect x="6" y="96" width="10" height="20" rx="4" fill="#1E293B" />
        <rect x="24" y="96" width="10" height="20" rx="4" fill="#1E293B" />
      </g>

      {/* magnifying glass */}
      <g transform="translate(112 78)">
        <circle cx="42" cy="42" r="38" fill="white" fillOpacity="0.35" />
        <circle cx="42" cy="42" r="30" fill="none" stroke="#F97316" strokeWidth="9" />
        <rect x="66" y="66" width="34" height="12" rx="6" transform="rotate(45 66 66)" fill="#F97316" />
        <circle cx="34" cy="34" r="10" fill="white" fillOpacity="0.6" />
      </g>

      {/* accents */}
      <circle cx="204" cy="46" r="10" fill="white" fillOpacity="0.4" />
      <circle cx="30" cy="52" r="6" fill="white" fillOpacity="0.5" />
    </svg>
  );
}

function FoundIllustration() {
  return (
    <svg viewBox="0 0 240 240" className="w-full h-full">
      <defs>
        <linearGradient id="foundBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="100%" stopColor="#F59E0B" />
        </linearGradient>
      </defs>
      <rect width="240" height="240" rx="28" fill="url(#foundBg)" />

      {/* desk */}
      <rect x="30" y="176" width="180" height="8" rx="3" fill="#1E293B" />
      <rect x="40" y="184" width="8" height="30" fill="#1E293B" opacity="0.7" />
      <rect x="192" y="184" width="8" height="30" fill="#1E293B" opacity="0.7" />

      {/* monitor */}
      <rect x="118" y="118" width="60" height="42" rx="4" fill="white" />
      <rect x="122" y="122" width="52" height="30" rx="2" fill="#93C5FD" />
      <rect x="140" y="160" width="16" height="10" fill="#1E293B" opacity="0.6" />
      <rect x="132" y="170" width="32" height="6" rx="3" fill="#1E293B" opacity="0.6" />

      {/* chair */}
      <rect x="66" y="150" width="34" height="34" rx="6" fill="#1E3A8A" />
      <rect x="66" y="184" width="6" height="24" fill="#1E293B" opacity="0.7" />
      <rect x="94" y="184" width="6" height="24" fill="#1E293B" opacity="0.7" />

      {/* backpack on chair */}
      <g transform="translate(58 118)">
        <rect x="0" y="8" width="40" height="46" rx="10" fill="#F97316" />
        <rect x="8" y="0" width="24" height="18" rx="8" fill="#EA580C" />
        <rect x="14" y="20" width="12" height="16" rx="4" fill="#FFEDD5" />
      </g>

      {/* person */}
      <g transform="translate(20 96)">
        <circle cx="18" cy="14" r="13" fill="#1E293B" />
        <path d="M2 96 Q0 54 18 48 Q36 54 34 96 Z" fill="#3B82F6" />
        <rect x="5" y="86" width="9" height="18" rx="4" fill="#1E293B" />
        <rect x="21" y="86" width="9" height="18" rx="4" fill="#1E293B" />
        <rect x="30" y="52" width="30" height="10" rx="5" fill="#3B82F6" />
      </g>

      {/* plant accent */}
      <g transform="translate(206 150)">
        <rect x="4" y="20" width="16" height="18" rx="3" fill="#1E293B" opacity="0.8" />
        <circle cx="12" cy="10" r="10" fill="#22C55E" opacity="0.85" />
      </g>
    </svg>
  );
}

const SLIDES = [
  {
    key: 'lost',
    title: 'Lost Something?',
    description: 'Report your lost item and let our smart matching system find it for you on campus.',
    Illustration: LostIllustration,
  },
  {
    key: 'found',
    title: 'Found Something?',
    description: 'Help reunite items with their owners. Report what you found and we handle the rest — safely and privately.',
    Illustration: FoundIllustration,
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const isLast = step === SLIDES.length - 1;
  const slide = SLIDES[step];
  const { Illustration } = slide;

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

      <div className="flex-1 flex flex-col items-center justify-center px-6 md:px-10 pb-10">
        <div className="w-full max-w-sm mx-auto flex flex-col items-center text-center">
          <div className="w-full max-w-[280px] aspect-square mb-8 animate-fade-in" key={slide.key}>
            <Illustration />
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
