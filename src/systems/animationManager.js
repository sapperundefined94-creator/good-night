// ============================================
// 🌙 Good Night — Animation Manager
// ============================================

import { gsap } from "gsap";

/**
 * GSAP 动画管理器
 *
 * 统一管理所有动画的时间轴和过渡效果。
 * 支持在不同模式间复用动画预设。
 */

// 全局时间轴
const masterTimeline = gsap.timeline({ paused: false });

// 存储每个模式的活跃动画
const modeAnimations = new Map();

/**
 * 动画预设库
 */
export const presets = {
  /** 入场：从下方淡入 */
  fadeInUp: (target, duration = 1.2, delay = 0) =>
    gsap.fromTo(
      target,
      { opacity: 0, y: 40 },
      { opacity: 1, y: 0, duration, delay, ease: "power2.out" }
    ),

  /** 入场：弹性缩放 */
  popIn: (target, duration = 0.8, delay = 0) =>
    gsap.fromTo(
      target,
      { scale: 0.01, opacity: 0 },
      { scale: 1, opacity: 1, duration, delay, ease: "elastic.out(1, 0.5)" }
    ),

  /** 退场：淡出 */
  fadeOut: (target, duration = 0.8) =>
    gsap.to(target, { opacity: 0, duration, ease: "power2.in" }),

  /** 呼吸效果（循环） */
  breathe: (target, duration = 3) =>
    gsap.to(target, {
      scale: 1.05,
      duration: duration / 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    }),

  /** 浮动效果 */
  float: (target, intensity = 10, duration = 4) =>
    gsap.to(target, {
      y: `+=${intensity}`,
      duration,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    }),

  /** 旋转 */
  spin: (target, duration = 20) =>
    gsap.to(target, {
      rotationY: Math.PI * 2,
      duration,
      repeat: -1,
      ease: "none",
    }),
};

/**
 * 为模式注册动画
 */
export function registerModeAnimation(mode, animation) {
  if (!modeAnimations.has(mode)) {
    modeAnimations.set(mode, []);
  }
  modeAnimations.get(mode).push(animation);
}

/**
 * 清除指定模式的所有动画
 */
export function clearModeAnimations(mode) {
  const animations = modeAnimations.get(mode);
  if (animations) {
    animations.forEach((anim) => anim.kill?.());
    modeAnimations.delete(mode);
  }
}

/**
 * 清除所有动画（全局重置）
 */
export function clearAllAnimations() {
  modeAnimations.forEach((animations) => {
    animations.forEach((anim) => anim.kill?.());
  });
  modeAnimations.clear();
  masterTimeline.clear();
}

/**
 * 创建模式过渡动画
 *
 * @param {string} fromMode - 离开的模式
 * @param {string} toMode - 进入的模式
 * @param {Function} onComplete - 过渡完成回调
 */
export function modeTransition(fromMode, toMode, onComplete) {
  const tl = gsap.timeline({ onComplete });

  // 退场阶段
  tl.to("#ui-overlay", {
    backgroundColor: "rgba(10,10,15,0.8)",
    duration: 1.5,
    ease: "power2.in",
  });

  // 中场（切换内容）
  tl.to("#ui-overlay", {
    backgroundColor: "rgba(10,10,15,0.95)",
    duration: 0.3,
    onComplete: () => {
      clearModeAnimations(fromMode);
    },
  });

  // 入场阶段
  tl.to("#ui-overlay", {
    backgroundColor: "rgba(0,0,0,0)",
    duration: 2,
    ease: "power2.out",
  });

  return tl;
}

export { masterTimeline };
