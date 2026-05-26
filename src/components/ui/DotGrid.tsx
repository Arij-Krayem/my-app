"use client";

import { CSSProperties, useCallback, useEffect, useMemo, useRef } from "react";
import styles from "./DotGrid.module.css";

type DotAnimation = {
  duration: number;
  fromX: number;
  fromY: number;
  phase: "push" | "return";
  startTime: number;
  toX: number;
  toY: number;
};

type Dot = {
  cx: number;
  cy: number;
  xOffset: number;
  yOffset: number;
  inMotion: boolean;
  animation: DotAnimation | null;
};

type PointerState = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  speed: number;
  lastTime: number;
  lastX: number;
  lastY: number;
};

type DotGridProps = {
  dotSize?: number;
  gap?: number;
  baseColor?: string;
  activeColor?: string;
  proximity?: number;
  speedTrigger?: number;
  shockRadius?: number;
  shockStrength?: number;
  maxSpeed?: number;
  resistance?: number;
  returnDuration?: number;
  className?: string;
  style?: CSSProperties;
};

const throttle = <T extends unknown[]>(func: (...args: T) => void, limit: number) => {
  let lastCall = 0;

  return (...args: T) => {
    const now = performance.now();
    if (now - lastCall >= limit) {
      lastCall = now;
      func(...args);
    }
  };
};

function hexToRgb(hex: string) {
  const match = hex.match(/^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i);
  if (!match) return { r: 0, g: 0, b: 0 };

  return {
    r: Number.parseInt(match[1], 16),
    g: Number.parseInt(match[2], 16),
    b: Number.parseInt(match[3], 16),
  };
}

function easeOutCubic(progress: number) {
  return 1 - Math.pow(1 - progress, 3);
}

function easeOutElastic(progress: number) {
  if (progress === 0 || progress === 1) return progress;

  const curve = (2 * Math.PI) / 3;
  return Math.pow(2, -10 * progress) * Math.sin((progress * 10 - 0.75) * curve) + 1;
}

export default function DotGrid({
  dotSize = 16,
  gap = 32,
  baseColor = "#5227FF",
  activeColor = "#5227FF",
  proximity = 150,
  speedTrigger = 100,
  shockRadius = 250,
  shockStrength = 5,
  maxSpeed = 5000,
  resistance = 750,
  returnDuration = 1.5,
  className = "",
  style,
}: DotGridProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const dotsRef = useRef<Dot[]>([]);
  const sizeRef = useRef({ width: 0, height: 0, dpr: 1 });
  const pointerRef = useRef<PointerState>({
    x: -9999,
    y: -9999,
    vx: 0,
    vy: 0,
    speed: 0,
    lastTime: 0,
    lastX: 0,
    lastY: 0,
  });

  const baseRgb = useMemo(() => hexToRgb(baseColor), [baseColor]);
  const activeRgb = useMemo(() => hexToRgb(activeColor), [activeColor]);

  const buildGrid = useCallback(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const { width, height } = wrapper.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const ctx = canvas.getContext("2d");
    if (!ctx || width <= 0 || height <= 0) return;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    sizeRef.current = { width, height, dpr };
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const cell = dotSize + gap;
    const cols = Math.max(1, Math.floor((width + gap) / cell));
    const rows = Math.max(1, Math.floor((height + gap) / cell));
    const gridW = cell * cols - gap;
    const gridH = cell * rows - gap;
    const startX = (width - gridW) / 2 + dotSize / 2;
    const startY = (height - gridH) / 2 + dotSize / 2;

    const dots: Dot[] = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        dots.push({
          cx: startX + col * cell,
          cy: startY + row * cell,
          xOffset: 0,
          yOffset: 0,
          inMotion: false,
          animation: null,
        });
      }
    }

    dotsRef.current = dots;
  }, [dotSize, gap]);

  useEffect(() => {
    let rafId = 0;
    const proxSq = proximity * proximity;

    const updateAnimation = (dot: Dot, now: number) => {
      const animation = dot.animation;
      if (!animation) return;

      const progress = Math.min((now - animation.startTime) / (animation.duration * 1000), 1);
      const eased = animation.phase === "return" ? easeOutElastic(progress) : easeOutCubic(progress);

      dot.xOffset = animation.fromX + (animation.toX - animation.fromX) * eased;
      dot.yOffset = animation.fromY + (animation.toY - animation.fromY) * eased;

      if (progress < 1) return;

      if (animation.phase === "push") {
        dot.animation = {
          duration: returnDuration,
          fromX: dot.xOffset,
          fromY: dot.yOffset,
          phase: "return",
          startTime: now,
          toX: 0,
          toY: 0,
        };
        return;
      }

      dot.xOffset = 0;
      dot.yOffset = 0;
      dot.inMotion = false;
      dot.animation = null;
    };

    const draw = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext("2d");
      const { width, height, dpr } = sizeRef.current;
      if (!ctx || width <= 0 || height <= 0) {
        rafId = window.requestAnimationFrame(draw);
        return;
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const now = performance.now();
      const { x: px, y: py } = pointerRef.current;

      for (const dot of dotsRef.current) {
        updateAnimation(dot, now);

        const ox = dot.cx + dot.xOffset;
        const oy = dot.cy + dot.yOffset;
        const dx = dot.cx - px;
        const dy = dot.cy - py;
        const dsq = dx * dx + dy * dy;

        let fill = baseColor;
        if (dsq <= proxSq) {
          const distance = Math.sqrt(dsq);
          const t = 1 - distance / proximity;
          const r = Math.round(baseRgb.r + (activeRgb.r - baseRgb.r) * t);
          const g = Math.round(baseRgb.g + (activeRgb.g - baseRgb.g) * t);
          const b = Math.round(baseRgb.b + (activeRgb.b - baseRgb.b) * t);
          fill = `rgb(${r},${g},${b})`;
        }

        ctx.beginPath();
        ctx.arc(ox, oy, dotSize / 2, 0, Math.PI * 2);
        ctx.fillStyle = fill;
        ctx.fill();
      }

      rafId = window.requestAnimationFrame(draw);
    };

    draw();
    return () => window.cancelAnimationFrame(rafId);
  }, [activeRgb, baseColor, baseRgb, dotSize, proximity, returnDuration]);

  useEffect(() => {
    buildGrid();

    let resizeObserver: ResizeObserver | null = null;
    if ("ResizeObserver" in window && wrapperRef.current) {
      resizeObserver = new ResizeObserver(buildGrid);
      resizeObserver.observe(wrapperRef.current);
    } else {
      window.addEventListener("resize", buildGrid);
    }

    return () => {
      if (resizeObserver) resizeObserver.disconnect();
      else window.removeEventListener("resize", buildGrid);
    };
  }, [buildGrid]);

  useEffect(() => {
    const animateDot = (dot: Dot, xOffset: number, yOffset: number, duration: number) => {
      dot.inMotion = true;
      dot.animation = {
        duration,
        fromX: dot.xOffset,
        fromY: dot.yOffset,
        phase: "push",
        startTime: performance.now(),
        toX: xOffset,
        toY: yOffset,
      };
    };

    const onMove = (event: PointerEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const now = performance.now();
      const pointer = pointerRef.current;
      const hasPrevious = pointer.lastTime > 0;
      const dt = hasPrevious ? Math.max(now - pointer.lastTime, 1) : 16;
      const dx = hasPrevious ? event.clientX - pointer.lastX : 0;
      const dy = hasPrevious ? event.clientY - pointer.lastY : 0;

      let vx = (dx / dt) * 1000;
      let vy = (dy / dt) * 1000;
      let speed = Math.hypot(vx, vy);

      if (speed > maxSpeed) {
        const scale = maxSpeed / speed;
        vx *= scale;
        vy *= scale;
        speed = maxSpeed;
      }

      pointer.lastTime = now;
      pointer.lastX = event.clientX;
      pointer.lastY = event.clientY;
      pointer.vx = vx;
      pointer.vy = vy;
      pointer.speed = speed;

      const rect = canvas.getBoundingClientRect();
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;

      const pushDuration = Math.max(0.18, Math.min(0.55, resistance / 2200));
      for (const dot of dotsRef.current) {
        const dist = Math.hypot(dot.cx - pointer.x, dot.cy - pointer.y);
        if (speed <= speedTrigger || dist >= proximity || dot.inMotion) continue;

        const falloff = 1 - dist / proximity;
        const pushX = (dot.cx - pointer.x) * 0.35 * falloff + vx * 0.0035 * falloff;
        const pushY = (dot.cy - pointer.y) * 0.35 * falloff + vy * 0.0035 * falloff;
        animateDot(dot, pushX, pushY, pushDuration);
      }
    };

    const onClick = (event: MouseEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const cx = event.clientX - rect.left;
      const cy = event.clientY - rect.top;
      const shockDuration = Math.max(0.22, Math.min(0.6, resistance / 1800));

      for (const dot of dotsRef.current) {
        const dist = Math.hypot(dot.cx - cx, dot.cy - cy);
        if (dist >= shockRadius || dot.inMotion) continue;

        const falloff = Math.max(0, 1 - dist / shockRadius);
        const pushX = (dot.cx - cx) * shockStrength * 0.18 * falloff;
        const pushY = (dot.cy - cy) * shockStrength * 0.18 * falloff;
        animateDot(dot, pushX, pushY, shockDuration);
      }
    };

    const throttledMove = throttle(onMove, 50);
    window.addEventListener("pointermove", throttledMove, { passive: true });
    window.addEventListener("click", onClick);

    return () => {
      window.removeEventListener("pointermove", throttledMove);
      window.removeEventListener("click", onClick);
    };
  }, [maxSpeed, proximity, resistance, returnDuration, shockRadius, shockStrength, speedTrigger]);

  return (
    <section className={`${styles.dotGrid} ${className}`.trim()} style={style}>
      <div ref={wrapperRef} className={styles.wrap}>
        <canvas ref={canvasRef} className={styles.canvas} />
      </div>
    </section>
  );
}
