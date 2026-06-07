// ============================================
// 🌙 Good Night — Three.js Main Scene
// ============================================

import * as THREE from "three";
import { initCamera, getCamera, updateCamera } from "./camera.js";
import { initLights } from "./lights.js";
import { initEnvironment } from "./environment.js";
import { emit } from "../core/eventBus.js";
import { tick as tickParticles } from "../systems/particleEngine.js";

// 后处理懒加载
let renderPost = null;      // 后处理渲染函数（加载后赋值）
let postReady = false;

let scene;
let renderer;
let clock;

export function initScene() {
  console.log("[Scene] Initializing Three.js...");

  // ---- Scene ----
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0f);
  scene.fog = new THREE.FogExp2(0x0a0a0f, 0.00015);

  // ---- Camera ----
  initCamera();
  const camera = getCamera();

  // ---- Renderer ----
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  document.getElementById("app").appendChild(renderer.domElement);

  // ---- Lights ----
  initLights(scene);

  // ---- Environment ----
  initEnvironment(scene);

  // ---- Clock ----
  clock = new THREE.Clock();

  // ---- Handle resize ----
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // ---- Start loop (无后处理，先裸渲染) ----
  animate();

  // 后台加载后处理
  loadPostProcessing(renderer, scene, camera);

  emit("scene:ready");
  console.log("[Scene] Ready (post-processing loading...)");
}

/** 懒加载后处理管线 */
async function loadPostProcessing(renderer, scene, camera) {
  try {
    const mod = await import("../systems/postProcessing.js");
    mod.initPostProcessing(renderer, scene, camera);
    renderPost = mod.render;
    postReady = true;
    console.log("[Scene] Post-processing activated");
  } catch (err) {
    console.warn("[Scene] Post-processing unavailable:", err.message);
    // renderPost 保持 null，使用 fallback
  }
}

function animate() {
  requestAnimationFrame(animate);

  const delta = Math.min(clock.getDelta(), 0.1);
  const elapsed = clock.getElapsedTime();

  // GPU 粒子引擎更新
  tickParticles(elapsed, delta);

  // 相机漂移 + 视差
  updateCamera(delta, elapsed);

  // Update uniforms / animations
  scene.traverse((child) => {
    if (child.material && child.material.uniforms?.uTime) {
      child.material.uniforms.uTime.value = elapsed;
    }
  });

  const camera = getCamera();

  if (renderPost) {
    // 后处理管线（Bloom + Vignette）
    renderPost(delta);
  } else {
    // Fallback：直接渲染
    renderer.render(scene, camera);
  }
}

/** 获取场景实例 */
export function getScene() {
  return scene;
}

/** 获取渲染器 */
export function getRenderer() {
  return renderer;
}

/** 获取时钟 */
export function getClock() {
  return clock;
}
