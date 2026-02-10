"use client";

import { useMemo, useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import {
  BEZEL_WIDTH,
  BEZEL_HEIGHT,
  BEZEL_DEPTH,
  BEZEL_CORNER_RADIUS,
  SCREEN_WIDTH,
  SCREEN_HEIGHT,
} from "@/lib/crt-config";

function createRoundedRectShape(
  w: number,
  h: number,
  r: number
): THREE.Shape {
  const shape = new THREE.Shape();
  const hw = w / 2;
  const hh = h / 2;
  shape.moveTo(-hw + r, -hh);
  shape.lineTo(hw - r, -hh);
  shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
  shape.lineTo(hw, hh - r);
  shape.quadraticCurveTo(hw, hh, hw - r, hh);
  shape.lineTo(-hw + r, hh);
  shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
  shape.lineTo(-hw, -hh + r);
  shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
  return shape;
}

// Button positions (exported for projection in CRTMonitorScene)
export const BUTTON_Y = -BEZEL_HEIGHT / 2 + 0.06;
export const BUTTON_Z = BEZEL_DEPTH / 2 + 0.008;
export const POWER_X = BEZEL_WIDTH / 2 - 0.15;
export const BRIGHT_DOWN_X = POWER_X - 0.18;
export const BRIGHT_UP_X = POWER_X - 0.09;
// How far the button protrudes (half the cylinder height after rotation)
export const BUTTON_PROTRUSION = 0.02;

/** Power LED + physical power button + brightness buttons on the bezel. */
function BezelControls() {
  const ledRef = useRef<THREE.Mesh>(null);
  const powerRef = useRef<THREE.Group>(null);
  const brightDownRef = useRef<THREE.Group>(null);
  const brightUpRef = useRef<THREE.Group>(null);
  const pressedRef = useRef({ power: false, brightDown: false, brightUp: false });

  useEffect(() => {
    const handler = (e: Event) => {
      const on = (e as CustomEvent).detail.on;
      if (ledRef.current) {
        (ledRef.current.material as THREE.MeshBasicMaterial).color.set(
          on ? 0x00cc44 : 0xcc6600
        );
      }
    };
    window.addEventListener("power-toggle", handler);
    return () => window.removeEventListener("power-toggle", handler);
  }, []);

  // Listen for button press/release events from the HTML overlay
  useEffect(() => {
    const onDown = (e: Event) => {
      const btn = (e as CustomEvent).detail.button as string;
      if (btn === "power") pressedRef.current.power = true;
      else if (btn === "brightDown") pressedRef.current.brightDown = true;
      else if (btn === "brightUp") pressedRef.current.brightUp = true;
    };
    const onUp = (e: Event) => {
      const btn = (e as CustomEvent).detail.button as string;
      if (btn === "power") pressedRef.current.power = false;
      else if (btn === "brightDown") pressedRef.current.brightDown = false;
      else if (btn === "brightUp") pressedRef.current.brightUp = false;
    };
    window.addEventListener("bezel-btn-down", onDown);
    window.addEventListener("bezel-btn-up", onUp);
    return () => {
      window.removeEventListener("bezel-btn-down", onDown);
      window.removeEventListener("bezel-btn-up", onUp);
    };
  }, []);

  // Animate button press/depress each frame
  const depressDepth = 0.016;
  useFrame(() => {
    const refs = [
      { ref: powerRef, key: "power" as const },
      { ref: brightDownRef, key: "brightDown" as const },
      { ref: brightUpRef, key: "brightUp" as const },
    ];
    for (const { ref, key } of refs) {
      if (!ref.current) continue;
      const target = pressedRef.current[key] ? -depressDepth : 0;
      ref.current.position.z = THREE.MathUtils.lerp(ref.current.position.z, target, 0.35);
    }
  });

  // Power button — soft-touch rubber feel
  const powerMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0x2a2a2a,
    roughness: 0.85,
    metalness: 0.0,
    clearcoat: 0.05,
    clearcoatRoughness: 0.9,
  }), []);
  // Power button rim — hard plastic surround
  const rimMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0x4a4a4a,
    roughness: 0.4,
    metalness: 0.15,
    clearcoat: 0.4,
    clearcoatRoughness: 0.3,
  }), []);
  // Brightness buttons — tactile hard plastic
  const btnMat = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: 0x3a3a3a,
    roughness: 0.6,
    metalness: 0.05,
    clearcoat: 0.2,
    clearcoatRoughness: 0.5,
  }), []);
  const labelMat = useMemo(() => new THREE.MeshBasicMaterial({ color: 0x999999 }), []);

  const btnZ = BUTTON_Z;
  const btnY = BUTTON_Y;

  return (
    <group>
      {/* Power LED */}
      <mesh
        ref={ledRef}
        position={[POWER_X, btnY, BEZEL_DEPTH / 2 + 0.04]}
      >
        <sphereGeometry args={[0.012, 12, 12]} />
        <meshBasicMaterial color={0x00cc44} />
      </mesh>

      {/* Power button — raised cylindrical button with rim */}
      <group ref={powerRef} position={[0, 0, 0]}>
        {/* Outer rim/collar */}
        <mesh position={[POWER_X, btnY, btnZ - 0.004]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.048, 0.05, 0.02, 24]} />
          <primitive object={rimMat} attach="material" />
        </mesh>
        {/* Main button body */}
        <mesh position={[POWER_X, btnY, btnZ]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.044, 0.04, 24]} />
          <primitive object={powerMat} attach="material" />
        </mesh>
        {/* Power symbol ring */}
        <mesh position={[POWER_X, btnY, btnZ + BUTTON_PROTRUSION + 0.001]}>
          <torusGeometry args={[0.02, 0.0025, 12, 24]} />
          <primitive object={labelMat} attach="material" />
        </mesh>
        {/* Power symbol stem (line at top of ring) */}
        <mesh position={[POWER_X, btnY + 0.016, btnZ + BUTTON_PROTRUSION + 0.001]}>
          <boxGeometry args={[0.003, 0.012, 0.001]} />
          <primitive object={labelMat} attach="material" />
        </mesh>
      </group>

      {/* Brightness down button (-) — rectangular tactile button */}
      <group ref={brightDownRef} position={[0, 0, 0]}>
        <mesh position={[BRIGHT_DOWN_X, btnY, btnZ]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.032, 0.036, 4]} />
          <primitive object={btnMat} attach="material" />
        </mesh>
        {/* Minus label */}
        <mesh position={[BRIGHT_DOWN_X, btnY, btnZ + BUTTON_PROTRUSION + 0.001]}>
          <boxGeometry args={[0.02, 0.004, 0.001]} />
          <primitive object={labelMat} attach="material" />
        </mesh>
      </group>

      {/* Brightness up button (+) — rectangular tactile button */}
      <group ref={brightUpRef} position={[0, 0, 0]}>
        <mesh position={[BRIGHT_UP_X, btnY, btnZ]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.03, 0.032, 0.036, 4]} />
          <primitive object={btnMat} attach="material" />
        </mesh>
        {/* Plus label — horizontal bar */}
        <mesh position={[BRIGHT_UP_X, btnY, btnZ + BUTTON_PROTRUSION + 0.001]}>
          <boxGeometry args={[0.02, 0.004, 0.001]} />
          <primitive object={labelMat} attach="material" />
        </mesh>
        {/* Plus label — vertical bar */}
        <mesh position={[BRIGHT_UP_X, btnY, btnZ + BUTTON_PROTRUSION + 0.001]}>
          <boxGeometry args={[0.004, 0.02, 0.001]} />
          <primitive object={labelMat} attach="material" />
        </mesh>
      </group>
    </group>
  );
}

export function CRTMonitorModel() {
  const { bezelGeo, innerLipGeo, backShellGeo, glassGeo, neckGeo, baseGeo } =
    useMemo(() => {
      // Outer bezel frame
      const outerShape = createRoundedRectShape(
        BEZEL_WIDTH,
        BEZEL_HEIGHT,
        BEZEL_CORNER_RADIUS
      );
      // Cut out the screen area
      const screenHole = createRoundedRectShape(
        SCREEN_WIDTH + 0.04,
        SCREEN_HEIGHT + 0.04,
        0.06
      );
      outerShape.holes.push(screenHole);

      const bezelGeo = new THREE.ExtrudeGeometry(outerShape, {
        depth: BEZEL_DEPTH,
        bevelEnabled: true,
        bevelThickness: 0.015,
        bevelSize: 0.015,
        bevelSegments: 3,
      });
      bezelGeo.translate(0, 0, -BEZEL_DEPTH / 2);

      // Inner lip (recessed frame around screen)
      const lipOuter = createRoundedRectShape(
        SCREEN_WIDTH + 0.04,
        SCREEN_HEIGHT + 0.04,
        0.06
      );
      const lipHole = createRoundedRectShape(
        SCREEN_WIDTH - 0.02,
        SCREEN_HEIGHT - 0.02,
        0.04
      );
      lipOuter.holes.push(lipHole);

      const innerLipGeo = new THREE.ExtrudeGeometry(lipOuter, {
        depth: 0.04,
        bevelEnabled: false,
      });
      innerLipGeo.translate(0, 0, -0.02);

      // Back shell - hemisphere for CRT tube bulge
      const backShellGeo = new THREE.SphereGeometry(
        BEZEL_WIDTH / 2,
        32,
        16,
        0,
        Math.PI * 2,
        0,
        Math.PI / 2
      );
      backShellGeo.rotateX(-Math.PI / 2);
      backShellGeo.scale(1, BEZEL_HEIGHT / BEZEL_WIDTH, 0.7);
      backShellGeo.translate(0, 0, -BEZEL_DEPTH / 2);

      // CRT glass bulge — subtle convex surface over the screen area
      const glassGeo = new THREE.SphereGeometry(
        4.0, // large radius = subtle curvature
        32,
        16,
        0,
        Math.PI * 2,
        0,
        Math.PI / 12 // just the very front cap
      );
      glassGeo.rotateX(Math.PI / 2);
      glassGeo.scale(
        SCREEN_WIDTH / 2.2,
        SCREEN_HEIGHT / 2.2,
        1
      );
      glassGeo.translate(0, 0, 0.01);

      // Neck (connects monitor to stand)
      const neckGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.35, 16);
      neckGeo.translate(0, -BEZEL_HEIGHT / 2 - 0.175, 0);

      // Base/stand
      const baseGeo = new THREE.BoxGeometry(0.7, 0.04, 0.4);
      baseGeo.translate(0, -BEZEL_HEIGHT / 2 - 0.37, 0.05);

      return { bezelGeo, innerLipGeo, backShellGeo, glassGeo, neckGeo, baseGeo };
    }, []);

  const bezelMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0x404040,
        roughness: 0.65,
        metalness: 0.0,
        clearcoat: 0.15,
        clearcoatRoughness: 0.6,
      }),
    []
  );

  const darkMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0x252525,
        roughness: 0.75,
        metalness: 0.0,
        clearcoat: 0.1,
        clearcoatRoughness: 0.7,
      }),
    []
  );

  const glassMaterial = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: 0x111111,
        transparent: true,
        opacity: 0.08,
        roughness: 0.05,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: 0.1,
      }),
    []
  );

  // Vent slot positions (upper back shell)
  const ventSlots = useMemo(() => {
    const slots: [number, number, number][] = [];
    for (let i = 0; i < 6; i++) {
      slots.push([0, BEZEL_HEIGHT / 2 - 0.15 - i * 0.06, -BEZEL_DEPTH / 2 - 0.35]);
    }
    return slots;
  }, []);

  return (
    <group>
      {/* Outer bezel */}
      <mesh geometry={bezelGeo} material={bezelMaterial} />
      {/* Inner lip */}
      <mesh geometry={innerLipGeo} material={darkMaterial} />
      {/* Back shell */}
      <mesh geometry={backShellGeo} material={bezelMaterial} />
      {/* Stand neck */}
      <mesh geometry={neckGeo} material={bezelMaterial} />
      {/* Stand base */}
      <mesh geometry={baseGeo} material={bezelMaterial} />

      {/* CRT glass bulge */}
      <mesh geometry={glassGeo} material={glassMaterial} />

      {/* Power LED + bezel buttons */}
      <BezelControls />

      {/* Back ports — VGA (blue trapezoid), power inlet, USB ports */}
      <group position={[0.2, -BEZEL_HEIGHT / 2 + 0.25, -BEZEL_DEPTH / 2 - 0.42]}>
        {/* VGA port */}
        <mesh position={[-0.15, 0, 0]}>
          <boxGeometry args={[0.12, 0.06, 0.03]} />
          <meshStandardMaterial color={0x2244aa} roughness={0.6} metalness={0.3} />
        </mesh>
        {/* Power inlet */}
        <mesh position={[0.08, 0, 0]}>
          <boxGeometry args={[0.08, 0.07, 0.03]} />
          <meshStandardMaterial color={0x1a1a1a} roughness={0.9} metalness={0.0} />
        </mesh>
        {/* USB-like ports */}
        <mesh position={[-0.35, 0, 0]}>
          <boxGeometry args={[0.05, 0.025, 0.02]} />
          <meshStandardMaterial color={0x1a1a1a} roughness={0.8} metalness={0.1} />
        </mesh>
        <mesh position={[-0.35, -0.04, 0]}>
          <boxGeometry args={[0.05, 0.025, 0.02]} />
          <meshStandardMaterial color={0x1a1a1a} roughness={0.8} metalness={0.1} />
        </mesh>
      </group>

      {/* Ventilation grille — thin slots on upper back shell */}
      {ventSlots.map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[0.6, 0.015, 0.01]} />
          <meshStandardMaterial color={0x1e1e1e} roughness={1} metalness={0} />
        </mesh>
      ))}
    </group>
  );
}
