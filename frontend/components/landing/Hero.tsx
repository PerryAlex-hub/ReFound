'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';
import { Zap } from 'lucide-react';
import gsap from 'gsap';
import { SplitText } from 'gsap/SplitText';
import Image from 'next/image';

gsap.registerPlugin(SplitText);

/** Two-column marketing hero: pill badge + headline + CTAs on the left, isometric illustration on the right. */
export function Hero() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    // The single signature text moment on this page — everything else fades as
    // a block, this cascades word by word, so it doesn't get diluted by reuse.
    const split = new SplitText(headingRef.current, { type: 'words' });

    const ctx = gsap.context(() => {
      gsap.from('.hero-badge', { opacity: 0, y: -10, duration: 0.5, ease: 'back.out(1.7)', delay: 0.1 });
      gsap.from(split.words, { opacity: 0, y: 24, duration: 0.6, stagger: 0.05, ease: 'power3.out', delay: 0.2 });
      gsap.from('.hero-copy', { opacity: 0, y: 16, duration: 0.6, ease: 'power3.out', delay: 0.4 });
      gsap.from('.hero-ctas', { opacity: 0, y: 16, duration: 0.5, ease: 'power2.out', delay: 0.55 });
      gsap.from('.hero-illustration', { opacity: 0, x: 32, scale: 0.96, duration: 0.8, ease: 'power3.out', delay: 0.3 });
    });

    return () => {
      ctx.revert();
      split.revert();
    };
  }, []);

  return (
    <section className="px-6 py-16 md:py-24 bg-white">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
        <div>
          <div className="hero-badge inline-flex items-center gap-1.5 bg-[#FFF7ED] border border-[#FDBA74] text-[#EA6C0A] text-xs font-bold px-3.5 py-1.5 rounded-full mb-6">
            <Zap size={13} className="fill-current" />
            24/7 Smart Campus Recovery
          </div>

          <h1 ref={headingRef} className="text-5xl md:text-6xl font-extrabold leading-[1.05] tracking-tight text-[#111827] mb-6">
            Reuniting Campus
            <br />
            with What Matters
          </h1>

          <p className="hero-copy text-lg text-gray-500 leading-relaxed max-w-lg mb-8">
            Lose your keys at the library? Found a laptop at the dining hall? ReFound is our
            university&rsquo;s official smart database connecting lost items with their rightful
            owners instantly.
          </p>

          <div className="hero-ctas flex flex-col sm:flex-row gap-3">
            <Link
              href="/items/new?type=lost"
              className="inline-flex items-center justify-center bg-[#F97316] text-white font-bold px-7 py-4 rounded-full text-base hover:opacity-90 active:opacity-80 transition-opacity shadow-sm"
            >
              Report Lost Item
            </Link>
            <Link
              href="/dashboard?type=found"
              className="inline-flex items-center justify-center border border-[#F97316] text-[#F97316] font-bold px-7 py-4 rounded-full text-base hover:bg-[#FFF7ED] transition-colors"
            >
              Browse Found Items
            </Link>
          </div>
        </div>

        <div className="hero-illustration">
          <Image 
            src="/img/hero-illustration.png"
            alt="Hero Illustration"
            width={600}
            height={400}
          />
        </div>
      </div>
    </section>
  );
}
