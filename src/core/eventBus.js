// ============================================
// 🌙 Good Night — Global Event Bus
// ============================================

/**
 * 全局事件系统 — 解耦各模块通信
 *
 * Events:
 *   state:change    — 状态机切换时触发
 *   gesture:detect  — 识别到手势时触发
 *   mode:enter      — 进入某个模式
 *   mode:exit       — 退出某个模式
 *   audio:play      — 播放音频
 *   photo:show      — 展示照片
 *   scene:ready     — 场景就绪
 */

const listeners = new Map();

export function initEventBus() {
  console.log("[EventBus] Initialized");
}

/** 订阅事件 */
export function on(event, callback) {
  if (!listeners.has(event)) {
    listeners.set(event, new Set());
  }
  listeners.get(event).add(callback);
  return () => listeners.get(event)?.delete(callback); // 返回取消订阅函数
}

/** 取消订阅 */
export function off(event, callback) {
  listeners.get(event)?.delete(callback);
}

/** 触发事件 */
export function emit(event, payload = {}) {
  const callbacks = listeners.get(event);
  if (!callbacks) return;

  callbacks.forEach((fn) => {
    try {
      fn(payload);
    } catch (err) {
      console.error(`[EventBus] Error in handler for "${event}":`, err);
    }
  });
}

/** 一次性订阅 */
export function once(event, callback) {
  const wrapper = (payload) => {
    off(event, wrapper);
    callback(payload);
  };
  on(event, wrapper);
}
