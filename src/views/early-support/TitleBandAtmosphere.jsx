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

function seedStars(count, { seed = STAR_SEED, scale = 1 } = {}) {
  const rand = mulberry32(seed);
  const stars = [];
  for (let i = 0; i < count; i += 1) {
    const hero = i < Math.max(8, Math.round(count * 0.22));
    stars.push({
      nx: rand(),
      ny: rand(),
      r: (hero ? 1.7 + rand() * 1.3 : 0.4 + rand() * 0.7) * scale,
      glow: (hero ? 10 + rand() * 8 : 0) * scale,
      base: hero ? 0.42 + rand() * 0.28 : 0.22 + rand() * 0.28,
      amp: hero ? 0.28 + rand() * 0.22 : 0.1 + rand() * 0.16,
      speed: hero ? 0.7 + rand() * 0.7 : 0.35 + rand() * 0.55,
      phase: rand() * Math.PI * 2,
      warm: hero ? rand() > 0.45 : rand() > 0.88,
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
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (const star of stars) {
    const x = star.nx * width;
    const y = star.ny * height;
    const twinkle = animate
      ? star.base + Math.sin(now * 0.001 * star.speed + star.phase) * star.amp
      : star.base * 0.7;
    const alpha = Math.max(0.08, Math.min(0.92, twinkle));
    const rgb = star.warm ? "255, 214, 132" : "255, 250, 240";

    if (star.glow > 0) {
      const glow = ctx.createRadialGradient(x, y, 0, x, y, star.glow);
      glow.addColorStop(0, `rgba(${rgb},${alpha * 0.55})`);
      glow.addColorStop(0.45, `rgba(${rgb},${alpha * 0.16})`);
      glow.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, star.glow, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = `rgba(${rgb},${alpha})`;
    ctx.beginPath();
    ctx.arc(x, y, star.r, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
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
    tail.addColorStop(0.4, `rgba(255, 228, 170, ${0.22 * fade})`);
    tail.addColorStop(1, `rgba(255, 248, 230, ${0.55 * fade})`);

    ctx.strokeStyle = tail;
    ctx.lineWidth = 4.6;
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

export default function TitleBandAtmosphere({ compact = false }) {
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
      const count = compact
        ? Math.round(Math.min(22, Math.max(10, (width * height) / 400)))
        : Math.round(Math.min(130, Math.max(48, (width * height) / 2400)));
      stars = seedStars(count, {
        seed: compact ? STAR_SEED + 7 : STAR_SEED,
        scale: compact ? 0.45 : 1,
      });
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

      if (!compact && now >= nextCometAt && comets.length < MAX_COMETS) {
        comets.push(spawnComet(width, height));
        nextCometAt =
          now +
          COMET_GAP_MIN_MS +
          Math.random() * (COMET_GAP_MAX_MS - COMET_GAP_MIN_MS);
      }
      if (!compact) drawComets(ctx, comets, dt, width, height);
      raf = requestAnimationFrame(frame);
    }

    function startLoop() {
      cancelAnimationFrame(raf);
      comets.length = 0;
      last = performance.now();
      nextCometAt = last + 400;
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
  }, [compact]);

  return <canvas ref={canvasRef} className="es-title-atmosphere" aria-hidden />;
}
