"use client";

import { useMemo } from "react";
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

export function CRTMonitorModel() {
  const { bezelGeo, innerLipGeo, backShellGeo, neckGeo, baseGeo } =
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

      // Neck (connects monitor to stand)
      const neckGeo = new THREE.CylinderGeometry(0.08, 0.1, 0.35, 16);
      neckGeo.translate(0, -BEZEL_HEIGHT / 2 - 0.175, 0);

      // Base/stand
      const baseGeo = new THREE.BoxGeometry(0.7, 0.04, 0.4);
      baseGeo.translate(0, -BEZEL_HEIGHT / 2 - 0.37, 0.05);

      return { bezelGeo, innerLipGeo, backShellGeo, neckGeo, baseGeo };
    }, []);

  const bezelMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x3a3a3a,
        roughness: 0.82,
        metalness: 0.08,
      }),
    []
  );

  const darkMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: 0x262626,
        roughness: 0.88,
        metalness: 0.04,
      }),
    []
  );

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
      {/* Power LED */}
      <mesh position={[BEZEL_WIDTH / 2 - 0.15, -BEZEL_HEIGHT / 2 + 0.06, BEZEL_DEPTH / 2 + 0.016]}>
        <sphereGeometry args={[0.012, 8, 8]} />
        <meshBasicMaterial color={0x00cc44} />
      </mesh>
    </group>
  );
}
