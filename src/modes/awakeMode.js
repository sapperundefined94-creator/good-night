// ============================================
// 🌙 Good Night — Awake Mode (清醒)
// ============================================

import { setLightPreset } from "../world/lights.js";
import { showPrompt } from "../ui/promptLayer.js";

export function enterAwake() {
  console.log("[Mode] Entering AWAKE");
  setLightPreset("AWAKE");
  showPrompt("今晚，还不想睡吗？");
}

export function exitAwake() {
  console.log("[Mode] Exiting AWAKE");
}
