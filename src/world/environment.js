// ============================================
// 🌙 Good Night — Environment Manager
// ============================================

import * as THREE from "three";
import { getScene } from "./scene.js";
import { on } from "../core/eventBus.js";
import { burst, bindScene } from "../systems/particleEngine.js";

/**
 * 环境对象管理 + 模式过渡爆裂特效
 */

// 各模式对应的爆裂颜色
const BURST_COLORS = {
  AWAKE: "#ffd4a0",
  SLEEP: "#ffc8a0",
  DREAM: "#d4a0ff",
  MEMORY: "#ffdd88",
  CAPTURE: "#ffffff",
  DEEP_SLEEP: "#112244",
};

let currentEnvironment = null;
let roomMesh = null;
let dreamParticles = null;
let photoWallGroup = null;
let captureFrame = null;

export function initEnvironment(scene) {
  bindScene(scene);

  createAwakeEnvironment(scene);

  on("mode:enter", ({ mode }) => {
    // 模式切换爆裂特效
    const color = BURST_COLORS[mode] || "#ffd4a0";
    burst(new THREE.Vector3(0, 0, 0), color, mode === "DEEP_SLEEP" ? 100 : 250);

    switch (mode) {
      case "AWAKE": transitionToAwake(scene); break;
      case "SLEEP": transitionToSleep(scene); break;
      case "DREAM": transitionToDream(scene); break;
      case "MEMORY": transitionToMemory(scene); break;
      case "CAPTURE": transitionToCapture(scene); break;
      case "DEEP_SLEEP": transitionToDeepSleep(scene); break;
    }
  });
}

/** AWAKE 环境 — 抽象房间 */
function createAwakeEnvironment(scene) {
  // 地板网格
  const gridHelper = new THREE.PolarGridHelper(6, 32, 24, 64, 0x333344, 0x222233);
  gridHelper.position.y = -2;
  scene.add(gridHelper);
  gridHelper.name = "awake-grid";

  // 中心光点
  const glowGeo = new THREE.SphereGeometry(0.08, 32, 32);
  const glowMat = new THREE.MeshBasicMaterial({ color: 0xffd4a0 });
  const glowSphere = new THREE.Mesh(glowGeo, glowMat);
  glowSphere.name = "awake-glow";
  scene.add(glowSphere);
}

function transitionToAwake(scene) {
  scene.fog = new THREE.FogExp2(0x0a0a0f, 0.00015);
  scene.background = new THREE.Color(0x0a0a0f);
  clearExcept(scene, []);
}

function transitionToSleep(scene) {
  scene.fog = new THREE.FogExp2(0x1a1020, 0.0008);
  scene.background = new THREE.Color(0x0d0815);
  clearExcept(scene, []);
}

function transitionToDream(scene) {
  scene.fog = new THREE.FogExp2(0x0a0a20, 0.0003);
  scene.background = new THREE.Color(0x050515);
  clearExcept(scene, []);
}

function transitionToMemory(scene) {
  scene.fog = new THREE.FogExp2(0x0a0a0f, 0.0001);
  clearExcept(scene, []);
}

function transitionToCapture(scene) {
  scene.fog = new THREE.FogExp2(0x000000, 0.0005);
  clearExcept(scene, []);
}

function transitionToDeepSleep(scene) {
  scene.fog = new THREE.FogExp2(0x000008, 0.002);
  scene.background = new THREE.Color(0x020208);
  clearExcept(scene, []);
}

/** 清理场景中除保留对象外的所有 mesh */
function clearExcept(scene, keepNames = []) {
  const toRemove = [];
  scene.traverse((child) => {
    if (child.isMesh || child.isLine || child.isPoints) {
      if (!keepNames.includes(child.name)) {
        toRemove.push(child);
      }
    }
  });
  toRemove.forEach((obj) => {
    if (obj.geometry) obj.geometry.dispose();
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach((m) => m.dispose());
      } else {
        obj.material.dispose();
      }
    }
    obj.parent?.remove(obj);
  });
}
