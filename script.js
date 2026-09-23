const still = matchMedia("(prefers-reduced-motion: reduce)");
const lite = matchMedia("(max-width: 600px)");   /* phones: same show, lighter load */
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
let DPR = Math.min(lite.matches ? 1.5 : 2, window.devicePixelRatio || 1);
if (!still.matches) document.documentElement.classList.add("anim");
const wait = ms => new Promise(r => setTimeout(r, ms));

/* each page has its own glow colour: dark orange / dark green / dark violet */
const GLOW = { home: [255, 128, 40], projects: [70, 205, 120], contact: [160, 100, 255] };
let color = [...GLOW.home], power = 1, flash = 0;

/* =======================================================
   BACKGROUND — just soft light behind everything
   ======================================================= */
const cv = $("#scene"), ctx = cv.getContext("2d");
let W, H, embers = [], bugs = [], puffs = [], last = 0;
function buildBg() {
  W = innerWidth; H = innerHeight;
  DPR = Math.min(lite.matches ? 1.5 : 2, window.devicePixelRatio || 1);
  cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR);
  embers = Array.from({ length: lite.matches ? 22 : 46 }, () => ({ x: Math.random() * W, y: Math.random() * H, r: .6 + Math.random() * 1.8, sp: 6 + Math.random() * 16, ph: Math.random() * 6 }));
}
function dragonCenter() {
  const r = $("#dragon").getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height * .52 };
}
function drawBg(now) {
  const t = now / 1000, dt = Math.min(.1, (now - last) / 1000 || 0); last = now;
  const [r, g, b] = color, P = Math.max(0, Math.min(1.4, power + flash)), c = dragonCenter();
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  const base = ctx.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, "#05030a"); base.addColorStop(1, "#0a0612");
  ctx.fillStyle = base; ctx.fillRect(0, 0, W, H);
  ctx.globalCompositeOperation = "lighter";
  /* the main light, coming from the dragon */
  const R = Math.max(W, H) * .6;
  const glow = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, R);
  glow.addColorStop(0, `rgba(${r},${g},${b},${.3 * P})`); glow.addColorStop(.22, `rgba(${r},${g},${b},${.12 * P})`);
  glow.addColorStop(.6, `rgba(${r},${g},${b},${.035 * P})`); glow.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
  /* a soft floor light */
  ctx.save(); ctx.translate(W / 2, H * 1.02); ctx.scale(1, .35);
  const floor = ctx.createRadialGradient(0, 0, 0, 0, 0, W * .6);
  floor.addColorStop(0, `rgba(${r},${g},${b},${.1 * P})`); floor.addColorStop(1, `rgba(${r},${g},${b},0)`);
  ctx.fillStyle = floor; ctx.beginPath(); ctx.arc(0, 0, W * .6, 0, 7); ctx.fill(); ctx.restore();
  /* embers drifting up */
  for (const e of embers) {
    if (!still.matches) { e.y -= e.sp * dt; e.x += Math.sin(t + e.ph) * 6 * dt; if (e.y < -10) { e.y = H + 10; e.x = Math.random() * W; } }
    ctx.fillStyle = `rgba(${r},${g},${b},${(.25 + .25 * Math.sin(t * 2 + e.ph)) * Math.min(1, P)})`;
    ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, 7); ctx.fill();
  }
  /* fireflies circling the dragon */
  for (const f of bugs) {
    if (!still.matches) f.a += f.sp * dt;
    let x = c.x + Math.cos(f.a) * f.r, y = c.y + Math.sin(f.a * 1.2 + f.wob) * f.r * .55;
    if (f.fly !== undefined && f.fly < 1) {
      f.fly = Math.min(1, f.fly + dt / 1.4);
      const k = 1 - Math.pow(1 - f.fly, 3), mx = (f.fx + x) / 2, my = Math.min(f.fy, y) - 120;
      x = (1 - k) ** 2 * f.fx + 2 * (1 - k) * k * mx + k * k * x; y = (1 - k) ** 2 * f.fy + 2 * (1 - k) * k * my + k * k * y;
    }
    const tw = .55 + .45 * Math.sin(t * 5 + f.wob * 3), gl = ctx.createRadialGradient(x, y, 0, x, y, 9);
    gl.addColorStop(0, `rgba(255,250,235,${tw})`); gl.addColorStop(.4, `rgba(${r},${g},${b},${.6 * tw})`); gl.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fill();
  }
  /* little light puffs when you poke the dragon */
  for (const p of puffs) {
    p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 20 * dt;
    const a = Math.max(0, p.life / p.max) * (p.dim ? .35 : 1), gl = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s);
    gl.addColorStop(0, `rgba(255,245,230,${a})`); gl.addColorStop(.5, `rgba(${r},${g},${b},${.5 * a})`); gl.addColorStop(1, `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, 7); ctx.fill();
  }
  puffs = puffs.filter(p => p.life > 0);
  ctx.globalCompositeOperation = "source-over";
  if (!still.matches && flash > 0) flash = Math.max(0, flash - dt * 1.6);
}
function newBug(from) {
  const b = { a: Math.random() * 6.28, r: 120 + Math.random() * 90, sp: (.3 + Math.random() * .5) * (Math.random() < .5 ? -1 : 1), wob: Math.random() * 6 };
  if (from) { b.fly = 0; b.fx = from.x; b.fy = from.y; }
  return b;
}

/* =======================================================
   THE DAEMON — an armoured serpent-dragon guarding a glowing kernel orb
   ======================================================= */
const D = { ok: false, strike: 0, coil: 0, speed: .55, u: 0 };
function initDragon() {
  if (!window.THREE) { $("#dragon").style.visibility = "hidden"; return; }
  const T = THREE, canvas = $("#dragon");
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, alpha: true, antialias: !lite.matches, powerPreference: "low-power" }); } catch (e) { canvas.style.visibility = "hidden"; return; }
  renderer.setPixelRatio(DPR);
  const scene = new T.Scene(), camera = new T.PerspectiveCamera(34, 1, .1, 100);
  camera.position.set(0, .95, 6.7); camera.lookAt(0, 0, 0);
  scene.add(new T.HemisphereLight(0x8a80b0, 0x050308, .5));
  const key = new T.DirectionalLight(0xdcd6ff, .8); key.position.set(-4, 5, 5); scene.add(key);
  const core = new T.PointLight(0xffffff, 3, 6); scene.add(core);                     // the orb lights the serpent

  const metal = new T.MeshStandardMaterial({ color: 0x1c1926, roughness: .4, metalness: .6, flatShading: true });
  const hornM = new T.MeshStandardMaterial({ color: 0x3a3548, roughness: .45, metalness: .35, flatShading: true, emissive: 0xffffff, emissiveIntensity: .1 });
  const glowM = new T.MeshStandardMaterial({ color: 0x000000, emissive: 0xffffff, emissiveIntensity: 2 });
  const edgeM = new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .55 });
  const add = (parent, geo, mat, p = [0, 0, 0], sc = [1, 1, 1], rot = [0, 0, 0]) => {
    const m = new T.Mesh(geo, mat); m.position.set(...p); m.scale.set(...sc); m.rotation.set(...rot); parent.add(m); return m;
  };
  const hornGeo = (r, h, bend) => {
    const g = new T.ConeGeometry(r, h, 6, 8), pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i), t = (y + h / 2) / h; pos.setZ(i, pos.getZ(i) - t * t * bend); }
    g.computeVertexNormals(); return g;
  };

  /* the kernel orb */
  const orb = new T.Group(); scene.add(orb);
  const shell = new T.Mesh(new T.IcosahedronGeometry(.62, 1), new T.MeshBasicMaterial({ color: 0xffffff, wireframe: true, transparent: true, opacity: .55 }));
  orb.add(shell);
  const inner = add(orb, new T.IcosahedronGeometry(.34, 0), glowM);

  /* the body: armoured segments with glowing edges */
  const N = 42, segGeo = new T.OctahedronGeometry(1, 0), segEdges = new T.EdgesGeometry(segGeo), segs = [];
  for (let i = 0; i < N; i++) {
    const k = 1 - i / N, s = .09 + .2 * Math.pow(k, .7);
    const g = new T.Group();
    add(g, segGeo, metal, [0, 0, 0], [s * 1.25, s, s * 1.5]);
    const e = new T.LineSegments(segEdges, edgeM); e.scale.set(s * 1.26, s * 1.01, s * 1.51); g.add(e);
    if (i % 2 === 0 && i < N - 4) add(g, hornGeo(s * .35, s * 2.2, s * .9), hornM, [0, s * 1.1, 0], [1, 1, 1], [-.6, 0, 0]);   // dorsal spikes
    if (i === N - 1) add(g, new T.ConeGeometry(.07, .4, 6), glowM, [0, 0, -.2], [1, 1, 1], [-Math.PI / 2, 0, 0]);          // tail blade
    scene.add(g); segs.push(g);
  }
  /* the head */
  const head = new T.Group(); scene.add(head);
  const hs = new T.Group(); hs.scale.setScalar(.42); head.add(hs);
  add(hs, new T.IcosahedronGeometry(1, 1), metal, [0, .15, -.1], [.85, .68, 1.05]);
  add(hs, new T.CylinderGeometry(.24, .5, 1.5, 6), metal, [0, 0, .95], [1.1, 1, .6], [Math.PI / 2, 0, 0]);
  const jaw = new T.Group(); jaw.position.set(0, -.22, .3); hs.add(jaw);
  add(jaw, new T.CylinderGeometry(.18, .42, 1.3, 6), metal, [0, -.06, .65], [1.05, 1, .42], [Math.PI / 2, 0, 0]);
  [1, -1].forEach(s => {
    add(hs, new T.BoxGeometry(.5, .12, .36), metal, [s * .36, .5, .62], [1, 1, 1], [.25, s * -.25, s * -.42]);
    add(hs, new T.SphereGeometry(.1, 10, 6), glowM, [s * .38, .36, .78], [1.8, .5, .5], [0, s * -.35, s * -.32]);
    add(hs, hornGeo(.16, 1.6, 1.2), hornM, [s * .4, .62, -.3], [1, 1, 1], [-1.2, 0, s * -.35]);
    add(hs, hornGeo(.09, .8, .45), hornM, [s * .7, .25, -.35], [1, 1, 1], [-1.4, 0, s * -.8]);
  });
  const throat = add(hs, new T.SphereGeometry(.2, 10, 6), glowM, [0, -.18, .85], [1, .5, 1.6]);

  /* soft additive glows */
  const gc = document.createElement("canvas"); gc.width = gc.height = 128;
  const gx = gc.getContext("2d"), gg = gx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gg.addColorStop(0, "rgba(255,255,255,1)"); gg.addColorStop(.25, "rgba(255,255,255,.4)"); gg.addColorStop(1, "rgba(255,255,255,0)");
  gx.fillStyle = gg; gx.fillRect(0, 0, 128, 128);
  const tex = new T.CanvasTexture(gc);
  const sprite = (par, sc, op) => { const sp = new T.Sprite(new T.SpriteMaterial({ map: tex, blending: T.AdditiveBlending, transparent: true, depthWrite: false, opacity: op })); sp.scale.set(sc, sc, 1); sp.userData.op = op; par.add(sp); return sp; };
  const sprites = [sprite(orb, 2.6, .9), sprite(head, .7, .6)];
  sprites[1].position.set(0, .12, .35);

  function size() { const r = canvas.getBoundingClientRect(); renderer.setSize(r.width, r.height, false); camera.aspect = r.width / r.height; camera.updateProjectionMatrix(); }
  size();
  Object.assign(D, { ok: true, T, renderer, scene, camera, orb, shell, inner, segs, head, jaw, throat, core, glowM, hornM, edgeM, sprites, size, tmp: new T.Vector3(), tmp2: new T.Vector3() });
  applyColor();
}
/* the path the daemon swims along: a tilted loop that dips in front of and behind the orb */
function pathAt(u, R, out) {
  return out.set(Math.cos(u) * R, Math.sin(2 * u) * .6 + Math.sin(u * 3) * .14, Math.sin(u) * R * .62);
}
function applyColor() {
  if (!D.ok) return;
  const [r, g, b] = color.map(v => v / 255), P = Math.max(0, Math.min(1.5, power + flash)), open = D.jaw.rotation.x / .6;
  D.glowM.emissive.setRGB(r, g, b); D.glowM.emissiveIntensity = .05 + 1.45 * P;
  D.hornM.emissive.setRGB(r, g, b); D.hornM.emissiveIntensity = .14 * P;
  D.edgeM.color.setRGB(r, g, b); D.edgeM.opacity = .15 + .5 * Math.min(1, P);
  D.shell.material.color.setRGB(r, g, b); D.shell.material.opacity = .15 + .5 * Math.min(1, P);
  D.core.color.setRGB(r, g, b); D.core.intensity = .4 + 3 * P;
  D.sprites.forEach(s => { s.material.color.setRGB(r, g, b); s.material.opacity = s.userData.op * Math.min(1.4, P); });
  D.throat.visible = open > .05;
}
function renderDragon(now) {
  if (!D.ok) return;
  const t = now / 1000, moving = !still.matches, dt = D.lastT ? Math.min(.05, t - D.lastT) : 0; D.lastT = t;
  if (moving) {
    D.u += dt * (D.speed + D.strike * 2.2);
    if (D.strike > 0) D.strike = Math.max(0, D.strike - dt * .9);
    if (D.coil > 0) D.coil = Math.max(0, D.coil - dt * .6);
  } else if (!D.u) D.u = 1.1;
  const R = 1.75 - D.coil * .75 + Math.sin(t * .6) * .05, gap = .085;
  const p = D.tmp, q = D.tmp2;
  D.segs.forEach((s, i) => { pathAt(D.u - (i + 1) * gap, R, p); s.position.copy(p); pathAt(D.u - i * gap, R, q); s.lookAt(q); });
  pathAt(D.u, R, p); D.head.position.copy(p); pathAt(D.u + gap, R, q); D.head.lookAt(q);
  D.jaw.rotation.x += ((moving ? Math.max(D.strike * .6, Math.max(0, Math.sin(t * .9)) ** 16 * .15) : 0) - D.jaw.rotation.x) * .25;
  D.orb.rotation.y = t * .5; D.orb.rotation.x = t * .23;
  D.inner.scale.setScalar(1 + Math.sin(t * 3) * .06 + flash * .5);
  applyColor();
  D.renderer.render(D.scene, D.camera);
}
function screenOf(v3) {
  const r = $("#dragon").getBoundingClientRect();
  if (!D.ok) return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  const v = v3.clone().project(D.camera);
  return { x: r.left + (v.x + 1) / 2 * r.width, y: r.top + (1 - v.y) / 2 * r.height };
}
const orbPos = () => D.ok ? screenOf(new D.T.Vector3(0, 0, 0)) : dragonCenter();
const mouthPos = () => D.ok ? screenOf(D.head.localToWorld(new D.T.Vector3(0, -.05, .7))) : dragonCenter();
function roar(burst = true) {
  if (still.matches) return;
  D.strike = 1;
  if (burst) setTimeout(() => {
    const m = mouthPos();
    for (let i = 0; i < 24; i++) { const a = Math.random() * 6.28, sp = 50 + Math.random() * 150; puffs.push({ x: m.x, y: m.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * .7 - 30, s: 5 + Math.random() * 11, life: 1 + Math.random() * .6, max: 1.6 }); }
  }, 150);
}

/* poke the daemon */
const LINES = ["<b>daemon</b> running · pid 1337", "who dares scan my ports?", "<b>kernel</b> protected. nice try.", "sudo rm -rf /fear", "<b>malupet na hacker</b> ang may-ari nito.", "ethical lang, promise."];
let li = 0, sayT;
function say(html) { const s = $("#dragon-say"); s.innerHTML = html; clearTimeout(sayT); sayT = setTimeout(() => s.innerHTML = "", 2800); }
$("#dragon").addEventListener("click", () => {
  say(LINES[li++ % LINES.length]);
  if (!still.matches) { roar(); flash = .5; } else frame(performance.now());
});

/* =======================================================
   CONTENT
   ======================================================= */
const INTERESTS = ["coding", "programming", "ethical-hacking", "cyber-security", "game-dev", "web-dev", "software-dev", "system-dev", "ui-ux-design", "ai"];
$("#interests").innerHTML = INTERESTS.map((i, n) => `<li style="--i:${n}">${i}/</li>`).join("");
let chase = 0;
setInterval(() => { if (still.matches) return; $$("#interests li").forEach((li, i) => li.classList.toggle("lit", i === chase % INTERESTS.length)); chase++; }, 900);

const PROJECTS = [
  { id: "pixel-dungeon", perm: "drwxr-xr-x  12K  aug 14", desc: "2D roguelike with procedurally generated floors.", tags: ["C#", "Unity"] },
  { id: "campus-board", perm: "drwxr-xr-x  9.6K jul 02", desc: "Responsive site to post and find campus events.", tags: ["HTML", "CSS", "JS"] },
  { id: "port-scan-viz", perm: "drwx------  4.1K jun 21", desc: "Maps open ports on your own lab network.", tags: ["Python", "Networking"] },
  { id: "study-bot", perm: "drwxr-xr-x  3.3K may 30", desc: "Small AI helper that quizzes you from your notes.", tags: ["Python", "AI"] }
];
const proj = p => `<article class="proj"><div class="perm">${p.perm}</div><h3>${p.id}</h3><p>${p.desc}</p><div class="tags">${p.tags.map(t => `<span>${t}</span>`).join("")}<span>sample</span></div></article>`;
$("#work-left").innerHTML = PROJECTS.slice(0, 2).map(proj).join("");
$("#work-right").innerHTML = PROJECTS.slice(2).map(proj).join("");

/* firefly jar */
const JAR = ["one more friend for the dragon.", "bzzz.", "the dragon likes this colour.", "malupet na firefly.", "the dragon has fans now."];
let ji = 0;
$("#jar").addEventListener("click", () => {
  const r = $("#jar").getBoundingClientRect();
  if (bugs.length < (lite.matches ? 16 : 26)) bugs.push(newBug(still.matches ? null : { x: r.left + r.width / 2, y: r.top + 30 }));
  $("#jar-say").textContent = JAR[ji++ % JAR.length] + `  (${bugs.length} flying)`;
  if (still.matches) frame(performance.now());
});

/* =======================================================
   NAVIGATION — the tab dot drops into the dragon and changes its glow
   ======================================================= */
const pages = ["home", "projects", "contact"], main = $("#main");
let current = null, busy = false;
function moveDot(p) {
  const a = $(`.tabs a[data-link="${p}"]`), n = $(".tabs").getBoundingClientRect(), r = a.getBoundingClientRect();
  $$(".tabs a").forEach(x => x === a ? x.setAttribute("aria-current", "page") : x.removeAttribute("aria-current"));
  $("#tab-dot").style.transform = `translateX(${r.left - n.left + r.width / 2 - 3}px)`;
}
function setCSS(c) { document.documentElement.style.setProperty("--lamp", c.join(",")); }
function show(p, enter) {
  $$(".page").forEach(s => s.hidden = s.dataset.page !== p);
  current = p; moveDot(p); scrollTo(0, 0);
  if (enter) {
    const sec = $(`.page[data-page="${p}"]`);
    sec.querySelector(".side.left").classList.add("enter-l"); sec.querySelector(".side.right").classList.add("enter-r");
    setTimeout(() => $$(".enter-l,.enter-r").forEach(e => e.classList.remove("enter-l", "enter-r")), 800);
  }
}
async function travel(to) {
  busy = true;
  const next = GLOW[to];
  main.classList.add("leaving");
  moveDot(to);
  await wait(420);
  /* 1) the dot leaves the tab bar and flies into the kernel orb */
  const d = $("#tab-dot").getBoundingClientRect(), sx = d.left + 3, sy = d.top + 3, tgt = orbPos();
  const drop = document.createElement("div"); drop.className = "drop";
  drop.style.background = `rgb(${next})`; drop.style.boxShadow = `0 0 12px 3px rgba(${next},.8)`;
  document.body.appendChild(drop);
  await new Promise(done => {
    const t0 = performance.now(), T = 700, cx = (sx + tgt.x) / 2 + 60, cy = Math.min(sy, tgt.y) - 60;
    (function f(now) {
      const k = Math.min(1, (now - t0) / T), e = k * k * (3 - 2 * k), p = orbPos();
      const x = (1 - e) ** 2 * sx + 2 * (1 - e) * e * cx + e * e * p.x, y = (1 - e) ** 2 * sy + 2 * (1 - e) * e * cy + e * e * p.y;
      drop.style.transform = `translate(${x}px,${y}px) scale(${1 - e * .4})`;
      if (k < 1) requestAnimationFrame(f); else done();
    })(t0);
  });
  drop.remove();
  /* 2) the orb goes dark, flickers, and blazes back in the new colour; the daemon uncoils and roars */
  power = 0; if (D.ok) D.coil = 1; await wait(160);   // the daemon coils tight around the orb
  color = [...next]; setCSS(next);
  for (const [p, ms] of [[.7, 60], [.05, 90], [.9, 50], [.2, 70]]) { power = p; await wait(ms); }
  power = 1; flash = .7; roar();
  /* 3) the new page slides in from both sides */
  show(to, true);
  main.classList.remove("leaving");
  await wait(300);
  busy = false;
}
function route() {
  const p = pages.includes(location.hash.slice(1)) ? location.hash.slice(1) : "home";
  if (p === current) return;
  if (current === null || still.matches || busy) {
    color = [...GLOW[p]]; setCSS(GLOW[p]); show(p, false);
    if (still.matches) frame(performance.now());
    return;
  }
  travel(p);
}
addEventListener("hashchange", route);

/* copy */
const toast = $("#toast"); let tt;
$$("[data-copy]").forEach(b => b.addEventListener("click", async () => {
  try { await navigator.clipboard.writeText(b.dataset.copy); toast.textContent = "copied"; }
  catch { toast.textContent = "couldn't copy — select the text instead"; }
  toast.hidden = false; clearTimeout(tt); tt = setTimeout(() => toast.hidden = true, 1600);
}));

/* loop */
function frame(now) { drawBg(now); renderDragon(now); }
let lastF = 0;
function loop(now) { if (!document.hidden && now - lastF > (lite.matches ? 40 : 28)) { lastF = now; frame(now); } requestAnimationFrame(loop); }
let rz;
addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { buildBg(); D.size && D.size(); if (current) moveDot(current); frame(performance.now()); }, 150); });

/* phones: the windows fade up as you scroll to them */
const seen = "IntersectionObserver" in window && !still.matches
  ? new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add("seen")), { rootMargin: "0px 0px -8% 0px" })
  : null;
if (seen) $$(".win").forEach(w => seen.observe(w)); else $$(".win").forEach(w => w.classList.add("seen"));

buildBg();
bugs = Array.from({ length: 3 }, () => newBug());
initDragon();
route();
frame(performance.now());
if (!still.matches) requestAnimationFrame(loop);
document.fonts && document.fonts.ready.then(() => current && moveDot(current));
