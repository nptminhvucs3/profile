import { useEffect, useRef } from 'react';
import type { Theme } from '../hooks/useTheme';

/**
 * Starfield — Layer 2: một canvas trong suốt đặt trên ảnh Galaxy.
 *
 *  - Hoàn toàn độc lập với chuột (không có mouse listener, không parallax).
 *  - Cũng là nơi đo fps: nếu máy giật kéo dài thì gắn class `perf-lite` lên <html> để tắt
 *    các mảng sáng của nền Galaxy (xem themes.css).
 *  - Thêm vài đĩa bokeh rất mờ ở phía dưới (4–10 cái) để tạo chiều sâu xa/gần.
 *  - Mỗi sao có vị trí, hướng, tốc độ, kích thước, độ sáng, nhịp nhấp nháy riêng
 *    và một quỹ đạo nhỏ rất chậm. Ra khỏi màn hình thì xuất hiện lại ở cạnh đối diện
 *    (ngoài vùng nhìn thấy nên không bị "nhảy").
 *  - Vòng lặp requestAnimationFrame + delta time; không setState, không tạo object/chuỗi
 *    mỗi frame (sprite dựng sẵn, sao băng dùng pool).
 *  - ResizeObserver, DPR tối đa 2, tạm dừng khi tab ẩn, dọn dẹp khi unmount.
 *  - Đổi theme chỉ đổi bộ sprite, không khởi tạo lại canvas hay danh sách sao.
 */

interface Star {
  x: number; // vị trí nền (đã trôi), px
  y: number;
  vx: number; // px/giây
  vy: number;
  size: number; // đường kính vẽ, px
  alpha: number;
  twSpeed: number;
  twPhase: number;
  orbitR: number; // bán kính quỹ đạo nhỏ, px
  orbitSpeed: number; // rad/giây
  orbitPhase: number;
  color: number; // chỉ số màu trong palette
  bright: boolean;
}

/** Bụi sáng mờ (bokeh): đĩa mềm to, rất mờ, trôi cực chậm. Đĩa càng to càng "gần" nên trôi nhanh hơn */
interface Bokeh {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number; // bán kính, px
  alpha: number;
  speed: number; // nhịp thở độ sáng
  phase: number;
  color: number;
}

interface Meteor {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  len: number;
  age: number;
  life: number;
  angle: number; // hướng bay (rad)
}

interface SpriteSet {
  dot: HTMLCanvasElement[];
  glow: HTMLCanvasElement[];
  bokeh: HTMLCanvasElement[];
  tail: HTMLCanvasElement;
  head: HTMLCanvasElement;
  alphaScale: number;
}

const PALETTE: Record<Theme, string[]> = {
  dark: ['244,241,230', '207,224,255', '196,186,240'], // trắng ngà, xanh nhạt, tím nhạt
  light: ['58,70,128', '88,80,150', '66,94,150'], // xanh navy, tím nhạt, xanh xám
};
const BOKEH_PALETTE: Record<Theme, string[]> = {
  dark: ['130,165,255', '165,150,235', '120,195,235'], // xanh, tím, xanh lơ — cùng tông nebula
  light: ['70,86,150', '96,84,150', '70,104,150'],
};
const METEOR_COLOR: Record<Theme, string> = { dark: '236,242,255', light: '70,80,150' };
const ALPHA_SCALE: Record<Theme, number> = { dark: 1, light: 0.85 };

const MARGIN = 28; // px ngoài màn hình để sao tái xuất hiện không bị nhìn thấy

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d') as CanvasRenderingContext2D];
}

/** Sao nhỏ: điểm tròn sắc nét, viền mềm rất ngắn */
function makeDot(rgb: string): HTMLCanvasElement {
  const [c, g] = makeCanvas(32, 32);
  const grad = g.createRadialGradient(16, 16, 0, 16, 16, 16);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.35, `rgba(${rgb},0.9)`);
  grad.addColorStop(0.6, `rgba(${rgb},0.22)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 32, 32);
  return c;
}

/** Sao sáng: lõi nhỏ + quầng sáng mềm */
function makeGlow(rgb: string): HTMLCanvasElement {
  const [c, g] = makeCanvas(64, 64);
  const grad = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grad.addColorStop(0, `rgba(${rgb},1)`);
  grad.addColorStop(0.1, `rgba(${rgb},0.95)`);
  grad.addColorStop(0.24, `rgba(${rgb},0.4)`);
  grad.addColorStop(0.5, `rgba(${rgb},0.1)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return c;
}

/** Bokeh: đĩa mềm, nhạt ở tâm và hơi đậm nhẹ ở rìa như ống kính mất nét */
function makeBokeh(rgb: string): HTMLCanvasElement {
  const [c, g] = makeCanvas(96, 96);
  const grad = g.createRadialGradient(48, 48, 0, 48, 48, 48);
  grad.addColorStop(0, `rgba(${rgb},0.32)`);
  grad.addColorStop(0.7, `rgba(${rgb},0.42)`);
  grad.addColorStop(0.88, `rgba(${rgb},0.55)`);
  grad.addColorStop(1, `rgba(${rgb},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, 96, 96);
  return c;
}

/** Vệt sao băng: tam giác thon, đậm ở đầu (bên phải sprite), mờ dần về đuôi */
function makeTail(rgb: string): HTMLCanvasElement {
  const [c, g] = makeCanvas(128, 8);
  const grad = g.createLinearGradient(0, 0, 128, 0);
  grad.addColorStop(0, `rgba(${rgb},0)`);
  grad.addColorStop(1, `rgba(${rgb},0.9)`);
  g.fillStyle = grad;
  g.beginPath();
  g.moveTo(0, 4);
  g.lineTo(128, 0.5);
  g.lineTo(128, 7.5);
  g.closePath();
  g.fill();
  return c;
}

function buildSprites(theme: Theme): SpriteSet {
  return {
    dot: PALETTE[theme].map(makeDot),
    glow: PALETTE[theme].map(makeGlow),
    bokeh: BOKEH_PALETTE[theme].map(makeBokeh),
    tail: makeTail(METEOR_COLOR[theme]),
    head: makeGlow(METEOR_COLOR[theme]),
    alphaScale: ALPHA_SCALE[theme],
  };
}

interface Props {
  theme: Theme;
}

export default function Starfield({ theme }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const themeRef = useRef<Theme>(theme);
  const redrawRef = useRef<(() => void) | null>(null);

  // Đổi theme: chỉ đổi bộ sprite và vẽ lại 1 khung — KHÔNG khởi tạo lại canvas/sao
  useEffect(() => {
    themeRef.current = theme;
    redrawRef.current?.();
  }, [theme]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const sprites: Record<Theme, SpriteSet> = {
      dark: buildSprites('dark'),
      light: buildSprites('light'),
    };
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    let reduceMotion = motionQuery.matches;

    let w = 0;
    let h = 0;
    let dpr = 1;
    let mobile = false;
    let raf = 0;
    let last = 0;
    let time = 0;
    let nextMeteorAt = rand(3, 6);
    let resizePending = false;
    let lastDraw = 0;
    let lite = false; // máy chậm: bỏ bokeh, bớt sao, gắn class perf-lite lên <html>

    const stars: Star[] = [];
    const bokehs: Bokeh[] = [];
    const meteors: Meteor[] = [
      { active: false, x: 0, y: 0, vx: 0, vy: 0, len: 0, age: 0, life: 1, angle: 0 },
      { active: false, x: 0, y: 0, vx: 0, vy: 0, len: 0, age: 0, life: 1, angle: 0 },
    ];

    const targetCount = (width: number) => (width < 768 ? 44 : width < 1100 ? 95 : 130);

    const bokehCount = (width: number) => (width < 768 ? 4 : width < 1100 ? 7 : 10);

    const createBokeh = (): Bokeh => {
      const r = rand(18, 56);
      const speed = 1.5 + (r / 56) * 5; // to = gần = nhanh hơn một chút (px/giây)
      const dir = rand(-0.5, 0.5) + Math.PI; // thiên về trôi sang trái, hơi lệch
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.cos(dir) * speed,
        vy: Math.sin(dir) * speed,
        r,
        alpha: rand(0.3, 0.55),
        speed: rand(0.15, 0.4),
        phase: Math.random() * Math.PI * 2,
        color: Math.floor(Math.random() * 3),
      };
    };

    const createStar = (): Star => {
      const bright = Math.random() < 0.18;
      const speed = bright ? rand(3, 8) : rand(4, 12); // px/giây — chậm nhưng nhìn thấy được
      const dir = Math.random() * Math.PI * 2;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        vx: Math.cos(dir) * speed,
        vy: Math.sin(dir) * speed,
        size: bright ? rand(14, 26) : rand(2.8, 4.6),
        alpha: bright ? rand(0.75, 1) : rand(0.5, 0.95),
        twSpeed: bright ? rand(0.5, 1.5) : rand(0.3, 1.2),
        twPhase: Math.random() * Math.PI * 2,
        orbitR: rand(1, 5),
        orbitSpeed: rand(0.05, 0.2),
        orbitPhase: Math.random() * Math.PI * 2,
        color: Math.floor(Math.random() * 3),
        bright,
      };
    };

    const spawnMeteor = () => {
      const m = meteors.find((it) => !it.active);
      if (!m) return;
      const goLeft = Math.random() < 0.65;
      const angle = (rand(18, 34) * Math.PI) / 180; // độ nghiêng so với phương ngang
      const speed = rand(420, 620);
      m.active = true;
      m.age = 0;
      m.life = rand(0.7, 1.1);
      m.len = mobile ? rand(60, 100) : rand(90, 150);
      m.vx = (goLeft ? -1 : 1) * Math.cos(angle) * speed;
      m.vy = Math.sin(angle) * speed;
      m.angle = Math.atan2(m.vy, m.vx);
      m.x = goLeft ? rand(w * 0.35, w * 1.02) : rand(-w * 0.02, w * 0.65);
      m.y = rand(-10, h * 0.4);
    };

    const draw = () => {
      const set = sprites[themeRef.current];
      const glowK = mobile ? 0.7 : 1; // mobile: giảm phát sáng
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // bokeh nằm dưới các ngôi sao (bỏ khi máy chậm)
      for (let i = 0; !lite && i < bokehs.length; i++) {
        const b = bokehs[i];
        const k = reduceMotion ? 1 : 0.75 + 0.25 * Math.sin(time * b.speed + b.phase);
        ctx.globalAlpha = b.alpha * k * set.alphaScale * (mobile ? 0.8 : 1);
        ctx.drawImage(set.bokeh[b.color], b.x - b.r, b.y - b.r, b.r * 2, b.r * 2);
      }

      const starCount = lite ? Math.ceil(stars.length * 0.55) : stars.length; // máy chậm: chỉ vẽ ~55% số sao
      for (let i = 0; i < starCount; i++) {
        const s = stars[i];
        const tw = reduceMotion ? 1 : 0.68 + 0.32 * Math.sin(time * s.twSpeed + s.twPhase); // nhấp nháy nhẹ
        ctx.globalAlpha = s.alpha * tw * set.alphaScale;
        const px = s.x + Math.cos(time * s.orbitSpeed + s.orbitPhase) * s.orbitR;
        const py = s.y + Math.sin(time * s.orbitSpeed * 0.8 + s.orbitPhase) * s.orbitR;
        const d = s.bright ? s.size * glowK : s.size;
        ctx.drawImage(s.bright ? set.glow[s.color] : set.dot[s.color], px - d / 2, py - d / 2, d, d);
      }

      // sao băng (đuôi xoay theo hướng bay bằng setTransform — không tạo object)
      for (let i = 0; i < meteors.length; i++) {
        const m = meteors[i];
        if (!m.active) continue;
        const fade = Math.sin((m.age / m.life) * Math.PI);
        ctx.globalAlpha = fade * set.alphaScale;
        const c = Math.cos(m.angle);
        const sn = Math.sin(m.angle);
        ctx.setTransform(dpr * c, dpr * sn, -dpr * sn, dpr * c, dpr * m.x, dpr * m.y);
        ctx.drawImage(set.tail, -m.len, -1.2, m.len, 2.4);
        ctx.drawImage(set.head, -4, -4, 8, 8);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.globalAlpha = 1;
    };

    const update = (dt: number) => {
      time += dt;
      for (let i = 0; i < bokehs.length; i++) {
        const b = bokehs[i];
        b.x += b.vx * dt;
        b.y += b.vy * dt;
        if (b.x < -b.r) b.x = w + b.r;
        else if (b.x > w + b.r) b.x = -b.r;
        if (b.y < -b.r) b.y = h + b.r;
        else if (b.y > h + b.r) b.y = -b.r;
      }
      for (let i = 0; i < stars.length; i++) {
        const s = stars[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        // tái xuất hiện ở cạnh đối diện (ngoài vùng nhìn thấy)
        if (s.x < -MARGIN) s.x = w + MARGIN;
        else if (s.x > w + MARGIN) s.x = -MARGIN;
        if (s.y < -MARGIN) s.y = h + MARGIN;
        else if (s.y > h + MARGIN) s.y = -MARGIN;
      }

      if (time >= nextMeteorAt) {
        spawnMeteor();
        nextMeteorAt = time + (mobile ? rand(22, 40) : rand(10, 22)); // tần suất thấp
      }
      for (let i = 0; i < meteors.length; i++) {
        const m = meteors[i];
        if (!m.active) continue;
        m.age += dt;
        if (m.age >= m.life) {
          m.active = false;
          continue;
        }
        m.x += m.vx * dt;
        m.y += m.vy * dt;
      }
    };

    // --- Tự bảo vệ hiệu năng ---
    // Nếu fps thấp kéo dài (máy yếu / không có GPU) thì giảm tải: tắt lõi sáng của nền
    // (.perf-lite trong themes.css), bỏ bokeh và bớt sao. Chỉ chạm vào class của <html>,
    // không dùng React state.
    const mountedAt = performance.now();
    let perfTime = 0;
    let perfFrames = 0;
    let perfBad = 0;
    const resetPerf = () => {
      perfTime = 0;
      perfFrames = 0;
    };

    const frame = (now: number) => {
      const raw = (now - last) / 1000;
      const dt = Math.min(raw, 0.05);
      last = now;

      if (!lite && raw < 0.25 && now - mountedAt > 3000) {
        perfTime += raw;
        perfFrames++;
        if (perfTime >= 2) {
          perfBad = perfFrames / perfTime < 40 ? perfBad + 1 : 0;
          resetPerf();
          if (perfBad >= 2) {
            lite = true;
            document.documentElement.classList.add('perf-lite');
          }
        }
      }

      update(dt);
      // Sao trôi chỉ ~0,2px/khung nên vẽ 30 lần/giây là đủ mượt và nhẹ gấp đôi cho GPU;
      // khi có sao băng (bay nhanh) thì vẽ đủ 60.
      let meteorActive = false;
      for (let i = 0; i < meteors.length; i++) if (meteors[i].active) meteorActive = true;
      if (meteorActive || now - lastDraw >= 30) {
        draw();
        lastDraw = now;
      }
      raf = requestAnimationFrame(frame);
    };

    // Sao chạy ngay từ đầu (đã đo: không làm giật intro). Đặt false để hoãn đến khi App báo xong intro.
    let settled = true;
    const start = () => {
      if (!settled || reduceMotion || raf || document.visibilityState === 'hidden') return;
      last = performance.now();
      resetPerf();
      raf = requestAnimationFrame(frame);
    };
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    // --- kích thước canvas: ResizeObserver, giữ nguyên các ngôi sao đang có ---
    const applySize = () => {
      resizePending = false;
      const nw = canvas.clientWidth;
      const nh = canvas.clientHeight;
      // DPR tối đa 2, và tổng số điểm ảnh canvas ≤ ~2.6 triệu (màn 4K/retina lớn không phải
      // nạp lên GPU một canvas khổng lồ mỗi khung hình)
      const ndpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(2.6e6 / Math.max(1, nw * nh))));
      if (nw === 0 || nh === 0) return;
      if (nw === w && nh === h && ndpr === dpr) return;

      const ow = w;
      const oh = h;
      w = nw;
      h = nh;
      dpr = ndpr;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      mobile = w < 768;

      if (ow > 0 && oh > 0) {
        // co giãn vị trí theo kích thước mới để không bị "nhảy"
        for (let i = 0; i < stars.length; i++) {
          stars[i].x *= w / ow;
          stars[i].y *= h / oh;
        }
        for (let i = 0; i < bokehs.length; i++) {
          bokehs[i].x *= w / ow;
          bokehs[i].y *= h / oh;
        }
      }
      const target = targetCount(w);
      while (stars.length < target) stars.push(createStar());
      if (stars.length > target) stars.length = target;
      const bTarget = bokehCount(w);
      while (bokehs.length < bTarget) bokehs.push(createBokeh());
      if (bokehs.length > bTarget) bokehs.length = bTarget;

      draw();
    };

    const ro = new ResizeObserver(() => {
      if (resizePending) return;
      resizePending = true;
      requestAnimationFrame(applySize);
    });
    ro.observe(canvas);
    applySize();

    const onVisibility = () => (document.visibilityState === 'hidden' ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    const onMotionChange = () => {
      reduceMotion = motionQuery.matches;
      if (reduceMotion) {
        stop();
        draw();
      } else {
        start();
      }
    };
    motionQuery.addEventListener('change', onMotionChange);

    const onSettled = () => {
      settled = true;
      start();
    };
    window.addEventListener('cosmic-settled', onSettled);
    const settleFallback = window.setTimeout(onSettled, 5000); // phòng khi sự kiện không tới
    redrawRef.current = draw;
    start();

    return () => {
      stop();
      window.removeEventListener('cosmic-settled', onSettled);
      window.clearTimeout(settleFallback);
      redrawRef.current = null;
      ro.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      motionQuery.removeEventListener('change', onMotionChange);
    };
  }, []);

  return <canvas ref={canvasRef} className="starfield" aria-hidden="true" />;
}
