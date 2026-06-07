// ============================================
// 🌙 Good Night — Post-Processing Pipeline
// ============================================

import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { on } from "../core/eventBus.js";

/**
 * 后处理管线
 *
 *   RenderPass → BloomPass → VignettePass → OutputPass
 *
 * 每个模式可配置不同的 bloom 强度和暗角程度。
 */

let composer = null;
let bloomPass = null;
let vignettePass = null;

// ==========================================
// 自定义 Vignette + 色温 Shader
// ==========================================

const VignetteShader = {
  uniforms: {
    tDiffuse: { value: null },
    uVignette: { value: 0.35 },     // 暗角强度
    uWarmth: { value: 0.0 },        // 色温偏移 (-1=冷, +1=暖)
    uBrightness: { value: 1.0 },    // 亮度
    uTime: { value: 0 },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float uVignette;
    uniform float uWarmth;
    uniform float uBrightness;
    uniform float uTime;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      // 暗角
      float d = length(vUv - 0.5) * 1.6;
      float vignette = 1.0 - d * uVignette;
      vignette = smoothstep(0.0, 1.0, vignette);

      // 色温偏移
      float warmth = uWarmth;
      color.r += warmth * 0.08;
      color.b -= warmth * 0.08;

      // 亮度
      color.rgb *= uBrightness;

      // 暗角色彩倾向（边缘偏蓝紫）
      vec3 edgeTint = mix(vec3(1.0), vec3(0.85, 0.82, 1.0), d * 0.3);

      color.rgb *= vignette * edgeTint;

      gl_FragColor = color;
    }
  `,
};

// ==========================================
// 模式预设
// ==========================================

const MODE_PRESETS = {
  AWAKE: {
    bloomStrength: 0.4,
    bloomRadius: 0.4,
    bloomThreshold: 0.6,
    vignette: 0.25,
    warmth: 0.2,
    brightness: 1.0,
  },
  SLEEP: {
    bloomStrength: 0.6,
    bloomRadius: 0.5,
    bloomThreshold: 0.5,
    vignette: 0.45,
    warmth: 0.5,
    brightness: 0.85,
  },
  DREAM: {
    bloomStrength: 1.2,     // 梦境最亮
    bloomRadius: 0.7,
    bloomThreshold: 0.3,   // 更多粒子被 bloom 捕获
    vignette: 0.3,
    warmth: -0.15,          // 偏冷紫
    brightness: 1.05,
  },
  MEMORY: {
    bloomStrength: 0.5,
    bloomRadius: 0.35,
    bloomThreshold: 0.55,
    vignette: 0.4,
    warmth: 0.4,            // 暖色回忆
    brightness: 0.95,
  },
  CAPTURE: {
    bloomStrength: 0.2,
    bloomRadius: 0.3,
    bloomThreshold: 0.8,
    vignette: 0.55,
    warmth: 0.0,
    brightness: 0.9,
  },
  DEEP_SLEEP: {
    bloomStrength: 0.05,
    bloomRadius: 0.2,
    bloomThreshold: 0.95,
    vignette: 0.85,
    warmth: -0.3,           // 极冷
    brightness: 0.3,
  },
};

// 当前模式（用于平滑过渡）
let currentPreset = MODE_PRESETS.AWAKE;
let targetPreset = MODE_PRESETS.AWAKE;

// ==========================================
// 初始化
// ==========================================

export function initPostProcessing(renderer, scene, camera) {
  console.log("[PostProcess] Initializing...");

  // 1. RenderPass — 渲染场景到纹理
  const renderPass = new RenderPass(scene, camera);

  // 2. UnrealBloomPass — 光溢出
  bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    MODE_PRESETS.AWAKE.bloomStrength,
    MODE_PRESETS.AWAKE.bloomRadius,
    MODE_PRESETS.AWAKE.bloomThreshold
  );

  // 3. VignettePass — 暗角 + 色温
  vignettePass = new ShaderPass(VignetteShader);
  vignettePass.uniforms.uVignette.value = MODE_PRESETS.AWAKE.vignette;
  vignettePass.uniforms.uWarmth.value = MODE_PRESETS.AWAKE.warmth;
  vignettePass.uniforms.uBrightness.value = MODE_PRESETS.AWAKE.brightness;

  // 4. OutputPass — 输出到屏幕（处理色彩空间）
  const outputPass = new OutputPass();

  // 组装管线
  composer = new EffectComposer(renderer);
  composer.addPass(renderPass);
  composer.addPass(bloomPass);
  composer.addPass(vignettePass);
  composer.addPass(outputPass);

  // 监听模式切换
  on("mode:enter", ({ mode }) => {
    const preset = MODE_PRESETS[mode] || MODE_PRESETS.AWAKE;
    targetPreset = preset;
  });

  // 监听 resize
  window.addEventListener("resize", () => {
    composer.setSize(window.innerWidth, window.innerHeight);
  });

  console.log("[PostProcess] Ready — Bloom + Vignette pipeline active");
}

// ==========================================
// 每帧渲染
// ==========================================

export function render(delta) {
  if (!composer) return;

  // 平滑过渡到目标预设
  const lerpSpeed = 2.0; // 过渡速度
  const t = 1 - Math.exp(-lerpSpeed * delta);

  currentPreset.bloomStrength += (targetPreset.bloomStrength - currentPreset.bloomStrength) * t;
  currentPreset.bloomRadius += (targetPreset.bloomRadius - currentPreset.bloomRadius) * t;
  currentPreset.bloomThreshold += (targetPreset.bloomThreshold - currentPreset.bloomThreshold) * t;
  currentPreset.vignette += (targetPreset.vignette - currentPreset.vignette) * t;
  currentPreset.warmth += (targetPreset.warmth - currentPreset.warmth) * t;
  currentPreset.brightness += (targetPreset.brightness - currentPreset.brightness) * t;

  // 更新 bloom
  if (bloomPass) {
    bloomPass.strength = currentPreset.bloomStrength;
    bloomPass.radius = currentPreset.bloomRadius;
    bloomPass.threshold = currentPreset.bloomThreshold;
  }

  // 更新 vignette
  if (vignettePass) {
    vignettePass.uniforms.uVignette.value = currentPreset.vignette;
    vignettePass.uniforms.uWarmth.value = currentPreset.warmth;
    vignettePass.uniforms.uBrightness.value = currentPreset.brightness;
    vignettePass.uniforms.uTime.value = performance.now() * 0.001;
  }

  composer.render();
}

// ==========================================
// 公共方法
// ==========================================

/** 获取 composer（用于外部 access） */
export function getComposer() {
  return composer;
}

/** 强制设置 bloom（调试用） */
export function setBloom(strength, radius, threshold) {
  if (bloomPass) {
    bloomPass.strength = strength;
    bloomPass.radius = radius;
    bloomPass.threshold = threshold;
  }
}
