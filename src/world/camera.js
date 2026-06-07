// ============================================
// 🌙 Good Night — Camera System v2
// ============================================

import * as THREE from "three";
import { gsap } from "gsap";
import { on } from "../core/eventBus.js";

/**
 * 相机系统
 *
 * 功能：
 *   - 每个模式独立相机预设（位置、FOV、lookAt）
 *   - 有机漂移（多频正弦叠加）
 *   - 平滑 GSAP 过渡
 *   - 鼠标视差
 *   - FOV 呼吸
 */

let camera;
let currentPreset;
let targetPreset;

// 漂移状态
let driftTime = 0;
let driftIntensity = 0;

// 视差
let mouseTarget = { x: 0, y: 0 };
let mouseCurrent = { x: 0, y: 0 };
let parallaxStrength = 0;

// 过渡动画引用
let activeTween = null;

// ==========================================
// 模式预设
// ==========================================

const PRESETS = {
  AWAKE: {
    position: { x: 0, y: 0.2, z: 8 },
    lookAt: { x: 0, y: 0, z: 0 },
    fov: 65,
    drift: 0.15,       // 漂移强度
    parallax: 0.3,     // 视差强度
    transition: {
      duration: 2.5,
      ease: "power2.inOut",
    },
  },

  SLEEP: {
    position: { x: 0, y: -0.8, z: 6 },
    lookAt: { x: 0, y: 0.5, z: -1 },
    fov: 58,
    drift: 0.08,        // 微弱漂移
    parallax: 0.15,
    transition: {
      duration: 3,
      ease: "power3.inOut",
    },
  },

  DREAM: {
    position: { x: 0, y: 0.5, z: 7 },
    lookAt: { x: 0, y: 0.3, z: -1.5 },
    fov: 72,            // 广角 — 梦境广阔
    drift: 0.35,        // 明显漂浮
    parallax: 0.5,      // 强视差
    transition: {
      duration: 4,
      ease: "power1.inOut",
    },
  },

  MEMORY: {
    position: { x: 0, y: 0, z: 5.5 },
    lookAt: { x: 0, y: 0, z: 0 },
    fov: 55,            // 窄视角 — 亲密
    drift: 0.06,
    parallax: 0.25,
    transition: {
      duration: 2,
      ease: "power2.out",
    },
  },

  CAPTURE: {
    position: { x: 0, y: 0, z: 7.5 },
    lookAt: { x: 0, y: 0, z: 0 },
    fov: 60,
    drift: 0.02,        // 几乎静止 — 冻结
    parallax: 0.1,
    transition: {
      duration: 1.5,
      ease: "power3.out",
    },
  },

  DEEP_SLEEP: {
    position: { x: 0, y: -0.3, z: 12 },
    lookAt: { x: 0, y: 0, z: 0 },
    fov: 45,            // 极窄 — 隧道感
    drift: 0.03,
    parallax: 0.05,
    transition: {
      duration: 5,
      ease: "power4.inOut",
    },
  },
};

// ==========================================
// 初始化
// ==========================================

export function initCamera() {
  const preset = PRESETS.AWAKE;

  camera = new THREE.PerspectiveCamera(
    preset.fov,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  );

  camera.position.set(preset.position.x, preset.position.y, preset.position.z);
  camera.lookAt(preset.lookAt.x, preset.lookAt.y, preset.lookAt.z);

  currentPreset = { ...preset };
  targetPreset = { ...preset };

  // 监听鼠标移动（视差）
  window.addEventListener("mousemove", (e) => {
    mouseTarget.x = (e.clientX / window.innerWidth) * 2 - 1;   // -1..1
    mouseTarget.y = -(e.clientY / window.innerHeight) * 2 + 1; // -1..1
  });

  // 监听模式切换
  on("mode:enter", ({ mode }) => {
    const preset = PRESETS[mode] || PRESETS.AWAKE;
    if (preset) {
      transitionTo(preset);
    }
  });

  console.log("[Camera] Ready —", Object.keys(PRESETS).length, "presets loaded");
}

// ==========================================
// 平滑过渡
// ==========================================

function transitionTo(preset) {
  targetPreset = { ...preset };

  const { duration, ease } = preset.transition;

  // 取消之前的过渡
  if (activeTween) {
    activeTween.kill();
  }

  // GSAP 动画：位置
  activeTween = gsap.to(camera.position, {
    x: preset.position.x,
    y: preset.position.y,
    z: preset.position.z,
    duration,
    ease,
  });

  // FOV 过渡
  gsap.to(camera, {
    fov: preset.fov,
    duration,
    ease,
    onUpdate: () => {
      camera.updateProjectionMatrix();
    },
  });

  // 同时更新漂移和视差目标
  gsap.to({}, {
    duration: duration * 0.6,
    ease: "power2.out",
    onUpdate: function () {
      const progress = this.progress();
      driftIntensity += (preset.drift - driftIntensity) * progress * 5 * 0.016;
    },
    onComplete: () => {
      driftIntensity = preset.drift;
      parallaxStrength = preset.parallax;
    },
  });
}

// ==========================================
// 每帧更新（在 scene.js 的 animate 中调用）
// ==========================================

export function updateCamera(delta, elapsed) {
  if (!camera) return;

  // ---- 有机漂移 ----
  driftTime = elapsed;
  const d = driftIntensity;

  if (d > 0.001) {
    const driftX = Math.sin(driftTime * 0.4 + 0.5) * d * 0.5
                 + Math.cos(driftTime * 0.67) * d * 0.3
                 + Math.sin(driftTime * 1.1 + 1.2) * d * 0.2;

    const driftY = Math.cos(driftTime * 0.35 + 0.8) * d * 0.4
                 + Math.sin(driftTime * 0.72) * d * 0.25
                 + Math.cos(driftTime * 1.3 + 0.3) * d * 0.15;

    const driftZ = Math.sin(driftTime * 0.25) * d * 0.3;

    // 漂移是相对于 targetPreset 位置的偏移
    if (targetPreset) {
      camera.position.x += (targetPreset.position.x + driftX - camera.position.x) * 0.02;
      camera.position.y += (targetPreset.position.y + driftY - camera.position.y) * 0.02;
      camera.position.z += (targetPreset.position.z + driftZ - camera.position.z) * 0.02;
    }
  }

  // ---- 鼠标视差 ----
  if (parallaxStrength > 0.001) {
    // 平滑跟随鼠标
    const smooth = 0.03;
    mouseCurrent.x += (mouseTarget.x - mouseCurrent.x) * smooth;
    mouseCurrent.y += (mouseTarget.y - mouseCurrent.y) * smooth;

    const p = parallaxStrength;
    const px = mouseCurrent.x * p;
    const py = mouseCurrent.y * p * 0.6;

    if (targetPreset) {
      camera.position.x += px * 0.02;
      camera.position.y += py * 0.02;
    }
  }

  // ---- FOV 呼吸（微妙） ----
  if (targetPreset) {
    const breathe = 1 + Math.sin(elapsed * 0.3) * 0.015;
    const targetFov = targetPreset.fov * breathe;
    camera.fov += (targetFov - camera.fov) * 0.03;
    camera.updateProjectionMatrix();
  }

  // ---- lookAt 平滑 ----
  if (targetPreset) {
    const t = targetPreset.lookAt;
    // 用当前相机的 lookAt 做平滑
    const currentLook = new THREE.Vector3();
    camera.getWorldDirection(currentLook);
    currentLook.add(camera.position);

    const targetLook = new THREE.Vector3(t.x, t.y, t.z);
    const lerped = new THREE.Vector3().lerpVectors(currentLook, targetLook, 0.02);

    camera.lookAt(lerped);
  }
}

// ==========================================
// 公共 API
// ==========================================

export function getCamera() {
  return camera;
}

/** 获取当前预设（调试用） */
export function getCurrentPreset() {
  return { ...currentPreset };
}

/** 手动设置视差强度 */
export function setParallax(strength) {
  parallaxStrength = strength;
}

/** 手动设置漂移强度 */
export function setDrift(intensity) {
  driftIntensity = intensity;
}

/** 重置相机到 AWAKE */
export function resetCamera() {
  transitionTo(PRESETS.AWAKE);
}
