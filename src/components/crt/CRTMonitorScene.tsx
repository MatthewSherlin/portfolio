"use client";

import { Suspense, useRef, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { Terminal } from "@/components/Terminal";
import { CRTMonitorModel } from "./CRTMonitorModel";
import { AmbientEffects } from "./AmbientEffects";
import { SCREEN_WIDTH, SCREEN_HEIGHT } from "@/lib/crt-config";

/** Project the CRT screen quad from 3D world space to viewport pixels. */
function calcScreenBounds() {
  if (typeof window === "undefined") {
    return { left: 0, top: 0, width: 0, height: 0 };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const aspect = vw / vh;
  const fovRad = (40 / 2) * (Math.PI / 180);
  const dist = 3.2 - 0.01; // camera.z - screen.z
  const cameraY = 0.05;
  const visHalfH = dist * Math.tan(fovRad);
  const visHalfW = visHalfH * aspect;
  // Inset slightly so the terminal sits within the bezel opening
  const inset = 0.06;
  const halfW = SCREEN_WIDTH / 2 - inset;
  const halfH = SCREEN_HEIGHT / 2 - inset;

  const left = ((-halfW / visHalfW + 1) / 2) * vw;
  const right = ((halfW / visHalfW + 1) / 2) * vw;
  const top = ((1 - (halfH - cameraY) / visHalfH) / 2) * vh;
  const bottom = ((1 - (-halfH - cameraY) / visHalfH) / 2) * vh;

  return { left, top, width: right - left, height: bottom - top };
}

function useScreenBounds() {
  const [bounds, setBounds] = useState(calcScreenBounds);

  useEffect(() => {
    const onResize = () => setBounds(calcScreenBounds());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return bounds;
}

function SceneContents() {
  return (
    <>
      <CRTMonitorModel />
      {/* Depth-only mask — keeps the screen area transparent by blocking the monitor interior */}
      <mesh position={[0, 0, 0.01]}>
        <planeGeometry args={[SCREEN_WIDTH, SCREEN_HEIGHT]} />
        <meshBasicMaterial colorWrite={false} />
      </mesh>
      <AmbientEffects />
    </>
  );
}

export function CRTMonitorScene() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const screenBounds = useScreenBounds();

  // Keep terminal input focused
  useEffect(() => {
    const focusInput = () => {
      const input = terminalRef.current?.querySelector("input") as HTMLInputElement | null;
      if (input && !input.disabled && document.activeElement !== input) {
        input.focus({ preventScroll: true });
      }
    };

    const timer = setTimeout(focusInput, 500);
    window.addEventListener("pointerdown", focusInput, true);
    window.addEventListener("keydown", focusInput, true);
    const interval = setInterval(focusInput, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("pointerdown", focusInput, true);
      window.removeEventListener("keydown", focusInput, true);
    };
  }, []);

  return (
    <div className="relative w-screen h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Terminal rendered directly at the CRT screen position */}
      <div
        ref={terminalRef}
        className="crt-screen"
        style={{
          position: "absolute",
          left: screenBounds.left,
          top: screenBounds.top,
          width: screenBounds.width,
          height: screenBounds.height,
          zIndex: 2,
        }}
      >
        <Terminal />
        <div className="crt-scanlines" />
        <div className="crt-vignette" />
      </div>

      {/* Three.js Canvas — monitor body with transparent screen area */}
      <Canvas
        style={{ position: "absolute", inset: 0, zIndex: 3, pointerEvents: "none" }}
        camera={{ position: [0, 0.05, 3.2], fov: 40 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <SceneContents />
        </Suspense>
      </Canvas>
    </div>
  );
}
