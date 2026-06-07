// ============================================
// 🌙 Good Night — Gesture Tutorial v2
// ============================================

import { gsap } from "gsap";
import { on } from "../core/eventBus.js";

/**
 * 摄像头启动后显示：
 *   - 4 张手势教程卡，每张有手型图解（ASCII 风格）和效果说明
 *   - 实时检测打勾
 *   - 掌握 1 个即可进入
 */

let tutorialEl = null;
let detectedGestures = new Set();
let resolvePromise = null;

const GUIDES = [
  {
    name: "fist", emoji: "✊", label: "握拳",
    mode: "睡前安抚",
    how: "五指并拢，自然握紧",
    effect: "❄️ 雪花慢飘 · 🛏️ 柔光被子展开 · 🌅 暖色暗角加深 · 🎵 低频嗡鸣",
    color: "#ffc8a0",
  },
  {
    name: "peace", emoji: "✌️", label: "剪刀手",
    mode: "梦境粒子",
    how: "伸出食指+中指，其余三指弯曲",
    effect: "🌌 涡旋银河展开 · 🌸 花瓣风暴飘落 · 🪐 12 颗光球环绕 · ✨ Bloom 光溢出最强",
    color: "#d4a0ff",
  },
  {
    name: "open", emoji: "🖐️", label: "张开手掌",
    mode: "记忆照片墙",
    how: "五指自然张开，掌心朝向摄像头",
    effect: "📸 8 张照片逐个弹出 · 🎯 鼠标悬停 3D 翻转 · 🔍 点击放大 · 💛 暖黄暗角",
    color: "#ffdd88",
  },
  {
    name: "frame", emoji: "📐", label: "L 形取景框",
    mode: "取景框冻结",
    how: "拇指和食指成 L 形（90°），其余弯曲",
    effect: "🔲 四角取景框出现 · ⏸️ 场景冻结 · ⬜ 高对比暗角 · 📷 拍照感",
    color: "#ffffff",
  },
];

const TIPS = [
  "📷 站远一点，手在画面中央",
  "💡 光线充足但不要直射摄像头",
  "⏱️ 保持手势约 1 秒触发",
  "🤚 手离摄像头 30-50cm 最佳",
];

export function showGestureTutorial() {
  return new Promise((resolve) => {
    resolvePromise = resolve;
    detectedGestures = new Set();
    createDOM();
    animateIn();
    on("gesture:detect", onGestureDetected);
  });
}

function createDOM() {
  tutorialEl = document.createElement("div");
  tutorialEl.id = "gesture-tutorial";

  tutorialEl.innerHTML = `
    <div class="gtt-overlay">
      <div class="gtt-container">
        <div class="gtt-header">
          <div class="gtt-title">🖐️ 试试你的手势</div>
          <div class="gtt-subtitle">摄像头已就绪。对着摄像头做以下手势，系统会实时识别</div>
        </div>

        <div class="gtt-tips">${TIPS.map(t => `<span>${t}</span>`).join("")}</div>

        <div class="gtt-cards">
          ${GUIDES.map(g => `
            <div class="gtt-card" data-gesture="${g.name}" style="--gc:${g.color}">
              <div class="gtt-card-check">○</div>

              <div class="gtt-card-visual">
                <div class="gtt-card-hand">
                  <span>${g.emoji}</span>
                </div>
                <div class="gtt-card-how">${g.how}</div>
              </div>

              <div class="gtt-card-info">
                <div class="gtt-card-name">${g.label}</div>
                <div class="gtt-card-mode">→ ${g.mode}</div>
                <div class="gtt-card-effect">${g.effect}</div>
              </div>
            </div>
          `).join("")}
        </div>

        <div class="gtt-footer">
          <div class="gtt-progress">
            已识别: <span id="gtt-count">0</span> / 4
          </div>
          <button class="gtt-start-btn" id="gtt-start" disabled>
            🌙 开始体验（识别 1 个手势即可）
          </button>
          <button class="gtt-skip-btn" id="gtt-skip">
            跳过教程，直接开始
          </button>
        </div>
      </div>
    </div>
  `;

  document.getElementById("app").appendChild(tutorialEl);

  document.getElementById("gtt-start").addEventListener("click", dismiss);
  document.getElementById("gtt-skip").addEventListener("click", dismiss);
}

function onGestureDetected({ gesture }) {
  if (detectedGestures.has(gesture)) return;
  detectedGestures.add(gesture);

  const card = tutorialEl?.querySelector(`[data-gesture="${gesture}"]`);
  if (card) {
    card.classList.add("mastered");
    card.querySelector(".gtt-card-check").textContent = "✓";
    gsap.fromTo(card, { scale: 1 }, { scale: 1.05, duration: 0.12, yoyo: true, repeat: 1 });
  }

  const countEl = document.getElementById("gtt-count");
  if (countEl) countEl.textContent = detectedGestures.size;

  const btn = document.getElementById("gtt-start");
  if (btn && detectedGestures.size >= 1) {
    btn.disabled = false;
    btn.textContent = "🌙 开始体验";
  }
}

function animateIn() {
  const container = tutorialEl.querySelector(".gtt-container");
  const cards = tutorialEl.querySelectorAll(".gtt-card");

  gsap.set(tutorialEl, { opacity: 0 });
  gsap.set(container, { y: 40, opacity: 0 });
  gsap.set(cards, { y: 30, opacity: 0, scale: 0.95 });

  gsap.to(tutorialEl, { opacity: 1, duration: 0.4 });
  gsap.to(container, { y: 0, opacity: 1, duration: 0.7, delay: 0.1, ease: "power2.out" });
  cards.forEach((card, i) => {
    gsap.to(card, {
      y: 0, opacity: 1, scale: 1,
      duration: 0.6, delay: 0.2 + i * 0.08, ease: "back.out(1.2)",
    });
  });
}

function dismiss() {
  gsap.to(tutorialEl, {
    opacity: 0, duration: 0.4, ease: "power2.in",
    onComplete: () => {
      tutorialEl?.remove();
      tutorialEl = null;
      if (resolvePromise) { resolvePromise(true); resolvePromise = null; }
    },
  });
}
