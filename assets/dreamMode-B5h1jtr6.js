import{b as g,q as b,S as z,A as C,a as M,M as S,G as D,c as E}from"./three-C2InbUjW.js";import{s as T,a as G,b as R,c,f as m,d as P,e as u,g as f,h as v,i as I}from"./index-Mcnjrz82.js";let d=null,e=null,a=null,p=!1;function Y(){console.log("[Mode] Entering DREAM v2"),p=!1,T("DREAM"),G("✨ 欢迎进入梦境...");const o=I();R(o);const n=c("vortex",{count:3e3,color:"#c8a0ff",arms:5});n&&(n.position.set(0,.3,-1),m("vortex",3));const t=c("stardust",{count:1500,color:"#ffaacc",spread:7});t&&(t.position.set(0,0,0),m("stardust",2.5));const i=c("petal",{count:300,color:"#ff6688",gravity:.5,wind:.6});i&&(i.position.set(0,2,-1),m("petal",3.5));const s=c("firefly",{count:50});s&&(s.position.set(0,0,-2),m("firefly",2)),N(o),F(o),P(new g(0,0,0),"#d4a0ff",250),U()}function _(){console.log("[Mode] Exiting DREAM v2"),p=!0,V(),P(new g(0,0,0),"#ffaacc",200),u("vortex",2),u("stardust",1.5),u("petal",2),u("firefly",1),q(),O(),setTimeout(()=>{f("vortex"),f("stardust"),f("petal"),f("firefly")},2200)}function N(o){if(e)return;const n=new b(.2,32,32),t=new z({uniforms:{uTime:{value:0},uColor1:{value:new M("#d4a0ff")},uColor2:{value:new M("#ff88aa")}},vertexShader:`
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vPosition = position;
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,fragmentShader:`
      varying vec3 vNormal;
      varying vec3 vPosition;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec3 uColor1;
      uniform vec3 uColor2;
      void main() {
        float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.5);
        float pulse = 0.8 + 0.2 * sin(uTime * 1.5) * cos(uTime * 0.7);
        vec3 color = mix(uColor1, uColor2, sin(uTime * 0.3) * 0.5 + 0.5);
        float alpha = (0.15 + fresnel * 0.85) * pulse;
        // 边缘发光
        alpha += fresnel * 0.3;
        gl_FragColor = vec4(mix(color, vec3(1.0), fresnel * 0.6), alpha);
      }
    `,transparent:!0,depthWrite:!1,blending:C});e=new S(n,t),e.name="dream-center-glow",e.position.set(0,.3,-.5),e.scale.set(0,0,0),o.add(e),v.to(e.scale,{x:1.3,y:1.3,z:1.3,duration:3.5,ease:"elastic.out(0.8, 0.3)"})}function q(){e&&v.to(e.scale,{x:0,y:0,z:0,duration:1,ease:"power2.in",onComplete:()=>{var o,n,t;(o=e.geometry)==null||o.dispose(),(n=e.material)==null||n.dispose(),(t=e.parent)==null||t.remove(e),e=null}})}function F(o){if(a)return;a=new D,a.name="dream-orbs";const n=12;for(let t=0;t<n;t++){const i=.03+Math.random()*.07,s=new b(i,16,16),r=.7+Math.random()*.2,h=new E({color:new M().setHSL(r,.8,.6+Math.random()*.4),transparent:!0,opacity:.5+Math.random()*.5,blending:C,depthWrite:!1}),l=new S(s,h);l.position.set((Math.random()-.5)*6,(Math.random()-.5)*4,(Math.random()-.5)*3-1),l.userData={baseY:l.position.y,speed:.3+Math.random()*.8,amplitude:.3+Math.random()*1.2,phase:Math.random()*Math.PI*2,orbitRadius:.5+Math.random()*2.5,orbitSpeed:(Math.random()-.5)*.3,orbitPhase:Math.random()*Math.PI*2},a.add(l)}a.scale.set(0,0,0),o.add(a),v.to(a.scale,{x:1,y:1,z:1,duration:4,ease:"elastic.out(0.7, 0.35)"})}function O(){a&&v.to(a.scale,{x:0,y:0,z:0,duration:1.5,ease:"power2.in",onComplete:()=>{var o;a.traverse(n=>{n.geometry&&n.geometry.dispose(),n.material&&n.material.dispose()}),(o=a.parent)==null||o.remove(a),a=null}})}function U(){performance.now();function o(){var s;if(p)return;d=requestAnimationFrame(o);const t=performance.now()*.001;if(e!=null&&e.material.uniforms){e.material.uniforms.uTime.value=t;const r=1.3+Math.sin(t*.8)*.15+Math.sin(t*1.3)*.1;e.scale.lerp(new g(r,r,r),.05)}a&&!p&&(a.children.forEach(r=>{const{baseY:h,speed:l,amplitude:A,phase:w,orbitRadius:W,orbitSpeed:y,orbitPhase:x}=r.userData;r.position.y=h+Math.sin(t*l+w)*A,r.position.x+=Math.cos(t*y+x)*.003,r.position.z+=Math.sin(t*y+x)*.002,r.material.opacity=.4+Math.sin(t*2+w)*.3}),a.rotation.y+=5e-4);const i=(s=document.querySelector)==null?void 0:s.dreamVortex;i&&(i.rotation.y+=2e-4)}o()}function V(){d&&(cancelAnimationFrame(d),d=null)}export{Y as enterDream,_ as exitDream};
