import { useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react';

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;

/** True once the element has scrolled into view (immediately when motion is reduced or IO is missing). */
function useInView<T extends Element>(threshold = 0.15) {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(() => reducedMotion() || typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const el = ref.current;
    if (seen || !el) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { setSeen(true); io.disconnect(); }
    }, { threshold, rootMargin: '0px 0px -6% 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [seen, threshold]);
  return [ref, seen] as const;
}

/** Fades and slides its children in when they scroll into view. `delay` is in milliseconds. */
export function Reveal({ children, delay = 0, from = 'up', as, className = '' }: {
  children: ReactNode; delay?: number; from?: 'up' | 'left' | 'right' | 'zoom'; as?: ElementType; className?: string;
}) {
  const Tag = (as ?? 'div') as ElementType;
  const [ref, seen] = useInView<HTMLElement>();
  return (
    <Tag ref={ref} className={`reveal from-${from}${seen ? ' in' : ''} ${className}`.trim()} style={{ '--d': `${delay}ms` } as CSSProperties}>
      {children}
    </Tag>
  );
}

/** 3D tilt + moving glare for a card, driven by CSS variables. Fine pointers only. */
export function useTilt<T extends HTMLElement>(max = 9) {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || !finePointer()) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--ry', `${((x - 0.5) * 2 * max).toFixed(2)}deg`);
        el.style.setProperty('--rx', `${((0.5 - y) * 2 * max).toFixed(2)}deg`);
        el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
        el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
      });
    };
    const leave = () => {
      cancelAnimationFrame(raf);
      ['--rx', '--ry'].forEach(k => el.style.setProperty(k, '0deg'));
      el.classList.remove('tilting');
    };
    const enter = () => el.classList.add('tilting');
    el.addEventListener('pointerenter', enter);
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('pointerenter', enter);
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
    };
  }, [max]);
  return ref;
}

/** Counts up from 0 to `to` the first time it is visible. */
export function CountUp({ to, ms = 1400 }: { to: number; ms?: number }) {
  const [ref, seen] = useInView<HTMLElement>(0.4);
  const [n, setN] = useState(() => (reducedMotion() ? to : 0));
  useEffect(() => {
    if (!seen || reducedMotion()) { if (seen) setN(to); return; }
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [seen, to, ms]);
  return <b ref={ref}>{n}</b>;
}

/** Thin bar at the top of the page showing how far down the page you are. */
export function ScrollProgress() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      if (ref.current) ref.current.style.transform = `scaleX(${max > 0 ? h.scrollTop / max : 0})`;
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener('scroll', on, { passive: true });
    addEventListener('resize', on);
    return () => { removeEventListener('scroll', on); removeEventListener('resize', on); cancelAnimationFrame(raf); };
  }, []);
  return <div className="progress" ref={ref} aria-hidden="true" />;
}

/** Soft spotlight that follows the mouse. Not rendered on touch devices or with reduced motion. */
export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null);
  const [on] = useState(() => !reducedMotion() && finePointer());
  useEffect(() => {
    if (!on) return;
    let raf = 0, x = 0, y = 0;
    const paint = () => { raf = 0; if (ref.current) ref.current.style.transform = `translate3d(${x - 260}px,${y - 260}px,0)`; };
    const move = (e: PointerEvent) => { x = e.clientX; y = e.clientY; if (!raf) raf = requestAnimationFrame(paint); };
    addEventListener('pointermove', move, { passive: true });
    return () => { removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
  }, [on]);
  return on ? <div className="glow" ref={ref} aria-hidden="true" /> : null;
}

/** Moves the element's children with the pointer (2D parallax) via --px/--py in the range -1..1. */
export function useParallax<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || reducedMotion() || !finePointer()) return;
    let raf = 0;
    const move = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--px', Math.max(-1, Math.min(1, (e.clientX / innerWidth - 0.5) * 2)).toFixed(3));
        el.style.setProperty('--py', Math.max(-1, Math.min(1, (e.clientY / innerHeight - 0.5) * 2)).toFixed(3));
      });
    };
    addEventListener('pointermove', move, { passive: true });
    return () => { removeEventListener('pointermove', move); cancelAnimationFrame(raf); };
  }, []);
  return ref;
}

/** Live clock for a time zone, with how far it is from the visitor's own time. */
export function LocalTime({ zone, city, utcOffsetMin }: { zone: string; city: string; utcOffsetMin: number }) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(t);
  }, []);
  const time = new Intl.DateTimeFormat('en', { timeStyle: 'short', timeZone: zone }).format(now);
  const hour = Number(new Intl.DateTimeFormat('en', { hour: 'numeric', hour12: false, timeZone: zone }).format(now)) % 24;
  const diffH = (utcOffsetMin - -now.getTimezoneOffset()) / 60;
  const rel = diffH === 0 ? 'Same time as you' : `${Math.abs(diffH)}h ${diffH > 0 ? 'ahead of' : 'behind'} you`;
  const online = hour >= 8 && hour < 20;
  return (
    <div className="clock" role="status">
      <span className={`dotlive${online ? ' on' : ''}`} aria-hidden="true" />
      <div>
        <b>{time}</b> <span>in {city}</span>
        <small>{rel} · {online ? 'usually online now' : 'replies next morning'}</small>
      </div>
    </div>
  );
}
