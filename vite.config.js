import { defineConfig } from "vite";

export default defineConfig({
  root: ".",
  publicDir: "public",
  server: {
    host: true,
    port: 3000,
    open: true,
  },
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      output: {
        manualChunks: {
          // Three.js 核心单独打包（~400KB，长期缓存）
          three: ["three"],
          // 后处理单独打包（~80KB，按需加载）
          postprocessing: [
            "three/examples/jsm/postprocessing/EffectComposer.js",
            "three/examples/jsm/postprocessing/RenderPass.js",
            "three/examples/jsm/postprocessing/UnrealBloomPass.js",
            "three/examples/jsm/postprocessing/ShaderPass.js",
            "three/examples/jsm/postprocessing/OutputPass.js",
          ],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
});
