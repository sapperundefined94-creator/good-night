// ============================================
// 🌙 Good Night — Capture Mode (取景框冻结)
// ============================================

import * as THREE from "three";
import { setLightPreset } from "../world/lights.js";
import { showPrompt } from "../ui/promptLayer.js";
import { getScene } from "../world/scene.js";
import { gsap } from "gsap";

let frameGroup = null;
let frozenScene = null;

export function enterCapture() {
  console.log("[Mode] Entering CAPTURE");
  setLightPreset("AWAKE");
  showPrompt("🔲 冻结此刻");

  createFrameOverlay();
  freezeScene();
}

export function exitCapture() {
  console.log("[Mode] Exiting CAPTURE");
  removeFrame();
  unfreezeScene();
}

/** 创建取景框 */
function createFrameOverlay() {
  const scene = getScene();
  if (!scene || frameGroup) return;

  frameGroup = new THREE.Group();
  frameGroup.name = "capture-frame";

  // 四个角标
  const cornerLength = 0.5;
  const cornerThickness = 0.03;
  const spread = 2.5;

  const corners = [
    { x: -spread, y: spread },   // 左上
    { x: spread, y: spread },    // 右上
    { x: -spread, y: -spread },  // 左下
    { x: spread, y: -spread },   // 右下
  ];

  corners.forEach(({ x, y }) => {
    const signX = Math.sign(x);
    const signY = Math.sign(y);

    // 水平线
    const hGeo = new THREE.BoxGeometry(cornerLength, cornerThickness, 0.01);
    const hMat = new THREE.MeshBasicMaterial({ color: 0xffd4a0, transparent: true, opacity: 0.8 });
    const hBar = new THREE.Mesh(hGeo, hMat);
    hBar.position.set(x - signX * cornerLength / 2, y, 0);
    frameGroup.add(hBar);

    // 竖直线
    const vGeo = new THREE.BoxGeometry(cornerThickness, cornerLength, 0.01);
    const vMat = new THREE.MeshBasicMaterial({ color: 0xffd4a0, transparent: true, opacity: 0.8 });
    const vBar = new THREE.Mesh(vGeo, vMat);
    vBar.position.set(x, y - signY * cornerLength / 2, 0);
    frameGroup.add(vBar);
  });

  frameGroup.position.z = -1;
  frameGroup.scale.set(0.01, 0.01, 0.01);
  scene.add(frameGroup);

  gsap.to(frameGroup.scale, {
    x: 1, y: 1, z: 1,
    duration: 0.8,
    ease: "back.out(1.7)",
  });
}

function removeFrame() {
  if (!frameGroup) return;

  gsap.to(frameGroup.scale, {
    x: 0.01, y: 0.01, z: 0.01,
    duration: 0.5,
    ease: "power2.in",
    onComplete: () => {
      frameGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      frameGroup.parent?.remove(frameGroup);
      frameGroup = null;
    },
  });
}

/** 冻结场景（停止动画） */
function freezeScene() {
  // 可以通过暂停时钟或设置 time scale = 0 来实现
  // 实际实现略
}

function unfreezeScene() {
  // 恢复动画
}
