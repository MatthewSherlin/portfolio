// Terminal capture dimensions (pixels)
export const TERMINAL_WIDTH = 1024;
export const TERMINAL_HEIGHT = 768;

// Screen mesh dimensions (Three.js units)
export const SCREEN_WIDTH = 2.4;
export const SCREEN_HEIGHT = 1.8;
export const SCREEN_CURVATURE = 0.06;

// Bezel dimensions
export const BEZEL_WIDTH = 2.7;
export const BEZEL_HEIGHT = 2.15;
export const BEZEL_DEPTH = 0.3;
export const BEZEL_CORNER_RADIUS = 0.12;

// Shader effect intensities
export const CRT_CONFIG = {
  barrelDistortion: 0.1,
  chromaticAberration: 0.003,
  scanlineIntensity: 0.06,
  scanlineSweepSpeed: 0.04,
  phosphorIntensity: 0.1,
  vignetteRadius: 0.65,
  vignetteSoftness: 0.45,
  noiseIntensity: 0.02,
  screenBrightness: 1.6,
  glowIntensity: 2.0,
} as const;

// Distortion event probabilities (per second)
export const DISTORTION_CONFIG = {
  emiChancePerSecond: 0.05,
  emiDurationMin: 200,
  emiDurationMax: 800,
  emiMaxOffset: 0.03,
  emiBandWidthMin: 0.02,
  emiBandWidthMax: 0.1,
  signalDropChance: 0.02,
  signalRecoveryRate: 3.0,
  hSyncChance: 0.01,
  hSyncMaxOffset: 0.05,
  hSyncDecay: 0.95,
  vRollChance: 0.005,
  vRollDurationMin: 2000,
  vRollDurationMax: 4000,
  vRollSpeedMin: 0.15,
  vRollSpeedMax: 0.4,
} as const;

// Particle system
export const PARTICLE_CONFIG = {
  count: 20,
  size: 0.008,
  opacity: 0.2,
  speed: 0.008,
  spread: [3.5, 2.5, 2.0] as readonly [number, number, number],
} as const;
