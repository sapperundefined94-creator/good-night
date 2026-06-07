import{v as l,S as s,M as u}from"./three-C2InbUjW.js";import{s as p,a as c,h as r,i as d}from"./index-Mcnjrz82.js";let e=null,o=null,n=null;function E(){console.log("[Mode] Entering DEEP_SLEEP"),p("DEEP_SLEEP"),c(""),m(),f()}function S(){console.log("[Mode] Exiting DEEP_SLEEP"),v(),g()}function m(){const t=d();if(!t||e)return;const i=new l(20,20),a=new s({uniforms:{uTime:{value:0},uOpacity:{value:0}},vertexShader:`
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      varying vec2 vUv;
      uniform float uTime;
      uniform float uOpacity;
      void main() {
        // Vignette effect
        float d = length(vUv - 0.5) * 2.0;
        float vignette = smoothstep(1.0, 0.3, d);
        vec3 color = mix(vec3(0.02, 0.01, 0.04), vec3(0.0), vignette);
        // Slow breathing pulse
        float pulse = 0.02 * sin(uTime * 0.3) * (1.0 - d);
        float alpha = uOpacity * (0.95 + pulse);
        gl_FragColor = vec4(color, alpha);
      }
    `,transparent:!0,depthTest:!1,depthWrite:!1});e=new u(i,a),e.name="dark-veil",e.position.z=.5,e.renderOrder=999,e.material.depthTest=!1,t.add(e),r.to(a.uniforms.uOpacity,{value:1,duration:5,ease:"power3.in"})}function v(){e&&r.to(e.material.uniforms.uOpacity,{value:0,duration:3,ease:"power2.out",onComplete:()=>{var t,i,a;(t=e.geometry)==null||t.dispose(),(i=e.material)==null||i.dispose(),(a=e.parent)==null||a.remove(e),e=null}})}function f(){const t=document.getElementById("ui-overlay");t&&(o=document.createElement("div"),o.style.cssText=`
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(100,120,180,0.4) 0%, transparent 70%);
    pointer-events: none;
  `,t.appendChild(o),n=r.to(o,{width:60,height:60,opacity:.3,duration:4,repeat:-1,yoyo:!0,ease:"sine.inOut"}))}function g(){n&&(n.kill(),n=null),o==null||o.remove(),o=null}export{E as enterDeepSleep,S as exitDeepSleep};
