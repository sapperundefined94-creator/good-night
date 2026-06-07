// ============================================
// 🌙 Good Night — Particle GLSL Shaders
// ============================================

/**
 * 粒子着色器库
 *
 * 所有粒子系统共用这些 GPU 着色器。
 * 使用 ShaderMaterial 替代 PointsMaterial，
 * 实现柔光圆形、拖尾、涡旋等效果。
 */

// ==========================================
// 柔光圆形粒子（替代方形点）
// ==========================================

export const SOFT_CIRCLE_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aAngle;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vAngle;
  varying vec2 vUv;

  uniform float uTime;
  uniform float uPixelRatio;

  void main() {
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    vColor = aColor;
    vAlpha = aAlpha;
    vAngle = aAngle;
    vUv = vec2(0.0);
  }
`;

export const SOFT_CIRCLE_FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vAngle;
  varying vec2 vUv;

  uniform float uTime;

  void main() {
    // 柔光圆形
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float alpha = 1.0 - smoothstep(0.0, 1.0, d);

    // 发光光晕
    float glow = exp(-d * 3.0) * 0.4;

    // 微弱的旋转扭曲
    float angle = atan(gl_PointCoord.y - 0.5, gl_PointCoord.x - 0.5);
    float sparkle = 0.5 + 0.5 * sin(angle * 6.0 + uTime * 2.0 + vAngle);
    sparkle = mix(1.0, sparkle, 0.15);

    float finalAlpha = (alpha + glow) * vAlpha * sparkle;

    // 中心亮白
    vec3 color = mix(vColor, vec3(1.0), alpha * 0.4);

    gl_FragColor = vec4(color, finalAlpha);
  }
`;

// ==========================================
// 涡旋粒子（银河旋转效果）
// ==========================================

export const VORTEX_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aDist;     // 距中心距离
  attribute float aSpeed;    // 旋转速度
  attribute float aOffset;   // 相位偏移

  varying vec3 vColor;
  varying float vAlpha;
  varying float vDist;
  varying float vTwinkle;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uVortexStrength;
  uniform float uBreathPhase;

  void main() {
    // 涡旋旋转
    float angle = aOffset + uTime * aSpeed * (0.3 + aDist * 0.7);
    float radius = aDist;

    // 呼吸式膨胀
    radius *= 1.0 + sin(uBreathPhase * 0.7 + aDist * 2.0) * 0.08;

    vec3 pos = position;
    pos.x = cos(angle) * radius;
    pos.z = sin(angle) * radius;
    pos.y += sin(uTime * 0.5 + aOffset) * 0.3 * aDist;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * uPixelRatio * (250.0 / -mvPosition.z) * (0.5 + aDist * 0.8);
    gl_Position = projectionMatrix * mvPosition;

    vColor = aColor;
    vAlpha = aAlpha;
    vDist = aDist;
    vTwinkle = 0.5 + 0.5 * sin(uTime * 3.0 + aOffset * 10.0);
  }
`;

export const VORTEX_FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vDist;
  varying float vTwinkle;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float core = 1.0 - smoothstep(0.0, 0.6, d);
    float glow = exp(-d * 2.5) * 0.5;

    float alpha = (core + glow) * vAlpha * (0.7 + vTwinkle * 0.3);

    // 越远越偏紫
    vec3 color = mix(vColor, vec3(0.6, 0.4, 1.0), vDist * 0.5);

    gl_FragColor = vec4(color, alpha);
  }
`;

// ==========================================
// 花瓣飘落（GPU 物理）
// ==========================================

export const PETAL_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aSeed;
  attribute float aPhase;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vRot;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uGravity;
  uniform float uWind;

  // Simple hash for pseudo-random
  float hash(float n) {
    return fract(sin(n) * 43758.5453123);
  }

  void main() {
    vec3 pos = position;

    // 重力下落
    float fallSpeed = 0.3 + hash(aSeed) * 0.7;
    float cycle = mod(uTime * fallSpeed + aPhase, 10.0);
    pos.y -= cycle * uGravity;

    // 风力漂移
    float windLayer = hash(aSeed * 2.0);
    pos.x += sin(uTime * 0.7 + aPhase) * uWind * windLayer;
    pos.z += cos(uTime * 0.5 + aPhase * 1.3) * uWind * 0.5 * windLayer;

    // 水平漂浮（超出底部后回到顶部）
    if (pos.y < -6.0) {
      pos.y = 6.0;
      pos.x = (hash(aSeed * 3.0) - 0.5) * 10.0;
      pos.z = (hash(aSeed * 4.0) - 0.5) * 6.0;
    }

    // 旋转抖动
    float wobble = sin(uTime * 2.0 + aSeed * 100.0) * 0.3;
    pos.x += wobble * 0.2;
    pos.z += wobble * 0.1;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * uPixelRatio * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    vColor = aColor;
    vAlpha = aAlpha * (0.5 + 0.5 * sin(uTime + aSeed * 50.0));
    vRot = uTime * hash(aSeed * 5.0) + aPhase;
  }
`;

export const PETAL_FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vRot;

  void main() {
    // 椭圆花瓣形状
    vec2 uv = gl_PointCoord - 0.5;
    float angle = vRot;
    float rx = uv.x * cos(angle) - uv.y * sin(angle);
    float ry = uv.x * sin(angle) + uv.y * cos(angle);

    // 拉长的椭圆
    float shape = 1.0 - smoothstep(0.0, 1.0,
      (rx * rx) / 0.12 + (ry * ry) / 0.35
    );

    // 边缘柔化
    float edge = smoothstep(0.0, 0.3, shape);

    // 叶脉纹理
    float vein = 1.0 - abs(ry) * 2.5;
    vein = smoothstep(0.0, 0.4, vein) * 0.3;

    float alpha = (edge + vein) * vAlpha;

    // 颜色渐变（中心亮，边缘暗）
    vec3 color = mix(vColor * 1.3, vColor * 0.6, abs(ry) * 2.0);

    gl_FragColor = vec4(color, alpha);
  }
`;

// ==========================================
// 萤火虫光点
// ==========================================

export const FIREFLY_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aPhase;
  attribute float aSpeed;

  varying vec3 vColor;
  varying float vAlpha;
  varying float vPulse;

  uniform float uTime;
  uniform float uPixelRatio;

  void main() {
    vec3 pos = position;

    // 缓慢随机漂移
    pos.x += sin(uTime * aSpeed + aPhase) * 0.8;
    pos.y += cos(uTime * aSpeed * 0.7 + aPhase) * 0.5;
    pos.z += sin(uTime * aSpeed * 0.5 + aPhase * 1.5) * 0.6;

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * uPixelRatio * (350.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    vColor = aColor;
    vAlpha = aAlpha;
    vPulse = 0.4 + 0.6 * sin(uTime * 3.5 + aPhase) * cos(uTime * 1.7 + aPhase * 0.7);
  }
`;

export const FIREFLY_FRAGMENT = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vPulse;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    // 多层光晕
    float core = exp(-d * 4.0);
    float mid = exp(-d * 2.0) * 0.5;
    float outer = exp(-d * 1.0) * 0.2;

    float alpha = (core + mid + outer) * vAlpha * vPulse;
    vec3 color = mix(vColor, vec3(1.0, 0.95, 0.8), core);

    gl_FragColor = vec4(color, alpha);
  }
`;

// ==========================================
// 雪花（缓飘）
// ==========================================

export const SNOW_VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aAlpha;
  attribute float aPhase;
  attribute float aDrift;

  varying float vAlpha;
  varying float vSparkle;

  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uWind;

  void main() {
    vec3 pos = position;

    // 缓慢下落 + 水平漂移
    float cycle = mod(uTime * 0.15 + aPhase, 12.0);
    pos.y -= cycle;

    // 正弦漂移
    pos.x += sin(uTime * 0.4 + aPhase) * aDrift * uWind;
    pos.z += cos(uTime * 0.3 + aPhase * 0.7) * aDrift * 0.5;

    // 循环回顶
    if (pos.y < -5.0) {
      pos.y = 5.0;
      pos.x = (fract(sin(aPhase * 43758.5453) * 100.0) - 0.5) * 12.0;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * uPixelRatio * (200.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;

    vAlpha = aAlpha;
    vSparkle = 0.6 + 0.4 * sin(uTime * 5.0 + aPhase * 50.0);
  }
`;

export const SNOW_FRAGMENT = /* glsl */ `
  varying float vAlpha;
  varying float vSparkle;

  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float core = 1.0 - smoothstep(0.0, 0.8, d);
    float glow = exp(-d * 3.0) * 0.3;

    float alpha = (core + glow) * vAlpha * vSparkle;
    gl_FragColor = vec4(vec3(0.95, 0.9, 1.0), alpha);
  }
`;
