# 🌙 Good Night

> 手势驱动的数字梦境状态机系统 — A gesture-driven digital dream state machine

---

## 🎯 项目概述

一个基于 **Vite + Three.js + MediaPipe** 的交互式数字梦境体验。

通过手势识别驱动状态机在不同"模式"间切换：
清醒 → 睡前安抚 → 梦境粒子 → 记忆照片墙 → 取景框冻结 → 深睡

---

## 🚀 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 启动开发服务器
npm run dev

# 3. 打开浏览器 http://localhost:3000
```

---

## ⌨️ 操作方式

### 键盘控制（默认，无需摄像头）

| 按键 | 模式 | 说明 |
|------|------|------|
| `A` | AWAKE | 清醒状态 |
| `S` | SLEEP | 睡前安抚 |
| `D` | DREAM | 梦境粒子 |
| `M` | MEMORY | 记忆照片墙 |
| `C` | CAPTURE | 取景框冻结 |
| `Z` | DEEP_SLEEP | 深睡 |
| `W` | DRAW | 绘画模式 |
| `U` | MUSIC | 音乐模式 |

### 手势控制（需要摄像头 + MediaPipe）

| 手势 | 模式 |
|------|------|
| ✊ 握拳 | SLEEP |
| ✌️ 剪刀手 | DREAM |
| 🖐️ 张开手掌 | MEMORY |
| 📐 L 形取景框 | CAPTURE |
| 👆 食指伸出 | DRAW |
| 🤘 Rock手势 | MUSIC |

---

## 📁 项目结构

```
good-night/
├── index.html              # 入口HTML
├── package.json
├── vite.config.js
│
├── src/
│   ├── main.js             # 入口
│   ├── app.js              # 总控制器
│   │
│   ├── core/               # 核心系统
│   │   ├── stateMachine.js # 状态机
│   │   ├── eventBus.js     # 事件总线
│   │   └── modeManager.js  # 模式管理
│   │
│   ├── input/              # 输入层
│   │   ├── mediaPipe.js    # 手势识别
│   │   ├── gestureDecoder.js # 手势解码 (cledecode)
│   │   └── handTracker.js  # 手部跟踪
│   │
│   ├── world/              # 世界层
│   │   ├── scene.js        # Three.js 场景
│   │   ├── camera.js       # 相机
│   │   ├── lights.js       # 灯光系统
│   │   └── environment.js  # 环境管理
│   │
│   ├── modes/              # 模式层 (6个模式)
│   │   ├── awakeMode.js
│   │   ├── sleepMode.js
│   │   ├── dreamMode.js
│   │   ├── memoryMode.js
│   │   ├── captureMode.js
│   │   └── deepSleepMode.js
│   │
│   ├── systems/            # 系统层
│   │   ├── particleEngine.js
│   │   ├── audioManager.js
│   │   ├── photoManager.js
│   │   └── animationManager.js
│   │
│   ├── ui/                 # UI层
│   │   ├── overlay.js
│   │   └── promptLayer.js
│   │
│   ├── config/             # 配置
│   │   ├── userConfig.js   # 用户信息
│   │   └── assetConfig.js  # 资源路径
│   │
│   ├── assets/             # 静态资源
│   │   ├── images/
│   │   ├── audio/
│   │   └── textures/
│   │
│   └── styles/
│       └── main.css
│
└── README.md
```

---

## 🧠 系统架构

```
MediaPipe 手势
      ↓
cledecode（手势 → 状态 翻译器）
      ↓
State Machine（状态机）
      ↓
Mode Manager（模式生命周期管理）
      ↓
┌─────────────────────────────────────┐
│  Three.js  │  Audio   │   Photo    │
│  渲染层    │  音频层  │  记忆层    │
└─────────────────────────────────────┘
```

---

## 🎨 定制指南

### 修改名字

编辑 `src/config/userConfig.js`:
```js
export const userConfig = {
  name: "你的名字",
  memoryTarget: "TA",  // "她" / "他" / 人名
};
```

### 替换照片

1. 将照片放入 `src/assets/images/`
2. 编辑 `src/systems/photoManager.js`，替换 `DEFAULT_PHOTOS` 数组

### 替换音频

1. 将音频文件放入 `src/assets/audio/`
2. 编辑 `src/config/assetConfig.js`，替换 `[DEFAULT_*]` 占位符

---

## 🛠️ 技术栈

- **Vite** — 构建工具
- **Three.js** — 3D 渲染引擎
- **GSAP** — 动画引擎
- **MediaPipe Hands** — 手势识别
- **Web Audio API** — 音频系统

---

## 📄 License

MIT
