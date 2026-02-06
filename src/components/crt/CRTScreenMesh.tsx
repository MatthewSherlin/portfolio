"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { SCREEN_WIDTH, SCREEN_HEIGHT, SCREEN_CURVATURE } from "@/lib/crt-config";

interface CRTScreenMeshProps {
  texture: THREE.CanvasTexture | null;
  onClick?: () => void;
}

export function CRTScreenMesh({ texture, onClick }: CRTScreenMeshProps) {
  const geometry = useMemo(() => {
    const geo = new THREE.PlaneGeometry(SCREEN_WIDTH, SCREEN_HEIGHT, 32, 24);

    // Displace vertices for convex CRT curvature
    const positions = geo.attributes.position;
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const y = positions.getY(i);
      const nx = x / (SCREEN_WIDTH / 2);
      const ny = y / (SCREEN_HEIGHT / 2);
      const r2 = nx * nx + ny * ny;
      const z = SCREEN_CURVATURE * (1.0 - r2);
      positions.setZ(i, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  return (
    <mesh geometry={geometry} onClick={onClick} position={[0, 0, 0.01]}>
      <meshBasicMaterial
        map={texture}
        toneMapped={false}
        color={texture ? 0xffffff : 0x221c0e}
      />
    </mesh>
  );
}
