export const crtFragmentShader = /* glsl */ `
// CRT effect parameters
uniform float u_barrelStrength;
uniform float u_chromaticAberration;
uniform float u_scanlineIntensity;
uniform float u_scanlineSweepSpeed;
uniform float u_phosphorIntensity;
uniform float u_vignetteRadius;
uniform float u_vignetteSoftness;
uniform float u_noiseIntensity;
uniform float u_brightnessFlicker;
uniform float u_screenBrightness;

// Distortion uniforms
uniform float u_emiOffset;
uniform float u_emiY;
uniform float u_emiBandWidth;
uniform float u_signalStrength;
uniform float u_hSyncOffset;
uniform float u_vRollOffset;
uniform float u_colorDrift;

// Turn-on animation
uniform float u_turnOnProgress;

// Screen bounds in viewport UV space
uniform vec2 u_screenMin;
uniform vec2 u_screenMax;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
}

float screenMask(vec2 coord) {
  vec2 d = abs(coord - 0.5) * 2.0;
  float edge = length(max(d - vec2(0.92, 0.92), 0.0));
  return 1.0 - smoothstep(0.0, 0.08, edge);
}

float scanlineEffect(vec2 coord, float screenPixelHeight) {
  float line = sin(coord.y * screenPixelHeight * PI) * 0.5 + 0.5;
  float staticScan = mix(1.0, line, u_scanlineIntensity);
  float sweepPos = fract(time * u_scanlineSweepSpeed);
  float sweep = smoothstep(0.0, 0.04, abs(coord.y - sweepPos));
  float sweepBand = mix(1.06, 1.0, sweep);
  return staticScan * sweepBand;
}

vec3 phosphorMask(vec2 fc) {
  int col = int(mod(fc.x, 3.0));
  vec3 mask;
  if (col == 0) mask = vec3(1.0, 0.25, 0.25);
  else if (col == 1) mask = vec3(0.25, 1.0, 0.25);
  else mask = vec3(0.25, 0.25, 1.0);
  return mix(vec3(1.0), mask, u_phosphorIntensity);
}

float vignetteEffect(vec2 coord) {
  vec2 cc = coord - 0.5;
  float dist = length(cc * vec2(1.0, 0.8));
  return 1.0 - smoothstep(u_vignetteRadius - u_vignetteSoftness, u_vignetteRadius, dist);
}

float noiseEffect(vec2 coord) {
  float grain = hash(coord * 400.0 + time * 80.0) * u_noiseIntensity;
  float lineY = floor(coord.y * 300.0);
  float staticTrigger = step(0.997, hash(vec2(lineY, floor(time * 20.0))));
  float staticLine = staticTrigger * hash(vec2(coord.x * 10.0, time)) * 0.25;
  return grain + staticLine;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 screenSize = u_screenMax - u_screenMin;
  vec2 screenUV = (uv - u_screenMin) / screenSize;

  // Outside screen bounds? Pass through the raw scene
  if (screenUV.x < -0.02 || screenUV.x > 1.02 ||
      screenUV.y < -0.02 || screenUV.y > 1.02) {
    outputColor = inputColor;
    return;
  }

  // Soft edge blend at screen boundary
  float border = 0.01;
  float inScreen = smoothstep(0.0, border, screenUV.x)
                 * smoothstep(0.0, border, screenUV.y)
                 * (1.0 - smoothstep(1.0 - border, 1.0, screenUV.x))
                 * (1.0 - smoothstep(1.0 - border, 1.0, screenUV.y));

  if (inScreen < 0.001) {
    outputColor = inputColor;
    return;
  }

  // Turn-on animation
  if (u_turnOnProgress < 1.0) {
    float p = u_turnOnProgress;
    float scaleX = smoothstep(0.0, 0.12, p);
    float scaleY = smoothstep(0.1, 0.4, p);
    vec2 center = vec2(0.5);
    vec2 scaled = (screenUV - center) / vec2(max(scaleX, 0.001), max(scaleY, 0.001)) + center;
    if (scaled.x < 0.0 || scaled.x > 1.0 || scaled.y < 0.0 || scaled.y > 1.0) {
      outputColor = mix(inputColor, vec4(0.0, 0.0, 0.0, 1.0), inScreen);
      return;
    }
    float turnOnBrightness = mix(8.0, 1.0, smoothstep(0.1, 0.8, p));
    vec3 col = inputColor.rgb * turnOnBrightness;
    float warmup = (1.0 - p) * 0.3;
    col += vec3(warmup * 0.8, warmup * 0.5, warmup * 0.1);
    outputColor = mix(inputColor, vec4(col, 1.0), inScreen);
    return;
  }

  // --- Compute sampling position as viewport-space offset from uv ---
  // Distortion offsets (screen-local amounts scaled to viewport space)
  vec2 samplePos = uv;

  // V-roll
  float vRollVP = u_vRollOffset * screenSize.y;
  samplePos.y += vRollVP;

  // H-sync
  samplePos.x += u_hSyncOffset * screenSize.x;

  // EMI band
  float emiBand = smoothstep(u_emiY - u_emiBandWidth, u_emiY, screenUV.y)
                - smoothstep(u_emiY, u_emiY + u_emiBandWidth, screenUV.y);
  samplePos.x += emiBand * u_emiOffset * screenSize.x;

  // Barrel distortion — computed as viewport-space offset centered on screen
  vec2 screenCenter = (u_screenMin + u_screenMax) * 0.5;
  vec2 fromCenter = samplePos - screenCenter;
  vec2 halfScreen = screenSize * 0.5;
  // Normalize so distortion strength is independent of screen viewport size
  vec2 normFC = fromCenter / halfScreen;
  float r2 = dot(normFC, normFC);
  float r4 = r2 * r2;
  samplePos += fromCenter * (u_barrelStrength * r2 + 0.6 * u_barrelStrength * r4);

  // Screen-local UV of the distorted sample point (for visual effects)
  vec2 effectUV = (samplePos - u_screenMin) / screenSize;

  // Screen edge mask (rounded corners)
  float mask = screenMask(effectUV);
  if (mask < 0.001) {
    outputColor = mix(inputColor, vec4(0.0, 0.0, 0.0, 1.0), inScreen);
    return;
  }

  // Chromatic aberration — small offsets in viewport space
  vec2 caVec = fromCenter * u_chromaticAberration;
  float r_ch = texture2D(inputBuffer, samplePos + caVec).r;
  float g_ch = texture2D(inputBuffer, samplePos).g;
  float b_ch = texture2D(inputBuffer, samplePos - caVec).b;
  vec3 color = vec3(r_ch, g_ch, b_ch);

  // Phosphor mask
  vec2 screenPixels = effectUV * screenSize * resolution;
  color *= phosphorMask(screenPixels);

  // Scanlines
  float screenPixelHeight = screenSize.y * resolution.y;
  color *= scanlineEffect(effectUV, screenPixelHeight);

  // Vignette
  color *= vignetteEffect(effectUV);

  // Noise
  color += noiseEffect(effectUV);

  // Signal strength
  color *= u_signalStrength;

  // Brightness
  color *= u_brightnessFlicker * u_screenBrightness;

  // Color drift
  float drift = u_colorDrift * 0.02;
  color.r *= 1.0 + drift;
  color.b *= 1.0 - drift;

  // Apply edge mask
  color *= mask;

  // Subtle edge glow
  float edgeGlow = (1.0 - vignetteEffect(effectUV)) * 0.006;
  color += vec3(edgeGlow * 0.8, edgeGlow * 0.5, edgeGlow * 0.1);

  // Blend CRT screen with surrounding scene
  outputColor = mix(inputColor, vec4(color, 1.0), inScreen * mask);
}
`;
