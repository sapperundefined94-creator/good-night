// ============================================
// 🌙 Good Night — Memory Mode v2 (交互照片墙)
// ============================================

import { setLightPreset } from "../world/lights.js";
import { showPrompt } from "../ui/promptLayer.js";
import { getPhotos } from "../systems/photoManager.js";
import { gsap } from "gsap";
import * as THREE from "three";
import { burst, bindScene } from "../systems/particleEngine.js";
import { getScene } from "../world/scene.js";

let photoWallEl = null;
let cards = [];
let cardData = [];       // { el, rect, tiltX, tiltY, floating }
let expandedCard = null; // 当前放大的卡片
let rafId = null;
let mouseX = 0.5;        // 归一化鼠标位置
let mouseY = 0.5;

export function enterMemory() {
  console.log("[Mode] Entering MEMORY v2");
  setLightPreset("AWAKE");
  showPrompt("这些瞬间，都关于你...");

  const scene = getScene();
  bindScene(scene);

  // 入场爆裂
  burst(new THREE.Vector3(0, 0, 0), "#ffdd88", 180);

  buildPhotoWall();
  startAnimLoop();
}

export function exitMemory() {
  console.log("[Mode] Exiting MEMORY v2");
  stopAnimLoop();
  destroyPhotoWall();
}

// ==========================================
// 构建照片墙
// ==========================================

function buildPhotoWall() {
  const photos = getPhotos();
  const app = document.getElementById("app");

  photoWallEl = document.createElement("div");
  photoWallEl.className = "photo-wall-v2";

  // 全局鼠标跟踪
  photoWallEl.addEventListener("mousemove", onWallMouseMove);
  photoWallEl.addEventListener("mouseleave", () => {
    mouseX = 0.5;
    mouseY = 0.5;
  });

  photos.forEach((photo, index) => {
    const card = createCard(photo, index);
    photoWallEl.appendChild(card);
    cards.push(card);
  });

  // 背景关闭放大
  photoWallEl.addEventListener("click", (e) => {
    if (e.target === photoWallEl && expandedCard) {
      collapseCard();
    }
  });

  app.appendChild(photoWallEl);
}

function createCard(photo, index) {
  const card = document.createElement("div");
  card.className = "memory-card";
  card.style.setProperty("--index", index);
  card.style.setProperty("--delay", `${0.15 + index * 0.12}s`);
  card.style.setProperty("--rotate-x", `${(Math.random() - 0.5) * 4}deg`);
  card.style.setProperty("--rotate-y", `${(Math.random() - 0.5) * 4}deg`);

  card.innerHTML = `
    <div class="memory-card-inner">
      <div class="memory-card-front">
        <div class="memory-card-image">
          <img src="${photo.image}" alt="" loading="lazy"
               onerror="this.parentElement.style.background='rgba(30,30,40,0.8)'" />
        </div>
        <div class="memory-card-overlay"></div>
        <div class="memory-card-date">${photo.date}</div>
      </div>
      <div class="memory-card-back">
        <div class="memory-card-back-text">${photo.text}</div>
        <div class="memory-card-back-line"></div>
        <div class="memory-card-back-date">${photo.date}</div>
      </div>
    </div>
    <div class="memory-card-glow"></div>
    <div class="memory-card-sparkle"></div>
  `;

  // 卡片 hover → 3D tilt
  card.addEventListener("mousemove", (e) => onCardMouseMove(e, card));
  card.addEventListener("mouseenter", (e) => onCardEnter(e, card));
  card.addEventListener("mouseleave", (e) => onCardLeave(e, card));

  // 点击 → 放大
  card.addEventListener("click", (e) => {
    e.stopPropagation();
    if (expandedCard === card) {
      collapseCard();
    } else if (!expandedCard) {
      expandCard(card);
    }
  });

  // 入场动画
  gsap.fromTo(card,
    { opacity: 0, y: 80, scale: 0.8, rotationY: 0.1 },
    {
      opacity: 1, y: 0, scale: 1, rotationY: 0,
      duration: 1.3,
      delay: 0.2 + index * 0.15,
      ease: "back.out(1.3)",
      onStart: () => {
        card.classList.add("visible");
        cardData.push({ el: card, rect: null, tiltX: 0, tiltY: 0, baseY: 0, floatPhase: Math.random() * Math.PI * 2 });
      },
    }
  );

  return card;
}

// ==========================================
// 鼠标交互
// ==========================================

function onWallMouseMove(e) {
  const rect = photoWallEl.getBoundingClientRect();
  mouseX = (e.clientX - rect.left) / rect.width;
  mouseY = (e.clientY - rect.top) / rect.height;
}

function onCardMouseMove(e, card) {
  const rect = card.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width - 0.5;   // -0.5..0.5
  const y = (e.clientY - rect.top) / rect.height - 0.5;

  const maxTilt = 18; // 度
  const tiltX = -y * maxTilt;
  const tiltY = x * maxTilt;

  // 更新 3D transform
  const inner = card.querySelector(".memory-card-inner");
  inner.style.transform = `rotateX(${tiltX}deg) rotateY(${tiltY}deg) translateZ(10px)`;

  // 光晕跟随
  const glow = card.querySelector(".memory-card-glow");
  const glowX = (x + 0.5) * 100;
  const glowY = (y + 0.5) * 100;
  glow.style.background = `radial-gradient(circle at ${glowX}% ${glowY}%, rgba(255,221,136,0.25) 0%, transparent 60%)`;
  glow.style.opacity = "1";

  // 保存状态
  const data = cardData.find(d => d.el === card);
  if (data) {
    data.tiltX = tiltX;
    data.tiltY = tiltY;
  }
}

function onCardEnter(e, card) {
  // 重置 inner 浮动，准备 tilt
  const inner = card.querySelector(".memory-card-inner");
  inner.style.transform = "";
  inner.style.transition = "transform 0.1s ease-out, border-color 0.4s ease, box-shadow 0.4s ease";

  gsap.to(card, { scale: 1.04, duration: 0.35, ease: "power2.out" });
  card.style.zIndex = "10";

  const sparkle = card.querySelector(".memory-card-sparkle");
  sparkle.style.opacity = "0.6";
}

function onCardLeave(e, card) {
  const inner = card.querySelector(".memory-card-inner");
  inner.style.transform = "";
  inner.style.transition = "transform 0.35s cubic-bezier(0.23, 1, 0.32, 1), border-color 0.4s ease, box-shadow 0.4s ease";

  const glow = card.querySelector(".memory-card-glow");
  glow.style.opacity = "0";
  glow.style.background = "";

  card.querySelector(".memory-card-sparkle").style.opacity = "0";

  gsap.to(card, { scale: 1, duration: 0.5, ease: "power2.out" });
  card.style.zIndex = "1";
}

// ==========================================
// 放大/缩小
// ==========================================

function expandCard(card) {
  expandedCard = card;

  // 计算卡片在视口中的位置
  const rect = card.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const dx = window.innerWidth / 2 - cx;
  const dy = window.innerHeight / 2 - cy;

  // 其他卡片退后
  cards.forEach(c => {
    if (c !== card) {
      gsap.to(c, { opacity: 0.2, scale: 0.9, duration: 0.5, ease: "power2.out" });
      c.style.pointerEvents = "none";
    }
  });

  // 放大卡片
  card.style.zIndex = "50";
  gsap.to(card, {
    x: dx,
    y: dy,
    scale: 2.2,
    duration: 0.6,
    ease: "power3.out",
  });

  // 光晕加亮
  const glow = card.querySelector(".memory-card-glow");
  glow.style.opacity = "0.5";
  glow.style.background = `radial-gradient(circle at 50% 50%, rgba(255,221,136,0.4) 0%, transparent 50%)`;

  // 显示背面
  const inner = card.querySelector(".memory-card-inner");
  inner.querySelector(".memory-card-back").style.opacity = "0.9";
}

function collapseCard() {
  if (!expandedCard) return;

  const card = expandedCard;
  expandedCard = null;

  // 恢复其他卡片
  cards.forEach(c => {
    if (c !== card) {
      gsap.to(c, { opacity: 1, scale: 1, duration: 0.5, ease: "power2.out" });
      c.style.pointerEvents = "auto";
    }
  });

  // 缩小
  const inner = card.querySelector(".memory-card-inner");
  inner.querySelector(".memory-card-back").style.opacity = "0";

  gsap.to(card, {
    x: 0,
    y: 0,
    scale: 1,
    duration: 0.5,
    ease: "power2.out",
    onComplete: () => {
      card.style.zIndex = "1";
    },
  });

  const glow = card.querySelector(".memory-card-glow");
  glow.style.opacity = "0";
  glow.style.background = "";
}

// ==========================================
// 动画循环（浮动 + 响应全局鼠标位置）
// ==========================================

function startAnimLoop() {
  function loop() {
    rafId = requestAnimationFrame(loop);
    const t = performance.now() * 0.001;

    // 全局视差 — 所有卡片微微跟随鼠标
    if (photoWallEl && !expandedCard) {
      const px = (mouseX - 0.5) * 20; // -10..10px
      const py = (mouseY - 0.5) * 15;

      photoWallEl.style.transform = `translate(${px}px, ${py}px)`;
    }

    // 每张卡片独立浮动（改 inner，不改卡片本身，避免 hover 检测不稳定）
    cardData.forEach((data, i) => {
      if (!data.el || data.el === expandedCard) return;
      const phase = data.floatPhase;
      const floatY = Math.sin(t * 0.6 + phase) * 6 + Math.cos(t * 0.9 + phase * 1.3) * 4;
      const floatRot = Math.sin(t * 0.4 + phase) * 1.2;

      const inner = data.el.querySelector(".memory-card-inner");
      if (inner) {
        inner.style.transform =
          `translateY(${floatY}px) rotate(${floatRot}deg)`;
      }
    });
  }
  loop();
}

function stopAnimLoop() {
  if (rafId) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  cardData = [];
}

// ==========================================
// 销毁
// ==========================================

function destroyPhotoWall() {
  if (!photoWallEl) return;

  cards.forEach((card, i) => {
    gsap.to(card, {
      opacity: 0,
      y: -60,
      scale: 0.85,
      rotationY: -0.1,
      duration: 0.5,
      delay: i * 0.06,
      ease: "power2.in",
    });
  });

  gsap.to(photoWallEl, {
    opacity: 0,
    duration: 1,
    delay: cards.length * 0.06 + 0.2,
    ease: "power2.in",
    onComplete: () => {
      photoWallEl?.remove();
      photoWallEl = null;
      cards = [];
      expandedCard = null;
    },
  });
}
