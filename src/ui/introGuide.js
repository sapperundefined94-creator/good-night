// ============================================
// 🌙 Good Night — Intro Guide Overlay
// ============================================

import { gsap } from "gsap";
import { on, emit } from "../core/eventBus.js";

/**
 * 启动引导 —— 展示所有手势/按键及其触发的效果。
 *
 * 行为：
 *   1. 页面加载后 1.5s 淡入
 *   2. 停留 8 秒后自动淡出
 *   3. 按任意操作键立即淡出
 *   4. 按 ? 键重新显示
 */

let guideEl = null;
let autoHideTimer = null;
let isVisible = false;

// 引导数据
const GUIDE_ITEMS = [
  {
    gesture: "🖐️",
    key: "A",
    mode: "AWAKE",
    label: "清醒",
    desc: "回到现实，极简空间",
    color: "#ffd4a0",
  },
  {
    gesture: "✊",
    key: "S",
    mode: "SLEEP",
    label: "睡前安抚",
    desc: "雪花飘落，柔光被子覆盖",
    color: "#ffc8a0",
  },
  {
    gesture: "✌️",
    key: "D",
    mode: "DREAM",
    label: "梦境粒子",
    desc: "涡旋银河、花瓣风暴、光球",
    color: "#d4a0ff",
  },
  {
    gesture: "🖐️",
    key: "M",
    mode: "MEMORY",
    label: "记忆照片墙",
    desc: "那些关于你的温暖瞬间",
    color: "#ffdd88",
  },
  {
    gesture: "📐",
    key: "C",
    mode: "CAPTURE",
    label: "取景框冻结",
    desc: "定格此刻，暂停时间",
    color: "#ffffff",
  },
  {
    gesture: "😴",
    key: "Z",
    mode: "DEEP_SLEEP",
    label: "深睡",
    desc: "黑暗帷幕、呼吸光点、沉入",
    color: "#4466aa",
  },
];

const HELP_ITEMS = [
  { key: "📷 按钮", desc: "点击右下角启动摄像头手势控制" },
  { key: "🖱️ 左键", desc: "无摄像头时，鼠标点击模拟手势" },
  { key: "H", desc: "显示/隐藏引导" },
  { key: "\\", desc: "后台管理（照片/音频/配置）" },
  { key: "ESC", desc: "返回清醒模式" },
];

export function initIntroGuide() {
  console.log("[IntroGuide] Ready — press H to show guide");

  // 首次加载延迟显示
  setTimeout(() => show(), 1500);

  // 按 H 切换显示
  window.addEventListener("keydown", (e) => {
    if (e.code === "KeyH" && !e.repeat) {
      e.preventDefault();
      isVisible ? hide() : show();
    }
  });

  // 按 ESC 回到清醒
  window.addEventListener("keydown", (e) => {
    if (e.code === "Escape") {
      emit("gesture:decoded", { targetState: "AWAKE" });
    }
  });

  // 操作键按下时自动隐藏
  const actionKeys = ["KeyA", "KeyS", "KeyD", "KeyM", "KeyC", "KeyZ", "KeyW", "KeyU"];
  window.addEventListener("keydown", (e) => {
    if (actionKeys.includes(e.code) && isVisible) {
      hide();
    }
  });
}

// ==========================================
// 创建 / 销毁 DOM
// ==========================================

function createDOM() {
  if (guideEl) return;

  guideEl = document.createElement("div");
  guideEl.id = "intro-guide";
  guideEl.innerHTML = `
    <div class="guide-backdrop"></div>
    <div class="guide-container">
      <div class="guide-header">
        <div class="guide-title">🌙 Good Night</div>
        <div class="guide-subtitle">手势驱动的数字梦境</div>
        <div class="guide-mode-hint">⌨️ 键盘模式 · 按 H 随时查看引导</div>
      </div>

      <div class="guide-grid">
        ${GUIDE_ITEMS.map((item, i) => `
          <div class="guide-card" style="--delay: ${i * 0.08}s; --color: ${item.color};">
            <div class="guide-card-gesture">${item.gesture}</div>
            <div class="guide-card-key">${item.key}</div>
            <div class="guide-card-info">
              <div class="guide-card-label">${item.label}</div>
              <div class="guide-card-desc">${item.desc}</div>
            </div>
            <div class="guide-card-mode">${item.mode}</div>
          </div>
        `).join("")}
      </div>

      <div class="guide-footer">
        ${HELP_ITEMS.map(h => `
          <span class="guide-help-item">
            <kbd>${h.key}</kbd> ${h.desc}
          </span>
        `).join("")}
      </div>
    </div>
  `;

  document.getElementById("app").appendChild(guideEl);

  // 点击背景关闭
  guideEl.querySelector(".guide-backdrop").addEventListener("click", hide);
}

function removeDOM() {
  if (!guideEl) return;
  guideEl.remove();
  guideEl = null;
}

// ==========================================
// 显示 / 隐藏
// ==========================================

function show() {
  // 清理任何残留状态
  if (autoHideTimer) { clearTimeout(autoHideTimer); autoHideTimer = null; }
  if (guideEl) { gsap.killTweensOf(guideEl); removeDOM(); }
  createDOM();
  isVisible = true;

  // 清除自动隐藏计时器
  if (autoHideTimer) {
    clearTimeout(autoHideTimer);
    autoHideTimer = null;
  }

  // 入场动画
  const cards = guideEl.querySelectorAll(".guide-card");
  const header = guideEl.querySelector(".guide-header");
  const footer = guideEl.querySelector(".guide-footer");

  gsap.set(guideEl, { opacity: 0, pointerEvents: "auto" });
  gsap.set(cards, { opacity: 0, y: 30, scale: 0.9 });
  gsap.set(header, { opacity: 0, y: -20 });
  gsap.set(footer, { opacity: 0 });

  gsap.to(guideEl, { opacity: 1, duration: 0.6 });

  gsap.to(header, {
    opacity: 1, y: 0,
    duration: 1,
    delay: 0.2,
    ease: "power2.out",
  });

  cards.forEach((card, i) => {
    gsap.to(card, {
      opacity: 1, y: 0, scale: 1,
      duration: 0.7,
      delay: 0.3 + i * 0.06,
      ease: "back.out(1.4)",
    });
  });

  gsap.to(footer, {
    opacity: 1,
    duration: 0.8,
    delay: 0.3 + cards.length * 0.06,
  });

  // 自动隐藏
  autoHideTimer = setTimeout(hide, 8000);
}

function hide() {
  if (!guideEl) return;
  isVisible = false;

  if (autoHideTimer) {
    clearTimeout(autoHideTimer);
    autoHideTimer = null;
  }

  gsap.to(guideEl, {
    opacity: 0,
    duration: 0.5,
    ease: "power2.in",
    onComplete: removeDOM,
  });
}
