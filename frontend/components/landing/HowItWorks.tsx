'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  {
    number: '1',
    title: 'Report',
    desc: 'File a report with detailed attributes, photos, and approximate location. Our system catalogues it immediately.',
  },
  {
    number: '2',
    title: 'Match',
    desc: 'Smart algorithms automatically compare descriptions, dates, and locations to flag highly probable matches.',
  },
  {
    number: '3',
    title: 'Return',
    desc: 'Verify identity through security questions, schedule a safe hand-off, and claim your belongings safely.',
  },
];

/** Light-gray "how it works" section: numbered orange circles + three white step cards. */
export function HowItWorks() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top 80%',
        once: true,
        onEnter: () => {
          gsap.from('.steps-eyebrow, .steps-title', { opacity: 0, y: 16, duration: 0.5, stagger: 0.08, ease: 'power2.out' });
          gsap.from('.step-card', { opacity: 0, y: 28, duration: 0.6, stagger: 0.12, delay: 0.15, ease: 'power2.out' });
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="px-6 py-20 md:py-24 bg-[#F5F6FA]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <p className="steps-eyebrow text-xs font-extrabold tracking-widest text-[#F97316] uppercase mb-3">
            Three Simple Steps
          </p>
          <h2 className="steps-title text-3xl md:text-4xl font-extrabold text-[#111827]">How ReFound Works</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {STEPS.map((step) => (
            <div key={step.number} className="step-card bg-white rounded-2xl p-7 border border-gray-100 shadow-sm">
              <div className="w-11 h-11 rounded-full bg-[#FFF7ED] flex items-center justify-center mb-5">
                <span className="text-[#F97316] font-extrabold text-base">{step.number}</span>
              </div>
              <h3 className="font-bold text-lg text-[#111827] mb-2">{step.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
