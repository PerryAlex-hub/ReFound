'use client';

import { RefObject, useEffect } from 'react';
import gsap from 'gsap';
import { TextPlugin } from 'gsap/TextPlugin';

gsap.registerPlugin(TextPlugin);

/**
 * Cycles an input's placeholder through example phrases with a typewriter
 * transition. TextPlugin can only animate a real DOM node (it reads
 * `target.nodeName` internally) — an <input> has no text content of its own
 * to type into, so a detached, never-mounted <span> does the typing and its
 * result is mirrored onto the input's placeholder attribute.
 */
export function useRotatingPlaceholder(inputRef: RefObject<HTMLInputElement | null>, phrases: string[]) {
  useEffect(() => {
    if (phrases.length === 0 || !inputRef.current) return;

    const typer = document.createElement('span');
    typer.textContent = phrases[0];
    inputRef.current.placeholder = phrases[0];

    const tl = gsap.timeline({ repeat: -1 });
    phrases.forEach((_, idx) => {
      const next = phrases[(idx + 1) % phrases.length];
      tl.to(typer, {
        duration: 1,
        text: next,
        ease: 'none',
        onUpdate: () => { if (inputRef.current) inputRef.current.placeholder = typer.textContent ?? ''; },
      }, '+=2');
    });

    return () => { tl.kill(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- phrases is a stable literal at each call site
  }, [inputRef]);
}
