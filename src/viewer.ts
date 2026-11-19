import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { box, HALF, rotation, type Plank } from './geometry';

export type Viewer = {
  /** Fits the camera to the whole model once, so it does not jump between steps. */
  frame(all: Plank[]): void;
  /** fresh planks drop into place unless animate is false; ghost planks (the rest of the model) are see-through */
  show(old: Plank[], fresh: Plank[], animate?: boolean, ghost?: Plank[]): void;
  /** pixels covered by the interface at the top and bottom: the model is framed in the band between */
  setInsets(top: number, bottom: number): void;
  celebrate(on: boolean): void;
  /** renders now and returns a PNG data URL (thumbnails) */
  snapshot(): string;
  dispose(): void;
};

/** Pine grain, drawn once: light wood with soft darker streaks along the length. */
function woodTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#ecc993';
  g.fillRect(0, 0, c.width, c.height);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 26; i++) {
    const y = rnd() * c.height;
    const amp = 1 + rnd() * 3;
    const freq = 0.004 + rnd() * 0.01;
    g.strokeStyle = `rgba(${150 + rnd() * 30}, ${95 + rnd() * 25}, ${45 + rnd() * 20}, ${0.12 + rnd() * 0.22})`;
    g.lineWidth = 0.6 + rnd() * 1.8;
    g.beginPath();
    for (let x = 0; x <= c.width; x += 8) g.lineTo(x, y + Math.sin(x * freq + i) * amp);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const DROP = 9; // units a fresh plank falls from
const DROP_MS = 520;
const STAGGER_MS = 90;

export function createViewer(canvas: HTMLCanvasElement, { preserve = false } = {}): Viewer {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: preserve });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.5, 2000);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.autoRotateSpeed = 1.6;
  controls.maxPolarAngle = Math.PI / 2 - 0.04; // never look from under the table

  scene.add(new THREE.HemisphereLight('#f4f9ff', '#c9a77a', 1.5));
  const sun = new THREE.DirectionalLight('#fff4e0', 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun, sun.target);

  // no visible floor: the model stands on its own soft shadow, over the page's sky
  const table = new THREE.Mesh(new THREE.CircleGeometry(1, 96), new THREE.ShadowMaterial({ color: '#1d2742', opacity: 0.16 }));
  table.rotation.x = -Math.PI / 2;
  table.receiveShadow = true;
  scene.add(table);

  const geo = new RoundedBoxGeometry(HALF.x * 2, HALF.y * 2, HALF.z * 2, 2, 0.14);
  const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(HALF.x * 2, HALF.y * 2, HALF.z * 2));
  const grain = woodTexture();
  const wood = new THREE.MeshStandardMaterial({ map: grain, roughness: 0.72 });
  // slightly different woods so a wall does not look printed
  const tints = ['#ffffff', '#fbefe0', '#f6e6d2', '#fff7ea'].map((c) => new THREE.Color(c));
  const fresh = new THREE.MeshStandardMaterial({ map: grain, color: '#ff9b82', emissive: '#ff5a36', emissiveIntensity: 0.35, roughness: 0.55 });
  const outline = new THREE.LineBasicMaterial({ color: '#1b1e26', transparent: true, opacity: 0.85 });
  // the rest of the model in the 'finished model' preview: the same wood, paler
  const ghostMat = new THREE.MeshStandardMaterial({ map: grain, color: '#fff6ea', emissive: '#ffffff', emissiveIntensity: 0.18, roughness: 0.85 });

  // one instanced mesh for the placed planks, one for the new ones: two draw calls whatever the model size
  const group = new THREE.Group();
  scene.add(group);
  let oldMesh: THREE.InstancedMesh | null = null;
  let freshMesh: THREE.InstancedMesh | null = null;
  let ghostMesh: THREE.InstancedMesh | null = null;
  let insets = { top: 0, bottom: 0 };
  let lines: THREE.LineSegments[] = [];
  let freshPlanks: Plank[] = [];

  const dummy = new THREE.Object3D();
  function place(target: THREE.InstancedMesh, i: number, p: Plank, lift = 0) {
    dummy.position.set(p.x, p.y + lift, p.z);
    dummy.quaternion.copy(rotation(p));
    dummy.updateMatrix();
    target.setMatrixAt(i, dummy.matrix);
  }
  function instanced(material: THREE.Material, n: number): THREE.InstancedMesh {
    const m = new THREE.InstancedMesh(geo, material, Math.max(n, 1));
    m.count = n;
    m.castShadow = m.receiveShadow = true;
    group.add(m);
    return m;
  }

  type Drop = { i: number; start: number };
  let drops: Drop[] = [];
  let awakeUntil = 0;
  let raf = 0;

  function lift(i: number, l: number) {
    const p = freshPlanks[i];
    place(freshMesh!, i, p, l);
    lines[i].position.set(p.x, p.y + l, p.z);
  }

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // shift the picture so its middle sits in the free band between the top and bottom interface
    camera.setViewOffset(w, h, 0, (insets.bottom - insets.top) / 2, w, h);
    camera.updateProjectionMatrix();
    wake(0);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // render on demand: while dropping, while the user turns the model (damping), or while celebrating.
  // raf stays set for the whole tick, so 'change' events fired by controls.update() never queue a second loop.
  function wake(ms = 1200) {
    awakeUntil = Math.max(awakeUntil, performance.now() + ms);
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick(now: number) {
    if (drops.length) {
      drops = drops.filter((d) => {
        const t = Math.min(1, Math.max(0, (now - d.start) / DROP_MS));
        lift(d.i, DROP * (1 - easeOut(t)));
        return t < 1;
      });
      freshMesh!.instanceMatrix.needsUpdate = true;
    }
    controls.update();
    renderer.render(scene, camera);
    raf = drops.length || controls.autoRotate || now < awakeUntil ? requestAnimationFrame(tick) : 0;
  }
  controls.addEventListener('change', () => wake());
  controls.addEventListener('start', () => wake(60_000));
  controls.addEventListener('end', () => {
    awakeUntil = 0;
    wake();
  });

  return {
    frame(all) {
      const min = new THREE.Vector3(Infinity, Infinity, Infinity);
      const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
      for (const p of all) {
        const b = box(p);
        min.min(new THREE.Vector3(...b.min));
        max.max(new THREE.Vector3(...b.max));
      }
      const center = min.clone().add(max).multiplyScalar(0.5);
      group.position.set(-center.x, 0, -center.z); // model centered on the table
      const radius = max.clone().sub(min).length() / 2;
      const target = new THREE.Vector3(0, center.y * 0.9, 0);
      resize(); // the aspect ratio must be known: on a phone in portrait, the width is what limits
      const vHalf = THREE.MathUtils.degToRad(camera.fov / 2);
      const h = canvas.clientHeight || 1;
      const band = Math.max(0.3, (h - insets.top - insets.bottom) / h); // share of the height left to the model
      const half = Math.min(Math.atan(Math.tan(vHalf) * band), Math.atan(Math.tan(vHalf) * camera.aspect));
      const dist = (radius / Math.sin(half)) * 0.98;
      camera.position.copy(target).add(new THREE.Vector3(0.62, 0.48, 1).normalize().multiplyScalar(dist));
      camera.near = dist / 60;
      camera.far = dist * 12;
      camera.updateProjectionMatrix();
      controls.target.copy(target);
      camera.lookAt(target);
      controls.minDistance = radius * 0.8;
      controls.maxDistance = dist * 2.5;
      table.scale.setScalar(radius * 2.6);
      sun.position.set(radius * 1.2, radius * 3.2, radius * 1.6);
      const s = sun.shadow.camera;
      s.left = s.bottom = -radius * 1.8;
      s.right = s.top = radius * 1.8;
      s.near = 0.5;
      s.far = radius * 10;
      s.updateProjectionMatrix();
      resize();
    },
    setInsets(top, bottom) {
      insets = { top, bottom };
      resize();
    },
    show(old, newPlanks, animate = true, ghost = []) {
      oldMesh?.dispose();
      freshMesh?.dispose();
      ghostMesh?.dispose();
      group.clear();
      ghostMesh = instanced(ghostMat, ghost.length);
      ghost.forEach((p, i) => place(ghostMesh!, i, p));
      oldMesh = instanced(wood, old.length);
      old.forEach((p, i) => {
        place(oldMesh!, i, p);
        oldMesh!.setColorAt(i, tints[i % tints.length]);
      });
      freshPlanks = newPlanks;
      freshMesh = instanced(fresh, newPlanks.length);
      lines = newPlanks.map((p) => {
        const l = new THREE.LineSegments(edges, outline);
        l.quaternion.copy(rotation(p));
        group.add(l);
        return l;
      });
      const now = performance.now();
      drops = animate ? newPlanks.map((_, i) => ({ i, start: now + i * STAGGER_MS })) : [];
      newPlanks.forEach((_, i) => lift(i, animate ? DROP : 0));
      wake(0);
    },
    celebrate(on) {
      controls.autoRotate = on;
      wake(0);
    },
    snapshot() {
      controls.update();
      renderer.render(scene, camera);
      return canvas.toDataURL('image/png');
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      for (const d of [geo, edges, table.geometry]) d.dispose();
      oldMesh?.dispose();
      freshMesh?.dispose();
      ghostMesh?.dispose();
      for (const m of [wood, fresh, outline, ghostMat, table.material]) m.dispose();
      grain.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
