'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';

gsap.registerPlugin(MorphSVGPlugin);

const CIRCLE_D = 'M9 1a8 8 0 1 0 0.01 0Z';
const CHECK_D = 'M4 9 L7.5 12.5 L14 4.5';

/** A circle outline morphs into a checkmark — the success state used by every success Toast. */
export function SuccessMorphIcon({ size = 18 }: { size?: number }) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.set(pathRef.current, { morphSVG: CIRCLE_D });
      gsap.to(pathRef.current, { morphSVG: CHECK_D, duration: 0.45, delay: 0.05, ease: 'back.out(1.7)' });
    });
    return () => ctx.revert();
  }, []);

  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className="shrink-0 mt-0.5">
      <path ref={pathRef} stroke="#22C55E" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </svg>
  );
}
