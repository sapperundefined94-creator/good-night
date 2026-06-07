// ============================================
// 🌙 Good Night — Mode Selector (交互方式选择)
// ============================================

import { gsap } from "gsap";
import { startCameraMode, startKeyboardMode, isActive } from "../input/mediaPipe.js";
import { showGestureTutorial } from "./gestureTutorial.js";

/**
 * 启动时显示两个选择：
 *   🖐️ 手势控制 — 摄像头 + 大屏幕，挥手操控
 *   ⌨️ 键盘鼠标 — 传统桌面操作
 *
 * 用户明确选择后进入体验。
 */

let selectorEl = null;
let modeChosen = false;
let chosenMode = null; // "camera" | "keyboard"

// 等待外部 resolve
let resolvePromise = null;

export function initModeSelector() {
  return new Promise((resolve) => {
    resolvePromise = resolve;
    showSelector();
  });
}

// ==========================================
// 选择界面
// ==========================================

function showSelector() {
  selectorEl = document.createElement("div");
  selectorEl.id = "mode-selector";
  selectorEl.innerHTML = `
    <div class="selector-bg">
      <div class="selector-stars"></div>
    </div>

    <div class="selector-content">
      <div class="selector-header">
        <h1 class="selector-title">🌙 Good Night</h1>
        <p class="selector-sub">选择你的交互方式</p>
      </div>

      <div class="selector-cards">
        <!-- 手势模式 -->
        <button class="selector-card" data-mode="camera" id="card-camera">
          <div class="card-icon">🖐️</div>
          <div class="card-label">手势控制</div>
          <div class="card-desc">
            站在摄像头前<br>
            用自然手势操控梦境
          </div>
          <div class="card-tags">
            <span>✊ 握拳 → 睡前</span>
            <span>✌️ 剪刀手 → 梦境</span>
            <span>🖐️ 张开 → 记忆</span>
          </div>
          <div class="card-requires">📷 需要摄像头</div>
        </button>

        <!-- 键盘模式 -->
        <button class="selector-card" data-mode="keyboard" id="card-keyboard">
          <div class="card-icon">⌨️</div>
          <div class="card-label">键盘鼠标</div>
          <div class="card-desc">
            传统桌面操作<br>
            鼠标点击模拟手势
          </div>
          <div class="card-tags">
            <span><kbd>A</kbd> 清醒</span>
            <span><kbd>S</kbd> 睡前</span>
            <span><kbd>D</kbd> 梦境</span>
            <span><kbd>M</kbd> 记忆</span>
            <span><kbd>C</kbd> 取景</span>
            <span><kbd>Z</kbd> 深睡</span>
          </div>
          <div class="card-requires">🖱️ 鼠标 + 键盘</div>
        </button>
      </div>
    </div>
  `;

  document.getElementById("app").appendChild(selectorEl);

  // 入场动画
  animateIn();

  // 选择事件
  selectorEl.querySelectorAll(".selector-card").forEach((card) => {
    card.addEventListener("click", () => {
      const mode = card.dataset.mode;
      onModeSelected(mode);
    });
  });
}

// ==========================================
// 动画
// ==========================================

function animateIn() {
  const header = selectorEl.querySelector(".selector-header");
  const cards = selectorEl.querySelectorAll(".selector-card");

  gsap.set(selectorEl, { opacity: 0 });
  gsap.set(header, { opacity: 0, y: -30 });
  gsap.set(cards, { opacity: 0, y: 40, scale: 0.9 });

  gsap.to(selectorEl, { opacity: 1, duration: 0.6 });

  gsap.to(header, {
    opacity: 1, y: 0,
    duration: 1, delay: 0.3, ease: "power2.out",
  });

  cards.forEach((card, i) => {
    gsap.to(card, {
      opacity: 1, y: 0, scale: 1,
      duration: 0.8,
      delay: 0.5 + i * 0.2,
      ease: "back.out(1.2)",
    });
  });
}

// ==========================================
// 选择处理
// ==========================================

async function onModeSelected(mode) {
  if (modeChosen) return;
  modeChosen = true;
  chosenMode = mode;

  // 高亮选中卡片
  const card = document.getElementById(`card-${mode}`);
  const other = document.getElementById(
    `card-${mode === "camera" ? "keyboard" : "camera"}`
  );

  // 另一张卡片缩小
  gsap.to(other, {
    scale: 0.9, opacity: 0.3,
    duration: 0.5, ease: "power2.in",
  });

  // 选中卡片放大
  gsap.to(card, {
    scale: 1.05,
    duration: 0.4,
    ease: "back.out(1.5)",
    onComplete: async () => {
      // 启动对应模式
      if (mode === "camera") {
        card.querySelector(".card-requires").textContent = "⏳ 启动摄像头...";
        await initCameraMode();

        // 关闭选择器 → 显示教程 → 最后通知 app.js
        dismissSelector(async () => {
          if (isActive()) {
            await showGestureTutorial();
          }
          finishSelection();
        });
      } else {
        initKeyboardOnlyMode();
        dismissSelector(finishSelection);
      }
    },
  });
}

async function initCameraMode() {
  try {
    await startCameraMode();
    console.log("[ModeSelector] Camera mode active");
  } catch (err) {
    console.warn("[ModeSelector] Camera failed, falling back:", err.message);
  }
  // 即使失败也继续（内部已降级到键盘）
}

function initKeyboardOnlyMode() {
  startKeyboardMode(true); // true = pure keyboard, no camera button
}

function dismissSelector(afterDismiss) {
  gsap.to(selectorEl, {
    opacity: 0,
    duration: 0.6,
    delay: 0.3,
    ease: "power2.in",
    onComplete: () => {
      selectorEl?.remove();
      selectorEl = null;
      if (afterDismiss) afterDismiss();
    },
  });
}

function finishSelection() {
  if (resolvePromise) {
    resolvePromise(chosenMode);
    resolvePromise = null;
  }
}

/** 获取选择的模式 */
export function getChosenMode() {
  return chosenMode;
}
