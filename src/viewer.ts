import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { box, size, type Plank } from './geometry';

const WOOD = '#e8c896';
const FRESH = '#ff8a2a';

export type Viewer = {
  /** Fits the camera to the whole model once, so it does not jump between steps. */
  frame(all: Plank[]): void;
  show(old: Plank[], fresh: Plank[]): void;
  dispose(): void;
};

export function createViewer(canvas: HTMLCanvasElement): Viewer {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(35, 1, 0.5, 2000);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false;
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI / 2 - 0.05; // never look from under the floor

  scene.add(new THREE.HemisphereLight('#fff8ee', '#b89b78', 1.6));
  const sun = new THREE.DirectionalLight('#ffffff', 2.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0005;
  scene.add(sun, sun.target);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshStandardMaterial({ color: '#efe3cf', roughness: 1 }));
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  scene.add(floor);

  const unit = new THREE.BoxGeometry(1, 1, 1);
  const edges = new THREE.EdgesGeometry(unit);
  const mats = {
    old: new THREE.MeshStandardMaterial({ color: WOOD, roughness: 0.75 }),
    fresh: new THREE.MeshStandardMaterial({ color: FRESH, roughness: 0.6 }),
  };
  const lineMats = {
    old: new THREE.LineBasicMaterial({ color: '#a07c4e' }),
    fresh: new THREE.LineBasicMaterial({ color: '#b3540d' }),
  };
  const group = new THREE.Group();
  scene.add(group);

  function plankMesh(p: Plank, kind: 'old' | 'fresh'): THREE.Object3D {
    const [sx, sy, sz] = size(p.o);
    const g = new THREE.Group();
    const mesh = new THREE.Mesh(unit, mats[kind]);
    mesh.castShadow = mesh.receiveShadow = true;
    g.add(mesh, new THREE.LineSegments(edges, lineMats[kind]));
    g.scale.set(sx, sy, sz);
    g.position.set(p.x, p.y, p.z);
    return g;
  }

  function resize() {
    const { clientWidth: w, clientHeight: h } = canvas;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  let raf = 0;
  const loop = () => {
    controls.update();
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  };
  loop();

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
      group.position.set(-center.x, 0, -center.z); // model centered on the floor
      const radius = max.clone().sub(min).length() / 2;
      const target = new THREE.Vector3(0, center.y, 0);
      const dist = (radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2))) * 1.05;
      camera.position.copy(target).add(new THREE.Vector3(0.55, 0.5, 1).normalize().multiplyScalar(dist));
      camera.near = dist / 50;
      camera.far = dist * 10;
      camera.updateProjectionMatrix();
      controls.target.copy(target);
      controls.minDistance = radius;
      controls.maxDistance = dist * 3;
      floor.scale.setScalar(radius * 3);
      sun.position.set(radius * 1.5, radius * 3, radius * 2);
      const s = sun.shadow.camera;
      s.left = s.bottom = -radius * 2;
      s.right = s.top = radius * 2;
      s.far = radius * 10;
      s.updateProjectionMatrix();
      resize();
    },
    show(old, fresh) {
      group.clear();
      for (const p of old) group.add(plankMesh(p, 'old'));
      for (const p of fresh) group.add(plankMesh(p, 'fresh'));
    },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      unit.dispose();
      edges.dispose();
      renderer.dispose();
    },
  };
}
