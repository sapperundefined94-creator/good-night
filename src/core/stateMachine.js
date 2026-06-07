// ============================================
// 🌙 Good Night — State Machine
// ============================================

import { emit, on } from "./eventBus.js";

/**
 * 状态定义：
 *   AWAKE      — 清醒（默认状态）
 *   SLEEP      — 睡前安抚（被子/柔光）
 *   DREAM      — 梦境粒子空间 ✨
 *   MEMORY     — 记忆照片墙 📸
 *   CAPTURE    — 取景框冻结 🔲
 *   DEEP_SLEEP — 深睡 🌑
 *   DRAW       — 绘画模式
 *   MUSIC      — 音乐模式
 */

export const STATES = {
  AWAKE: "AWAKE",
  SLEEP: "SLEEP",
  DREAM: "DREAM",
  MEMORY: "MEMORY",
  CAPTURE: "CAPTURE",
  DEEP_SLEEP: "DEEP_SLEEP",
  DRAW: "DRAW",
  MUSIC: "MUSIC",
};

let currentState = STATES.AWAKE;
let stateHistory = [];

export function initStateMachine() {
  console.log("[StateMachine] Initialized — current:", currentState);

  // Listen for gesture-decoded state requests
  on("gesture:decoded", ({ targetState }) => {
    if (targetState && targetState !== currentState) {
      transitionTo(targetState);
    }
  });
}

/** 获取当前状态 */
export function getState() {
  return currentState;
}

/** 获取状态历史 */
export function getHistory() {
  return [...stateHistory];
}

/** 执行状态转换 */
export function transitionTo(newState) {
  if (!STATES[newState]) {
    console.warn(`[StateMachine] Unknown state: ${newState}`);
    return;
  }

  const previousState = currentState;

  // Exit old state
  emit("mode:exit", { mode: previousState });
  emit(`mode:exit:${previousState}`);

  // Enter new state
  currentState = newState;
  stateHistory.push({ from: previousState, to: newState, time: Date.now() });

  emit("state:change", { from: previousState, to: newState });
  emit("mode:enter", { mode: newState });
  emit(`mode:enter:${newState}`);

  // Update UI
  const indicator = document.getElementById("state-indicator");
  if (indicator) {
    indicator.textContent = newState;
  }

  // Log with style
  const stateMessages = {
    AWAKE: "今晚，还不想睡吗？",
    SLEEP: "🌙 进入睡前安抚...",
    DREAM: "✨ 进入梦境粒子空间...",
    MEMORY: "📸 打开记忆照片墙...",
    CAPTURE: "🔲 冻结此刻...",
    DEEP_SLEEP: "🌑 沉入深睡...",
    DRAW: "🎨 绘画模式...",
    MUSIC: "🎧 音乐模式...",
  };

  console.log(
    `%c[StateMachine] ${previousState} → ${newState}`,
    "color:#d4a574;",
    `\n  ${stateMessages[newState] || ""}`
  );
}
