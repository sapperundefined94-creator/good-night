import{b as f,v as w,S as y,a as h,M as x}from"./three-C2InbUjW.js";import{s as S,a as P,b as E,c as l,f as m,d as c,e as u,g as v,h as p,i as M}from"./index-Mcnjrz82.js";let e=null,n=null,s=!1;function N(){console.log("[Mode] Entering SLEEP v2"),s=!1,S("SLEEP"),P("闭上眼睛，放松身体...");const t=M();E(t);const o=l("snow",{count:400,wind:.3});o&&(o.position.set(0,0,-1),m("snow",3));const a=l("firefly",{count:30});a&&(a.position.set(0,-1,-2),m("firefly",2.5)),T(t),c(new f(0,0,0),"#ffc8a0",150),C()}function L(){console.log("[Mode] Exiting SLEEP v2"),s=!0,b(),c(new f(0,0,0),"#ffaa88",120),u("snow",2),u("firefly",1.5),U(),setTimeout(()=>{v("snow"),v("firefly")},2200)}function T(t){if(e)return;const o=new w(14,11,48,48),a=o.attributes.position;for(let i=0;i<a.count;i++){const d=a.getX(i),g=a.getY(i);a.setZ(i,Math.sin(d*1.5)*Math.cos(g*1.8)*.3)}o.computeVertexNormals();const r=new y({uniforms:{uTime:{value:0},uColor:{value:new h("#3a2a4a")},uOpacity:{value:0}},vertexShader:`
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float uTime;
      void main() {
        vUv = uv;
        vec3 pos = position;
        // 呼吸式起伏
        float wave = sin(pos.x * 2.0 + uTime * 0.4) * cos(pos.y * 2.5 + uTime * 0.3) * 0.15;
        pos.z += wave;
        vNormal = normalize(normalMatrix * normal);
        vPosition = pos;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
      }
    `,fragmentShader:`
      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vPosition;
      uniform float uTime;
      uniform vec3 uColor;
      uniform float uOpacity;
      void main() {
        // 边缘渐隐 + 波纹纹理
        float edge = smoothstep(0.0, 0.25, vUv.x)
                   * smoothstep(1.0, 0.75, vUv.x)
                   * smoothstep(0.0, 0.25, vUv.y)
                   * smoothstep(1.0, 0.75, vUv.y);

        // 柔光波纹
        float ripple = 0.08 * sin(vUv.x * 15.0 + uTime * 0.5)
                     * cos(vUv.y * 12.0 + uTime * 0.4);

        // 菲涅尔边缘光
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);

        float alpha = (0.10 + ripple + fresnel * 0.08) * edge * uOpacity;

        gl_FragColor = vec4(uColor, alpha);
      }
    `,transparent:!0,depthWrite:!1});e=new x(o,r),e.name="blanket",e.position.set(0,1.2,-2),e.rotation.x=-.35,t.add(e),p.to(r.uniforms.uOpacity,{value:1,duration:4,ease:"power3.out"})}function U(){e&&p.to(e.material.uniforms.uOpacity,{value:0,duration:2,ease:"power2.in",onComplete:()=>{var t,o,a;(t=e.geometry)==null||t.dispose(),(o=e.material)==null||o.dispose(),(a=e.parent)==null||a.remove(e),e=null}})}function C(){function t(){if(s)return;n=requestAnimationFrame(t);const o=performance.now()*.001;e!=null&&e.material.uniforms&&(e.material.uniforms.uTime.value=o)}t()}function b(){n&&(cancelAnimationFrame(n),n=null)}export{N as enterSleep,L as exitSleep};
