// ============================================
// 🌙 Good Night — User Configuration
// ============================================

/**
 * 用户配置
 *
 * 这里是整个项目的「个人化」入口。
 * 修改 name 和 memoryTarget 即可定制体验。
 */

export const userConfig = {
  /** 用户的名字（用于问候语） */
  name: "杨华丽",

  /** 记忆指向的人（用于照片墙文字） */
  memoryTarget: "她",

  /** 语言偏好 */
  locale: "zh-CN",

  /** 是否启用音频 */
  audioEnabled: true,

  /** 手势灵敏度 (0-1)，越高越敏感 */
  gestureSensitivity: 0.7,

  /** 进入深睡的默认延迟（秒） */
  deepSleepDelay: 30,

  /** 梦境粒子密度 (0-1) */
  dreamParticleDensity: 0.7,
};

/**
 * 使用方法：
 *   1. 修改 name 为你的名字
 *   2. 修改 memoryTarget 为照片指向的人称
 *   3. 在 assetConfig.js 中配置你的照片路径
 *   4. 替换 assets/images/ 中的照片
 *   5. 替换 assets/audio/ 中的音频
 *
 * 然后运行:
 *   npm run dev
 */
