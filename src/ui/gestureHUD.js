// ============================================
// 🌙 Good Night — Gesture Mode HUD v2
// ============================================

import { gsap } from "gsap";
import { on } from "../core/eventBus.js";

/**
 * 手势模式专属底部栏：
 *   摄像头（大） + 进度环 + 4 张效果标注卡
 */

let hudEl = null;
let progressRing = null;
let gestureCards = [];
let activeGesture = null;

// 每张卡片：手势 → 触发模式 → 视觉特效
const CARDS = [
  {
    name: "fist", emoji: "✊", label: "握拳",
    mode: "SLEEP", modeLabel: "睡前安抚",
    effect: "雪花飘落 · 柔光被子 · 暖暗角",
    effectShort: "雪花 + 安抚被子",
    color: "#ffc8a0",
  },
  {
    name: "peace", emoji: "✌️", label: "剪刀手",
    mode: "DREAM", modeLabel: "梦境粒子",
    effect: "涡旋银河 · 花瓣风暴 · 光球 · Bloom最强",
    effectShort: "涡旋 + 花瓣 + 光溢出",
    color: "#d4a0ff",
  },
  {
    name: "open", emoji: "🖐️", label: "张开手",
    mode: "MEMORY", modeLabel: "记忆照片",
    effect: "照片墙弹出 · 3D悬浮 · 点击放大",
    effectShort: "照片墙 + 记忆回溯",
    color: "#ffdd88",
  },
  {
    name: "frame", emoji: "📐", label: "L 形框",
    mode: "CAPTURE", modeLabel: "取景冻结",
    effect: "画面定格 · 四角取景框 · 暂停时间",
    effectShort: "取景框 + 画面冻结",
    color: "#ffffff",
  },
];

export function showGestureHUD() {
  if (hudEl) return;
  createDOM();
  animateIn();
  bindEvents();
}

export function hideGestureHUD() {
  if (!hudEl) return;
  gsap.to(hudEl, {
    y: 250, opacity: 0, duration: 0.4, ease: "power2.in",
    onComplete: () => { hudEl?.remove(); hudEl = null; },
  });
}

// ==========================================
// DOM
// ==========================================

function createDOM() {
  hudEl = document.createElement("div");
  hudEl.id = "gesture-hud";

  hudEl.innerHTML = `
    <div class="gh-camera-wrap">
      <video id="webcam" autoplay playsinline></video>
      <canvas id="hand-canvas"></canvas>
      <svg class="gh-progress-ring" viewBox="0 0 120 120">
        <circle class="gh-ring-bg" cx="60" cy="60" r="52"
          fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="3"/>
        <circle class="gh-ring-fill" cx="60" cy="60" r="52"
          fill="none" stroke="#ffd4a0" stroke-width="3"
          stroke-linecap="round" stroke-dasharray="326.7" stroke-dashoffset="326.7"
          transform="rotate(-90 60 60)"/>
      </svg>
      <div class="gh-camera-label">📷 摄像头画面（镜像）</div>
    </div>

    <div class="gh-bar">
      ${CARDS.map(g => `
        <div class="gh-card" data-gesture="${g.name}" style="--gc:${g.color}">
          <div class="gh-card-top">
            <span class="gh-card-emoji">${g.emoji}</span>
            <span class="gh-card-name">${g.label}</span>
          </div>
          <div class="gh-card-arrow">→</div>
          <div class="gh-card-mode">${g.modeLabel}</div>
          <div class="gh-card-effect">${g.effectShort}</div>
          <div class="gh-card-dot"></div>
        </div>
      `).join("")}
    </div>
  `;

  document.getElementById("app").appendChild(hudEl);

  progressRing = hudEl.querySelector(".gh-ring-fill");
  gestureCards = [...hudEl.querySelectorAll(".gh-card")];
}

// ==========================================
// 事件
// ==========================================

function bindEvents() {
  on("gesture:progress", ({ gesture, progress }) => {
    updateProgress(gesture, progress);
  });

  on("gesture:detect", ({ gesture }) => {
    flashTrigger(gesture);
  });

  on("hand:lost", () => {
    updateProgress(null, 0);
  });
}

// ==========================================
// 进度更新
// ==========================================

function updateProgress(gesture, progress) {
  // 进度环
  const circumference = 326.7;
  const offset = circumference * (1 - progress);
  if (progressRing) {
    progressRing.setAttribute("stroke-dashoffset", offset);
    if (progress > 0.8) {
      progressRing.setAttribute("stroke", "#ffd4a0");
    } else if (progress > 0.4) {
      progressRing.setAttribute("stroke", "rgba(255,212,160,0.5)");
    } else {
      progressRing.setAttribute("stroke", "rgba(255,212,160,0.2)");
    }
  }

  // 卡片状态
  gestureCards.forEach((card) => {
    const name = card.dataset.gesture;

    if (name === gesture && progress > 0.05) {
      if (!card.classList.contains("detecting")) {
        card.classList.add("detecting");
      }
      card.style.setProperty("--progress", progress);
      card.querySelector(".gh-card-dot").style.transform =
        `scale(${0.5 + progress * 1.5})`;
      card.querySelector(".gh-card-dot").style.opacity = 0.3 + progress * 0.7;
    } else {
      card.classList.remove("detecting");
      card.style.setProperty("--progress", 0);
    }
  });

  activeGesture = gesture;
}

// ==========================================
// 触发反馈
// ==========================================

function flashTrigger(gestureName) {
  const card = CARDS.find(g => g.name === gestureName);
  if (!card) return;

  // 屏幕中央弹出手势 + 效果说明
  const flash = document.createElement("div");
  flash.className = "gh-trigger-flash";
  flash.innerHTML = `
    <div class="gh-flash-circle" style="--gc:${card.color}">
      <span class="gh-flash-emoji">${card.emoji}</span>
    </div>
    <div class="gh-flash-mode">${card.modeLabel}</div>
    <div class="gh-flash-effect">${card.effectShort}</div>
  `;
  document.getElementById("app").appendChild(flash);

  // 卡片跳动
  const hudCard = hudEl?.querySelector(`[data-gesture="${gestureName}"]`);
  if (hudCard) {
    hudCard.classList.add("triggered");
    gsap.fromTo(hudCard, { scale: 1 }, { scale: 1.15, duration: 0.12, yoyo: true, repeat: 2 });
    setTimeout(() => hudCard.classList.remove("triggered"), 1200);
  }

  // 环闪烁
  if (progressRing) {
    progressRing.setAttribute("stroke", card.color);
    setTimeout(() => {
      if (progressRing) progressRing.setAttribute("stroke", "#ffd4a0");
    }, 500);
  }

  // 动画
  gsap.fromTo(flash,
    { scale: 0.2, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(2.5)" }
  );
  gsap.to(flash, {
    scale: 1.3, opacity: 0,
    duration: 0.8, delay: 0.6, ease: "power2.out",
    onComplete: () => flash.remove(),
  });
}

// ==========================================
// 入场
// ==========================================

function animateIn() {
  gsap.set(hudEl, { y: 280, opacity: 0 });
  gsap.to(hudEl, {
    y: 0, opacity: 1,
    duration: 0.7, delay: 0.5, ease: "power3.out",
  });
}
