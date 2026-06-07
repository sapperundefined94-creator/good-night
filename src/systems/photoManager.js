// ============================================
// 🌙 Good Night — Photo Manager v2
// ============================================

import { userConfig } from "../config/userConfig.js";

/**
 * 照片记忆管理器
 *
 * 管理照片数据。照片可以来自：
 *   1. 内置默认照片
 *   2. 用户通过管理面板添加
 *   3. localStorage 持久化
 */

let photos = [];
let listeners = [];

// 默认照片 — 氛围感 Unsplash (dreamy/atmospheric/warm)
const DEFAULT_PHOTOS = [
  {
    id: "d1",
    image: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=500&fit=crop&q=80",
    date: "2025.10.01",
    text: `第一次和${userConfig.memoryTarget}一起看海`,
  },
  {
    id: "d2",
    image: "https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=400&h=500&fit=crop&q=80",
    date: "2025.12.24",
    text: "平安夜的灯光",
  },
  {
    id: "d3",
    image: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=500&fit=crop&q=80",
    date: "2026.01.01",
    text: "新年的第一个日出",
  },
  {
    id: "d4",
    image: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=500&fit=crop&q=80",
    date: "2026.02.14",
    text: "穿过森林的那天",
  },
  {
    id: "d5",
    image: "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=400&h=500&fit=crop&q=80",
    date: "2026.03.20",
    text: "星空下的夜晚",
  },
  {
    id: "d6",
    image: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=400&h=500&fit=crop&q=80",
    date: "2026.04.05",
    text: "春天的田野",
  },
];

// 附加精选（更多氛围感）
const EXTRA_PHOTOS = [
  {
    id: "d7",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop&q=80",
    date: "2026.05.20",
    text: "黄昏的海面",
  },
  {
    id: "d8",
    image: "https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=400&h=500&fit=crop&q=80",
    date: "2026.05.30",
    text: "雨后的街道",
  },
];

// ==========================================
// 初始化
// ==========================================

export function initPhotoManager() {
  console.log("[PhotoManager] Initializing...");

  const saved = loadFromStorage();

  if (saved && saved.length > 0) {
    photos = saved;
    console.log(`[PhotoManager] Loaded ${photos.length} photos from storage`);
  } else {
    photos = [...DEFAULT_PHOTOS, ...EXTRA_PHOTOS];
    saveToStorage();
    console.log(`[PhotoManager] Using ${photos.length} default photos`);
  }
}

// ==========================================
// CRUD
// ==========================================

export function getPhotos() {
  return [...photos];
}

export function addPhoto(photo) {
  const newPhoto = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    image: photo.image || "",
    date: photo.date || new Date().toISOString().split("T")[0].replace(/-/g, "."),
    text: photo.text || "",
  };

  photos.push(newPhoto);
  saveToStorage();
  notifyListeners();
  return newPhoto;
}

export function removePhoto(id) {
  photos = photos.filter((p) => p.id !== id);
  saveToStorage();
  notifyListeners();
}

export function updatePhoto(id, updates) {
  const index = photos.findIndex((p) => p.id === id);
  if (index !== -1) {
    photos[index] = { ...photos[index], ...updates };
    saveToStorage();
    notifyListeners();
  }
}

export function movePhoto(id, direction) {
  const index = photos.findIndex((p) => p.id === id);
  if (index === -1) return;
  const newIndex = index + direction;
  if (newIndex < 0 || newIndex >= photos.length) return;

  const [item] = photos.splice(index, 1);
  photos.splice(newIndex, 0, item);
  saveToStorage();
  notifyListeners();
}

/** 重置为默认照片 */
export function resetToDefaults() {
  photos = [...DEFAULT_PHOTOS, ...EXTRA_PHOTOS];
  saveToStorage();
  notifyListeners();
}

// ==========================================
// 变更监听（管理面板用）
// ==========================================

export function onPhotosChanged(callback) {
  listeners.push(callback);
  return () => {
    listeners = listeners.filter((l) => l !== callback);
  };
}

function notifyListeners() {
  listeners.forEach((fn) => fn(getPhotos()));
}

// ==========================================
// localStorage
// ==========================================

const STORAGE_KEY = "good-night-photos";

function saveToStorage() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  } catch (err) {
    console.warn("[PhotoManager] Failed to save:", err.message);
  }
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch (_) {
    return null;
  }
}
