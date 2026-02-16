"use client";

import { Suspense, useRef, useEffect, useState, useCallback } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Terminal } from "@/components/Terminal";
import { CRTMonitorModel, BUTTON_Y, BUTTON_Z, BUTTON_PROTRUSION, POWER_X, BRIGHT_DOWN_X, BRIGHT_UP_X } from "./CRTMonitorModel";
import { AmbientEffects } from "./AmbientEffects";
import { SCREEN_WIDTH, SCREEN_HEIGHT } from "@/lib/crt-config";
import { soundManager } from "@/lib/sound-manager";
import { hasUnlock } from "@/lib/unlocks";
import { CHANNELS } from "@/components/channels";
import { DVDLogo } from "@/components/channels/DVDLogo";
import { BanjoKazooie } from "@/components/channels/BanjoKazooie";
import { ColorBars } from "@/components/channels/ColorBars";
import { StaticNoise } from "@/components/channels/StaticNoise";
import { StaticTransition } from "@/components/channels/StaticTransition";
import { ChannelOSD } from "@/components/channels/ChannelOSD";

/** Compute a responsive FOV that ensures the CRT screen fits within the viewport width. */
function getResponsiveFov(): number {
  if (typeof window === "undefined") return 40;
  const aspect = window.innerWidth / window.innerHeight;
  if (aspect >= 1) return 40; // Landscape: default FOV
  // Portrait: compute minimum FOV so the screen fits with small margins
  const halfW = SCREEN_WIDTH / 2 - 0.06;
  const dist = 3.19;
  const margin = 0.94; // screen uses 94% of viewport width
  const minTan = halfW / (dist * aspect * margin);
  const fov = Math.atan(minTan) * 2 * (180 / Math.PI);
  return Math.min(85, Math.max(40, fov));
}

/** Project the CRT screen quad from 3D world space to viewport pixels. */
function calcScreenBounds() {
  if (typeof window === "undefined") {
    return { left: 0, top: 0, width: 0, height: 0, fov: 40, mobilePortrait: false };
  }
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const fov = getResponsiveFov();

  // Portrait phones: fill the viewport for usability
  if (vw < 640 && vh > vw) {
    const pad = 4;
    return { left: pad, top: pad, width: vw - pad * 2, height: vh - pad * 2, fov, mobilePortrait: true };
  }

  const aspect = vw / vh;
  const fovRad = (fov / 2) * (Math.PI / 180);
  const dist = 3.2 - 0.01; // camera.z - screen.z
  const cameraY = 0.05;
  const visHalfH = dist * Math.tan(fovRad);
  const visHalfW = visHalfH * aspect;
  // Inset slightly so the terminal sits within the bezel opening
  const inset = 0.06;
  const halfW = SCREEN_WIDTH / 2 - inset;
  const halfH = SCREEN_HEIGHT / 2 - inset;
  // Shift screen center up slightly to match bezel opening
  const screenCenterY = 0.08;

  const left = ((-halfW / visHalfW + 1) / 2) * vw;
  const right = ((halfW / visHalfW + 1) / 2) * vw;
  const top = ((1 - (halfH + screenCenterY - cameraY) / visHalfH) / 2) * vh;
  const bottom = ((1 - (-halfH + screenCenterY - cameraY) / visHalfH) / 2) * vh;

  return { left, top, width: right - left, height: bottom - top, fov, mobilePortrait: false };
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

/** Imperatively sync camera FOV on resize (Canvas camera prop is read-once). */
function ResponsiveCamera({ fov }: { fov: number }) {
  const { camera } = useThree();
  useEffect(() => {
    if (camera instanceof THREE.PerspectiveCamera) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
    }
  }, [camera, fov]);
  return null;
}

function SceneContents({ fov }: { fov: number }) {
  return (
    <>
      <ResponsiveCamera fov={fov} />
      <CRTMonitorModel />
      <AmbientEffects />
    </>
  );
}

/** Project a single 3D point to viewport pixels using the same camera math. */
function projectPoint(x: number, y: number, z: number) {
  if (typeof window === "undefined") return { x: 0, y: 0 };
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const aspect = vw / vh;
  const fov = getResponsiveFov();
  const fovRad = (fov / 2) * (Math.PI / 180);
  const dist = 3.2 - z;
  const cameraY = 0.05;
  const visHalfH = dist * Math.tan(fovRad);
  const visHalfW = visHalfH * aspect;

  const px = ((x / visHalfW + 1) / 2) * vw;
  const py = ((1 - (y - cameraY) / visHalfH) / 2) * vh;
  return { x: px, y: py };
}

const BRIGHTNESS_STEP = 0.15;
const BRIGHTNESS_MIN = 0.4;
const BRIGHTNESS_MAX = 1.6;

export function CRTMonitorScene() {
  const terminalRef = useRef<HTMLDivElement>(null);
  const screenBounds = useScreenBounds();
  const [screenOff, setScreenOff] = useState(false);
  const [transitionClass, setTransitionClass] = useState("");
  const [brightness, setBrightness] = useState(1.0);

  // Channel system state
  const [channelsUnlocked, setChannelsUnlocked] = useState(() =>
    typeof window !== "undefined" ? hasUnlock("channels") : false
  );
  const [currentChannel, setCurrentChannel] = useState(1);
  const [showStaticTransition, setShowStaticTransition] = useState(false);
  const [showOSD, setShowOSD] = useState(false);
  const osdKeyRef = useRef(0);

  // Keep terminal input focused (only when on terminal channel)
  useEffect(() => {
    if (screenOff || currentChannel !== 1) return;
    const isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
    const focusInput = () => {
      const input = terminalRef.current?.querySelector("input") as HTMLInputElement | null;
      if (input && !input.disabled && document.activeElement !== input) {
        input.focus({ preventScroll: true });
      }
    };

    const timer = setTimeout(focusInput, 500);

    // On touch devices, don't grab focus on every tap or on an interval —
    // it causes keyboard flashing and interferes with scrolling.
    // Only re-focus on keydown (for external keyboards).
    if (isTouchDevice) {
      window.addEventListener("keydown", focusInput, true);
      return () => {
        clearTimeout(timer);
        window.removeEventListener("keydown", focusInput, true);
      };
    }

    window.addEventListener("pointerdown", focusInput, true);
    window.addEventListener("keydown", focusInput, true);
    const interval = setInterval(focusInput, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("pointerdown", focusInput, true);
      window.removeEventListener("keydown", focusInput, true);
    };
  }, [screenOff, currentChannel]);

  // Listen for theme changes to trigger glitch (skip the initial theme load)
  useEffect(() => {
    let ready = false;
    const readyTimer = setTimeout(() => { ready = true; }, 3500);
    const handler = () => {
      if (!ready) return;
      setTransitionClass("theme-glitch");
      setTimeout(() => setTransitionClass(""), 250);
    };
    window.addEventListener("themechange", handler);
    return () => {
      clearTimeout(readyTimer);
      window.removeEventListener("themechange", handler);
    };
  }, []);

  // Listen for Konami code unlock
  useEffect(() => {
    const handler = () => {
      setChannelsUnlocked(true);
    };
    window.addEventListener("konami-unlocked", handler);
    return () => window.removeEventListener("konami-unlocked", handler);
  }, []);

  // Listen for channel-change commands from the terminal
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.channel) {
        changeChannel(detail.channel);
      }
    };
    window.addEventListener("channel-change", handler);
    return () => window.removeEventListener("channel-change", handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen for meltdown events (rm -rf /)
  const [meltdownClass, setMeltdownClass] = useState("");
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail?.phase === "start") {
        setMeltdownClass("meltdown-active");
      } else if (detail?.phase === "end") {
        setMeltdownClass("");
      }
    };
    window.addEventListener("meltdown", handler);
    return () => window.removeEventListener("meltdown", handler);
  }, []);

  const changeChannel = useCallback((newChannel: number) => {
    if (newChannel < 1 || newChannel > CHANNELS.length) return;
    if (newChannel === currentChannel) return;

    soundManager.channelChange();
    setShowStaticTransition(true);

    // After static clears, switch channel and show OSD
    setTimeout(() => {
      setCurrentChannel(newChannel);
      setShowStaticTransition(false);
      osdKeyRef.current++;
      setShowOSD(true);
    }, 300);
  }, [currentChannel]);

  const handlePowerToggle = useCallback(() => {
    if (screenOff) {
      // Turn on — always return to terminal channel
      soundManager.powerOn();
      setScreenOff(false);
      setCurrentChannel(1);
      setTransitionClass("crt-turning-on");
      setTimeout(() => setTransitionClass(""), 450);
      window.dispatchEvent(new CustomEvent("power-toggle", { detail: { on: true } }));
    } else {
      // Turn off
      soundManager.powerDown();
      setTransitionClass("crt-turning-off");
      setTimeout(() => {
        setScreenOff(true);
        setTransitionClass("");
      }, 350);
      window.dispatchEvent(new CustomEvent("power-toggle", { detail: { on: false } }));
    }
  }, [screenOff]);

  const handleBrightnessDown = useCallback(() => {
    setBrightness((b) => Math.max(BRIGHTNESS_MIN, b - BRIGHTNESS_STEP));
  }, []);

  const handleBrightnessUp = useCallback(() => {
    setBrightness((b) => Math.min(BRIGHTNESS_MAX, b + BRIGHTNESS_STEP));
  }, []);

  // Dispatch press/release events for 3D button animation
  const dispatchBtnDown = useCallback((button: string) => {
    window.dispatchEvent(new CustomEvent("bezel-btn-down", { detail: { button } }));
    if (button !== "power") soundManager.buttonClick();
  }, []);
  const dispatchBtnUp = useCallback((button: string) => {
    window.dispatchEvent(new CustomEvent("bezel-btn-up", { detail: { button } }));
  }, []);

  // Brightness buttons always control brightness — channels are via commands only

  // Project bezel button positions to viewport using front-face Z for accuracy.
  // The manual projection slightly undershoots vs Three.js rendering at the
  // bottom of the viewport, so we apply a small upward correction.
  const btnYCorrection = -30;
  const frontZ = BUTTON_Z + BUTTON_PROTRUSION;
  const powerPos = projectPoint(POWER_X, BUTTON_Y, frontZ);
  const brightDownPos = projectPoint(BRIGHT_DOWN_X, BUTTON_Y, frontZ);
  const brightUpPos = projectPoint(BRIGHT_UP_X, BUTTON_Y, frontZ);
  powerPos.y += btnYCorrection;
  brightDownPos.y += btnYCorrection;
  brightUpPos.y += btnYCorrection;

  // Hit areas sized to match the larger 3D buttons (larger on touch devices)
  const isTouch = typeof window !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
  const powerHitSize = isTouch ? 64 : 56;
  const brightHitSize = isTouch ? 56 : 48;

  const leftLabel = "Brightness -";
  const rightLabel = "Brightness +";

  // Render channel content
  const channelContent = (() => {
    if (screenOff) return null;
    switch (currentChannel) {
      case 1:
        return <Terminal />;
      case 2:
        return <DVDLogo />;
      case 3:
        return <BanjoKazooie />;
      case 4:
        return <ColorBars />;
      case 5:
        return <StaticNoise />;
      default:
        return <Terminal />;
    }
  })();

  const activeChannel = CHANNELS[currentChannel - 1];

  return (
    <div className="relative w-screen h-screen bg-[#0a0a0a] overflow-hidden">
      {/* Terminal/Channel rendered directly at the CRT screen position */}
      <div
        ref={terminalRef}
        className={`crt-screen ${screenOff ? "crt-screen-off" : ""} ${transitionClass} ${meltdownClass}`}
        style={{
          position: "absolute",
          left: screenBounds.left,
          top: screenBounds.top,
          width: screenBounds.width,
          height: screenBounds.height,
          zIndex: 2,
          filter: `brightness(${brightness})`,
        }}
      >
        {channelContent}

        {/* CRT sweep line (electron beam refresh bar) */}
        {!screenOff && <div className="crt-sweep-line" />}

        {/* Static transition overlay */}
        <StaticTransition active={showStaticTransition} />

        {/* Channel OSD */}
        {channelsUnlocked && activeChannel && (
          <ChannelOSD
            key={osdKeyRef.current}
            channelId={activeChannel.id}
            channelLabel={activeChannel.label}
            show={showOSD}
          />
        )}
      </div>

      {!screenBounds.mobilePortrait && (<>
      {/* Power button — positioned over the 3D button */}
      <button
        onPointerDown={() => dispatchBtnDown("power")}
        onPointerUp={() => { dispatchBtnUp("power"); handlePowerToggle(); }}
        onPointerLeave={() => dispatchBtnUp("power")}
        aria-label="Power toggle"
        title="Power"
        style={{
          position: "absolute",
          zIndex: 4,
          left: powerPos.x - powerHitSize / 2,
          top: powerPos.y - powerHitSize / 2,
          width: powerHitSize,
          height: powerHitSize,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          borderRadius: "50%",
          padding: 0,
        }}
      />
      {/* Left button (-) — brightness down */}
      <button
        onPointerDown={() => dispatchBtnDown("brightDown")}
        onPointerUp={() => { dispatchBtnUp("brightDown"); handleBrightnessDown(); }}
        onPointerLeave={() => dispatchBtnUp("brightDown")}
        aria-label={leftLabel}
        title={leftLabel}
        style={{
          position: "absolute",
          zIndex: 4,
          left: brightDownPos.x - brightHitSize / 2,
          top: brightDownPos.y - brightHitSize / 2,
          width: brightHitSize,
          height: brightHitSize,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          borderRadius: "4px",
          padding: 0,
        }}
      />
      {/* Right button (+) — brightness up */}
      <button
        onPointerDown={() => dispatchBtnDown("brightUp")}
        onPointerUp={() => { dispatchBtnUp("brightUp"); handleBrightnessUp(); }}
        onPointerLeave={() => dispatchBtnUp("brightUp")}
        aria-label={rightLabel}
        title={rightLabel}
        style={{
          position: "absolute",
          zIndex: 4,
          left: brightUpPos.x - brightHitSize / 2,
          top: brightUpPos.y - brightHitSize / 2,
          width: brightHitSize,
          height: brightHitSize,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          borderRadius: "4px",
          padding: 0,
        }}
      />
      </>)}

      {/* Three.js Canvas — monitor body BEHIND the terminal (skip on portrait phones to save GPU/battery) */}
      {!screenBounds.mobilePortrait && (
        <Canvas
          style={{ position: "absolute", inset: 0, zIndex: 1, pointerEvents: "none" }}
          camera={{ position: [0, 0.05, 3.2], fov: screenBounds.fov }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: isTouch ? "default" : "high-performance",
          }}
          dpr={[1, isTouch ? 1.25 : 1.5]}
        >
          <Suspense fallback={null}>
            <SceneContents fov={screenBounds.fov} />
          </Suspense>
        </Canvas>
      )}
    </div>
  );
}
