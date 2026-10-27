import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const BASE_SIZE = 10;
const CAPTURE_MARGIN = 14;
const RELEASE_MARGIN = 26;
const MAGNETS = 'a[href], button:not(:disabled):not(.entry-screen)';

function distanceFromRect(x: number, y: number, rect: DOMRect) {
  return Math.hypot(Math.max(rect.left - x, 0, x - rect.right), Math.max(rect.top - y, 0, y - rect.bottom));
}

export function CursorEffects() {
  const cursorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let visible = false;
    let target: Element | null = null;
    let pointerX = 0, pointerY = 0, x = 0, y = 0, vx = 0, vy = 0;
    let width = BASE_SIZE, height = BASE_SIZE, widthVelocity = 0, heightVelocity = 0;
    let previousTime = 0;

    const release = () => {
      if (!target) return;
      const dx = pointerX - x;
      const dy = pointerY - y;
      const distance = Math.hypot(dx, dy);
      if (distance > 0) {
        const impulse = Math.min(12, distance * .13);
        vx += (dx / distance) * impulse;
        vy += (dy / distance) * impulse;
      }
      target = null;
    };

    const findMagnet = (direct: Element | null) => {
      if (direct?.matches(MAGNETS) && !direct.closest('[inert]')) return direct;
      let nearest: Element | null = null;
      let nearestDistance = CAPTURE_MARGIN;
      for (const candidate of document.querySelectorAll(MAGNETS)) {
        if (candidate.closest('[inert]')) continue;
        const rect = candidate.getBoundingClientRect();
        if (!rect.width || !rect.height || rect.bottom < 0 || rect.top > innerHeight) continue;
        const distance = distanceFromRect(pointerX, pointerY, rect);
        if (distance > nearestDistance) continue;
        const top = document.elementFromPoint(Math.max(0, Math.min(innerWidth - 1, rect.left + rect.width / 2)), Math.max(0, Math.min(innerHeight - 1, rect.top + rect.height / 2)));
        if (top && (candidate === top || candidate.contains(top))) {
          nearest = candidate;
          nearestDistance = distance;
        }
      }
      return nearest;
    };

    const leave = () => {
      visible = false; target = null; vx = 0; vy = 0;
      cursor.classList.remove('is-visible', 'is-attached', 'is-pressed');
      document.documentElement.classList.remove('custom-cursor-active');
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      pointerX = event.clientX; pointerY = event.clientY;
      const direct = event.target instanceof Element ? event.target.closest(MAGNETS) : null;
      if (target && (!target.isConnected || distanceFromRect(pointerX, pointerY, target.getBoundingClientRect()) > RELEASE_MARGIN || (direct && direct !== target))) release();
      if (!target) target = findMagnet(direct);
      if (!visible) {
        x = pointerX; y = pointerY; vx = 0; vy = 0; visible = true;
        cursor.classList.add('is-visible');
        document.documentElement.classList.add('custom-cursor-active');
      }
    };
    const down = (event: PointerEvent) => {
      if (event.pointerType === 'mouse') cursor.classList.add('is-pressed');
      else leave();
    };
    const up = () => cursor.classList.remove('is-pressed');
    const render = (now: number) => {
      const dt = Math.min((now - (previousTime || now)) / 16.667, 2);
      previousTime = now;
      const rect = target?.isConnected ? target.getBoundingClientRect() : null;
      const centerX = rect ? rect.left + rect.width / 2 : pointerX;
      const centerY = rect ? rect.top + rect.height / 2 : pointerY;
      const goalX = rect ? centerX + (pointerX - centerX) * .08 : pointerX;
      const goalY = rect ? centerY + (pointerY - centerY) * .08 : pointerY;
      const stiffness = rect ? .19 : .13;
      const damping = Math.pow(rect ? .67 : .76, dt);
      if (reduced.matches) {
        x = goalX; y = goalY; vx = 0; vy = 0;
        width = rect?.width ?? BASE_SIZE; height = rect?.height ?? BASE_SIZE;
        widthVelocity = 0; heightVelocity = 0;
      } else {
        vx = (vx + (goalX - x) * stiffness * dt) * damping;
        vy = (vy + (goalY - y) * stiffness * dt) * damping;
        x += vx * dt; y += vy * dt;
        widthVelocity = (widthVelocity + ((rect?.width ?? BASE_SIZE) - width) * .16 * dt) * Math.pow(.66, dt);
        heightVelocity = (heightVelocity + ((rect?.height ?? BASE_SIZE) - height) * .12 * dt) * Math.pow(.66, dt);
        width = Math.max(1, width + widthVelocity * dt);
        height = Math.max(1, height + heightVelocity * dt);
      }
      cursor.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) scale(${width / BASE_SIZE}, ${height / BASE_SIZE})`;
      cursor.classList.toggle('is-attached', Boolean(rect));
      frame = requestAnimationFrame(render);
    };
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down);
    window.addEventListener('pointerup', up);
    window.addEventListener('blur', leave);
    document.addEventListener('pointerleave', leave);
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerdown', down);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('blur', leave);
      document.removeEventListener('pointerleave', leave);
      leave();
    };
  }, []);

  return createPortal(<div className="custom-cursor" ref={cursorRef} aria-hidden="true" />, document.body);
}
