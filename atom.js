// Tino Science — 3D atom for the homepage hero.
// Self-contained Three.js snippet. Three.js (~650 KB) is fetched from a CDN
// only when this file runs, which script.js limits to larger screens.
//
// To use a .glb model instead (for example one made with Kimi 3D), see README.md.

const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js';

const GOLD = 0xc9a227;       // matches --accent in style.css
const NAVY_LIGHT = 0x3a4f80; // lighter navy so the nucleus reads against the dark hero
const RING = 0xdfe6f5;

export async function mountAtom(container) {
  const THREE = await import(THREE_URL);

  // --- Renderer, scene, camera -------------------------------------------
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0); // transparent background
  container.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(0, 0.4, 8);
  camera.lookAt(0, 0, 0);

  scene.add(new THREE.AmbientLight(0xffffff, 0.6));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.8);
  keyLight.position.set(4, 6, 5);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(GOLD, 1.2);
  rimLight.position.set(-5, -3, -4);
  scene.add(rimLight);

  const atom = new THREE.Group();
  scene.add(atom);

  // --- Nucleus: a cluster of gold "protons" and navy "neutrons" -----------
  const goldMat = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.5, roughness: 0.3 });
  const navyMat = new THREE.MeshStandardMaterial({ color: NAVY_LIGHT, metalness: 0.3, roughness: 0.5 });
  const nucleonGeo = new THREE.SphereGeometry(0.36, 32, 32);
  const nucleus = new THREE.Group();
  const spots = [
    [0, 0, 0], [0.42, 0.12, 0.16], [-0.36, 0.28, -0.12], [0.1, -0.42, 0.22],
    [-0.16, -0.22, -0.42], [0.26, 0.36, -0.32], [-0.42, -0.1, 0.32],
    [0.06, 0.16, 0.46], [-0.1, 0.46, 0.12], [0.36, -0.3, -0.2],
  ];
  spots.forEach((p, i) => {
    const m = new THREE.Mesh(nucleonGeo, i % 2 ? navyMat : goldMat);
    m.position.set(p[0], p[1], p[2]);
    nucleus.add(m);
  });
  atom.add(nucleus);

  // --- Orbits: three tilted rings, each carrying one electron -------------
  const ORBIT_RADIUS = 2.4;
  const ringGeo = new THREE.TorusGeometry(ORBIT_RADIUS, 0.028, 12, 180);
  const ringMat = new THREE.MeshStandardMaterial({
    color: RING, metalness: 0.1, roughness: 0.7, transparent: true, opacity: 0.8,
  });
  const electronGeo = new THREE.SphereGeometry(0.15, 24, 24);
  const electronMat = new THREE.MeshStandardMaterial({
    color: GOLD, emissive: GOLD, emissiveIntensity: 0.55, metalness: 0.4, roughness: 0.3,
  });
  const electrons = [];
  [0, Math.PI / 3, -Math.PI / 3].forEach((tilt, i) => {
    const orbit = new THREE.Group();
    // Lay the ring nearly flat, then spin it around the viewing axis.
    orbit.rotation.set(Math.PI / 2 * 0.82, 0, tilt, 'ZXY');
    orbit.add(new THREE.Mesh(ringGeo, ringMat));
    const electron = new THREE.Mesh(electronGeo, electronMat);
    orbit.add(electron);
    electrons.push({ mesh: electron, speed: 0.9 + i * 0.25, phase: i * 2.1 });
    atom.add(orbit);
  });

  // --- Sizing -------------------------------------------------------------
  function resize() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || w;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  new ResizeObserver(resize).observe(container);

  // --- Drag to spin -------------------------------------------------------
  const el = renderer.domElement;
  let dragging = false;
  let lastX = 0;
  let lastY = 0;
  let velX = 0; // leftover spin after releasing the drag
  let velY = 0;
  el.addEventListener('pointerdown', (e) => {
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    el.setPointerCapture(e.pointerId);
  });
  el.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    atom.rotation.y += dx * 0.01;
    atom.rotation.x += dy * 0.01;
    velX = dx * 0.6;
    velY = dy * 0.6;
  });
  const endDrag = () => { dragging = false; };
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);

  // --- Animation loop (pauses when off-screen or the tab is hidden) -------
  const AUTO_SPIN = 0.25; // radians per second
  const clock = new THREE.Clock();
  let running = false;
  let inView = true;

  function frame() {
    if (!running) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (!dragging) {
      atom.rotation.y += (AUTO_SPIN + velX) * dt;
      atom.rotation.x += velY * dt;
      velX *= 0.95;
      velY *= 0.95;
    }
    nucleus.rotation.y -= dt * 0.4;
    nucleus.rotation.x += dt * 0.2;
    electrons.forEach((e) => {
      const a = t * e.speed + e.phase;
      e.mesh.position.set(ORBIT_RADIUS * Math.cos(a), ORBIT_RADIUS * Math.sin(a), 0);
    });

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  function start() {
    if (running) return;
    running = true;
    clock.getDelta();
    requestAnimationFrame(frame);
  }
  function stop() { running = false; }

  new IntersectionObserver(([entry]) => {
    inView = entry.isIntersecting;
    if (inView && !document.hidden) start(); else stop();
  }, { threshold: 0.05 }).observe(container);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden || !inView) stop(); else start();
  });
  start();
}
