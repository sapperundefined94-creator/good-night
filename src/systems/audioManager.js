// ============================================
// 🌙 Good Night — Audio Manager v3 (Theme Piano)
// ============================================

import { on } from "../core/eventBus.js";

/**
 * 单曲钢琴主题模式
 *
 * 一首钢琴曲贯穿所有模式，每个模式用不同的音量/EQ/混响
 * 营造不同的氛围——同一首曲子，不同听感。
 *
 * 使用你的音乐：
 *   1. 把 MP3 放到 src/assets/audio/theme.mp3
 *   2. 或者在管理面板（按 \ 键）粘贴 URL
 *
 * 默认：Web Audio 合成钢琴和弦（无需文件）
 */

let ctx = null;
let master = null;
let audioBuffer = null;   // 加载的外部音频
let isExternalLoaded = false;

const activeNodes = new Map();

// 每个模式的"听感"（相对同一首曲子）
const MODE_MIX = {
  AWAKE: {
    volume: 0.18,     // 轻柔
    lowpass: 5000,    // 高音保留
    reverb: 0.3,      // 少许混响
    detune: 0,        // 原调
  },
  SLEEP: {
    volume: 0.22,
    lowpass: 1200,    // 闷（滤掉高音，像隔着被子）
    reverb: 0.5,      // 更多混响
    detune: -200,     // 降半音（更沉）
  },
  DREAM: {
    volume: 0.28,
    lowpass: 8000,    // 高音通透
    reverb: 0.7,      // 最空灵
    detune: 200,      // 升半音（梦幻）
  },
  MEMORY: {
    volume: 0.2,
    lowpass: 3000,
    reverb: 0.4,
    detune: 0,
  },
  CAPTURE: {
    volume: 0.06,
    lowpass: 800,
    reverb: 0.2,
    detune: 0,
  },
  DEEP_SLEEP: {
    volume: 0.12,
    lowpass: 400,     // 极高频滤除（嗡嗡感）
    reverb: 0.8,      // 最远
    detune: -400,     // 降全音
  },
};

// ==========================================
// 初始化
// ==========================================

export function initAudio() {
  console.log("[Audio] Initializing theme piano engine...");

  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 0;
    master.connect(ctx.destination);
  } catch (err) {
    console.warn("[Audio] Web Audio unavailable:", err.message);
    return;
  }

  // 尝试加载外部主题曲
  tryLoadThemeFile();

  on("mode:enter", ({ mode }) => {
    stopMode(mode);
    if (isExternalLoaded && audioBuffer) {
      playExternalBuffer(mode);
    } else {
      playSynthChord(mode);
    }
    applyMix(MODE_MIX[mode] || MODE_MIX.AWAKE);
  });

  on("mode:exit", ({ mode }) => stopMode(mode));

  // 首次交互启动
  const resume = async () => {
    if (ctx?.state === "suspended") await ctx.resume();
    if (!isExternalLoaded && !activeNodes.has("AWAKE")) {
      playSynthChord("AWAKE");
      applyMix(MODE_MIX.AWAKE);
    }
    document.removeEventListener("click", resume);
    document.removeEventListener("keydown", resume);
  };
  document.addEventListener("click", resume);
  document.addEventListener("keydown", resume);

  console.log("[Audio] Ready — piano theme engine active");
}

// ==========================================
// 主题曲加载（src/assets/audio/theme.mp3）
// ==========================================

async function tryLoadThemeFile() {
  const paths = [
    "/src/assets/audio/theme.mp3",
    "/assets/audio/theme.mp3",
    "/theme.mp3",
  ];

  for (const path of paths) {
    try {
      const resp = await fetch(path);
      if (!resp.ok) continue;

      const buf = await resp.arrayBuffer();
      audioBuffer = await ctx.decodeAudioData(buf);
      isExternalLoaded = true;
      console.log(`[Audio] ✅ Theme loaded: ${path} (${(buf.byteLength / 1024).toFixed(0)}KB)`);
      return;
    } catch (_) {}
  }

  console.log("[Audio] No theme.mp3 found — using synth piano (put theme.mp3 in src/assets/audio/)");
}

// ==========================================
// 外部音频播放（缓冲循环）
// ==========================================

function playExternalBuffer(mode) {
  if (!ctx || !audioBuffer || !master) return;

  const src = ctx.createBufferSource();
  src.buffer = audioBuffer;
  src.loop = true;
  src.playbackRate.value = 1;

  const gain = ctx.createGain();
  gain.gain.value = 0.6;

  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = 5000;

  src.connect(filter);
  filter.connect(gain);
  gain.connect(master);

  src.start();
  activeNodes.set(mode, [src, gain, filter]);
}

// ==========================================
// 合成钢琴（无文件时的默认）
// ==========================================

function playSynthChord(mode) {
  if (!ctx || !master) return;

  // 钢琴音域和弦
  const chords = {
    AWAKE:      [261.63, 329.63, 392.00], // C 大三和弦
    SLEEP:      [174.61, 220.00, 261.63], // F 大三和弦 低
    DREAM:      [392.00, 493.88, 587.33], // G 大三和弦 高
    MEMORY:     [293.66, 369.99, 440.00], // D 大三和弦
    CAPTURE:    [261.63],
    DEEP_SLEEP: [130.81, 164.81],
  };

  const notes = chords[mode] || chords.AWAKE;
  const nodes = [];

  notes.forEach((freq, i) => {
    // 主振荡器（三角波接近钢琴音色）
    const osc = ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;

    // 泛音（增加真实感）
    const harm = ctx.createOscillator();
    harm.type = "sine";
    harm.frequency.value = freq * 2;

    const gain = ctx.createGain();
    gain.gain.value = 0;
    const now = ctx.currentTime;

    // 钢琴包络：快起 → 衰减 → 保持
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12 / notes.length, now + 0.1);
    gain.gain.linearRampToValueAtTime(0.06 / notes.length, now + 0.5);

    const harmGain = ctx.createGain();
    harmGain.gain.value = 0;
    harmGain.gain.linearRampToValueAtTime(0.02 / notes.length, now + 0.05);
    harmGain.gain.linearRampToValueAtTime(0.005 / notes.length, now + 0.3);

    const panner = ctx.createStereoPanner();
    panner.pan.value = (i / (notes.length - 1) - 0.5) * 0.5;

    osc.connect(gain);
    gain.connect(panner);
    panner.connect(master);

    harm.connect(harmGain);
    harmGain.connect(panner);

    osc.start(now);
    harm.start(now);
    nodes.push(osc, harm, gain, harmGain, panner);
  });

  activeNodes.set(mode, nodes);
}

// ==========================================
// 模式混音
// ==========================================

function applyMix(mix) {
  if (!ctx || !master) return;
  const t = ctx.currentTime;

  // 主音量渐变
  master.gain.cancelScheduledValues(t);
  master.gain.setValueAtTime(master.gain.value, t);
  master.gain.linearRampToValueAtTime(mix.volume, t + 1.5);

  // 如果有外部音频，调整滤波器
  const nodes = activeNodes.values().next().value;
  if (nodes && nodes.length >= 3) {
    const filter = nodes[2];
    if (filter?.frequency) {
      filter.frequency.cancelScheduledValues(t);
      filter.frequency.setValueAtTime(filter.frequency.value, t);
      filter.frequency.linearRampToValueAtTime(mix.lowpass, t + 1.5);
    }
  }
}

// ==========================================
// 停止
// ==========================================

function stopMode(mode) {
  const nodes = activeNodes.get(mode);
  if (!nodes) return;
  nodes.forEach((n) => {
    try { n.stop?.(); } catch (_) {}
    n.disconnect?.();
  });
  activeNodes.delete(mode);
}

export function getVolume() {
  return master?.gain.value ?? 0;
}

export function setVolume(v) {
  if (master) master.gain.value = Math.max(0, Math.min(1, v));
}
