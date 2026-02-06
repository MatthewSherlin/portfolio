"use client";

import { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  BEZEL_HEIGHT,
  CRT_CONFIG,
  PARTICLE_CONFIG,
} from "@/lib/crt-config";

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
  glowLightRef: React.RefObject<THREE.PointLight | null>;
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
  const glowLightRef = useRef<THREE.PointLight>(null);
  const fillLightRef = useRef<THREE.PointLight>(null);

  // Listen for theme changes — only update screen glow light.
  // Fill light stays warm neutral so the monitor body keeps its natural color.
  useEffect(() => {
    const handler = (e: Event) => {
      const theme = (e as CustomEvent).detail;
      if (glowLightRef.current) {
        glowLightRef.current.color.set(theme.threeGlow);
      }
    };
    window.addEventListener("themechange", handler);
    return () => window.removeEventListener("themechange", handler);
  }, []);

  return (
    <group>
      {/* Ambient light for overall scene visibility */}
      <ambientLight intensity={0.35} color={0x9999bb} />

      {/* Screen glow -- main light */}
      <pointLight
        ref={glowLightRef}
        position={[0, 0, 0.8]}
        intensity={CRT_CONFIG.glowIntensity * 2.4}
        color={0xffb000}
        distance={5}
        decay={2}
      />

      {/* Fill light from below (bounce off desk) */}
      <pointLight
        ref={fillLightRef}
        position={[0, deskY + 0.1, 0.8]}
        intensity={1.2}
        color={0xffb000}
        distance={3}
        decay={2}
      />

      {/* Desk surface */}
      <mesh
        position={[0, deskY, 0.2]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[5, 3]} />
        <meshStandardMaterial
          color={0x3d3228}
          roughness={0.88}
          metalness={0.0}
        />
      </mesh>

      {/* Back wall (very far, very dark) */}
      <mesh position={[0, 0.5, -2]}>
        <planeGeometry args={[8, 5]} />
        <meshStandardMaterial
          color={0x1e1e1e}
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
