import { useEffect, useRef } from "react";

/**
 * Soft ambient starfield + occasional quiet comets, clipped to the title-band.
 * Motion is disabled when prefers-reduced-motion is set.
 */

const STAR_SEED = 1300;
const MAX_COMETS = 1;
const COMET_GAP_MIN_MS = 4800;
const COMET_GAP_MAX_MS = 9000;

function mulberry32(seed) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function seedStars(count) {
  const rand = mulberry32(STAR_SEED);
  const stars = [];
  for (let i = 0; i < count; i += 1) {
    const large = rand() > 0.78;
    stars.push({
      nx: rand(),
      ny: rand(),
      r: large ? 1.35 + rand() * 1.05 : 0.45 + rand() * 0.75,
      base: 0.28 + rand() * 0.42,
      amp: 0.16 + rand() * 0.28,
      speed: 0.45 + rand() * 0.75,
      phase: rand() * Math.PI * 2,
      warm: rand() > 0.82,
    });
  }
  return stars;
}

function spawnComet(width, height) {
  const fromLeft = Math.random() >= 0.4;
  const y = height * (0.16 + Math.random() * 0.62);
  const speed = 86 + Math.random() * 40;
  const tilt = (fromLeft ? -12 : 168) + Math.random() * 10;
  const angle = (tilt * Math.PI) / 180;
  return {
    x: fromLeft ? -36 : width + 36,
    y,
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
    life: 0,
    maxLife: 2.8 + Math.random() * 1.2,
    len: 56 + Math.random() * 28,
  };
}

function drawStars(ctx, stars, width, height, now, animate) {
  for (const star of stars) {
    const x = star.nx * width;
    const y = star.ny * height;
    const twinkle = animate
      ? star.base + Math.sin(now * 0.001 * star.speed + star.phase) * star.amp
      : star.base * 0.72;
    const alpha = Math.max(0.1, Math.min(0.88, twinkle));
    const rgb = star.warm ? "255, 220, 150" : "255, 252, 246";

    if (star.r > 1.05) {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, star.r * 6.5);
      glow.addColorStop(0, `rgba(${rgb},${alpha * 0.5})`);
      glow.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, star.r * 5.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = `rgba(${rgb},${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawComets(ctx, comets, dt, width, height) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.lineCap = "round";

  for (let i = comets.length - 1; i >= 0; i -= 1) {
    const comet = comets[i];
    comet.x += comet.vx * dt;
    comet.y += comet.vy * dt;
    comet.life += dt;

    const progress = Math.min(1, comet.life / comet.maxLife);
    const fade = Math.sin(progress * Math.PI);
    const mag = Math.hypot(comet.vx, comet.vy) || 1;
    const tx = (comet.vx / mag) * comet.len;
    const ty = (comet.vy / mag) * comet.len;
    const x0 = comet.x - tx;
    const y0 = comet.y - ty;

    const tail = ctx.createLinearGradient(x0, y0, comet.x, comet.y);
    tail.addColorStop(0, "rgba(255, 246, 220, 0)");
    tail.addColorStop(0.45, `rgba(255, 236, 196, ${0.14 * fade})`);
    tail.addColorStop(1, `rgba(255, 250, 236, ${0.42 * fade})`);

    ctx.strokeStyle = tail;
    ctx.lineWidth = 3.8;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(comet.x, comet.y);
    ctx.stroke();

    ctx.lineWidth = 1.05;
    ctx.beginPath();
    ctx.moveTo(x0 + tx * 0.35, y0 + ty * 0.35);
    ctx.lineTo(comet.x, comet.y);
    ctx.stroke();

    const head = ctx.createRadialGradient(
      comet.x,
      comet.y,
      0,
      comet.x,
      comet.y,
      8,
    );
    head.addColorStop(0, `rgba(255, 252, 244, ${0.5 * fade})`);
    head.addColorStop(1, "rgba(255, 252, 244, 0)");
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.arc(comet.x, comet.y, 8, 0, Math.PI * 2);
    ctx.fill();

    const off =
      comet.life > comet.maxLife ||
      comet.x < -90 ||
      comet.x > width + 90 ||
      comet.y < -50 ||
      comet.y > height + 50;
    if (off) comets.splice(i, 1);
  }

  ctx.restore();
}

export default function TitleBandAtmosphere() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const parent = canvas.parentElement;
    if (!parent) return undefined;

    const ctx = canvas.getContext("2d", { alpha: true });
    const motionMq = window.matchMedia("(prefers-reduced-motion: reduce)");

    let width = 0;
    let height = 0;
    let stars = [];
    const comets = [];
    let nextCometAt = 0;
    let raf = 0;
    let last = performance.now();
    let reduced = motionMq.matches;

    function resize() {
      const rect = parent.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, rect.width);
      height = Math.max(1, rect.height);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(
        Math.min(130, Math.max(48, (width * height) / 2400)),
      );
      stars = seedStars(count);
    }

    function paintStatic() {
      ctx.clearRect(0, 0, width, height);
      drawStars(ctx, stars, width, height, 0, false);
    }

    function frame(now) {
      const dt = Math.min(0.048, (now - last) / 1000);
      last = now;
      ctx.clearRect(0, 0, width, height);
      drawStars(ctx, stars, width, height, now, true);

      if (now >= nextCometAt && comets.length < MAX_COMETS) {
        comets.push(spawnComet(width, height));
        nextCometAt =
          now +
          COMET_GAP_MIN_MS +
          Math.random() * (COMET_GAP_MAX_MS - COMET_GAP_MIN_MS);
      }
      drawComets(ctx, comets, dt, width, height);
      raf = requestAnimationFrame(frame);
    }

    function startLoop() {
      cancelAnimationFrame(raf);
      comets.length = 0;
      last = performance.now();
      nextCometAt = last + 900 + Math.random() * 900;
      raf = requestAnimationFrame(frame);
    }

    function applyMotionPreference() {
      reduced = motionMq.matches;
      cancelAnimationFrame(raf);
      if (reduced) {
        paintStatic();
        return;
      }
      startLoop();
    }

    resize();
    applyMotionPreference();

    const observer = new ResizeObserver(() => {
      resize();
      if (reduced) paintStatic();
    });
    observer.observe(parent);

    const onMotionChange = () => applyMotionPreference();
    motionMq.addEventListener("change", onMotionChange);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      motionMq.removeEventListener("change", onMotionChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="es-title-atmosphere" aria-hidden />;
}
