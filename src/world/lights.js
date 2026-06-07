// ============================================
// 🌙 Good Night — Lighting System
// ============================================

import * as THREE from "three";

/**
 * 灯光配置文件
 * 不同模式使用不同的光照方案
 */
const LIGHT_PRESETS = {
  AWAKE: {
    ambient: { color: 0x2a2a3a, intensity: 0.6 },
    key: { color: 0xffeedd, intensity: 1.2, position: [5, 5, 5] },
    rim: { color: 0x4466aa, intensity: 0.4, position: [-3, 1, -2] },
  },
  SLEEP: {
    ambient: { color: 0x1a1020, intensity: 0.3 },
    key: { color: 0xffc8a0, intensity: 0.6, position: [0, 3, 4] },
    rim: { color: 0x332244, intensity: 0.5, position: [-2, 0, -3] },
  },
  DREAM: {
    ambient: { color: 0x0a0a20, intensity: 0.4 },
    key: { color: 0xd4a0ff, intensity: 0.8, position: [0, 5, 0] },
    rim: { color: 0xff6699, intensity: 0.6, position: [3, -1, -3] },
  },
  DEEP_SLEEP: {
    ambient: { color: 0x050510, intensity: 0.15 },
    key: { color: 0x112244, intensity: 0.2, position: [0, 0, 5] },
    rim: { color: 0x000022, intensity: 0.3, position: [0, 0, -3] },
  },
};

let ambientLight;
let keyLight;
let rimLight;

export function initLights(scene) {
  ambientLight = new THREE.AmbientLight(0x2a2a3a, 0.6);
  scene.add(ambientLight);

  keyLight = new THREE.DirectionalLight(0xffeedd, 1.2);
  keyLight.position.set(5, 5, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.set(1024, 1024);
  scene.add(keyLight);

  rimLight = new THREE.PointLight(0x4466aa, 0.4);
  rimLight.position.set(-3, 1, -2);
  scene.add(rimLight);
}

/**
 * 切换到指定模式的光照方案
 */
export function setLightPreset(presetName) {
  const preset = LIGHT_PRESETS[presetName] || LIGHT_PRESETS.AWAKE;

  if (ambientLight) {
    ambientLight.color.set(preset.ambient.color);
    ambientLight.intensity = preset.ambient.intensity;
  }

  if (keyLight) {
    keyLight.color.set(preset.key.color);
    keyLight.intensity = preset.key.intensity;
    keyLight.position.set(...preset.key.position);
  }

  if (rimLight) {
    rimLight.color.set(preset.rim.color);
    rimLight.intensity = preset.rim.intensity;
    rimLight.position.set(...preset.rim.position);
  }
}

export { ambientLight, keyLight, rimLight };
