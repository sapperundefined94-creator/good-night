// ============================================
// 🌙 Good Night — Prompt Layer
// ============================================

import { gsap } from "gsap";

let promptEl = null;
let currentTween = null;

export function initPromptLayer() {
  promptEl = document.getElementById("prompt-layer");
  if (!promptEl) {
    console.warn("[PromptLayer] #prompt-layer not found");
    return;
  }

  console.log("[PromptLayer] Ready");
}

/**
 * 显示提示文字（自动淡入淡出）
 */
export function showPrompt(text, options = {}) {
  if (!promptEl) return;

  const {
    duration = 0.8,
    stay = 0, // 0 = 不自动消失
    delay = 0,
  } = options;

  // 取消之前的动画
  if (currentTween) {
    currentTween.kill();
  }

  // 如果文字相同，不重复动画
  if (promptEl.textContent === text && promptEl.style.opacity > 0.5) {
    return;
  }

  // 淡出 → 更换文字 → 淡入
  currentTween = gsap
    .timeline()
    .to(promptEl, {
      opacity: 0,
      duration: 0.3,
      onComplete: () => {
        promptEl.textContent = text;
      },
    })
    .to(promptEl, {
      opacity: 1,
      duration,
      delay,
      ease: "power2.out",
    });

  // 如果指定了停留时间，自动消失
  if (stay > 0) {
    currentTween.to(promptEl, {
      opacity: 0,
      duration: 0.8,
      delay: stay,
      ease: "power2.in",
    });
  }
}

/**
 * 隐藏提示
 */
export function hidePrompt(duration = 0.6) {
  if (!promptEl) return;

  if (currentTween) {
    currentTween.kill();
  }

  currentTween = gsap.to(promptEl, {
    opacity: 0,
    duration,
    ease: "power2.in",
  });
}

/**
 * 获取当前提示文字
 */
export function getCurrentPrompt() {
  return promptEl?.textContent || "";
}
