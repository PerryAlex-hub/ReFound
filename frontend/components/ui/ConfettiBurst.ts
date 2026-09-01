import gsap from 'gsap';
import { Physics2DPlugin } from 'gsap/Physics2DPlugin';
import { PhysicsPropsPlugin } from 'gsap/PhysicsPropsPlugin';

gsap.registerPlugin(Physics2DPlugin, PhysicsPropsPlugin);

const COLORS = ['#F97316', '#FB923C', '#1E293B', '#FDBA74', '#22C55E'];
const PARTICLE_COUNT = 26;

/**
 * A one-off confetti burst — reserved for the single most earned celebration
 * moment in the app: a fully confirmed item handover, not scattered on every
 * minor success. Physics2D drives each particle's position (velocity, launch
 * angle, gravity); PhysicsProps drives an independent friction-decayed spin.
 */
export function fireConfetti(origin: { x: number; y: number }) {
  const layer = document.createElement('div');
  layer.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden;';
  document.body.appendChild(layer);

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const el = document.createElement('div');
    const isCircle = Math.random() > 0.5;
    const size = 6 + Math.random() * 5;
    el.style.cssText = `
      position:absolute; left:${origin.x}px; top:${origin.y}px;
      width:${size}px; height:${size * (isCircle ? 1 : 0.4)}px;
      background:${COLORS[i % COLORS.length]};
      border-radius:${isCircle ? '50%' : '2px'};
      will-change: transform, opacity;
    `;
    layer.appendChild(el);

    const angle = -90 + (Math.random() * 140 - 70); // launched in an upward cone
    const velocity = 220 + Math.random() * 260;

    gsap.to(el, {
      physics2D: { velocity, angle, gravity: 900 },
      physicsProps: { rotation: { velocity: (Math.random() - 0.5) * 720, friction: 0.12 } },
      opacity: 0,
      duration: 1.4 + Math.random() * 0.5,
      ease: 'none',
      onComplete: () => el.remove(),
    });
  }

  gsap.delayedCall(2.2, () => layer.remove());
}
