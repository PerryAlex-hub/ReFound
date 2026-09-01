'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/** Full-width solid-orange band with three count-up stats. */
export function StatsBand() {
  const sectionRef = useRef<HTMLElement>(null);
  const itemsRef = useRef<HTMLSpanElement>(null);
  const matchRef = useRef<HTMLSpanElement>(null);
  const hoursRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 85%',
        once: true,
        onEnter: () => {
          const counters: { el: HTMLSpanElement | null; target: number }[] = [
            { el: itemsRef.current, target: 12480 },
            { el: matchRef.current, target: 94 },
            { el: hoursRef.current, target: 18 },
          ];
          counters.forEach(({ el, target }) => {
            if (!el) return;
            gsap.to(
              { val: 0 },
              {
                val: target,
                duration: 1.6,
                ease: 'power2.out',
                onUpdate: function () {
                  el.textContent = Math.round(this.targets()[0].val).toLocaleString();
                },
              }
            );
          });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="px-6 py-16 md:py-20 bg-[#F97316]">
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-10 text-center">
        <div>
          <p className="text-4xl md:text-5xl font-extrabold text-white">
            <span ref={itemsRef}>0</span>+
          </p>
          <p className="text-sm md:text-base font-semibold text-white/85 mt-2">Items Reunited</p>
        </div>
        <div>
          <p className="text-4xl md:text-5xl font-extrabold text-white">
            <span ref={matchRef}>0</span>%
          </p>
          <p className="text-sm md:text-base font-semibold text-white/85 mt-2">Match Rate on Electronics</p>
        </div>
        <div>
          <p className="text-4xl md:text-5xl font-extrabold text-white">
            <span ref={hoursRef}>0</span> Hours
          </p>
          <p className="text-sm md:text-base font-semibold text-white/85 mt-2">Average Return Time</p>
        </div>
      </div>
    </section>
  );
}
