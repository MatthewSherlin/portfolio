"use client";

import { useRef, useEffect, useState } from "react";

interface StaticTransitionProps {
  active: boolean;
  duration?: number;
  onComplete?: () => void;
}

/** Brief TV static burst between channel changes (~300ms). */
export function StaticTransition({ active, duration = 300, onComplete }: StaticTransitionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!active) {
      setVisible(false);
      return;
    }

    setVisible(true);
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [active, duration, onComplete]);

  useEffect(() => {
    if (!visible) return;

    const cvs = canvasRef.current;
    if (!cvs) return;

    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    // Capture non-null refs for use in closures
    const c = cvs;
    const g = ctx;

    c.width = Math.floor(c.offsetWidth / 3);
    c.height = Math.floor(c.offsetHeight / 3);

    let animId: number;

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

    return () => cancelAnimationFrame(animId);
  }, [visible]);

  if (!visible) return null;

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full"
      style={{
        zIndex: 20,
        imageRendering: "pixelated",
        background: "#000",
      }}
    />
  );
}
