"use client";

import { useRef, useEffect } from "react";

/** TV static noise — canvas-based white noise. */
export function StaticNoise() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;

    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    // Capture non-null refs for use in closures
    const c = cvs;
    const g = ctx;

    let animId: number;

    function resize() {
      // Low resolution for performance + retro look
      c.width = Math.floor(c.offsetWidth / 4);
      c.height = Math.floor(c.offsetHeight / 4);
    }

    resize();
    window.addEventListener("resize", resize);

    function draw() {
      const imageData = g.createImageData(c.width, c.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const v = Math.random() * 255;
        data[i] = v;
        data[i + 1] = v;
        data[i + 2] = v;
        data[i + 3] = 255;
      }

      g.putImageData(imageData, 0, 0);
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
      style={{ background: "#000", imageRendering: "pixelated" }}
    />
  );
}
