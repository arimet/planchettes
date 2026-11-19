import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { box, HALF, rotation, type Plank } from './geometry';

export type Viewer = {
  /** Fits the camera to the whole model once, so it does not jump between steps. */
  frame(all: Plank[]): void;
  /** fresh planks drop into place unless animate is false */
  show(old: Plank[], fresh: Plank[], animate?: boolean): void;
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

  const geo = new RoundedBoxGeometry(HALF.x * 2, HALF.y * 2, HALF.z * 2, 3, 0.14);
  const edges = new THREE.EdgesGeometry(new THREE.BoxGeometry(HALF.x * 2, HALF.y * 2, HALF.z * 2));
  const grain = woodTexture();
  // four slightly different woods so a wall does not look printed
  const woods = ['#ffffff', '#fbefe0', '#f6e6d2', '#fff7ea'].map((tint) => new THREE.MeshStandardMaterial({ map: grain, color: tint, roughness: 0.72 }));
  const fresh = new THREE.MeshStandardMaterial({ map: grain, color: '#ffa860', emissive: '#ff6a00', emissiveIntensity: 0.38, roughness: 0.55 });
  const outline = new THREE.LineBasicMaterial({ color: '#ff7a1a', transparent: true, opacity: 0.9 });

  const group = new THREE.Group();
  scene.add(group);

  type Drop = { obj: THREE.Object3D; y: number; start: number };
  let drops: Drop[] = [];
  let awakeUntil = 0;
  let raf = 0;

  function plankObject(p: Plank, i: number, isFresh: boolean): THREE.Object3D {
    const o = new THREE.Group();
    const mesh = new THREE.Mesh(geo, isFresh ? fresh : woods[i % woods.length]);
    mesh.castShadow = mesh.receiveShadow = true;
    o.add(mesh);
    if (isFresh) o.add(new THREE.LineSegments(edges, outline));
    o.position.set(p.x, p.y, p.z);
    o.quaternion.copy(rotation(p));
    return o;
  }

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    wake(0);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  // render on demand: while dropping, while the user turns the model (damping), or while celebrating
  function wake(ms = 1200) {
    awakeUntil = Math.max(awakeUntil, performance.now() + ms);
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick(now: number) {
    raf = 0;
    drops = drops.filter((d) => {
      const t = Math.min(1, Math.max(0, (now - d.start) / DROP_MS));
      d.obj.position.y = d.y + DROP * (1 - easeOut(t));
      return t < 1;
    });
    controls.update();
    renderer.render(scene, camera);
    if (drops.length || controls.autoRotate || now < awakeUntil) raf = requestAnimationFrame(tick);
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
      const dist = (radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 0.98;
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
    show(old, freshPlanks, animate = true) {
      group.clear();
      drops = [];
      old.forEach((p, i) => group.add(plankObject(p, i, false)));
      const now = performance.now();
      freshPlanks.forEach((p, i) => {
        const obj = plankObject(p, i, true);
        group.add(obj);
        if (animate) {
          obj.position.y = p.y + DROP;
          drops.push({ obj, y: p.y, start: now + i * STAGGER_MS });
        }
      });
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
      for (const m of [...woods, fresh, outline, table.material]) m.dispose();
      grain.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}
