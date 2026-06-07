// ============================================
// 🌙 Good Night — Sleep Mode v2 (睡前安抚)
// ============================================

import * as THREE from "three";
import { setLightPreset } from "../world/lights.js";
import { showPrompt } from "../ui/promptLayer.js";
import { getScene } from "../world/scene.js";
import { gsap } from "gsap";
import { spawn, despawn, fadeIn, fadeOut, burst, bindScene } from "../systems/particleEngine.js";

let blanketMesh = null;
let animationId = null;
let isExiting = false;

export function enterSleep() {
  console.log("[Mode] Entering SLEEP v2");
  isExiting = false;

  setLightPreset("SLEEP");
  showPrompt("闭上眼睛，放松身体...");

  const scene = getScene();
  bindScene(scene);

  // 1. 雪花飘落 — 400 片，微风
  const snow = spawn("snow", { count: 400, wind: 0.3 });
  if (snow) {
    snow.position.set(0, 0, -1);
    fadeIn("snow", 3);
  }

  // 2. 少量暖光萤火虫
  const fireflies = spawn("firefly", { count: 30 });
  if (fireflies) {
    fireflies.position.set(0, -1, -2);
    fadeIn("firefly", 2.5);
  }

  // 3. 安抚被子（Shader 动画）
  createBlanket(scene);

  // 4. 入场光爆
  burst(new THREE.Vector3(0, 0, 0), "#ffc8a0", 150);

  // 5. 动画循环
  startAnimation();
}

export function exitSleep() {
  console.log("[Mode] Exiting SLEEP v2");
  isExiting = true;

  stopAnimation();

  // 退场爆裂
  burst(new THREE.Vector3(0, 0, 0), "#ffaa88", 120);

  // 淡出粒子
  fadeOut("snow", 2);
  fadeOut("firefly", 1.5);

  // 移除被子
  removeBlanket();

  // 延迟清理
  setTimeout(() => {
    despawn("snow");
    despawn("firefly");
  }, 2200);
}

// ==========================================
// 安抚被子
// ==========================================

function createBlanket(scene) {
  if (blanketMesh) return;

  const geo = new THREE.PlaneGeometry(14, 11, 48, 48);

  // 微扰顶点让被子有布料感
  const posAttr = geo.attributes.position;
  for (let i = 0; i < posAttr.count; i++) {
    const x = posAttr.getX(i);
    const y = posAttr.getY(i);
    posAttr.setZ(i, (Math.sin(x * 1.5) * Math.cos(y * 1.8)) * 0.3);
  }
  geo.computeVertexNormals();

  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#3a2a4a") },
      uOpacity: { value: 0 },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float uTime;
      void main() {
        vUv = uv;
        vec3 pos = position;
        // 呼吸式起伏
        float wave = sin(pos.x * 2.0 + uTime * 0.4) * cos(pos.y * 2.5 + uTime * 0.3) * 0.15;
        pos.z += wave;
        vNormal = normalize(normalMatrix * normal);
        vPosition = pos;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      void main() {
        // 边缘渐隐 + 波纹纹理
        float edge = smoothstep(0.0, 0.25, vUv.x)
                   * smoothstep(1.0, 0.75, vUv.x)
                   * smoothstep(0.0, 0.25, vUv.y)
                   * smoothstep(1.0, 0.75, vUv.y);

        // 柔光波纹
        float ripple = 0.08 * sin(vUv.x * 15.0 + uTime * 0.5)
                     * cos(vUv.y * 12.0 + uTime * 0.4);

        // 菲涅尔边缘光
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);

        float alpha = (0.10 + ripple + fresnel * 0.08) * edge * uOpacity;

        gl_FragColor = vec4(uColor, alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
  });

  blanketMesh = new THREE.Mesh(geo, mat);
  blanketMesh.name = "blanket";
  blanketMesh.position.set(0, 1.2, -2);
  blanketMesh.rotation.x = -0.35;

  scene.add(blanketMesh);

  // 渐入
  gsap.to(mat.uniforms.uOpacity, {
    value: 1,
    duration: 4,
    ease: "power3.out",
  });
}

function removeBlanket() {
  if (!blanketMesh) return;

  gsap.to(blanketMesh.material.uniforms.uOpacity, {
    value: 0,
    duration: 2,
    ease: "power2.in",
    onComplete: () => {
      blanketMesh.geometry?.dispose();
      blanketMesh.material?.dispose();
      blanketMesh.parent?.remove(blanketMesh);
      blanketMesh = null;
    },
  });
}

// ==========================================
// 动画循环
// ==========================================

function startAnimation() {
  function animate() {
    if (isExiting) return;
    animationId = requestAnimationFrame(animate);

    const time = performance.now() * 0.001;

    // 被子呼吸
    if (blanketMesh?.material.uniforms) {
      blanketMesh.material.uniforms.uTime.value = time;
    }
  }
  animate();
}

function stopAnimation() {
  if (animationId) {
    cancelAnimationFrame(animationId);
    animationId = null;
  }
}
