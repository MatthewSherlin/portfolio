"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  BEZEL_HEIGHT,
  CRT_CONFIG,
  PARTICLE_CONFIG,
} from "@/lib/crt-config";

const DEG2RAD = Math.PI / 180;

function DustParticles() {
  const pointsRef = useRef<THREE.Points>(null);
  const cfg = PARTICLE_CONFIG;

  const { positions, velocities } = useMemo(() => {
    const positions = new Float32Array(cfg.count * 3);
    const velocities = new Float32Array(cfg.count * 3);

    for (let i = 0; i < cfg.count; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * cfg.spread[0];
      positions[i3 + 1] = (Math.random() - 0.5) * cfg.spread[1];
      positions[i3 + 2] = Math.random() * cfg.spread[2] - 0.5;

      velocities[i3] = (Math.random() - 0.5) * cfg.speed;
      velocities[i3 + 1] = (Math.random() - 0.5) * cfg.speed * 0.5;
      velocities[i3 + 2] = (Math.random() - 0.5) * cfg.speed * 0.3;
    }
    return { positions, velocities };
  }, [cfg.count, cfg.spread, cfg.speed]);

  // Listen for theme changes to update particle color
  useEffect(() => {
    const handler = (e: Event) => {
      const theme = (e as CustomEvent).detail;
      if (pointsRef.current) {
        const mat = pointsRef.current.material as THREE.PointsMaterial;
        mat.color.set(theme.threeGlow);
      }
    };
    window.addEventListener("themechange", handler);
    return () => window.removeEventListener("themechange", handler);
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const pos = pointsRef.current.geometry.attributes.position
      .array as Float32Array;

    for (let i = 0; i < cfg.count; i++) {
      const i3 = i * 3;
      pos[i3] += velocities[i3] * delta * 60;
      pos[i3 + 1] += velocities[i3 + 1] * delta * 60;
      pos[i3 + 2] += velocities[i3 + 2] * delta * 60;

      // Wrap around bounds
      const hw = cfg.spread[0] / 2;
      const hh = cfg.spread[1] / 2;
      const hd = cfg.spread[2];
      if (pos[i3] > hw) pos[i3] = -hw;
      if (pos[i3] < -hw) pos[i3] = hw;
      if (pos[i3 + 1] > hh) pos[i3 + 1] = -hh;
      if (pos[i3 + 1] < -hh) pos[i3 + 1] = hh;
      if (pos[i3 + 2] > hd / 2) pos[i3 + 2] = -0.5;
      if (pos[i3 + 2] < -0.5) pos[i3 + 2] = hd / 2;
    }
    pointsRef.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial
        size={cfg.size}
        color={0xffb000}
        transparent
        opacity={cfg.opacity}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

function ColorCycler({
  glowLightRef,
  fillLightRef,
}: {
  glowLightRef: React.RefObject<THREE.SpotLight | null>;
  fillLightRef: React.RefObject<THREE.PointLight | null>;
}) {
  const discoModeRef = useRef(false);

  useEffect(() => {
    const discoHandler = () => {
      discoModeRef.current = !discoModeRef.current;
    };
    window.addEventListener("disco-mode-toggle", discoHandler);
    return () => {
      window.removeEventListener("disco-mode-toggle", discoHandler);
    };
  }, []);

  useFrame(() => {
    if (!discoModeRef.current) return;

    const hue = (performance.now() * 0.5) % 360;
    const color = new THREE.Color(`hsl(${hue}, 100%, 50%)`);

    if (glowLightRef.current) {
      glowLightRef.current.color.copy(color);
    }
    if (fillLightRef.current) {
      fillLightRef.current.color.copy(color);
    }
  });

  return null;
}

export function AmbientEffects() {
  const deskY = -BEZEL_HEIGHT / 2 - 0.39;
  const glowLightRef = useRef<THREE.SpotLight>(null);
  const glowTargetRef = useRef<THREE.Object3D>(null);
  const fillLightRef = useRef<THREE.PointLight>(null);
  const bezelGlowRef = useRef<THREE.PointLight>(null);

  const powerOnRef = useRef(true);

  // Listen for theme changes — update forward glow AND bezel spill light.
  useEffect(() => {
    const handler = (e: Event) => {
      const theme = (e as CustomEvent).detail;
      if (!powerOnRef.current) return; // Don't update colors while off
      if (glowLightRef.current) {
        glowLightRef.current.color.set(theme.threeGlow);
      }
      if (bezelGlowRef.current) {
        bezelGlowRef.current.color.set(theme.threeGlow);
      }
    };
    window.addEventListener("themechange", handler);
    return () => window.removeEventListener("themechange", handler);
  }, []);

  // Listen for power toggle — kill/restore screen glow lights
  useEffect(() => {
    const handler = (e: Event) => {
      const on = (e as CustomEvent).detail.on;
      powerOnRef.current = on;
      if (glowLightRef.current) {
        glowLightRef.current.intensity = on ? CRT_CONFIG.glowIntensity * 2.8 : 0;
      }
      if (bezelGlowRef.current) {
        bezelGlowRef.current.intensity = on ? 0.8 : 0;
      }
    };
    window.addEventListener("power-toggle", handler);
    return () => window.removeEventListener("power-toggle", handler);
  }, []);

  // Point the SpotLight at its target once both are mounted
  useEffect(() => {
    if (glowLightRef.current && glowTargetRef.current) {
      glowLightRef.current.target = glowTargetRef.current;
    }
  }, []);

  return (
    <group>
      {/* Ambient light for overall scene visibility */}
      <ambientLight intensity={0.3} color={0xdddde8} />

      {/* Key light — illuminates the monitor body from above-front */}
      <directionalLight
        position={[1, 2, 2.5]}
        intensity={0.8}
        color={0xfff4e8}
      />
      {/* Fill light from the opposite side to reduce harsh shadows */}
      <directionalLight
        position={[-1, 0.5, 2]}
        intensity={0.3}
        color={0xe8e0f0}
      />

      {/* Screen glow — SpotLight aimed FORWARD from screen surface.
          A real CRT emits light into the room, not onto its own body. */}
      <spotLight
        ref={glowLightRef}
        position={[0, 0, 0.3]}
        intensity={CRT_CONFIG.glowIntensity * 2.8}
        color={0xffb000}
        distance={7}
        decay={2}
        angle={75 * DEG2RAD}
        penumbra={0.7}
      />
      {/* SpotLight target — forward and slightly down (desk bounce) */}
      <object3D ref={glowTargetRef} position={[0, -0.2, 3.5]} />

      {/* Screen spill — theme-colored light that illuminates the bezel/case */}
      <pointLight
        ref={bezelGlowRef}
        position={[0, 0, 0.2]}
        intensity={0.8}
        color={0xffb000}
        distance={2.5}
        decay={2}
      />

      {/* Fill light from below (warm neutral — NOT theme-colored) */}
      <pointLight
        ref={fillLightRef}
        position={[0, deskY + 0.1, 0.8]}
        intensity={1.5}
        color={0xffd9a0}
        distance={4}
        decay={2}
      />

      {/* Desk surface — dark wood */}
      <mesh
        position={[0, deskY, 0.2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[5, 3]} />
        <meshStandardMaterial
          color={0x2a2018}
          roughness={0.85}
          metalness={0.02}
        />
      </mesh>

      {/* Back wall */}
      <mesh position={[0, 0.5, -2]}>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial
          color={0x151515}
          roughness={1}
          metalness={0}
        />
      </mesh>

      {/* Dust particles floating in the light */}
      <DustParticles />

      {/* Party / disco color cycling */}
      <ColorCycler glowLightRef={glowLightRef} fillLightRef={fillLightRef} />
    </group>
  );
}
