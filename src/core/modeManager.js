// ============================================
// 🌙 Good Night — Mode Manager v2 (Lazy Load)
// ============================================

import { on } from "./eventBus.js";

// AWAKE 是默认模式，静态加载（首屏必需）
import { enterAwake, exitAwake } from "../modes/awakeMode.js";

/**
 * 懒加载模式模块。
 *
 * SLEEP/DREAM/MEMORY/CAPTURE/DEEP_SLEEP 仅在首次进入时动态 import，
 * 加载后缓存。首屏 bundle 减少 ~200KB。
 */

const MODE_LOADERS = {
  SLEEP: () => import("../modes/sleepMode.js"),
  DREAM: () => import("../modes/dreamMode.js"),
  MEMORY: () => import("../modes/memoryMode.js"),
  CAPTURE: () => import("../modes/captureMode.js"),
  DEEP_SLEEP: () => import("../modes/deepSleepMode.js"),
};

// 模式注册表 — 懒填充
const modeRegistry = {
  AWAKE: { enter: enterAwake, exit: exitAwake },
  SLEEP: null,
  DREAM: null,
  MEMORY: null,
  CAPTURE: null,
  DEEP_SLEEP: null,
};

// 正在加载的模式（防止重复加载）
const loading = new Set();

export function initModeManager() {
  console.log("[ModeManager] Registered: AWAKE (static), others lazy");

  // 后台预加载最可能的下一个模式
  setTimeout(() => loadMode("SLEEP"), 2000);

  on("state:change", ({ from, to }) => {
    // Exit previous mode（同步，已加载的模块保证可用）
    if (modeRegistry[from]?.exit) {
      modeRegistry[from].exit();
    }

    // Enter new mode
    if (modeRegistry[to]) {
      // 已缓存，同步进入
      modeRegistry[to].enter();
    } else if (MODE_LOADERS[to]) {
      // 懒加载
      loadAndEnter(to);
    }
    // 如果 to 不在 MODE_LOADERS 中（如 DRAW/MUSIC），静默跳过
  });

  // 启动默认模式
  modeRegistry.AWAKE.enter();
}

/**
 * 模式 → 导出函数名映射
 */
const MODE_EXPORT_NAMES = {
  SLEEP:      { enter: "enterSleep",      exit: "exitSleep" },
  DREAM:      { enter: "enterDream",      exit: "exitDream" },
  MEMORY:     { enter: "enterMemory",     exit: "exitMemory" },
  CAPTURE:    { enter: "enterCapture",    exit: "exitCapture" },
  DEEP_SLEEP: { enter: "enterDeepSleep",  exit: "exitDeepSleep" },
};

/**
 * 加载模式模块并缓存
 */
async function loadMode(mode) {
  if (modeRegistry[mode]) return;
  if (loading.has(mode)) return;

  const loader = MODE_LOADERS[mode];
  if (!loader) return;

  loading.add(mode);

  try {
    const mod = await loader();
    const names = MODE_EXPORT_NAMES[mode];
    modeRegistry[mode] = {
      enter: mod[names.enter],
      exit: mod[names.exit],
    };
    console.log(`[ModeManager] Lazy loaded: ${mode}`);
  } catch (err) {
    console.error(`[ModeManager] Failed to load ${mode}:`, err);
  } finally {
    loading.delete(mode);
  }
}

/**
 * 加载并进入模式
 */
async function loadAndEnter(mode) {
  await loadMode(mode);
  modeRegistry[mode]?.enter?.();
}
