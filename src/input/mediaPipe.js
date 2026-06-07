// ============================================
// 🌙 Good Night — MediaPipe Hands v3
//   (显式启动：startCameraMode / startKeyboardMode)
// ============================================

import { decodeGesture, cledecode, getHandPosition } from "./gestureDecoder.js";
import { emit, on } from "../core/eventBus.js";

let hands = null;
let camera = null;
let isRunning = false;
let isReady = false;
let canvasCtx = null;
let canvasEl = null;
let videoEl = null;

// 互斥模式标记
let activeMode = null; // "camera" | "keyboard" | null

let lastGesture = null;
let gestureHoldFrames = 0;
const HOLD_FRAMES = 18;
let lastTriggerTime = 0;
const COOLDOWN_MS = 1800;

let fallbackKeyHandler = null; // 键盘事件引用，用于移除

// ==========================================
// 显式启动：摄像头手势模式
// ==========================================

export async function startCameraMode() {
  console.log("[MediaPipe] Starting CAMERA mode...");
  activeMode = "camera";

  // 禁用键盘快捷键（手势模式专用）
  removeKeyboardListeners();

  const cdnReady = await waitForMediaPipe(8000);
  if (!cdnReady) {
    console.warn("[MediaPipe] CDN not available — keyboard fallback");
    startKeyboardMode(false);
    return;
  }

  videoEl = document.getElementById("webcam");
  canvasEl = document.getElementById("hand-canvas");
  canvasCtx = canvasEl.getContext("2d");

  // 显示 PIP
  const pip = document.getElementById("webcam-pip");
  if (pip) {
    pip.style.display = "block";
    pip.style.width = "240px";
    pip.style.height = "180px";
  }

  try {
    // 请求摄像头
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 640, height: 480, facingMode: "user" },
    });
    videoEl.srcObject = stream;
    await videoEl.play();

    // 初始化 MediaPipe Hands
    const Hands = window.Hands;
    hands = new Hands({
      locateFile: (file) =>
        `https://cdn.jsdelivr.net/npm/@mediapipe/hands@0.4/${file}`,
    });
    hands.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.65,
      minTrackingConfidence: 0.5,
    });
    hands.onResults(onHandResults);

    // 初始化 Camera
    const Camera = window.Camera;
    camera = new Camera(videoEl, {
      onFrame: async () => { await hands.send({ image: videoEl }); },
      width: 640, height: 480,
    });
    await camera.start();

    isRunning = true;
    isReady = true;

    videoEl.addEventListener("loadedmetadata", () => {
      canvasEl.width = videoEl.videoWidth;
      canvasEl.height = videoEl.videoHeight;
    });

    updateIndicator("✋ 等待手势...", false);

    console.log("%c[MediaPipe] ✋ Camera gesture mode ACTIVE", "color:#4f4;font-size:1.1em;");
  } catch (err) {
    console.warn("[MediaPipe] Camera failed:", err.message);
    hideWebcamPip();
    activeMode = "keyboard";
    startKeyboardMode(false);
  }

  on("mode:enter:DEEP_SLEEP", () => pause());
  on("mode:exit:DEEP_SLEEP", () => resume());
}

// ==========================================
// 显式启动：键盘鼠标模式
// ==========================================

export function startKeyboardMode(hideCameraUI = true) {
  console.log("[MediaPipe] Starting KEYBOARD+MOUSE mode");
  activeMode = "keyboard";

  // 移除摄像头 UI
  if (hideCameraUI) {
    hideWebcamPip();
  }

  // 注册键盘监听（可移除的引用）
  const keyMap = {
    KeyA: "AWAKE", KeyS: "SLEEP", KeyD: "DREAM",
    KeyM: "MEMORY", KeyC: "CAPTURE", KeyZ: "DEEP_SLEEP",
    KeyW: "DRAW", KeyU: "MUSIC",
  };

  fallbackKeyHandler = (e) => {
    if (activeMode !== "keyboard") return; // 互斥检查
    if (isInputFocused()) return;
    const target = keyMap[e.code];
    if (target) emit("gesture:decoded", { targetState: target });
  };

  window.addEventListener("keydown", fallbackKeyHandler);

  // 鼠标模拟
  window.addEventListener("mousedown", onMouseDown);

  // 鼠标位置（模式内交互）
  window.addEventListener("mousemove", onMouseMove);

  updateIndicator("⌨️ 键盘 + 🖱️ 鼠标", false);
  console.log("[MediaPipe] ⌨️ Keyboard + Mouse mode active");
}

// 鼠标事件处理（可移除）
function onMouseDown(e) {
  if (activeMode !== "keyboard") return;
  if (isInputFocused()) return;
  const map = { 0: "open", 1: "peace", 2: "fist" };
  const g = map[e.button];
  if (g) {
    const target = cledecode(g);
    if (target) emit("gesture:decoded", { targetState: target });
  }
}

function onMouseMove(e) {
  if (activeMode !== "keyboard") return;
  emit("hand:move", {
    x: e.clientX / window.innerWidth,
    y: 1 - e.clientY / window.innerHeight,
    present: true,
  });
}

function removeKeyboardListeners() {
  if (fallbackKeyHandler) {
    window.removeEventListener("keydown", fallbackKeyHandler);
    fallbackKeyHandler = null;
  }
  window.removeEventListener("mousedown", onMouseDown);
  window.removeEventListener("mousemove", onMouseMove);
}

// ==========================================
// 手势回调
// ==========================================

function onHandResults(results) {
  drawHandLandmarks(results);

  if (results.multiHandLandmarks?.length > 0) {
    const lm = results.multiHandLandmarks[0];
    const pos = getHandPosition(lm);
    emit("hand:move", pos);

    const gesture = decodeGesture(lm);
    updateIndicator(gesture, !!gesture);

    if (gesture === lastGesture) {
      gestureHoldFrames++;
      // 发射进度（给 HUD 进度环用）
      emit("gesture:progress", {
        gesture,
        progress: Math.min(gestureHoldFrames / HOLD_FRAMES, 1),
      });

      if (gestureHoldFrames >= HOLD_FRAMES && gesture) {
        if (Date.now() - lastTriggerTime > COOLDOWN_MS) {
          lastTriggerTime = Date.now();
          const target = cledecode(gesture);
          if (target) {
            flashGesture(gesture);
            emit("gesture:detect", { gesture });
            emit("gesture:decoded", { targetState: target });
          }
        }
      }
    } else {
      lastGesture = gesture;
      gestureHoldFrames = 1;
      emit("gesture:progress", { gesture, progress: 1 / HOLD_FRAMES });
    }
  } else {
    lastGesture = null;
    gestureHoldFrames = 0;
    updateIndicator(null, false);
    emit("hand:lost");
    emit("gesture:progress", { gesture: null, progress: 0 });
  }
}

// ==========================================
// UI
// ==========================================

function updateIndicator(gesture, active) {
  let el = document.getElementById("gesture-indicator");
  if (!el) {
    el = document.createElement("div");
    el.id = "gesture-indicator";
    document.getElementById("app")?.appendChild(el);
  }

  if (active && gesture) {
    const emoji = { fist: "✊", peace: "✌️", open: "🖐️", frame: "📐", draw: "👆", music: "🤘" };
    el.innerHTML = `${emoji[gesture] || "?"} <span>${gesture}</span>`;
    el.classList.add("detected");
  } else if (gesture) {
    el.innerHTML = `${gesture}`;
    el.classList.remove("detected");
  } else if (isReady) {
    el.innerHTML = "✋ 等待手势...";
    el.classList.remove("detected");
  }
}

function flashGesture(name) {
  const emoji = { fist: "✊", peace: "✌️", open: "🖐️", frame: "📐", draw: "👆", music: "🤘" };
  const el = document.createElement("div");
  el.textContent = emoji[name] || name;
  el.style.cssText = `
    position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);
    font-size:4rem;pointer-events:none;z-index:100;
    animation:gesture-pop 0.8s ease-out forwards;
  `;
  document.getElementById("app").appendChild(el);
  setTimeout(() => el.remove(), 900);
}

function drawHandLandmarks(results) {
  if (!canvasCtx || !canvasEl) return;
  canvasCtx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  if (results.multiHandLandmarks?.length > 0) {
    const lm = results.multiHandLandmarks[0];
    if (window.drawConnectors && window.HAND_CONNECTIONS) {
      window.drawConnectors(canvasCtx, lm, window.HAND_CONNECTIONS, {
        color: "#ffd4a0", lineWidth: 2,
      });
    }
    for (const p of lm) {
      canvasCtx.beginPath();
      canvasCtx.arc(p.x * canvasEl.width, p.y * canvasEl.height, 4, 0, 2 * Math.PI);
      canvasCtx.fillStyle = "#ffd4a0"; canvasCtx.fill();
      canvasCtx.strokeStyle = "rgba(10,10,15,0.6)"; canvasCtx.lineWidth = 1; canvasCtx.stroke();
    }
  }
}

// ==========================================
// 工具
// ==========================================

function waitForMediaPipe(ms) {
  return new Promise((resolve) => {
    if (typeof window.Hands !== "undefined") { resolve(true); return; }
    const start = Date.now();
    const t = setInterval(() => {
      if (typeof window.Hands !== "undefined") { clearInterval(t); resolve(true); }
      else if (Date.now() - start > ms) { clearInterval(t); resolve(false); }
    }, 100);
  });
}

function hideWebcamPip() {
  const pip = document.getElementById("webcam-pip");
  if (pip) pip.style.display = "none";
}

function isInputFocused() {
  const tag = document.activeElement?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function pause() {
  isRunning = false;
  console.log("[MediaPipe] Paused");
}

export function resume() {
  if (isRunning) return;
  isRunning = true;
  lastGesture = null;
  gestureHoldFrames = 0;
  lastTriggerTime = Date.now();
  console.log("[MediaPipe] Resumed");
}

export function isActive() {
  return isRunning && isReady;
}
