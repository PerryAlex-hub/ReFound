'use client';

import { ReactNode, useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollSmoother } from 'gsap/ScrollSmoother';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollSmoother, ScrollTrigger);

/**
 * Smooths scroll momentum on the marketing landing page only — the authenticated
 * app relies on native scroll for its fixed nav, bottom bar, and modals, which
 * ScrollSmoother would fight, so this never wraps anything under (app)/admin.
 *
 * `header` is pinned via ScrollTrigger rather than CSS `position: sticky`,
 * since sticky positioning stops tracking correctly once its container is
 * being transformed for the smoothing effect — pinning is GSAP's own
 * documented fix for a "sticky nav + ScrollSmoother" page.
 */
export function SmoothScrollWrapper({ header, children }: { header: ReactNode; children: ReactNode }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const smoother = ScrollSmoother.create({
        wrapper: wrapperRef.current!,
        content: contentRef.current!,
        smooth: 1.1,
        normalizeScroll: true,
      });

      ScrollTrigger.create({
        trigger: headerRef.current,
        start: 'top top',
        endTrigger: contentRef.current,
        end: 'bottom top',
        pin: true,
        pinSpacing: false,
      });

      return () => smoother.kill();
    });

    return () => ctx.revert();
  }, []);

  return (
    <div ref={wrapperRef} id="smooth-wrapper">
      <div ref={contentRef} id="smooth-content">
        <div ref={headerRef} className="relative z-30">{header}</div>
        {children}
      </div>
    </div>
  );
}
