"use client";

import { useRef, useEffect } from "react";

interface Cloud {
  x: number;
  y: number;
  w: number;
  h: number;
  speed: number;
}

interface Note {
  x: number;
  y: number;
  opacity: number;
  speed: number;
  symbol: string;
}

interface Jiggy {
  x: number;
  y: number;
  baseY: number;
  phase: number;
  spin: number;
  collected: boolean;
  sparkle: number;
}

interface Butterfly {
  x: number;
  y: number;
  wingPhase: number;
  dx: number;
  dy: number;
  color: string;
}

export function BanjoKazooie() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const cvs = el;

    let animId: number;
    let frame = 0;

    const clouds: Cloud[] = [
      { x: 50, y: 25, w: 90, h: 28, speed: 0.25 },
      { x: 220, y: 45, w: 70, h: 22, speed: 0.18 },
      { x: 380, y: 15, w: 110, h: 32, speed: 0.22 },
      { x: 520, y: 55, w: 65, h: 20, speed: 0.3 },
    ];

    const notes: Note[] = [
      { x: 0, y: 0, opacity: 1, speed: 0.4, symbol: "\u266A" },
      { x: 0, y: 0, opacity: 1, speed: 0.35, symbol: "\u266B" },
      { x: 0, y: 0, opacity: 1, speed: 0.5, symbol: "\u266A" },
      { x: 0, y: 0, opacity: 1, speed: 0.3, symbol: "\u266B" },
    ];

    const jiggies: Jiggy[] = [
      { x: 0, y: 0, baseY: 0, phase: 0, spin: 0, collected: false, sparkle: 0 },
      { x: 0, y: 0, baseY: 0, phase: 2, spin: 0.5, collected: false, sparkle: 0 },
      { x: 0, y: 0, baseY: 0, phase: 4, spin: 1, collected: false, sparkle: 0 },
    ];

    const butterflies: Butterfly[] = [
      { x: 0, y: 0, wingPhase: 0, dx: 0.6, dy: 0.3, color: "#ff66aa" },
      { x: 0, y: 0, wingPhase: Math.PI, dx: -0.5, dy: 0.4, color: "#66ccff" },
    ];

    function resize() {
      cvs.width = cvs.offsetWidth;
      cvs.height = cvs.offsetHeight;
      const w = cvs.width;
      const h = cvs.height;
      notes.forEach((n, i) => {
        n.x = w * 0.2 + i * w * 0.2;
        n.y = h * 0.4 + Math.random() * h * 0.25;
        n.opacity = Math.random();
      });
      jiggies[0].x = w * 0.12; jiggies[0].baseY = h * 0.35;
      jiggies[1].x = w * 0.75; jiggies[1].baseY = h * 0.28;
      jiggies[2].x = w * 0.88; jiggies[2].baseY = h * 0.55;
      jiggies.forEach(j => { j.y = j.baseY; j.collected = false; });
      butterflies[0].x = w * 0.7; butterflies[0].y = h * 0.5;
      butterflies[1].x = w * 0.3; butterflies[1].y = h * 0.45;
    }
    resize();
    window.addEventListener("resize", resize);

    // --- pixel-art helper ---
    function px(g: CanvasRenderingContext2D, x: number, y: number, s: number, color: string) {
      g.fillStyle = color;
      g.fillRect(Math.round(x), Math.round(y), s, s);
    }

    function drawCloud(cx: number, cy: number, w: number, h: number) {
      const g = ctx!;
      const bs = 6;
      const cols = Math.floor(w / bs);
      const rows = Math.floor(h / bs);
      // Shadow
      g.fillStyle = "#c8d8e8";
      for (let r = 1; r < rows; r++) {
        const rowW = r === rows - 1 ? cols - 2 : cols;
        const off = r === rows - 1 ? 1 : 0;
        for (let c = off; c < off + rowW; c++) {
          g.fillRect(cx + c * bs + 2, cy + r * bs + 2, bs, bs);
        }
      }
      // Body
      for (let r = 0; r < rows; r++) {
        const rowW = r === 0 || r === rows - 1 ? cols - 2 : cols;
        const off = r === 0 || r === rows - 1 ? 1 : 0;
        g.fillStyle = r === 0 ? "#ffffff" : "#eef4ff";
        for (let c = off; c < off + rowW; c++) {
          g.fillRect(cx + c * bs, cy + r * bs, bs, bs);
        }
      }
    }

    function drawSun() {
      const g = ctx!;
      const sx = cvs.width * 0.85;
      const sy = cvs.height * 0.08;
      const s = 5;
      // Rays (animated)
      const rayLen = 4 + Math.sin(frame * 0.05) * 1.5;
      g.fillStyle = "#ffee44";
      for (let a = 0; a < 8; a++) {
        const angle = (a / 8) * Math.PI * 2 + frame * 0.01;
        for (let r = 3; r < 3 + rayLen; r++) {
          px(g, sx + Math.cos(angle) * r * s, sy + Math.sin(angle) * r * s, s, "#ffee44");
        }
      }
      // Sun body
      for (let dy = -2; dy <= 2; dy++) {
        const hw = dy === -2 || dy === 2 ? 1 : 2;
        for (let dx = -hw; dx <= hw; dx++) {
          px(g, sx + dx * s, sy + dy * s, s, "#ffdd00");
        }
      }
      // Highlight
      px(g, sx - s, sy - s, s, "#ffff88");
    }

    function drawMountain() {
      const g = ctx!;
      const baseY = cvs.height * 0.72;
      const peakX = cvs.width * 0.5;
      const peakY = cvs.height * 0.1;
      const baseHW = cvs.width * 0.38;

      // Mountain body
      g.fillStyle = "#2d8a4e";
      g.beginPath();
      g.moveTo(peakX, peakY);
      g.lineTo(peakX - baseHW, baseY);
      g.lineTo(peakX + baseHW, baseY);
      g.closePath();
      g.fill();

      // Darker left face for depth
      g.fillStyle = "#237a3e";
      g.beginPath();
      g.moveTo(peakX, peakY);
      g.lineTo(peakX - baseHW, baseY);
      g.lineTo(peakX - baseHW * 0.1, baseY);
      g.lineTo(peakX, peakY + (baseY - peakY) * 0.15);
      g.closePath();
      g.fill();

      // Rocky patches
      g.fillStyle = "#3a7a4a";
      const patches = [
        [0.55, 0.4, 0.08], [0.42, 0.55, 0.06], [0.58, 0.65, 0.07],
        [0.46, 0.3, 0.05], [0.52, 0.5, 0.04],
      ];
      for (const [px2, py2, sz] of patches) {
        const patchX = peakX - baseHW + baseHW * 2 * px2;
        const patchY = peakY + (baseY - peakY) * py2;
        g.fillRect(patchX, patchY, baseHW * sz, (baseY - peakY) * sz * 0.5);
      }

      // Spiral path
      g.strokeStyle = "#c4a265";
      g.lineWidth = 3;
      g.beginPath();
      for (let t = 0; t < Math.PI * 4.5; t += 0.08) {
        const progress = t / (Math.PI * 4.5);
        const radius = baseHW * (1 - progress) * 0.55;
        const pathX = peakX + Math.cos(t) * radius;
        const pathY = peakY + (baseY - peakY) * progress;
        if (t === 0) g.moveTo(pathX, pathY);
        else g.lineTo(pathX, pathY);
      }
      g.stroke();
      // Path edge highlight
      g.strokeStyle = "#d4b275";
      g.lineWidth = 1;
      g.stroke();

      // Snow cap
      g.fillStyle = "#ffffff";
      g.beginPath();
      g.moveTo(peakX, peakY);
      g.lineTo(peakX - baseHW * 0.18, peakY + (baseY - peakY) * 0.12);
      g.lineTo(peakX + baseHW * 0.18, peakY + (baseY - peakY) * 0.12);
      g.closePath();
      g.fill();
      // Snow highlight
      g.fillStyle = "#e8f0ff";
      g.beginPath();
      g.moveTo(peakX + baseHW * 0.02, peakY + (baseY - peakY) * 0.03);
      g.lineTo(peakX - baseHW * 0.12, peakY + (baseY - peakY) * 0.12);
      g.lineTo(peakX + baseHW * 0.12, peakY + (baseY - peakY) * 0.12);
      g.closePath();
      g.fill();

      // Waterfall
      const wfX = peakX + baseHW * 0.12;
      const wfTop = peakY + (baseY - peakY) * 0.2;
      const wfBot = baseY;
      g.fillStyle = "rgba(100,180,255,0.6)";
      g.fillRect(wfX - 2, wfTop, 5, wfBot - wfTop);
      // Waterfall sparkles
      g.fillStyle = "rgba(255,255,255,0.7)";
      for (let wy = wfTop; wy < wfBot; wy += 12) {
        const off = ((frame * 2 + wy) % 20) - 10;
        g.fillRect(wfX - 1 + off * 0.15, wy, 2, 3);
      }
      // Splash at base
      const splashW = 10 + Math.sin(frame * 0.15) * 3;
      g.fillStyle = "rgba(200,230,255,0.5)";
      g.beginPath();
      g.arc(wfX, wfBot, splashW, Math.PI, 0);
      g.fill();
    }

    function drawTrees() {
      const g = ctx!;
      const baseY = cvs.height * 0.72;
      const s = 4;
      const treePositions = [0.08, 0.16, 0.82, 0.92];
      for (const tx of treePositions) {
        const treeX = cvs.width * tx;
        // Trunk
        g.fillStyle = "#6b4226";
        g.fillRect(treeX - s, baseY - s * 6, s * 2, s * 6);
        // Foliage (layered circles)
        const greens = ["#1a8a2e", "#22a838", "#2bc44a"];
        for (let layer = 0; layer < 3; layer++) {
          g.fillStyle = greens[layer];
          const ly = baseY - s * 6 - layer * s * 2.5;
          const lw = s * (4 - layer * 0.8);
          g.beginPath();
          g.arc(treeX, ly, lw, 0, Math.PI * 2);
          g.fill();
        }
      }
    }

    function drawGrass() {
      const g = ctx!;
      const baseY = cvs.height * 0.72;
      const s = 3;
      g.fillStyle = "#4dd35a";
      for (let gx = 0; gx < cvs.width; gx += 18) {
        const sway = Math.sin(frame * 0.03 + gx * 0.1) * 1.5;
        g.fillRect(gx + sway, baseY - s * 2, s, s * 2);
        g.fillRect(gx + 6 + sway * 0.7, baseY - s * 1.5, s, s * 1.5);
      }
      // Flowers
      const flowerPositions = [0.05, 0.22, 0.68, 0.78, 0.95];
      const flowerColors = ["#ff4466", "#ffaa22", "#ff66cc", "#ffee44", "#ff6644"];
      flowerPositions.forEach((fp, i) => {
        const fx = cvs.width * fp;
        const fy = baseY + s * 2;
        // Stem
        g.fillStyle = "#2a8a2e";
        g.fillRect(fx, fy - s * 3, 2, s * 3);
        // Petals
        g.fillStyle = flowerColors[i];
        const petalSize = s * 1.2;
        g.fillRect(fx - petalSize, fy - s * 3 - petalSize / 2, petalSize, petalSize);
        g.fillRect(fx + 2, fy - s * 3 - petalSize / 2, petalSize, petalSize);
        g.fillRect(fx - petalSize / 2 + 1, fy - s * 3 - petalSize * 1.2, petalSize, petalSize);
        g.fillRect(fx - petalSize / 2 + 1, fy - s * 3 + petalSize * 0.3, petalSize, petalSize);
        // Center
        g.fillStyle = "#ffee00";
        g.fillRect(fx - 1, fy - s * 3 - 1, s, s);
      });
    }

    function drawBridge() {
      const g = ctx!;
      const baseY = cvs.height * 0.72;
      const bx = cvs.width * 0.6;
      const bw = cvs.width * 0.12;
      const s = 4;
      // Posts
      g.fillStyle = "#8B6914";
      g.fillRect(bx, baseY - s * 4, s, s * 4);
      g.fillRect(bx + bw, baseY - s * 4, s, s * 4);
      // Rail
      g.fillRect(bx, baseY - s * 4, bw + s, s);
      // Planks
      g.fillStyle = "#a07830";
      for (let p = 0; p < bw; p += s * 1.5) {
        g.fillRect(bx + p, baseY - s * 0.5, s * 1.2, s * 0.5);
      }
    }

    function drawMumboHut() {
      const g = ctx!;
      const baseY = cvs.height * 0.72;
      const hx = cvs.width * 0.78;
      const s = 4;
      // Hut body
      g.fillStyle = "#c49850";
      g.fillRect(hx, baseY - s * 6, s * 6, s * 6);
      // Roof
      g.fillStyle = "#884422";
      g.beginPath();
      g.moveTo(hx - s, baseY - s * 6);
      g.lineTo(hx + s * 3, baseY - s * 10);
      g.lineTo(hx + s * 7, baseY - s * 6);
      g.closePath();
      g.fill();
      // Door
      g.fillStyle = "#553311";
      g.fillRect(hx + s * 1.5, baseY - s * 3, s * 2.5, s * 3);
      // Skull decoration on hut
      g.fillStyle = "#e8e0d0";
      g.fillRect(hx + s * 2, baseY - s * 5, s * 1.5, s * 1.2);
      g.fillStyle = "#332211";
      px(g, hx + s * 2.1, baseY - s * 4.6, s * 0.4, "#332211");
      px(g, hx + s * 2.8, baseY - s * 4.6, s * 0.4, "#332211");
    }

    function drawBanjo() {
      const g = ctx!;
      const bx = cvs.width * 0.28;
      const by = cvs.height * 0.72;
      const s = 5;
      const bobPhase = Math.sin(frame * 0.08);
      const bob = Math.round(bobPhase * 2);
      const kazooieBob = Math.round(Math.sin(frame * 0.12) * 1.5);

      // Shadow
      g.fillStyle = "rgba(0,0,0,0.15)";
      g.beginPath();
      g.ellipse(bx + s * 2, by, s * 3, s * 1, 0, 0, Math.PI * 2);
      g.fill();

      // Legs / feet
      g.fillStyle = "#ff9900";
      px(g, bx - s * 0.5, by - s * 2 + bob, s * 2, "#ff9900");
      px(g, bx + s * 2.5, by - s * 2 + bob, s * 2, "#ff9900");
      // Toes
      px(g, bx - s, by - s * 1.5 + bob, s, "#ffaa22");
      px(g, bx + s * 3.5, by - s * 1.5 + bob, s, "#ffaa22");

      // Yellow shorts
      px(g, bx - s * 0.5, by - s * 4 + bob, s * 5, "#ffcc00");
      px(g, bx, by - s * 3 + bob, s * 4, "#ffcc00");

      // Brown bear body
      g.fillStyle = "#8B5E3C";
      px(g, bx - s * 0.5, by - s * 7 + bob, s * 5, "#8B5E3C");
      px(g, bx, by - s * 8 + bob, s * 4, "#8B5E3C");
      // Belly (lighter)
      px(g, bx + s * 0.5, by - s * 6.5 + bob, s * 2.5, "#c49060");

      // Necklace
      px(g, bx, by - s * 7.2 + bob, s * 4, "#ffcc00");

      // Head
      g.fillStyle = "#8B5E3C";
      px(g, bx - s * 0.5, by - s * 11 + bob, s * 5, "#8B5E3C");
      px(g, bx, by - s * 12 + bob, s * 4, "#8B5E3C");
      px(g, bx + s * 0.5, by - s * 12.5 + bob, s * 3, "#8B5E3C");
      // Snout
      px(g, bx + s * 0.5, by - s * 9.5 + bob, s * 2.5, "#c4915a");
      px(g, bx + s, by - s * 9 + bob, s * 1.5, "#c4915a");
      // Nose
      px(g, bx + s * 1.2, by - s * 9.8 + bob, s * 1, "#553322");
      // Eyes
      px(g, bx, by - s * 11 + bob, s * 0.8, "#ffffff");
      px(g, bx + s * 2.5, by - s * 11 + bob, s * 0.8, "#ffffff");
      px(g, bx + s * 0.3, by - s * 10.8 + bob, s * 0.4, "#222222");
      px(g, bx + s * 2.8, by - s * 10.8 + bob, s * 0.4, "#222222");
      // Brows
      px(g, bx - s * 0.3, by - s * 11.5 + bob, s * 1.3, "#6a4422");
      px(g, bx + s * 2.2, by - s * 11.5 + bob, s * 1.3, "#6a4422");

      // Backpack (blue)
      g.fillStyle = "#2244aa";
      px(g, bx + s * 4, by - s * 7 + bob, s * 2.5, "#2244aa");
      px(g, bx + s * 4, by - s * 5 + bob, s * 2.5, "#2244aa");
      px(g, bx + s * 4.5, by - s * 8 + bob, s * 2, "#2244aa");
      // Backpack buckle
      px(g, bx + s * 4.8, by - s * 6 + bob, s * 1, "#ffcc00");

      // Kazooie poking out
      const kBob = kazooieBob;
      // Body (green/red)
      px(g, bx + s * 4.5, by - s * 9 + bob + kBob, s * 2, "#cc3333");
      px(g, bx + s * 5, by - s * 10 + bob + kBob, s * 1.5, "#cc3333");
      // Head
      px(g, bx + s * 5, by - s * 11.5 + bob + kBob, s * 2, "#cc3333");
      // Crest feathers
      px(g, bx + s * 5.5, by - s * 12.5 + bob + kBob, s * 1.5, "#dd4444");
      px(g, bx + s * 6, by - s * 13 + bob + kBob, s * 1, "#ee5555");
      // Kazooie eye
      px(g, bx + s * 5.5, by - s * 11 + bob + kBob, s * 0.6, "#ffffff");
      px(g, bx + s * 5.8, by - s * 10.8 + bob + kBob, s * 0.3, "#222222");
      // Beak
      px(g, bx + s * 7, by - s * 10.5 + bob + kBob, s * 1.5, "#ff9900");
      px(g, bx + s * 7, by - s * 10 + bob + kBob, s * 1.8, "#ffaa22");
      // Wing hints
      px(g, bx + s * 4, by - s * 9.5 + bob + kBob, s * 0.8, "#aa2222");

      // Banjo's arm (holding instrument line)
      px(g, bx - s * 0.5, by - s * 6 + bob, s * 0.8, "#8B5E3C");
    }

    function drawJiggy(j: Jiggy) {
      const g = ctx!;
      if (j.collected) return;
      j.y = j.baseY + Math.sin(frame * 0.04 + j.phase) * 8;
      j.spin += 0.03;
      j.sparkle = (j.sparkle + 1) % 40;

      const s = 4;
      const squash = 0.6 + Math.abs(Math.cos(j.spin)) * 0.4;

      g.save();
      g.translate(j.x, j.y);
      g.scale(squash, 1);

      // Glow
      g.shadowColor = "#ffdd00";
      g.shadowBlur = 12;

      // Jigsaw piece shape (simplified pixel art)
      g.fillStyle = "#ffdd00";
      g.fillRect(-s * 2, -s * 2, s * 4, s * 4);
      g.fillRect(-s, -s * 3, s * 2, s);
      g.fillRect(-s * 3, -s, s, s * 2);
      g.fillRect(s * 2, -s, s, s * 2);
      g.fillRect(-s, s * 2, s * 2, s);
      // Highlight
      g.fillStyle = "#ffee88";
      g.fillRect(-s * 1.5, -s * 1.5, s * 2, s);
      // Inner shine
      g.fillStyle = "#fff8cc";
      g.fillRect(-s, -s, s, s * 0.5);

      g.shadowBlur = 0;

      // Sparkle particles
      if (j.sparkle < 10) {
        g.fillStyle = "#ffffff";
        const sparkDist = j.sparkle * 2;
        for (let a = 0; a < 4; a++) {
          const angle = (a / 4) * Math.PI * 2 + j.sparkle * 0.3;
          g.fillRect(
            Math.cos(angle) * sparkDist * s * 0.5,
            Math.sin(angle) * sparkDist * s * 0.5,
            2, 2
          );
        }
      }

      g.restore();
    }

    function drawButterfly(b: Butterfly) {
      const g = ctx!;
      b.wingPhase += 0.15;
      b.x += b.dx;
      b.y += Math.sin(frame * 0.03 + b.wingPhase) * 0.5;

      // Bounce off edges
      if (b.x < 20 || b.x > cvs.width - 20) b.dx *= -1;
      if (b.y < cvs.height * 0.3) b.y = cvs.height * 0.3;
      if (b.y > cvs.height * 0.7) b.y = cvs.height * 0.7;

      const wingSpread = Math.sin(b.wingPhase) * 4;
      const s = 3;

      // Wings
      g.fillStyle = b.color;
      g.fillRect(b.x - s * 2 - wingSpread, b.y - s, s * 2, s * 2);
      g.fillRect(b.x + s + wingSpread, b.y - s, s * 2, s * 2);
      // Wing detail
      g.fillStyle = "#ffffff";
      g.globalAlpha = 0.4;
      g.fillRect(b.x - s * 1.5 - wingSpread, b.y - s * 0.5, s, s);
      g.fillRect(b.x + s * 1.5 + wingSpread, b.y - s * 0.5, s, s);
      g.globalAlpha = 1;
      // Body
      g.fillStyle = "#222222";
      g.fillRect(b.x - 1, b.y - s, 2, s * 2);
    }

    function drawJinjo() {
      const g = ctx!;
      const jx = cvs.width * 0.42;
      const jy = cvs.height * 0.72;
      const s = 3;
      const hop = Math.abs(Math.sin(frame * 0.06)) * 3;

      // Shadow
      g.fillStyle = "rgba(0,0,0,0.1)";
      g.beginPath();
      g.ellipse(jx + s, jy, s * 1.5, s * 0.5, 0, 0, Math.PI * 2);
      g.fill();

      // Body (yellow jinjo)
      px(g, jx, jy - s * 4 - hop, s * 2, "#ffdd00");
      px(g, jx - s * 0.3, jy - s * 3 - hop, s * 2.5, "#ffdd00");
      // Head
      px(g, jx, jy - s * 6 - hop, s * 2, "#ffdd00");
      // Top feather
      px(g, jx + s * 0.5, jy - s * 7 - hop, s, "#ffee44");
      // Eyes
      px(g, jx + s * 0.2, jy - s * 5.5 - hop, s * 0.5, "#ffffff");
      px(g, jx + s * 1.2, jy - s * 5.5 - hop, s * 0.5, "#ffffff");
      px(g, jx + s * 0.4, jy - s * 5.3 - hop, s * 0.3, "#111111");
      px(g, jx + s * 1.4, jy - s * 5.3 - hop, s * 0.3, "#111111");
      // Feet
      px(g, jx - s * 0.3, jy - s * 1.5 - hop, s, "#ffaa00");
      px(g, jx + s * 1.3, jy - s * 1.5 - hop, s, "#ffaa00");
    }

    function drawHoneycomb() {
      const g = ctx!;
      const hx = cvs.width * 0.15;
      const hy = cvs.height * 0.62;
      const s = 4;
      const bob = Math.sin(frame * 0.05 + 1) * 4;

      g.save();
      g.translate(hx, hy + bob);

      // Glow
      g.shadowColor = "#ffaa00";
      g.shadowBlur = 6;

      // Honeycomb hexagon (simplified)
      g.fillStyle = "#ffaa00";
      g.fillRect(-s * 2, -s, s * 4, s * 2);
      g.fillRect(-s * 1.5, -s * 2, s * 3, s);
      g.fillRect(-s * 1.5, s, s * 3, s);
      // Inner
      g.fillStyle = "#ffcc44";
      g.fillRect(-s, -s * 0.5, s * 2, s);

      g.shadowBlur = 0;
      g.restore();
    }

    function draw() {
      const g = ctx!;
      frame++;

      // Sky gradient
      const sky = g.createLinearGradient(0, 0, 0, cvs.height * 0.72);
      sky.addColorStop(0, "#3a7ec9");
      sky.addColorStop(0.5, "#5da0e0");
      sky.addColorStop(1, "#87ceeb");
      g.fillStyle = sky;
      g.fillRect(0, 0, cvs.width, cvs.height * 0.72);

      drawSun();

      // Clouds
      for (const cloud of clouds) {
        cloud.x += cloud.speed;
        if (cloud.x > cvs.width + cloud.w) cloud.x = -cloud.w;
        drawCloud(cloud.x, cloud.y, cloud.w, cloud.h);
      }

      // Ground gradient
      const ground = g.createLinearGradient(0, cvs.height * 0.72, 0, cvs.height);
      ground.addColorStop(0, "#3cb043");
      ground.addColorStop(1, "#2a8a2e");
      g.fillStyle = ground;
      g.fillRect(0, cvs.height * 0.72, cvs.width, cvs.height * 0.28);
      // Ground highlight
      g.fillStyle = "#4dd35a";
      g.fillRect(0, cvs.height * 0.72, cvs.width, 3);

      drawMountain();
      drawTrees();
      drawBridge();
      drawMumboHut();
      drawGrass();
      drawHoneycomb();
      drawJinjo();
      drawBanjo();

      // Jiggies
      for (const jiggy of jiggies) {
        drawJiggy(jiggy);
      }

      // Butterflies
      for (const b of butterflies) {
        drawButterfly(b);
      }

      // Floating music notes
      g.font = "20px serif";
      for (const note of notes) {
        note.y -= note.speed;
        note.opacity -= 0.004;
        if (note.opacity <= 0) {
          note.y = cvs.height * 0.45 + Math.random() * cvs.height * 0.2;
          note.opacity = 1;
          note.x = cvs.width * 0.1 + Math.random() * cvs.width * 0.8;
        }
        g.globalAlpha = note.opacity;
        g.fillStyle = "#ffdd00";
        g.shadowColor = "#ffdd00";
        g.shadowBlur = 6;
        g.fillText(note.symbol, note.x, note.y);
        g.shadowBlur = 0;
        g.globalAlpha = 1;
      }

      animId = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full"
      style={{ background: "#3a7ec9" }}
    />
  );
}
