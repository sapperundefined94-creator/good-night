import{V as g}from"./three-C2InbUjW.js";import{R as d,U as v,S as b,O as f,E as c}from"./postprocessing-C1OtMSP-.js";import{o as w}from"./index-Mcnjrz82.js";let n=null,s=null,r=null;const P={uniforms:{tDiffuse:{value:null},uVignette:{value:.35},uWarmth:{value:0},uBrightness:{value:1},uTime:{value:0}},vertexShader:`
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,fragmentShader:`
    varying vec2 vUv;
    uniform sampler2D tDiffuse;
    uniform float uVignette;
    uniform float uWarmth;
    uniform float uBrightness;
    uniform float uTime;

    void main() {
      vec4 color = texture2D(tDiffuse, vUv);

      // 暗角
      float d = length(vUv - 0.5) * 1.6;
      float vignette = 1.0 - d * uVignette;
      vignette = smoothstep(0.0, 1.0, vignette);

      // 色温偏移
      float warmth = uWarmth;
      color.r += warmth * 0.08;
      color.b -= warmth * 0.08;

      // 亮度
      color.rgb *= uBrightness;

      // 暗角色彩倾向（边缘偏蓝紫）
      vec3 edgeTint = mix(vec3(1.0), vec3(0.85, 0.82, 1.0), d * 0.3);

      color.rgb *= vignette * edgeTint;

      gl_FragColor = color;
    }
  `},o={AWAKE:{bloomStrength:.4,bloomRadius:.4,bloomThreshold:.6,vignette:.25,warmth:.2,brightness:1},SLEEP:{bloomStrength:.6,bloomRadius:.5,bloomThreshold:.5,vignette:.45,warmth:.5,brightness:.85},DREAM:{bloomStrength:1.2,bloomRadius:.7,bloomThreshold:.3,vignette:.3,warmth:-.15,brightness:1.05},MEMORY:{bloomStrength:.5,bloomRadius:.35,bloomThreshold:.55,vignette:.4,warmth:.4,brightness:.95},CAPTURE:{bloomStrength:.2,bloomRadius:.3,bloomThreshold:.8,vignette:.55,warmth:0,brightness:.9},DEEP_SLEEP:{bloomStrength:.05,bloomRadius:.2,bloomThreshold:.95,vignette:.85,warmth:-.3,brightness:.3}};let e=o.AWAKE,i=o.AWAKE;function R(l,t,a){console.log("[PostProcess] Initializing...");const m=new d(t,a);s=new v(new g(window.innerWidth,window.innerHeight),o.AWAKE.bloomStrength,o.AWAKE.bloomRadius,o.AWAKE.bloomThreshold),r=new b(P),r.uniforms.uVignette.value=o.AWAKE.vignette,r.uniforms.uWarmth.value=o.AWAKE.warmth,r.uniforms.uBrightness.value=o.AWAKE.brightness;const h=new f;n=new c(l),n.addPass(m),n.addPass(s),n.addPass(r),n.addPass(h),w("mode:enter",({mode:u})=>{i=o[u]||o.AWAKE}),window.addEventListener("resize",()=>{n.setSize(window.innerWidth,window.innerHeight)}),console.log("[PostProcess] Ready — Bloom + Vignette pipeline active")}function T(l){if(!n)return;const t=1-Math.exp(-2*l);e.bloomStrength+=(i.bloomStrength-e.bloomStrength)*t,e.bloomRadius+=(i.bloomRadius-e.bloomRadius)*t,e.bloomThreshold+=(i.bloomThreshold-e.bloomThreshold)*t,e.vignette+=(i.vignette-e.vignette)*t,e.warmth+=(i.warmth-e.warmth)*t,e.brightness+=(i.brightness-e.brightness)*t,s&&(s.strength=e.bloomStrength,s.radius=e.bloomRadius,s.threshold=e.bloomThreshold),r&&(r.uniforms.uVignette.value=e.vignette,r.uniforms.uWarmth.value=e.warmth,r.uniforms.uBrightness.value=e.brightness,r.uniforms.uTime.value=performance.now()*.001),n.render()}function W(){return n}function K(l,t,a){s&&(s.strength=l,s.radius=t,s.threshold=a)}export{W as getComposer,R as initPostProcessing,T as render,K as setBloom};
