import gsap from 'gsap';
import { ScrollToPlugin } from 'gsap/ScrollToPlugin';

gsap.registerPlugin(ScrollToPlugin);

/**
 * Smooth-scrolls to the first invalid field on a failed form submission.
 * react-hook-form's own `register()` sets a real DOM `name` attribute, so the
 * field is addressable without threading refs through every form.
 *
 * Only for plain-document forms (auth pages, report/claim forms) — never call
 * this on the landing page, where ScrollSmoother owns the scroll instead.
 */
export function scrollToFirstError(errors: Record<string, unknown>) {
  const firstKey = Object.keys(errors)[0];
  if (!firstKey) return;

  const el = document.querySelector(`[name="${firstKey}"]`);
  if (!el) return;

  gsap.to(window, { duration: 0.6, scrollTo: { y: el as HTMLElement, offsetY: 100 }, ease: 'power2.out' });
}
