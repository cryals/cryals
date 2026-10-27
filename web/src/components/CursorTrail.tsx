import { useEffect, useRef } from 'react';

type Node = { x: number; y: number; vx: number; vy: number };
type Trail = { spring: number; friction: number; nodes: Node[] };

// A lighter, monochrome adaptation of the supplied spring-line cursor example.
export function CursorTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    let frame = 0;
    let running = false;
    let trails: Trail[] = [];
    let pointer = { x: 0, y: 0 };
    let lastMove = 0;

    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(window.innerWidth * ratio);
      canvas.height = Math.round(window.innerHeight * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    const clear = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      trails = [];
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    };
    const render = (now: number) => {
      ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
      const opacity = Math.max(0, Math.min(1, (now - lastMove < 500 ? 1 : 1 - (now - lastMove - 500) / 600)));
      if (!opacity || document.hidden) { clear(); return; }
      for (const trail of trails) {
        let spring = trail.spring;
        ctx.beginPath();
        for (let index = 0; index < trail.nodes.length; index++) {
          const node = trail.nodes[index];
          const previous = index === 0 ? null : trail.nodes[index - 1];
          const target = previous ?? pointer;
          node.vx += (target.x - node.x) * spring + (previous?.vx ?? 0) * .25;
          node.vy += (target.y - node.y) * spring + (previous?.vy ?? 0) * .25;
          node.vx *= trail.friction;
          node.vy *= trail.friction;
          node.x += node.vx;
          node.y += node.vy;
          spring *= .98;
          if (index === 0) ctx.moveTo(node.x, node.y);
          else {
            const next = trail.nodes[index + 1];
            if (next) ctx.quadraticCurveTo(node.x, node.y, (node.x + next.x) / 2, (node.y + next.y) / 2);
            else ctx.lineTo(node.x, node.y);
          }
        }
        ctx.lineWidth = 2.5;
        ctx.strokeStyle = `rgba(0, 0, 0, ${opacity * .12})`;
        ctx.stroke();
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(245, 245, 243, ${opacity * .32})`;
        ctx.stroke();
      }
      frame = requestAnimationFrame(render);
    };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') return;
      pointer = { x: event.clientX, y: event.clientY };
      lastMove = performance.now();
      if (!trails.length) {
        trails = Array.from({ length: 12 }, (_, index) => ({
          spring: .36 + index * .004,
          friction: .48 + index * .002,
          nodes: Array.from({ length: 32 }, () => ({ ...pointer, vx: 0, vy: 0 })),
        }));
      }
      if (!frame && !document.hidden) frame = requestAnimationFrame(render);
    };
    const visibility = () => { if (document.hidden) clear(); };
    const sync = () => {
      const enabled = !reduced.matches;
      if (enabled === running) return;
      running = enabled;
      if (enabled) {
        resize();
        window.addEventListener('resize', resize);
        window.addEventListener('pointermove', move, { passive: true });
        window.addEventListener('blur', clear);
        document.addEventListener('visibilitychange', visibility);
      } else {
        window.removeEventListener('resize', resize);
        window.removeEventListener('pointermove', move);
        window.removeEventListener('blur', clear);
        document.removeEventListener('visibilitychange', visibility);
        clear();
      }
    };
    reduced.addEventListener('change', sync);
    sync();
    return () => {
      reduced.removeEventListener('change', sync);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('blur', clear);
      document.removeEventListener('visibilitychange', visibility);
      clear();
    };
  }, []);

  return <canvas ref={canvasRef} className="cursor-trail" aria-hidden="true" />;
}
