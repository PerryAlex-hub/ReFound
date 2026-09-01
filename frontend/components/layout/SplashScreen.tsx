'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';

gsap.registerPlugin(DrawSVGPlugin);

/** Branded loading state shown while auth resolves — see (app)/layout.tsx and admin/layout.tsx. */
export function SplashScreen() {
  const circleRef = useRef<SVGCircleElement>(null);
  const handleRef = useRef<SVGLineElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.timeline({ delay: 0.2 })
        .from(circleRef.current, { drawSVG: '0%', duration: 0.6, ease: 'power2.inOut' })
        .from(handleRef.current, { drawSVG: '0%', duration: 0.25, ease: 'power1.out' }, '-=0.1');
    });
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen w-full relative flex flex-col items-center justify-center bg-gradient-to-br from-[#FB923C] to-[#EA580C] px-6">
      <div className="flex flex-col items-center gap-5 animate-fade-in">
        <div className="w-24 h-24 rounded-full bg-white/15 flex items-center justify-center">
          <div className="w-[72px] h-[72px] rounded-full bg-white flex items-center justify-center shadow-lg">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <circle ref={circleRef} cx="11" cy="11" r="8" stroke="#F97316" strokeWidth="2.5" />
              <line ref={handleRef} x1="21" y1="21" x2="16.65" y2="16.65" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </div>
        </div>
        <div className="text-center">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">ReFound</h1>
          <p className="text-sm font-medium text-white/90 mt-1">Reuniting you with what matters.</p>
        </div>
      </div>

      <div className="absolute bottom-8 inset-x-0 flex flex-col items-center gap-0.5">
        <p className="text-xs text-white/70">Campus Lost &amp; Found Platform</p>
        <p className="text-[11px] text-white/50">v1.0.2</p>
      </div>
    </div>
  );
}
