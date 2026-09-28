(() => {
  "use strict";

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- procedural block textures ---------- */

  const clamp255 = (v) => Math.max(0, Math.min(255, Math.round(v)));

  function makeTexture(base, variance, size) {
    const c = document.createElement("canvas");
    c.width = c.height = size;
    const x = c.getContext("2d");
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        const v = (Math.random() - 0.5) * variance;
        x.fillStyle = `rgb(${clamp255(base[0] + v)},${clamp255(base[1] + v)},${clamp255(base[2] + v)})`;
        x.fillRect(i, j, 1, 1);
      }
    }
    return `url(${c.toDataURL()})`;
  }

  const root = document.documentElement.style;
  root.setProperty("--tex-dirt", makeTexture([134, 96, 67], 46, 16));
  root.setProperty("--tex-grass", makeTexture([108, 191, 74], 42, 16));
  root.setProperty("--tex-stone", makeTexture([150, 150, 150], 34, 16));

  /* ---------- pixel avatar ---------- */

  const face = [
    "hhhhhhhh",
    "hhhhhhhh",
    "hssssssh",
    "hsessesh",
    "hsessesh",
    "hssmmssh",
    ".ssssss.",
    "..ssss..",
  ];
  const faceColors = { h: "#3a2a1c", s: "#c98d63", e: "#274b8f", m: "#7a4a33" };
  const avatar = document.getElementById("avatar");
  const actx = avatar.getContext("2d");
  face.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (faceColors[ch]) {
        actx.fillStyle = faceColors[ch];
        actx.fillRect(x, y, 1, 1);
      }
    });
  });

  /* ---------- voxel hero scene ---------- */

  const hero = document.querySelector(".hero");
  const cv = document.getElementById("voxel");
  const ctx = cv.getContext("2d");

  const N = 20;
  const TW = 34;
  const TH = 17;
  const BH = 15;

  let W = 0, H = 0;
  let originX = 0, originY = 0;

  function resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    W = hero.clientWidth;
    H = hero.clientHeight;
    cv.width = W * dpr;
    cv.height = H * dpr;
    cv.style.width = W + "px";
    cv.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener("resize", resize);

  function hash(x, y) {
    let n = x * 374761393 + y * 668265263;
    n = (n ^ (n >> 13)) * 1274126177;
    return ((n ^ (n >> 16)) >>> 0) / 4294967295;
  }

  function noise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = x - xi, yf = y - yi;
    const s = (t) => t * t * (3 - 2 * t);
    const a = hash(xi, yi), b = hash(xi + 1, yi);
    const c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * s(xf) + (c - a) * s(yf) + (a - b - c + d) * s(xf) * s(yf);
  }

  const height = [];
  const stone = [];
  const tree = [];
  for (let x = 0; x < N; x++) {
    height[x] = [];
    stone[x] = [];
    tree[x] = [];
    for (let y = 0; y < N; y++) {
      height[x][y] = Math.round(noise(x * 0.22 + 3.7, y * 0.22 + 9.1) * 4.2) - 1;
      stone[x][y] = noise(x * 0.5 + 40, y * 0.5 + 17) > 0.78;
      tree[x][y] = height[x][y] >= 1 && !stone[x][y] && hash(x * 91 + 7, y * 53 + 11) > 0.93;
    }
  }

  function rgb(c) { return `rgb(${c[0]},${c[1]},${c[2]})`; }
  function shade(c, f) {
    return [clamp255(c[0] * f), clamp255(c[1] * f), clamp255(c[2] * f)];
  }

  function poly(pts, fill) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
    ctx.closePath();
    ctx.fill();
  }

  function cube(sx, sy, top, left, right, h) {
    poly([[sx, sy], [sx + TW / 2, sy + TH / 2], [sx, sy + TH], [sx - TW / 2, sy + TH / 2]], top);
    poly([[sx - TW / 2, sy + TH / 2], [sx, sy + TH], [sx, sy + TH + h], [sx - TW / 2, sy + TH / 2 + h]], left);
    poly([[sx + TW / 2, sy + TH / 2], [sx, sy + TH], [sx, sy + TH + h], [sx + TW / 2, sy + TH / 2 + h]], right);
  }

  const grassTop = [106, 190, 74];
  const dirtSide = [121, 85, 52];
  const stoneTop = [152, 152, 152];
  const trunkTop = [112, 78, 44];
  const leafTop = [46, 122, 40];
  const water = [52, 108, 205];

  const floaters = [
    { x: 3, y: 6, color: [79, 227, 209], phase: 0 },
    { x: 14, y: 4, color: [255, 214, 77], phase: 1.3 },
    { x: 9, y: 13, color: [227, 74, 74], phase: 2.1 },
    { x: 16, y: 12, color: [62, 207, 106], phase: 3.4 },
    { x: 6, y: 16, color: [160, 108, 196], phase: 4.6 },
  ];

  const clouds = [
    { x: 40, y: 46, sp: 14 },
    { x: 320, y: 84, sp: 9 },
    { x: 640, y: 34, sp: 18 },
    { x: 900, y: 66, sp: 11 },
  ];

  const particles = [];

  cv.addEventListener("pointerdown", (e) => {
    const r = cv.getBoundingClientRect();
    const px = e.clientX - r.left;
    const py = e.clientY - r.top;
    const palette = ["#6cbf4a", "#8b5a2b", "#9a9a9a", "#cfe4ff"];
    for (let i = 0; i < 18; i++) {
      particles.push({
        x: px, y: py,
        vx: (Math.random() - 0.5) * 260,
        vy: -Math.random() * 260 - 60,
        life: 1,
        color: palette[(Math.random() * palette.length) | 0],
      });
    }
  });

  let mouseX = 0.5, mouseY = 0.5, parX = 0, parY = 0;
  hero.addEventListener("pointermove", (e) => {
    mouseX = e.clientX / innerWidth;
    mouseY = e.clientY / innerHeight;
  });

  const fpsEl = document.getElementById("fps");
  let frames = 0, lastFps = performance.now();
  const start = performance.now();

  function draw(now) {
    const t = (now - start) / 1000;
    const dt = Math.min(0.05, t - (draw.lastT || 0));
    draw.lastT = t;

    ctx.clearRect(0, 0, W, H);

    parX += ((mouseX - 0.5) * 34 - parX) * 0.05;
    parY += ((mouseY - 0.5) * 16 - parY) * 0.05;

    originX = W / 2 + parX;
    originY = H * 0.16 + parY;

    ctx.fillStyle = "#ffe066";
    ctx.fillRect(W - 110, 42, 48, 48);
    ctx.fillStyle = "#fff2a8";
    ctx.fillRect(W - 98, 54, 24, 24);

    for (const c of clouds) {
      const cx = ((c.x + t * c.sp) % (W + 260)) - 130;
      ctx.fillStyle = "rgba(255,255,255,0.92)";
      ctx.fillRect(cx, c.y, 84, 22);
      ctx.fillRect(cx + 18, c.y - 14, 48, 16);
    }

    for (let s = 0; s <= 2 * (N - 1); s++) {
      for (let x = Math.max(0, s - N + 1); x <= Math.min(N - 1, s); x++) {
        const y = s - x;
        const h = height[x][y];
        const j = (hash(x * 7, y * 13) - 0.5) * 22;
        const sx = originX + (x - y) * (TW / 2);
        const syBase = originY + (x + y) * (TH / 2);

        if (h < 0) {
          const shimmer = 0.72 + 0.14 * Math.sin(t * 2 + x + y);
          poly(
            [[sx, syBase - TH], [sx + TW / 2, syBase - TH / 2], [sx, syBase], [sx - TW / 2, syBase - TH / 2]],
            `rgba(${water[0]},${water[1]},${water[2]},${shimmer})`
          );
          continue;
        }

        const isStone = stone[x][y];
        const topC = isStone ? stoneTop : grassTop;
        const sideC = isStone ? shade(stoneTop, 0.72) : dirtSide;
        const top = shade(topC, 1 + j / 255);
        const sy = syBase - (h + 1) * BH;
        cube(sx, sy, rgb(top), rgb(sideC), rgb(shade(sideC, 0.78)), (h + 1) * BH);

        if (!isStone) {
          poly(
            [[sx - TW / 2, sy + TH / 2], [sx, sy + TH], [sx, sy + TH + 4], [sx - TW / 2, sy + TH / 2 + 4]],
            rgb(shade(grassTop, 0.9))
          );
          poly(
            [[sx + TW / 2, sy + TH / 2], [sx, sy + TH], [sx, sy + TH + 4], [sx + TW / 2, sy + TH / 2 + 4]],
            rgb(shade(grassTop, 0.72))
          );
        }

        if (tree[x][y]) {
          const trunkTopY = sy - 2 * BH;
          cube(sx, trunkTopY, rgb(shade(trunkTop, 1)), rgb(trunkTop), rgb(shade(trunkTop, 0.78)), 2 * BH);
          cube(sx, trunkTopY - BH, rgb(shade(leafTop, 1.15)), rgb(leafTop), rgb(shade(leafTop, 0.75)), BH);
        }
      }
    }

    for (const f of floaters) {
      const sx = originX + (f.x - f.y) * (TW / 2);
      const base = syBaseFor(f.x, f.y) - (height[f.x][f.y] + 1) * BH;
      const bob = Math.sin(t * 1.6 + f.phase) * 9;
      const sy = base - 78 + bob;
      cube(sx, sy, rgb(shade(f.color, 1.15)), rgb(f.color), rgb(shade(f.color, 0.72)), BH);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.vy += 900 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt * 0.9;
      if (p.life <= 0) { particles.splice(i, 1); continue; }
      ctx.globalAlpha = Math.max(0, p.life);
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x, p.y, 5, 5);
      ctx.globalAlpha = 1;
    }

    frames++;
    if (now - lastFps >= 1000) {
      fpsEl.textContent = frames;
      frames = 0;
      lastFps = now;
    }

    if (!reducedMotion) requestAnimationFrame(draw);
  }

  function syBaseFor(x, y) {
    return originY + (x + y) * (TH / 2);
  }

  requestAnimationFrame(draw);

  /* ---------- reveal on scroll ---------- */

  const revealIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        revealIO.unobserve(e.target);
      }
    }
  }, { threshold: 0.15 });
  document.querySelectorAll(".reveal").forEach((el) => revealIO.observe(el));

  /* ---------- hotbar active slot ---------- */

  const slots = [...document.querySelectorAll(".hotbar .slot")];
  const sectionIO = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        slots.forEach((s) => s.classList.toggle("active", s.getAttribute("href") === "#" + e.target.id));
      }
    }
  }, { rootMargin: "-40% 0px -40% 0px" });
  document.querySelectorAll("section, .hero").forEach((sec) => sectionIO.observe(sec));
})();
