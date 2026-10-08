/* ============================================================
   THE RECORD — a real 12" vinyl, rendered in WebGL.

   Grooves are generated procedurally into a colour / roughness /
   normal triplet, so the light sweeps across the lacquer the way it
   does on a record under the booth lamps. The centre label carries
   the actual Middle Room wordmark.
   ============================================================ */
import {
  Scene, PerspectiveCamera, WebGLRenderer, Group, Mesh,
  CylinderGeometry, MeshPhysicalMaterial, CanvasTexture,
  DirectionalLight, AmbientLight, PointLight, Color,
  ACESFilmicToneMapping, SRGBColorSpace, LinearSRGBColorSpace,
  MathUtils,
} from 'three';

const TEX = 1024;
const R_OUT = 0.5;        // normalised outer radius on the texture
const R_LABEL = 0.168;
const R_HOLE = 0.0135;
const R_GROOVE_IN = 0.20; // grooves run from here out to the run-out
const R_GROOVE_OUT = 0.475;

function canvas2d(size) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d', { willReadFrequently: true })];
}

/* ---------- face colour: lacquer, grooves, label, spindle hole ---------- */
function buildColour(logo) {
  const [c, x] = canvas2d(TEX);
  const C = TEX / 2;

  x.fillStyle = '#07070a';
  x.fillRect(0, 0, TEX, TEX);

  // the pressed area: a touch warmer than the dead-wax
  const base = x.createRadialGradient(C, C, TEX * 0.12, C, C, TEX * R_OUT);
  base.addColorStop(0, '#121216');
  base.addColorStop(0.55, '#0d0d11');
  base.addColorStop(1, '#09090c');
  x.fillStyle = base;
  x.beginPath(); x.arc(C, C, TEX * R_OUT, 0, 7); x.fill();

  // groove bands — subtle, the sheen does the real work
  x.lineWidth = 1;
  for (let r = R_GROOVE_IN; r < R_GROOVE_OUT; r += 0.00075) {
    const t = (r - R_GROOVE_IN) / (R_GROOVE_OUT - R_GROOVE_IN);
    const band = 0.5 + 0.5 * Math.sin(t * 46);          // track gaps
    x.strokeStyle = `rgba(255,255,255,${0.012 + band * 0.016})`;
    x.beginPath(); x.arc(C, C, TEX * r, 0, 7); x.stroke();
  }

  // run-out groove
  x.strokeStyle = 'rgba(255,255,255,.10)';
  x.lineWidth = 2;
  x.beginPath(); x.arc(C, C, TEX * (R_GROOVE_IN - 0.012), 0, 7); x.stroke();

  // ---- centre label ----
  const lab = x.createRadialGradient(C, C * 0.84, 4, C, C, TEX * R_LABEL);
  lab.addColorStop(0, '#E03A32');
  lab.addColorStop(0.72, '#CE2026');
  lab.addColorStop(1, '#9E161B');
  x.fillStyle = lab;
  x.beginPath(); x.arc(C, C, TEX * R_LABEL, 0, 7); x.fill();

  x.strokeStyle = 'rgba(0,0,0,.33)'; x.lineWidth = 3;
  x.beginPath(); x.arc(C, C, TEX * R_LABEL, 0, 7); x.stroke();

  // wordmark, knocked out in paper white
  if (logo) {
    const w = TEX * 0.175;
    const h = w * (logo.height / logo.width);
    const [lc, lx] = canvas2d(TEX);
    lx.drawImage(logo, 0, 0, w, h);
    lx.globalCompositeOperation = 'source-in';
    lx.fillStyle = '#F4EDE3';
    lx.fillRect(0, 0, TEX, TEX);
    x.drawImage(lc, 0, 0, w, h, C - w / 2, C - h / 2 - TEX * 0.012, w, h);
  }

  // hairline rings on the label + the spindle hole
  x.strokeStyle = 'rgba(0,0,0,.22)'; x.lineWidth = 1.5;
  x.beginPath(); x.arc(C, C, TEX * (R_LABEL - 0.016), 0, 7); x.stroke();
  x.fillStyle = '#05050a';
  x.beginPath(); x.arc(C, C, TEX * R_HOLE, 0, 7); x.fill();

  const t = new CanvasTexture(c);
  t.colorSpace = SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/* ---------- roughness: grooves are matte, the land between is glossy ---------- */
function buildRough() {
  const [c, x] = canvas2d(TEX);
  const C = TEX / 2;
  x.fillStyle = '#4a4a4a'; x.fillRect(0, 0, TEX, TEX);
  x.fillStyle = '#2a2a2a';
  x.beginPath(); x.arc(C, C, TEX * R_OUT, 0, 7); x.fill();
  x.lineWidth = 1;
  for (let r = R_GROOVE_IN; r < R_GROOVE_OUT; r += 0.00075) {
    const v = 46 + Math.round(26 * (0.5 + 0.5 * Math.sin(r * 2600)));
    x.strokeStyle = `rgb(${v},${v},${v})`;
    x.beginPath(); x.arc(C, C, TEX * r, 0, 7); x.stroke();
  }
  // the paper label is matte
  x.fillStyle = '#b4b4b4';
  x.beginPath(); x.arc(C, C, TEX * R_LABEL, 0, 7); x.fill();
  const t = new CanvasTexture(c);
  t.colorSpace = LinearSRGBColorSpace;
  return t;
}

/* ---------- normals: a radial ripple, computed analytically ---------- */
function buildNormal() {
  const N = 512;
  const [c, x] = canvas2d(N);
  const img = x.createImageData(N, N);
  const d = img.data;
  const C = N / 2;
  const freq = 150;      // groove pitch across the face
  const amp = 0.85;
  for (let y = 0; y < N; y++) {
    for (let xx = 0; xx < N; xx++) {
      const dx = (xx - C) / N, dy = (y - C) / N;
      const r = Math.hypot(dx, dy);
      let nx = 0, ny = 0;
      if (r > R_GROOVE_IN && r < R_GROOVE_OUT && r > 1e-6) {
        const slope = Math.cos(r * freq * Math.PI * 2) * amp;
        nx = -slope * (dx / r);
        ny = -slope * (dy / r);
      }
      const len = Math.hypot(nx, ny, 1);
      const i = (y * N + xx) * 4;
      d[i]     = ((nx / len) * 0.5 + 0.5) * 255;
      d[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      d[i + 2] = ((1 / len) * 0.5 + 0.5) * 255;
      d[i + 3] = 255;
    }
  }
  x.putImageData(img, 0, 0);
  const t = new CanvasTexture(c);
  t.colorSpace = LinearSRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function loadLogo(src) {
  return new Promise(res => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = () => res(null);
    i.src = src;
  });
}

export async function createRecord({ canvas, logoSrc, reduced }) {
  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    return null;                       // no WebGL — the page simply goes without it
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.14;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const camera = new PerspectiveCamera(34, 1, 0.1, 100);
  camera.position.set(0, 0, 4.3);

  const logo = await loadLogo(logoSrc);

  const face = new MeshPhysicalMaterial({
    map: buildColour(logo),
    roughnessMap: buildRough(),
    normalMap: buildNormal(),
    roughness: 1, metalness: 0.08,
    clearcoat: 1, clearcoatRoughness: 0.04,
    reflectivity: 0.6,
  });
  face.normalScale.set(0.62, 0.62);

  const edge = new MeshPhysicalMaterial({
    color: new Color('#0b0b0f'), roughness: 0.55, metalness: 0.05, clearcoat: 0.6,
  });

  // CylinderGeometry groups are [side, top, bottom]
  const disc = new Mesh(new CylinderGeometry(1, 1, 0.016, 160, 1, false), [edge, face, face]);
  disc.rotation.x = Math.PI;           // put the labelled face up

  const pivot = new Group();           // spins on the record's own axis
  pivot.add(disc);

  const group = new Group();           // tilt / position, driven by scroll
  group.add(pivot);
  group.rotation.x = -Math.PI / 2;     // face toward the camera
  scene.add(group);

  // booth lighting: warm key, red rim, barely any fill
  const key = new DirectionalLight(new Color('#FFE0B4'), 4.1);
  key.position.set(-2.4, 3.0, 2.6); scene.add(key);
  const rim = new DirectionalLight(new Color('#FF2E25'), 2.8);
  rim.position.set(3.0, -1.4, -1.8); scene.add(rim);
  const side = new DirectionalLight(new Color('#FFBB6B'), 1.7);
  side.position.set(3.2, 1.0, 1.4); scene.add(side);
  // a low fill so the grooves still read on the lower half of the disc
  const low = new DirectionalLight(new Color('#C98B4B'), 1.5);
  low.position.set(-2.0, -2.6, 2.2); scene.add(low);
  // faint cool bounce so the rim always draws an edge
  const bounce = new DirectionalLight(new Color('#8EA0B4'), 0.75);
  bounce.position.set(0.4, -1.2, -2.6); scene.add(bounce);
  scene.add(new AmbientLight(new Color('#3A2622'), 2.4));
  const glow = new PointLight(new Color('#FF7A4D'), 2.4, 6, 2);
  glow.position.set(0, 0, 1.4); scene.add(glow);

  const state = {
    tilt: 0.30,      // radians away from face-on
    roll: 0,
    spin: 0,
    x: 0, y: 0, z: 0,
    scale: 1,
    opacity: 1,
    speed: 1,
  };
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  if (!reduced) {
    window.addEventListener('pointermove', e => {
      pointer.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  let raf = 0, last = performance.now(), running = false;

  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    if (state.opacity <= 0.001) {          // offscreen — stop doing work
      if (running) { canvas.style.visibility = 'hidden'; running = false; }
      return;
    }
    if (!running) { canvas.style.visibility = 'visible'; running = true; }

    if (!reduced) {
      // 33 1/3 rpm, slowed to roughly a third so it reads on screen
      state.spin += dt * 1.16 * state.speed;
      pointer.x = MathUtils.lerp(pointer.x, pointer.tx, 1 - Math.pow(0.0015, dt));
      pointer.y = MathUtils.lerp(pointer.y, pointer.ty, 1 - Math.pow(0.0015, dt));
    }

    pivot.rotation.y = state.spin;
    group.rotation.x = -Math.PI / 2 + state.tilt + pointer.y * 0.10;
    group.rotation.z = state.roll + pointer.x * 0.12;
    group.position.set(state.x, state.y, state.z);
    group.scale.setScalar(state.scale);
    canvas.style.opacity = state.opacity;

    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  return {
    state,
    resize,
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      renderer.dispose();
    },
  };
}
