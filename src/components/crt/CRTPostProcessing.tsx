"use client";

import { forwardRef, useMemo, useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { EffectComposer } from "@react-three/postprocessing";
import { Effect, EffectAttribute, BlendFunction } from "postprocessing";
import { Uniform, Vector2, Vector3 } from "three";
import { crtFragmentShader } from "@/shaders/crt-shader";
import { CRT_CONFIG, SCREEN_WIDTH, SCREEN_HEIGHT } from "@/lib/crt-config";
import { useDistortionState, type DistortionState } from "./useDistortionState";

class CRTEffectImpl extends Effect {
  constructor() {
    super("CRTEffect", crtFragmentShader, {
      blendFunction: BlendFunction.SET,
      attributes: EffectAttribute.CONVOLUTION,
      uniforms: new Map<string, Uniform>([
        ["u_barrelStrength", new Uniform(CRT_CONFIG.barrelDistortion)],
        ["u_chromaticAberration", new Uniform(CRT_CONFIG.chromaticAberration)],
        ["u_scanlineIntensity", new Uniform(CRT_CONFIG.scanlineIntensity)],
        ["u_scanlineSweepSpeed", new Uniform(CRT_CONFIG.scanlineSweepSpeed)],
        ["u_phosphorIntensity", new Uniform(CRT_CONFIG.phosphorIntensity)],
        ["u_vignetteRadius", new Uniform(CRT_CONFIG.vignetteRadius)],
        ["u_vignetteSoftness", new Uniform(CRT_CONFIG.vignetteSoftness)],
        ["u_noiseIntensity", new Uniform(CRT_CONFIG.noiseIntensity)],
        ["u_brightnessFlicker", new Uniform(1.0)],
        ["u_screenBrightness", new Uniform(CRT_CONFIG.screenBrightness)],
        ["u_emiOffset", new Uniform(0.0)],
        ["u_emiY", new Uniform(0.0)],
        ["u_emiBandWidth", new Uniform(0.0)],
        ["u_signalStrength", new Uniform(1.0)],
        ["u_hSyncOffset", new Uniform(0.0)],
        ["u_vRollOffset", new Uniform(0.0)],
        ["u_colorDrift", new Uniform(0.0)],
        ["u_turnOnProgress", new Uniform(0.0)],
        ["u_screenMin", new Uniform(new Vector2(0, 0))],
        ["u_screenMax", new Uniform(new Vector2(1, 1))],
      ]),
    });
  }
}

const CRTEffectComponent = forwardRef<CRTEffectImpl>(function CRTEffectComponent(_props, ref) {
  const effect = useMemo(() => new CRTEffectImpl(), []);

  // Forward the ref
  useEffect(() => {
    if (typeof ref === "function") {
      ref(effect);
    } else if (ref) {
      ref.current = effect;
    }
  }, [effect, ref]);

  return <primitive object={effect} dispose={null} />;
});

// Pre-allocated vectors to avoid GC in useFrame
const _topLeft = new Vector3();
const _bottomRight = new Vector3();

export function CRTPostProcessing() {
  const effectRef = useRef<CRTEffectImpl>(null);
  const distortionState = useDistortionState();
  const turnOnStart = useRef(performance.now());
  const { camera } = useThree();

  const halfW = SCREEN_WIDTH / 2;
  const halfH = SCREEN_HEIGHT / 2;

  useFrame(() => {
    const effect = effectRef.current;
    if (!effect) return;

    // Turn-on animation (1.5 seconds)
    const elapsed = (performance.now() - turnOnStart.current) / 1000;
    const turnOnProgress = Math.min(elapsed / 1.5, 1.0);
    effect.uniforms.get("u_turnOnProgress")!.value = turnOnProgress;

    // Compute screen bounds in viewport UV space
    _topLeft.set(-halfW, halfH, 0.01).project(camera);
    _bottomRight.set(halfW, -halfH, 0.01).project(camera);

    // NDC [-1,1] → UV [0,1]
    const screenMin = effect.uniforms.get("u_screenMin")!.value as Vector2;
    const screenMax = effect.uniforms.get("u_screenMax")!.value as Vector2;
    screenMin.set((_topLeft.x + 1) / 2, (_bottomRight.y + 1) / 2);
    screenMax.set((_bottomRight.x + 1) / 2, (_topLeft.y + 1) / 2);

    // Update distortion uniforms
    const d: DistortionState = distortionState.current;
    effect.uniforms.get("u_emiOffset")!.value = d.emiOffset;
    effect.uniforms.get("u_emiY")!.value = d.emiY;
    effect.uniforms.get("u_emiBandWidth")!.value = d.emiBandWidth;
    effect.uniforms.get("u_signalStrength")!.value = d.signalStrength;
    effect.uniforms.get("u_hSyncOffset")!.value = d.hSyncOffset;
    effect.uniforms.get("u_vRollOffset")!.value = d.vRollOffset;
    effect.uniforms.get("u_brightnessFlicker")!.value = d.brightness;
    effect.uniforms.get("u_colorDrift")!.value = d.colorDrift;
  });

  return (
    <EffectComposer>
      <CRTEffectComponent ref={effectRef} />
    </EffectComposer>
  );
}
