// ============================================
// 🌙 Good Night — Deep Sleep Mode (深睡)
// ============================================

import * as THREE from "three";
import { setLightPreset } from "../world/lights.js";
import { showPrompt } from "../ui/promptLayer.js";
import { getScene } from "../world/scene.js";
import { gsap } from "gsap";

let darkVeil = null;
let breathIndicator = null;
let breathAnimation = null;

export function enterDeepSleep() {
  console.log("[Mode] Entering DEEP_SLEEP");
  setLightPreset("DEEP_SLEEP");
  showPrompt("");

  createDarkVeil();
  startBreathIndicator();
}

export function exitDeepSleep() {
  console.log("[Mode] Exiting DEEP_SLEEP");
  removeDarkVeil();
  stopBreathIndicator();
}

/** 创建黑暗帷幕（覆盖整个视野） */
function createDarkVeil() {
  const scene = getScene();
  if (!scene || darkVeil) return;

  const geo = new THREE.PlaneGeometry(20, 20);
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
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
      uniform float uTime;
      uniform float uOpacity;
      void main() {
        // Vignette effect
        float d = length(vUv - 0.5) * 2.0;
        float vignette = smoothstep(1.0, 0.3, d);
        vec3 color = mix(vec3(0.02, 0.01, 0.04), vec3(0.0), vignette);
        // Slow breathing pulse
        float pulse = 0.02 * sin(uTime * 0.3) * (1.0 - d);
        float alpha = uOpacity * (0.95 + pulse);
        gl_FragColor = vec4(color, alpha);
      }
    `,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  darkVeil = new THREE.Mesh(geo, mat);
  darkVeil.name = "dark-veil";
  darkVeil.position.z = 0.5;
  darkVeil.renderOrder = 999;
  darkVeil.material.depthTest = false;
  scene.add(darkVeil);

  // 渐入
  gsap.to(mat.uniforms.uOpacity, {
    value: 1,
    duration: 5,
    ease: "power3.in",
  });
}

function removeDarkVeil() {
  if (!darkVeil) return;

  gsap.to(darkVeil.material.uniforms.uOpacity, {
    value: 0,
    duration: 3,
    ease: "power2.out",
    onComplete: () => {
      darkVeil.geometry?.dispose();
      darkVeil.material?.dispose();
      darkVeil.parent?.remove(darkVeil);
      darkVeil = null;
    },
  });
}

/** 呼吸指示器（屏幕中央微弱光点） */
function startBreathIndicator() {
  const overlay = document.getElementById("ui-overlay");
  if (!overlay) return;

  breathIndicator = document.createElement("div");
  breathIndicator.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(100,120,180,0.4) 0%, transparent 70%);
    pointer-events: none;
  `;
  overlay.appendChild(breathIndicator);

  // 呼吸动画
  breathAnimation = gsap.to(breathIndicator, {
    width: 60,
    height: 60,
    opacity: 0.3,
    duration: 4,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
}

function stopBreathIndicator() {
  if (breathAnimation) {
    breathAnimation.kill();
    breathAnimation = null;
  }
  breathIndicator?.remove();
  breathIndicator = null;
}
