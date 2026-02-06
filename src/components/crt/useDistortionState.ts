"use client";

import { useRef, useCallback, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { DISTORTION_CONFIG } from "@/lib/crt-config";

export interface DistortionState {
  emiOffset: number;
  emiY: number;
  emiBandWidth: number;
  signalStrength: number;
  hSyncOffset: number;
  vRollSpeed: number;
  vRollOffset: number;
  brightness: number;
  colorDrift: number;
}

function createInitialState(): DistortionState {
  return {
    emiOffset: 0,
    emiY: 0,
    emiBandWidth: 0,
    signalStrength: 1,
    hSyncOffset: 0,
    vRollSpeed: 0,
    vRollOffset: 0,
    brightness: 1,
    colorDrift: 0,
  };
}

export function useDistortionState() {
  const state = useRef<DistortionState>(createInitialState());
  const emiTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vRollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const celebrationHoldRef = useRef(false);

  // Listen for celebration CRT static effect
  useEffect(() => {
    const handler = (e: Event) => {
      const { phase } = (e as CustomEvent).detail;
      const s = state.current;
      if (phase === "start") {
        celebrationHoldRef.current = true;
        s.signalStrength = 0.1;
        s.hSyncOffset = 0.15;
        s.vRollSpeed = 2.0;
        s.colorDrift = 5.0;
      } else if (phase === "end") {
        celebrationHoldRef.current = false;
        s.vRollSpeed = 0;
      }
    };
    window.addEventListener("crt-celebration", handler);
    return () => window.removeEventListener("crt-celebration", handler);
  }, []);

  const update = useCallback((delta: number) => {
    const s = state.current;
    const cfg = DISTORTION_CONFIG;

    // EMI interference: random horizontal displacement band
    if (
      s.emiOffset === 0 &&
      Math.random() < cfg.emiChancePerSecond * delta
    ) {
      s.emiY = Math.random();
      s.emiBandWidth =
        cfg.emiBandWidthMin +
        Math.random() * (cfg.emiBandWidthMax - cfg.emiBandWidthMin);
      s.emiOffset = (Math.random() - 0.5) * 2 * cfg.emiMaxOffset;

      const duration =
        cfg.emiDurationMin +
        Math.random() * (cfg.emiDurationMax - cfg.emiDurationMin);

      if (emiTimeout.current) clearTimeout(emiTimeout.current);
      emiTimeout.current = setTimeout(() => {
        state.current.emiOffset = 0;
      }, duration);
    }

    // Signal degradation
    if (
      !celebrationHoldRef.current &&
      s.signalStrength > 0.95 &&
      Math.random() < cfg.signalDropChance * delta
    ) {
      s.signalStrength = 0.3 + Math.random() * 0.5;
    }
    if (!celebrationHoldRef.current) {
      s.signalStrength += (1.0 - s.signalStrength) * cfg.signalRecoveryRate * delta;
      s.signalStrength = Math.min(s.signalStrength, 1.0);
    }

    // H-sync jitter
    if (
      Math.abs(s.hSyncOffset) < 0.001 &&
      Math.random() < cfg.hSyncChance * delta
    ) {
      s.hSyncOffset = (Math.random() - 0.5) * 2 * cfg.hSyncMaxOffset;
    }
    s.hSyncOffset *= Math.pow(cfg.hSyncDecay, delta * 60);
    if (Math.abs(s.hSyncOffset) < 0.0001) s.hSyncOffset = 0;

    // Vertical roll
    if (
      s.vRollSpeed === 0 &&
      Math.random() < cfg.vRollChance * delta
    ) {
      s.vRollSpeed =
        cfg.vRollSpeedMin +
        Math.random() * (cfg.vRollSpeedMax - cfg.vRollSpeedMin);

      const duration =
        cfg.vRollDurationMin +
        Math.random() * (cfg.vRollDurationMax - cfg.vRollDurationMin);

      if (vRollTimeout.current) clearTimeout(vRollTimeout.current);
      vRollTimeout.current = setTimeout(() => {
        state.current.vRollSpeed = 0;
      }, duration);
    }
    s.vRollOffset += s.vRollSpeed * delta;
    // Decay vRollOffset back toward 0 when not rolling
    if (s.vRollSpeed === 0) {
      s.vRollOffset *= Math.pow(0.95, delta * 60);
      if (Math.abs(s.vRollOffset) < 0.001) s.vRollOffset = 0;
    }

    // Continuous brightness flicker (multi-frequency)
    const t = performance.now() * 0.001;
    s.brightness =
      0.97 +
      Math.sin(t * 6.3) * 0.012 +
      Math.sin(t * 23.1) * 0.008 +
      Math.sin(t * 1.7) * 0.015 +
      (Math.random() - 0.5) * 0.008;

    // Color drift (slow wandering)
    s.colorDrift = Math.sin(t * 0.3) * 0.5 + Math.sin(t * 0.8) * 0.3;
  }, []);

  useEffect(() => {
    return () => {
      if (emiTimeout.current) clearTimeout(emiTimeout.current);
      if (vRollTimeout.current) clearTimeout(vRollTimeout.current);
    };
  }, []);

  useFrame((_, delta) => {
    update(Math.min(delta, 0.1));
  });

  return state;
}
