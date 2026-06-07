// ============================================
// 🌙 Good Night — Asset Configuration
// ============================================

/**
 * 资源路径配置
 *
 * 所有音频 URL 可从以下免费来源获取：
 *   pixabay.com/music/search/ambient/
 *   freesound.org
 *
 * 推荐曲目：
 *   ambient  → "Ambient Piano Relaxing Music" (pixabay.com/music/ambient-ambient-piano-relaxing-music-347950/)
 *   blanket  → "Raindrops" (pixabay.com/music/ambient-raindrops-soothing-ambient-background-music-294224/)
 *   dream    → "Dreamy Ambient Music" (pixabay.com/music/ambient-dreamy-ambient-music-348223/)
 *   memory   → "Time For Reflections" (pixabay.com/music/modern-classical-time-for-reflections-442292/)
 *   deep     → "nightfall" (pixabay.com/music/ambient-nightfall-calm-night-ambient-313126/)
 *   end      → "Morning Dew" (pixabay.com/music/electronic-morning-dew-454851/)
 */

// 从 localStorage 加载或使用默认值
function loadConfig() {
  try {
    const saved = localStorage.getItem("good-night-assets");
    if (saved) return JSON.parse(saved);
  } catch (_) {}
  return null;
}

const saved = loadConfig();

export const assetConfig = saved || {
  /** 音频资源 — 替换为你下载的 MP3 路径或 URL */
  audio: {
    ambient: "",     // 清醒 — 安静环境音
    blanket: "",     // 睡前 — 安抚低频
    dream: "",       // 梦境 — 空灵梦幻
    memory: "",      // 记忆 — 温暖钢琴
    deepsleep: "",   // 深睡 — 极低嗡鸣
    end: "",         // 结束 — 晨曦苏醒
  },

  /** 图片资源 */
  images: {
    logo: "",
    background: "",
  },

  /** 纹理资源 */
  textures: {
    particle: "",
    rose: "",
  },

  /** 3D 模型 */
  models: {},
};

/** 保存资源配置到 localStorage */
export function saveAssetConfig(config) {
  try {
    localStorage.setItem("good-night-assets", JSON.stringify(config));
  } catch (err) {
    console.warn("[AssetConfig] Failed to save:", err.message);
  }
}
