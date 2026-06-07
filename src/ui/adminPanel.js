// ============================================
// 🌙 Good Night — Admin Panel (后台管理)
// ============================================

import { gsap } from "gsap";
import { userConfig } from "../config/userConfig.js";
import { assetConfig, saveAssetConfig } from "../config/assetConfig.js";
import {
  getPhotos, addPhoto, removePhoto, updatePhoto, movePhoto,
  resetToDefaults, onPhotosChanged,
} from "../systems/photoManager.js";

/**
 * 后台管理面板
 *
 * 按 \ 键（反斜杠）打开/关闭。
 *
 * Tab:
 *   📸 照片 — 添加/删除/编辑照片
 *   🎧 音频 — 设置各模式音频 URL
 *   👤 配置 — 用户名/灵敏度等
 */

let panelEl = null;
let isOpen = false;
let activeTab = "photos";
let photoListDirty = false;

// ==========================================
// 初始化
// ==========================================

export function initAdminPanel() {
  // 按 \ 打开/关闭
  window.addEventListener("keydown", (e) => {
    if (e.code === "Backslash" && !e.repeat && !isInputFocused()) {
      e.preventDefault();
      toggle();
    }
  });

  // 监听照片变化，自动刷新列表
  onPhotosChanged(() => {
    photoListDirty = true;
    if (isOpen && activeTab === "photos") {
      renderPhotoList();
    }
  });

  console.log("[AdminPanel] Press \\ to open admin panel");
}

// ==========================================
// 开/关
// ==========================================

function toggle() {
  isOpen ? close() : open();
}

function open() {
  if (panelEl) return;
  createDOM();
  isOpen = true;

  gsap.fromTo(panelEl,
    { x: 420, opacity: 0 },
    { x: 0, opacity: 1, duration: 0.35, ease: "power3.out" }
  );

  renderTab(activeTab);
}

function close() {
  if (!panelEl) return;
  isOpen = false;

  gsap.to(panelEl, {
    x: 420, opacity: 0, duration: 0.25, ease: "power2.in",
    onComplete: removeDOM,
  });
}

// ==========================================
// DOM 结构
// ==========================================

function createDOM() {
  panelEl = document.createElement("div");
  panelEl.id = "admin-panel";
  panelEl.innerHTML = `
    <div class="admin-backdrop"></div>
    <div class="admin-drawer">
      <div class="admin-header">
        <span>⚙️ 管理</span>
        <button class="admin-close" title="关闭 (\\)">✕</button>
      </div>

      <div class="admin-tabs">
        <button class="admin-tab active" data-tab="photos">📸 照片</button>
        <button class="admin-tab" data-tab="audio">🎧 音频</button>
        <button class="admin-tab" data-tab="config">👤 配置</button>
      </div>

      <div class="admin-body" id="admin-body">
        <!-- 动态渲染 -->
      </div>
    </div>
  `;

  document.getElementById("app").appendChild(panelEl);

  // 事件绑定
  panelEl.querySelector(".admin-backdrop").addEventListener("click", close);
  panelEl.querySelector(".admin-close").addEventListener("click", close);

  panelEl.querySelectorAll(".admin-tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;
      switchTab(tab);
    });
  });
}

function removeDOM() {
  if (!panelEl) return;
  panelEl.remove();
  panelEl = null;
}

// ==========================================
// Tab 切换
// ==========================================

function switchTab(tab) {
  activeTab = tab;

  panelEl.querySelectorAll(".admin-tab").forEach((b) => {
    b.classList.toggle("active", b.dataset.tab === tab);
  });

  renderTab(tab);
}

function renderTab(tab) {
  const body = document.getElementById("admin-body");
  if (!body) return;

  switch (tab) {
    case "photos": renderPhotoTab(body); break;
    case "audio": renderAudioTab(body); break;
    case "config": renderConfigTab(body); break;
  }
}

// ==========================================
// 📸 照片 Tab
// ==========================================

function renderPhotoTab(body) {
  const photos = getPhotos();

  body.innerHTML = `
    <div class="admin-section">
      <div class="admin-section-header">
        <span>共 ${photos.length} 张照片</span>
        <div class="admin-actions">
          <button class="admin-btn-sm" id="btn-add-photo">+ 添加</button>
          <button class="admin-btn-sm admin-btn-ghost" id="btn-reset-photos">↺ 重置</button>
        </div>
      </div>
      <div class="photo-edit-list" id="photo-edit-list">
        ${photos.map((p, i) => `
          <div class="photo-edit-item" data-id="${p.id}">
            <div class="photo-edit-preview">
              <img src="${p.image}" alt="" onerror="this.style.display='none'" />
            </div>
            <div class="photo-edit-fields">
              <input type="text" class="admin-input photo-url" value="${escapeHtml(p.image)}" placeholder="图片 URL" />
              <div class="photo-edit-row">
                <input type="text" class="admin-input photo-date" value="${p.date}" placeholder="日期" style="width:45%" />
                <input type="text" class="admin-input photo-text" value="${escapeHtml(p.text)}" placeholder="描述文字" style="width:55%" />
              </div>
            </div>
            <div class="photo-edit-actions">
              ${i > 0 ? '<button class="admin-btn-icon move-up" title="上移">▲</button>' : '<span></span>'}
              ${i < photos.length - 1 ? '<button class="admin-btn-icon move-down" title="下移">▼</button>' : '<span></span>'}
              <button class="admin-btn-icon delete-photo" title="删除">🗑</button>
            </div>
          </div>
        `).join("")}
      </div>
    </div>
  `;

  // 绑定事件
  document.getElementById("btn-add-photo")?.addEventListener("click", () => {
    addPhoto({
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&q=80",
      date: new Date().toISOString().split("T")[0].replace(/-/g, "."),
      text: "新照片",
    });
    renderPhotoTab(body);
  });

  document.getElementById("btn-reset-photos")?.addEventListener("click", () => {
    if (confirm("恢复为默认照片？当前照片将丢失。")) {
      resetToDefaults();
      renderPhotoTab(body);
    }
  });

  // 每张照片的操作
  body.querySelectorAll(".photo-edit-item").forEach((item) => {
    const id = item.dataset.id;

    item.querySelector(".delete-photo")?.addEventListener("click", () => {
      removePhoto(id);
      renderPhotoTab(body);
    });

    item.querySelector(".move-up")?.addEventListener("click", () => {
      movePhoto(id, -1);
      renderPhotoTab(body);
    });

    item.querySelector(".move-down")?.addEventListener("click", () => {
      movePhoto(id, 1);
      renderPhotoTab(body);
    });

    // 输入框自动保存
    const urlInput = item.querySelector(".photo-url");
    const dateInput = item.querySelector(".photo-date");
    const textInput = item.querySelector(".photo-text");

    [urlInput, dateInput, textInput].forEach((input) => {
      input?.addEventListener("change", () => {
        updatePhoto(id, {
          image: urlInput.value,
          date: dateInput.value,
          text: textInput.value,
        });
      });
    });
  });
}

// ==========================================
// 🎧 音频 Tab
// ==========================================

function renderAudioTab(body) {
  body.innerHTML = `
    <div class="admin-section">
      <div class="admin-card-highlight">
        <div class="admin-card-title">🎹 主题钢琴曲</div>
        <p class="admin-hint">
          同一首曲子贯穿所有模式。<br>
          每个模式用不同的音高和混响，听起来不同。
        </p>
      </div>

      <div class="admin-info-box">
        <strong>📁 方式一：本地文件（推荐）</strong>
        <p>把你的 MP3 放到 <code>src/assets/audio/theme.mp3</code>，重启 dev server。</p>
        <p style="font-size:0.7rem;color:rgba(255,255,255,0.3)">
          菊次郎的夏天 / Summer / 任意你喜欢的钢琴曲
        </p>
      </div>

      <div class="admin-info-box">
        <strong>🌐 方式二：在线 URL</strong>
        <input
          type="text" class="admin-input" id="theme-url"
          value="${escapeHtml(assetConfig.audio?.theme || "")}"
          placeholder="粘贴 MP3 直链 URL..."
        />
        ${assetConfig.audio?.theme ? `
          <audio controls class="audio-preview" src="${assetConfig.audio.theme}" style="margin-top:8px"></audio>
        ` : ""}
      </div>

      <button class="admin-btn" id="btn-save-audio">💾 保存</button>

      <hr style="border-color:rgba(255,255,255,0.05);margin:16px 0">

      <div class="admin-info-box" style="background:rgba(255,212,160,0.03);border-color:rgba(255,212,160,0.1)">
        <strong>🎵 免费夏季钢琴曲推荐</strong>
        <p style="margin-top:4px;line-height:1.8">
          <a href="https://pixabay.com/music/solo-piano-summer-motivation-444129/" target="_blank">Summer Motivation</a>
          — 轻快夏季钢琴（16.8 万播放，Pixabay 免费）<br>
          <a href="https://pixabay.com/music/modern-classical-nostalgic-ambient-piano-404556/" target="_blank">Nostalgic Ambient Piano</a>
          — 怀旧氛围钢琴（Pixabay 免费）<br>
          <a href="https://pixabay.com/music/modern-classical-nostalgic-piano-ambient-1-395640/" target="_blank">Nostalgic Piano Ambient</a>
          — 温暖钢琴（Pixabay 免费）
        </p>
        <p style="font-size:0.65rem;color:rgba(255,255,255,0.25);margin-top:4px">
          ⬆️ 打开链接 → Download → 放入 src/assets/audio/theme.mp3
        </p>
      </div>
    </div>
  `;

  document.getElementById("btn-save-audio")?.addEventListener("click", () => {
    const url = document.getElementById("theme-url")?.value?.trim();
    if (url) {
      saveAssetConfig({ ...assetConfig, audio: { ...assetConfig.audio, theme: url } });
      alert("音频 URL 已保存！刷新页面后生效。");
      renderAudioTab(body);
    }
  });
}

// ==========================================
// 👤 配置 Tab
// ==========================================

function renderConfigTab(body) {
  body.innerHTML = `
    <div class="admin-section">
      <div class="config-field">
        <label>你的名字</label>
        <input type="text" class="admin-input" id="cfg-name" value="${escapeHtml(userConfig.name)}" />
      </div>
      <div class="config-field">
        <label>记忆指向的人称</label>
        <input type="text" class="admin-input" id="cfg-target" value="${escapeHtml(userConfig.memoryTarget)}" />
      </div>
      <div class="config-field">
        <label>手势灵敏度 (0-1)</label>
        <input type="range" min="0" max="1" step="0.05" class="admin-range" id="cfg-sensitivity" value="${userConfig.gestureSensitivity}" />
        <span class="range-value" id="val-sensitivity">${userConfig.gestureSensitivity}</span>
      </div>
      <div class="config-field">
        <label>梦境粒子密度 (0-1)</label>
        <input type="range" min="0" max="1" step="0.05" class="admin-range" id="cfg-density" value="${userConfig.dreamParticleDensity}" />
        <span class="range-value" id="val-density">${userConfig.dreamParticleDensity}</span>
      </div>
      <button class="admin-btn" id="btn-save-config">💾 保存配置（需刷新）</button>
    </div>
  `;

  // Range 值显示
  document.getElementById("cfg-sensitivity")?.addEventListener("input", (e) => {
    document.getElementById("val-sensitivity").textContent = e.target.value;
  });
  document.getElementById("cfg-density")?.addEventListener("input", (e) => {
    document.getElementById("val-density").textContent = e.target.value;
  });

  document.getElementById("btn-save-config")?.addEventListener("click", () => {
    const config = {
      name: document.getElementById("cfg-name").value.trim() || userConfig.name,
      memoryTarget: document.getElementById("cfg-target").value.trim() || userConfig.memoryTarget,
      gestureSensitivity: parseFloat(document.getElementById("cfg-sensitivity").value),
      dreamParticleDensity: parseFloat(document.getElementById("cfg-density").value),
    };

    localStorage.setItem("good-night-user-config", JSON.stringify(config));
    alert("配置已保存！刷新页面后生效。");
  });
}

// ==========================================
// 工具
// ==========================================

function isInputFocused() {
  const tag = document.activeElement?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
