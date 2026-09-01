'use client';

import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { Flip } from 'gsap/Flip';

gsap.registerPlugin(Flip);

interface PillToggleProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

/**
 * Segmented pill control (Lost/Found, etc.) whose active background slides
 * between options via Flip instead of hard-swapping a class — used by the
 * dashboard and My Items mobile toggles, one component instead of two copies.
 */
export function PillToggle<T extends string>({ options, value, onChange, className = '' }: PillToggleProps<T>) {
  const indicatorRef = useRef<HTMLDivElement>(null);
  const flipStateRef = useRef<Flip.FlipState | null>(null);

  useLayoutEffect(() => {
    if (flipStateRef.current) {
      Flip.from(flipStateRef.current, { duration: 0.35, ease: 'power2.out' });
      flipStateRef.current = null;
    }
  }, [value]);

  const handleClick = (v: T) => {
    if (v !== value && indicatorRef.current) {
      flipStateRef.current = Flip.getState(indicatorRef.current);
    }
    onChange(v);
  };

  const activeIndex = Math.max(0, options.findIndex((o) => o.value === value));

  return (
    <div className={`relative flex bg-white rounded-2xl p-1 border border-gray-100 shadow-sm ${className}`}>
      <div
        ref={indicatorRef}
        className="absolute top-1 bottom-1 rounded-xl bg-[#F97316] shadow-sm"
        style={{
          left: `calc(${(100 / options.length) * activeIndex}% + 4px)`,
          width: `calc(${100 / options.length}% - 8px)`,
        }}
      />
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => handleClick(o.value)}
          className={`relative z-10 flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors ${
            o.value === value ? 'text-white' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
