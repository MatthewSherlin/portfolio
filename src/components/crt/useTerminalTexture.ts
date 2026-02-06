"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import html2canvas from "html2canvas";
import { TERMINAL_WIDTH, TERMINAL_HEIGHT } from "@/lib/crt-config";

export function useTerminalTexture(
  containerRef: React.RefObject<HTMLDivElement | null>
) {
  const [texture, setTexture] = useState<THREE.CanvasTexture | null>(null);
  const offscreenCanvas = useRef<HTMLCanvasElement | null>(null);
  const capturing = useRef(false);

  useEffect(() => {
    const canvas = document.createElement("canvas");
    canvas.width = TERMINAL_WIDTH;
    canvas.height = TERMINAL_HEIGHT;
    offscreenCanvas.current = canvas;

    // Fill with CRT background color initially
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#221c0e";
      ctx.fillRect(0, 0, TERMINAL_WIDTH, TERMINAL_HEIGHT);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    setTexture(tex);

    let running = true;
    let dirty = true; // Start dirty to capture initial content

    // Watch for DOM changes in the terminal to avoid unnecessary captures
    let observer: MutationObserver | null = null;
    if (containerRef.current) {
      observer = new MutationObserver(() => {
        dirty = true;
      });
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
      });
    }

    const capture = async () => {
      if (!running || !containerRef.current || capturing.current || !dirty)
        return;
      capturing.current = true;
      dirty = false;
      try {
        await html2canvas(containerRef.current, {
          canvas: offscreenCanvas.current!,
          backgroundColor: "#221c0e",
          scale: 1,
          logging: false,
          useCORS: true,
          width: TERMINAL_WIDTH,
          height: TERMINAL_HEIGHT,
          windowWidth: TERMINAL_WIDTH,
          windowHeight: TERMINAL_HEIGHT,
          x: 0,
          y: 0,
          scrollX: 0,
          scrollY: 0,
        });
        if (tex) {
          tex.needsUpdate = true;
        }
      } catch {
        // Mark dirty again so we retry next interval
        dirty = true;
      }
      capturing.current = false;
    };

    // Capture at ~4fps — terminal text doesn't change faster than this
    const interval = setInterval(capture, 250);

    // Initial captures with staggered delays for DOM/fonts to settle
    setTimeout(capture, 200);
    setTimeout(capture, 600);
    setTimeout(capture, 1200);

    return () => {
      running = false;
      clearInterval(interval);
      observer?.disconnect();
      tex.dispose();
    };
  }, [containerRef]);

  return texture;
}
