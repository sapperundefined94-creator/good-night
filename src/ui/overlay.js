// ============================================
// 🌙 Good Night — UI Overlay
// ============================================

import { on } from "../core/eventBus.js";
import { gsap } from "gsap";

let overlayEl = null;
let modeFadeEl = null;

export function initOverlay() {
  overlayEl = document.getElementById("ui-overlay");
  if (!overlayEl) {
    console.warn("[Overlay] #ui-overlay not found");
    return;
  }

  // 创建模式过渡渐变层
  modeFadeEl = document.createElement("div");
  modeFadeEl.className = "mode-fade";
  overlayEl.appendChild(modeFadeEl);

  // 监听模式切换，显示过渡效果
  on("mode:enter", ({ mode }) => {
    if (mode === "DEEP_SLEEP") {
      // 深睡时慢慢变暗
      gsap.to(overlayEl, {
        backgroundColor: "rgba(0,0,8,0.6)",
        duration: 4,
        ease: "power2.in",
      });
    } else if (mode === "DREAM") {
      gsap.to(overlayEl, {
        backgroundColor: "rgba(5,5,20,0.3)",
        duration: 2,
        ease: "power2.inOut",
      });
    } else {
      gsap.to(overlayEl, {
        backgroundColor: "rgba(0,0,0,0)",
        duration: 2,
        ease: "power2.out",
      });
    }
  });

  console.log("[Overlay] Ready");
}

/**
 * 在 overlay 上显示一段文字
 */
export function showText(text, duration = 3) {
  if (!overlayEl) return;

  const el = document.createElement("div");
  el.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 1.5rem;
    letter-spacing: 0.15em;
    color: rgba(232,224,212,0.8);
    pointer-events: none;
    text-align: center;
    opacity: 0;
  `;
  el.textContent = text;
  overlayEl.appendChild(el);

  gsap.to(el, {
    opacity: 1,
    duration: 1,
    onComplete: () => {
      gsap.to(el, {
        opacity: 0,
        duration: 1,
        delay: duration,
        onComplete: () => el.remove(),
      });
    },
  });
}
