// ============================================
// 🌙 Good Night — Dream Mode v2 (梦境粒子空间)
// ============================================

import * as THREE from "three";
import { setLightPreset } from "../world/lights.js";
import { showPrompt } from "../ui/promptLayer.js";
import { getScene } from "../world/scene.js";
import { gsap } from "gsap";
import { spawn, despawn, fadeIn, fadeOut, burst, bindScene } from "../systems/particleEngine.js";

let animationId = null;
let centerGlow = null;
let orbGroup = null;
let isExiting = false;

export function enterDream() {
  console.log("[Mode] Entering DREAM v2");
  isExiting = false;

  setLightPreset("DREAM");
  showPrompt("✨ 欢迎进入梦境...");

  const scene = getScene();
  bindScene(scene);

  // 1. 涡旋银河 — 5 臂螺旋，3000 粒子
  const vortex = spawn("vortex", {
    count: 3000,
    color: "#c8a0ff",
    arms: 5,
  });
  if (vortex) {
    vortex.position.set(0, 0.3, -1);
    fadeIn("vortex", 3);
  }

  // 2. 星尘 — 1500 柔光粒子球
  const stardust = spawn("stardust", {
    count: 1500,
    color: "#ffaacc",
    spread: 7,
  });
  if (stardust) {
    stardust.position.set(0, 0, 0);
    fadeIn("stardust", 2.5);
  }

  // 3. 玫瑰花瓣 — 300 片 GPU 物理飘落
  const petals = spawn("petal", {
    count: 300,
    color: "#ff6688",
    gravity: 0.5,
    wind: 0.6,
  });
  if (petals) {
    petals.position.set(0, 2, -1);
    fadeIn("petal", 3.5);
  }

  // 4. 萤火虫 — 50 只暖金光点
  const fireflies = spawn("firefly", { count: 50 });
  if (fireflies) {
    fireflies.position.set(0, 0, -2);
    fadeIn("firefly", 2);
  }

  // 5. 中心光球（Shader 脉动）
  createCenterGlow(scene);

  // 6. 漂浮光球群
  createOrbCluster(scene);

  // 7. 入场爆裂
  burst(new THREE.Vector3(0, 0, 0), "#d4a0ff", 250);

  // 启动动画循环
  startAnimation();
}

export function exitDream() {
  console.log("[Mode] Exiting DREAM v2");
  isExiting = true;

  stopAnimation();

  // 退场爆裂
  burst(new THREE.Vector3(0, 0, 0), "#ffaacc", 200);

  // 淡出所有发射器
  fadeOut("vortex", 2);
  fadeOut("stardust", 1.5);
  fadeOut("petal", 2);
  fadeOut("firefly", 1);

  // 移除光球
  removeCenterGlow();
  removeOrbCluster();

  // 延迟清理（等淡出完成）
  setTimeout(() => {
    despawn("vortex");
    despawn("stardust");
    despawn("petal");
    despawn("firefly");
  }, 2200);
}

// ==========================================
// 中心光球
// ==========================================

function createCenterGlow(scene) {
  if (centerGlow) return;

  const geo = new THREE.SphereGeometry(0.2, 32, 32);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color("#d4a0ff") },
      uColor2: { value: new THREE.Color("#ff88aa") },
    },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      void main() {
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
        float pulse = 0.8 + 0.2 * sin(uTime * 1.5) * cos(uTime * 0.7);
        vec3 color = mix(uColor1, uColor2, sin(uTime * 0.3) * 0.5 + 0.5);
        float alpha = (0.15 + fresnel * 0.85) * pulse;
        // 边缘发光
        alpha += fresnel * 0.3;
        gl_FragColor = vec4(mix(color, vec3(1.0), fresnel * 0.6), alpha);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  });

  centerGlow = new THREE.Mesh(geo, mat);
  centerGlow.name = "dream-center-glow";
  centerGlow.position.set(0, 0.3, -0.5);
  centerGlow.scale.set(0, 0, 0);

  scene.add(centerGlow);

  // 弹性入场
  gsap.to(centerGlow.scale, {
    x: 1.3, y: 1.3, z: 1.3,
    duration: 3.5,
    ease: "elastic.out(0.8, 0.3)",
  });
}

function removeCenterGlow() {
  if (!centerGlow) return;

  gsap.to(centerGlow.scale, {
    x: 0, y: 0, z: 0,
    duration: 1,
    ease: "power2.in",
    onComplete: () => {
      centerGlow.geometry?.dispose();
      centerGlow.material?.dispose();
      centerGlow.parent?.remove(centerGlow);
      centerGlow = null;
    },
  });
}

// ==========================================
// 漂浮光球群
// ==========================================

function createOrbCluster(scene) {
  if (orbGroup) return;

  orbGroup = new THREE.Group();
  orbGroup.name = "dream-orbs";

  const orbCount = 12;
  for (let i = 0; i < orbCount; i++) {
    const size = 0.03 + Math.random() * 0.07;
    const geo = new THREE.SphereGeometry(size, 16, 16);
    const hue = 0.7 + Math.random() * 0.2; // 紫-粉范围
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color().setHSL(hue, 0.8, 0.6 + Math.random() * 0.4),
      transparent: true,
      opacity: 0.5 + Math.random() * 0.5,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const orb = new THREE.Mesh(geo, mat);
    orb.position.set(
      (Math.random() - 0.5) * 6,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 3 - 1
    );
    orb.userData = {
      baseY: orb.position.y,
      speed: 0.3 + Math.random() * 0.8,
      amplitude: 0.3 + Math.random() * 1.2,
      phase: Math.random() * Math.PI * 2,
      orbitRadius: 0.5 + Math.random() * 2.5,
      orbitSpeed: (Math.random() - 0.5) * 0.3,
      orbitPhase: Math.random() * Math.PI * 2,
    };
    orbGroup.add(orb);
  }

  orbGroup.scale.set(0, 0, 0);
  scene.add(orbGroup);

  gsap.to(orbGroup.scale, {
    x: 1, y: 1, z: 1,
    duration: 4,
    ease: "elastic.out(0.7, 0.35)",
  });
}

function removeOrbCluster() {
  if (!orbGroup) return;

  gsap.to(orbGroup.scale, {
    x: 0, y: 0, z: 0,
    duration: 1.5,
    ease: "power2.in",
    onComplete: () => {
      orbGroup.traverse((child) => {
        if (child.geometry) child.geometry.dispose();
        if (child.material) child.material.dispose();
      });
      orbGroup.parent?.remove(orbGroup);
      orbGroup = null;
    },
  });
}

// ==========================================
// 动画循环
// ==========================================

function startAnimation() {
  let lastTime = performance.now();

  function animate() {
    if (isExiting) return;
    animationId = requestAnimationFrame(animate);

    const now = performance.now();
    const delta = Math.min((now - lastTime) / 1000, 0.1);
    const time = now * 0.001;
    lastTime = now;

    // 中心光球脉动
    if (centerGlow?.material.uniforms) {
      centerGlow.material.uniforms.uTime.value = time;
      // 呼吸缩放
      const breathe = 1.3 + Math.sin(time * 0.8) * 0.15 + Math.sin(time * 1.3) * 0.1;
      centerGlow.scale.lerp(
        new THREE.Vector3(breathe, breathe, breathe),
        0.05
      );
    }

    // 光球群浮动
    if (orbGroup && !isExiting) {
      orbGroup.children.forEach((orb) => {
        const { baseY, speed, amplitude, phase, orbitRadius, orbitSpeed, orbitPhase } = orb.userData;
        // 上下浮动
        orb.position.y = baseY + Math.sin(time * speed + phase) * amplitude;
        // 水平轨道
        orb.position.x += Math.cos(time * orbitSpeed + orbitPhase) * 0.003;
        orb.position.z += Math.sin(time * orbitSpeed + orbitPhase) * 0.002;
        // 闪烁
        orb.material.opacity = 0.4 + Math.sin(time * 2 + phase) * 0.3;
      });
      orbGroup.rotation.y += 0.0005;
    }

    // 涡旋整体缓慢旋转
    const vortex = document.querySelector?.dreamVortex; // custom reference
    if (vortex) {
      vortex.rotation.y += 0.0002;
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
