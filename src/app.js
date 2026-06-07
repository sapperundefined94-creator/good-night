// ============================================
// 🌙 Good Night — Application Controller v2
// ============================================

import { initStateMachine } from "./core/stateMachine.js";
import { initEventBus } from "./core/eventBus.js";
import { initModeManager } from "./core/modeManager.js";
// 注意：mediaPipe 不再自动初始化，由 modeSelector 按需启动
import { initScene } from "./world/scene.js";
import { initAudio } from "./systems/audioManager.js";
import { initPhotoManager } from "./systems/photoManager.js";
import { initOverlay } from "./ui/overlay.js";
import { initPromptLayer } from "./ui/promptLayer.js";
import { initIntroGuide } from "./ui/introGuide.js";
import { initAdminPanel } from "./ui/adminPanel.js";
import { initModeSelector } from "./ui/modeSelector.js";
import { showGestureHUD } from "./ui/gestureHUD.js";
import { userConfig } from "./config/userConfig.js";

export async function initApp() {
  console.log("%c🌙 Good Night — Starting...", "font-size:1.2em;color:#d4a574;");
  console.log(`%c  为 ${userConfig.name} 准备的夜晚`, "color:#e8e0d4;");

  // 1. Core infrastructure
  initEventBus();
  initStateMachine();
  initModeManager();

  // 2. Rendering (scene, camera, lights, environment)
  initScene();

  // 3. Systems
  initAudio();
  initPhotoManager();

  // 4. UI (不含引导页 — 等选择完交互方式后再显示)
  initOverlay();
  initPromptLayer();
  initAdminPanel();

  // 5. 隐藏加载画面
  hideLoader();

  // 6. 等待用户选择交互方式
  console.log("[App] Waiting for mode selection...");
  const chosenMode = await initModeSelector();

  console.log(`[App] Mode chosen: ${chosenMode}`);

  // 7. 手势模式：显示专属 HUD
  if (chosenMode === "camera") {
    showGestureHUD();
  }

  // 8. 引导页
  initIntroGuide();

  console.log("%c🌙 Good Night — Ready", "font-size:1.2em;color:#d4a574;");
}

function hideLoader() {
  const loader = document.getElementById("loader");
  if (!loader) return;

  setTimeout(() => {
    loader.classList.add("hidden");
    setTimeout(() => loader.remove(), 900);
  }, 500);
}
