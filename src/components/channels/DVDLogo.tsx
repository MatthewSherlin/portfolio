"use client";

import { useRef, useEffect } from "react";

const COLORS = ["#ff0000", "#ff8800", "#ffff00", "#00ff00", "#0088ff", "#ff00ff", "#00ffff"];

export function DVDLogo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const ctx = el.getContext("2d");
    if (!ctx) return;
    const cvs = el; // const reassignment so TS knows non-null in closures

    let animId: number;
    const logoW = 120;
    const logoH = 55;
    let x = Math.random() * 200 + 50;
    let y = Math.random() * 150 + 50;
    let dx = 1.5;
    let dy = 1.2;
    let colorIdx = 0;

    function resize() {
      cvs.width = cvs.offsetWidth;
      cvs.height = cvs.offsetHeight;
      // Keep logo in bounds after resize
      x = Math.min(x, cvs.width - logoW);
      y = Math.min(y, cvs.height - logoH);
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      ctx!.fillStyle = "#000";
      ctx!.fillRect(0, 0, cvs.width, cvs.height);

      const color = COLORS[colorIdx];

      // Draw "DVD" text with glow
      ctx!.save();
      ctx!.font = "bold 36px monospace";
      ctx!.textAlign = "center";
      ctx!.textBaseline = "middle";
      ctx!.shadowColor = color;
      ctx!.shadowBlur = 20;
      ctx!.fillStyle = color;
      ctx!.fillText("DVD", x + logoW / 2, y + logoH / 2);
      // Double-draw for stronger glow
      ctx!.fillText("DVD", x + logoW / 2, y + logoH / 2);
      ctx!.restore();

      // Move
      x += dx;
      y += dy;

      // Bounce
      let hit = false;
      if (x <= 0) { x = 0; dx = Math.abs(dx); hit = true; }
      if (x + logoW >= cvs.width) { x = cvs.width - logoW; dx = -Math.abs(dx); hit = true; }
      if (y <= 0) { y = 0; dy = Math.abs(dy); hit = true; }
      if (y + logoH >= cvs.height) { y = cvs.height - logoH; dy = -Math.abs(dy); hit = true; }

      if (hit) {
        colorIdx = (colorIdx + 1) % COLORS.length;
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
      style={{ background: "#000" }}
    />
  );
}
