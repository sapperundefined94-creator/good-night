// ============================================
// 🌙 Good Night — GPU Particle Engine v2
// ============================================

import * as THREE from "three";
import {
  SOFT_CIRCLE_VERTEX, SOFT_CIRCLE_FRAGMENT,
  VORTEX_VERTEX, VORTEX_FRAGMENT,
  PETAL_VERTEX, PETAL_FRAGMENT,
  FIREFLY_VERTEX, FIREFLY_FRAGMENT,
  SNOW_VERTEX, SNOW_FRAGMENT,
} from "../shaders/particleShaders.js";

/**
 * GPU 粒子引擎
 *
 * 使用 ShaderMaterial 实现：
 *  - 柔光圆形粒子
 *  - 涡旋银河
 *  - 花瓣飘落（GPU 物理）
 *  - 萤火虫
 *  - 雪花
 *  - 爆裂特效
 */

const registry = new Map();       // name → { emitter, burst }
let sceneRef = null;

// ==========================================
// 公共 API
// ==========================================

/** 绑定场景引用 */
export function bindScene(scene) {
  sceneRef = scene;
}

/**
 * 创建发射器
 *
 * @param {string} type - "stardust" | "vortex" | "petal" | "firefly" | "snow"
 * @param {object} options - 覆盖默认参数
 * @returns {THREE.Points}
 */
export function spawn(type, options = {}) {
  if (!sceneRef) {
    console.warn("[ParticleEngine] No scene bound — call bindScene() first");
    return null;
  }

  const factory = FACTORIES[type];
  if (!factory) {
    console.warn(`[ParticleEngine] Unknown type: ${type}`);
    return null;
  }

  const emitter = factory(options);
  sceneRef.add(emitter);

  registry.set(type, { emitter, burst: null });
  console.log(`[ParticleEngine] Spawned "${type}" (${emitter.userData.count} particles)`);

  return emitter;
}

/**
 * 粒子爆裂（模式切换时调用）
 *
 * @param {THREE.Vector3} origin - 爆裂中心
 * @param {string} color - 颜色
 * @param {number} count - 粒子数
 */
export function burst(origin, color = "#ffd4a0", count = 300) {
  if (!sceneRef) return;

  const geo = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const alphas = new Float32Array(count);
  const angles = new Float32Array(count);

  const velocities = new Float32Array(count * 3); // CPU-side for update
  const lifetimes = new Float32Array(count);

  const baseColor = new THREE.Color(color);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    const speed = 0.5 + Math.random() * 3;

    positions[i * 3] = origin.x;
    positions[i * 3 + 1] = origin.y;
    positions[i * 3 + 2] = origin.z;

    velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
    velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
    velocities[i * 3 + 2] = Math.cos(phi) * speed;

    const c = baseColor.clone();
    c.offsetHSL((Math.random() - 0.5) * 0.1, 0, (Math.random() - 0.5) * 0.3);
    colors[i * 3] = c.r;
    colors[i * 3 + 1] = c.g;
    colors[i * 3 + 2] = c.b;

    sizes[i] = 0.02 + Math.random() * 0.06;
    alphas[i] = 1.0;
    angles[i] = Math.random() * Math.PI * 2;
    lifetimes[i] = 1.5 + Math.random() * 2;
  }

  geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
  geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
  geo.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
  geo.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
    },
    vertexShader: SOFT_CIRCLE_VERTEX,
    fragmentShader: SOFT_CIRCLE_FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  const mesh = new THREE.Points(geo, mat);
  mesh.name = "burst";
  mesh.userData = {
    type: "burst",
    count,
    velocities,
    lifetimes,
    createdAt: performance.now(),
    decay: true,
  };

  sceneRef.add(mesh);

  // 存储最近的 burst 引用
  const existing = registry.get("burst");
  if (existing?.emitter) {
    disposeEmitter(existing.emitter);
  }
  registry.set("burst", { emitter: mesh, burst: null });

  return mesh;
}

/**
 * 每帧更新所有发射器
 */
export function tick(time, delta) {
  registry.forEach(({ emitter }) => {
    if (!emitter) return;

    const ud = emitter.userData;

    // 更新 uniforms
    if (emitter.material.uniforms?.uTime) {
      emitter.material.uniforms.uTime.value = time;
    }

    // 涡旋呼吸相位
    if (emitter.material.uniforms?.uBreathPhase) {
      emitter.material.uniforms.uBreathPhase.value = time;
    }

    // 爆裂粒子衰减
    if (ud.decay && ud.velocities && ud.lifetimes) {
      updateBurstDecay(emitter, delta);
    }
  });
}

/** 移除发射器 */
export function despawn(type) {
  const entry = registry.get(type);
  if (entry?.emitter) {
    disposeEmitter(entry.emitter);
  }
  registry.delete(type);
}

/** 移除所有 */
export function clear() {
  registry.forEach(({ emitter }) => disposeEmitter(emitter));
  registry.clear();
}

// ==========================================
// 爆裂衰减
// ==========================================

function updateBurstDecay(mesh, delta) {
  const positions = mesh.geometry.attributes.position.array;
  const alphas = mesh.geometry.attributes.aAlpha.array;
  const { velocities, lifetimes } = mesh.userData;
  const elapsed = (performance.now() - mesh.userData.createdAt) / 1000;
  const count = mesh.userData.count;

  let allDead = true;

  for (let i = 0; i < count; i++) {
    const age = elapsed;
    if (age > lifetimes[i]) {
      alphas[i] = 0;
      continue;
    }

    allDead = false;
    const progress = age / lifetimes[i];

    // 物理：速度衰减
    const damp = 1 - progress;
    positions[i * 3] += velocities[i * 3] * delta * damp;
    positions[i * 3 + 1] += velocities[i * 3 + 1] * delta * damp;
    positions[i * 3 + 2] += velocities[i * 3 + 2] * delta * damp;

    // 轻微重力
    positions[i * 3 + 1] -= delta * 0.8 * progress;

    // alpha 衰减曲线
    alphas[i] = 1 - Math.pow(progress, 2);
  }

  mesh.geometry.attributes.position.needsUpdate = true;
  mesh.geometry.attributes.aAlpha.needsUpdate = true;

  if (allDead && elapsed > 3) {
    disposeEmitter(mesh);
    registry.delete("burst");
  }
}

// ==========================================
// 工厂函数
// ==========================================

const FACTORIES = {

  /** 星尘 — 球形分布柔光粒子 */
  stardust: (opts) => {
    const count = opts.count || 2000;
    const color = new THREE.Color(opts.color || "#d4a0ff");
    const spread = opts.spread || 6;

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    const angles = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 1.5 + Math.random() * spread;

      positions[i * 3] = Math.sin(phi) * Math.cos(theta) * r;
      positions[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * r;
      positions[i * 3 + 2] = Math.cos(phi) * r;

      const c = color.clone();
      c.offsetHSL((Math.random() - 0.5) * 0.08, 0, (Math.random() - 0.5) * 0.25);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = 0.02 + Math.random() * 0.06;
      alphas[i] = 0.3 + Math.random() * 0.7;
      angles[i] = Math.random() * Math.PI * 2;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    geo.setAttribute("aAngle", new THREE.BufferAttribute(angles, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: SOFT_CIRCLE_VERTEX,
      fragmentShader: SOFT_CIRCLE_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    });

    const mesh = new THREE.Points(geo, mat);
    mesh.name = "stardust";
    mesh.userData = { type: "stardust", count, rotationSpeed: 0.0003 };

    return mesh;
  },

  /** 涡旋银河 — 旋转粒子臂 */
  vortex: (opts) => {
    const count = opts.count || 3000;
    const color = new THREE.Color(opts.color || "#d4a0ff");
    const arms = opts.arms || 5;

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    const dists = new Float32Array(count);
    const speeds = new Float32Array(count);
    const offsets = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // 螺旋臂分布
      const armIndex = i % arms;
      const armAngle = (armIndex / arms) * Math.PI * 2;
      const dist = 0.3 + Math.pow(Math.random(), 0.5) * 5;
      const scatter = (Math.random() - 0.5) * 0.3 * (1 - dist / 5);

      const angle = armAngle + scatter;
      positions[i * 3] = Math.cos(angle) * dist;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 0.8 * (1 - dist / 5);
      positions[i * 3 + 2] = Math.sin(angle) * dist;

      const c = color.clone();
      // 中心暖色，外围冷色
      const hueShift = (dist / 5) * 0.15;
      c.offsetHSL(hueShift, 0, -dist / 10);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = 0.015 + Math.random() * 0.05 * (1 - dist / 6);
      alphas[i] = 0.4 + Math.random() * 0.6 * (1 - dist / 5);
      dists[i] = dist;
      speeds[i] = 0.3 + Math.random() * 0.4;
      offsets[i] = Math.random() * Math.PI * 2;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    geo.setAttribute("aDist", new THREE.BufferAttribute(dists, 1));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));
    geo.setAttribute("aOffset", new THREE.BufferAttribute(offsets, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uVortexStrength: { value: 1.0 },
        uBreathPhase: { value: 0 },
      },
      vertexShader: VORTEX_VERTEX,
      fragmentShader: VORTEX_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    });

    const mesh = new THREE.Points(geo, mat);
    mesh.name = "vortex";
    mesh.userData = { type: "vortex", count, arms };

    return mesh;
  },

  /** 玫瑰花瓣 — GPU 物理飘落 */
  petal: (opts) => {
    const count = opts.count || 300;
    const color = new THREE.Color(opts.color || "#ff6688");

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    const seeds = new Float32Array(count);
    const phases = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;

      const c = color.clone();
      c.offsetHSL((Math.random() - 0.5) * 0.06, 0, (Math.random() - 0.5) * 0.2);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = 0.06 + Math.random() * 0.14;
      alphas[i] = 0.5 + Math.random() * 0.5;
      seeds[i] = Math.random();
      phases[i] = Math.random() * Math.PI * 2;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    geo.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uGravity: { value: opts.gravity || 0.6 },
        uWind: { value: opts.wind || 0.5 },
      },
      vertexShader: PETAL_VERTEX,
      fragmentShader: PETAL_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.NormalBlending,
      opacity: 0,
    });

    const mesh = new THREE.Points(geo, mat);
    mesh.name = "petals";
    mesh.userData = { type: "petal", count };

    return mesh;
  },

  /** 萤火虫 — 漂浮光点 */
  firefly: (opts) => {
    const count = opts.count || 80;

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 6;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 5 - 1;

      const hue = 0.08 + Math.random() * 0.1; // 暖金
      const c = new THREE.Color().setHSL(hue, 0.9, 0.6 + Math.random() * 0.4);
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;

      sizes[i] = 0.04 + Math.random() * 0.1;
      alphas[i] = 0.5 + Math.random() * 0.5;
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.3 + Math.random() * 1.2;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aColor", new THREE.BufferAttribute(colors, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geo.setAttribute("aSpeed", new THREE.BufferAttribute(speeds, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: FIREFLY_VERTEX,
      fragmentShader: FIREFLY_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    });

    const mesh = new THREE.Points(geo, mat);
    mesh.name = "fireflies";
    mesh.userData = { type: "firefly", count };

    return mesh;
  },

  /** 雪花 — 缓慢飘落 */
  snow: (opts) => {
    const count = opts.count || 400;

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    const phases = new Float32Array(count);
    const drifts = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;

      sizes[i] = 0.02 + Math.random() * 0.06;
      alphas[i] = 0.3 + Math.random() * 0.7;
      phases[i] = Math.random() * Math.PI * 2;
      drifts[i] = 0.3 + Math.random() * 1.5;
    }

    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    geo.setAttribute("aPhase", new THREE.BufferAttribute(phases, 1));
    geo.setAttribute("aDrift", new THREE.BufferAttribute(drifts, 1));

    const mat = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        uWind: { value: opts.wind || 0.5 },
      },
      vertexShader: SNOW_VERTEX,
      fragmentShader: SNOW_FRAGMENT,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      opacity: 0,
    });

    const mesh = new THREE.Points(geo, mat);
    mesh.name = "snow";
    mesh.userData = { type: "snow", count };

    return mesh;
  },
};

// ==========================================
// 工具
// ==========================================

function disposeEmitter(mesh) {
  if (!mesh) return;
  mesh.geometry?.dispose();
  mesh.material?.dispose();
  mesh.parent?.remove(mesh);
}

/** 获取注册的发射器（用于外部动画控制） */
export function get(type) {
  return registry.get(type)?.emitter || null;
}

/** 淡入发射器 */
export function fadeIn(type, duration = 2) {
  const mesh = get(type);
  if (!mesh?.material) return;
  mesh.material.opacity = 0;
  // 使用 GSAP 需要在调用方导入，这里提供简单递增
  const start = performance.now();
  function tick() {
    const elapsed = (performance.now() - start) / 1000;
    const progress = Math.min(elapsed / duration, 1);
    mesh.material.opacity = progress;
    if (progress < 1) requestAnimationFrame(tick);
  }
  tick();
}

/** 淡出并销毁 */
export function fadeOut(type, duration = 1.5) {
  const mesh = get(type);
  if (!mesh?.material) return;
  const startOp = mesh.material.opacity;
  const start = performance.now();
  function tick() {
    const elapsed = (performance.now() - start) / 1000;
    const progress = Math.min(elapsed / duration, 1);
    mesh.material.opacity = startOp * (1 - progress);
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      despawn(type);
    }
  }
  tick();
}
