// ============================================
// 🌙 Good Night — Cledecode: Gesture Decoder
// ============================================

import { STATES } from "../core/stateMachine.js";

/**
 * cledecode — 手势到状态的翻译器
 *
 * 这是你丢的核心模块。根据 MediaPipe 手部关键点
 * 的几何关系，判断当前手势并映射到对应的状态。
 *
 * 手势映射：
 *   fist  → SLEEP     ✊ 握拳 → 睡觉
 *   peace → DREAM     ✌️ 剪刀手 → 梦境
 *   open  → MEMORY    🖐️ 张开手掌 → 记忆
 *   frame → CAPTURE   □ 取景框手势 → 冻结
 *   draw  → DRAW      🎨 食指伸出 → 绘画
 *   music → MUSIC     🤘 → 音乐
 */

/**
 * 手势到状态的映射表
 */
const GESTURE_STATE_MAP = {
  fist: STATES.SLEEP,
  peace: STATES.DREAM,
  open: STATES.MEMORY,
  frame: STATES.CAPTURE,
  draw: STATES.DRAW,
  music: STATES.MUSIC,
};

/**
 * cledecode 主函数
 * @param {string} handGesture - 手势名称
 * @returns {string|null} 对应的状态，或 null
 */
export function cledecode(handGesture) {
  return GESTURE_STATE_MAP[handGesture] || null;
}

/**
 * 根据 MediaPipe 地标数组识别手势
 *
 * MediaPipe 手部 21 个关键点索引：
 *   0: 手腕, 4: 拇指尖, 8: 食指尖,
 *   12: 中指尖, 16: 无名指尖, 20: 小指尖
 *
 * @param {Array} landmarks - MediaPipe 手部关键点数组
 * @returns {string|null} 手势名称
 */
export function decodeGesture(landmarks) {
  if (!landmarks || landmarks.length < 21) return null;

  const thumbTip = landmarks[4];
  const indexTip = landmarks[8];
  const middleTip = landmarks[12];
  const ringTip = landmarks[16];
  const pinkyTip = landmarks[20];

  const indexMcp = landmarks[5];
  const middleMcp = landmarks[9];
  const ringMcp = landmarks[13];
  const pinkyMcp = landmarks[17];

  // 伸直判定：指尖比指根"高"（y更小，因为摄像头是镜像的）
  // 使用更宽松的阈值和指尖-指根距离
  const thumbDist = distance(thumbTip, landmarks[2]);
  const indexDist = distance(indexTip, indexMcp);
  const middleDist = distance(middleTip, middleMcp);
  const ringDist = distance(ringTip, ringMcp);
  const pinkyDist = distance(pinkyTip, pinkyMcp);

  // 伸直：指尖高于指根 且 指尖-指根距离足够大
  const distThreshold = 0.08;
  const isIndexUp = indexTip.y < indexMcp.y - 0.02 && indexDist > distThreshold;
  const isMiddleUp = middleTip.y < middleMcp.y - 0.02 && middleDist > distThreshold;
  const isRingUp = ringTip.y < ringMcp.y - 0.02 && ringDist > distThreshold;
  const isPinkyUp = pinkyTip.y < pinkyMcp.y - 0.02 && pinkyDist > distThreshold;
  const isThumbUp = Math.abs(thumbTip.x - indexMcp.x) > 0.08 && thumbDist > 0.06;

  const fingersUp = [isThumbUp, isIndexUp, isMiddleUp, isRingUp, isPinkyUp].filter(Boolean).length;

  // ✊ 拳头（所有手指弯曲，0-1 根伸直）
  if (fingersUp <= 1 && !isIndexUp) {
    return "fist";
  }

  // 🖐️ 张开手掌（4-5 指全伸）
  if (fingersUp >= 4) {
    return "open";
  }

  // ✌️ 剪刀手 / Peace（食指 + 中指伸直，其余弯）
  if (isIndexUp && isMiddleUp && !isRingUp && !isPinkyUp) {
    return "peace";
  }

  // □ 取景框（食指 + 拇指形成 L 形）
  if (isIndexUp && isThumbUp && !isMiddleUp && !isRingUp && !isPinkyUp) {
    const dx = Math.abs(thumbTip.x - indexTip.x);
    const dy = Math.abs(thumbTip.y - indexTip.y);
    if (dx > 0.08 && dy > 0.08) {
      return "frame";
    }
  }

  // 🎨 仅食指伸出 → 绘画模式
  if (isIndexUp && !isMiddleUp && !isRingUp && !isPinkyUp && fingersUp <= 2) {
    return "draw";
  }

  // 🤘 Rock on（食指 + 小指）
  if (isIndexUp && isPinkyUp && !isMiddleUp && !isRingUp) {
    return "music";
  }

  return null;
}

/** 两点间欧氏距离 */
function distance(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

/**
 * 获取手部中心位置（归一化 0-1）
 * 用于模式内交互（浏览照片、扰动粒子等）
 */
export function getHandPosition(landmarks) {
  if (!landmarks || landmarks.length < 21) {
    return { x: 0.5, y: 0.5, z: 0, present: false };
  }

  // 使用手腕（0）和中指根（9）的中点作为手部位置
  const wrist = landmarks[0];
  const middleMcp = landmarks[9];

  const x = 1 - (wrist.x + middleMcp.x) / 2;  // 翻转X（镜像）
  const y = 1 - (wrist.y + middleMcp.y) / 2;  // 翻转Y（屏幕坐标）
  const z = Math.abs(wrist.z);

  return {
    x: Math.max(0, Math.min(1, x)),
    y: Math.max(0, Math.min(1, y)),
    z,
    present: true,
  };
}
