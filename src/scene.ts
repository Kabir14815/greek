import * as THREE from 'three';

const GOLD = 0xd4af37;
const MARBLE_WARM = 0xe8e4dc;

function createSoftParticleTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, 'rgba(255,255,255,0.9)');
  gradient.addColorStop(0.3, 'rgba(255,255,255,0.4)');
  gradient.addColorStop(0.6, 'rgba(255,255,255,0.1)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(canvas);
  return tex;
}

export function initScene(canvas: HTMLCanvasElement) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.1, 1000);

  // Camera path: entering forward through the monument — stay at eye level, move in Z
  // No "looking down" — we walk INTO the space, view stays horizontal
  const camExterior = { x: 0, y: 1.7, z: 10 };       // Outside, approaching
  const camThreshold = { x: 0, y: 1.7, z: 0 };       // At the entrance
  const camInterior = { x: 0, y: 1.5, z: -16 };      // Inside naos
  const camUnderground = { x: 0, y: 1.2, z: -24 };   // Inner sanctum (forward, not down)
  const lookExterior = { x: 0, y: 1.2, z: -6 };
  const lookThreshold = { x: 0, y: 1.2, z: -12 };
  const lookInterior = { x: 0, y: 1.2, z: -22 };
  const lookUnderground = { x: 0, y: 1.0, z: -30 };  // Look forward, level

  camera.position.set(camExterior.x, camExterior.y, camExterior.z);
  camera.lookAt(lookExterior.x, lookExterior.y, lookExterior.z);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const ambient = new THREE.AmbientLight(0x404050, 0.4);
  scene.add(ambient);
  const sunLight = new THREE.DirectionalLight(0xfff5e6, 1.2);
  sunLight.position.set(5, 10, 5);
  scene.add(sunLight);
  const fillLight = new THREE.DirectionalLight(0xe8dcc8, 0.3);
  fillLight.position.set(-5, 5, -5);
  scene.add(fillLight);
  const rimLight = new THREE.DirectionalLight(0xd4af37, 0.2);
  rimLight.position.set(0, 5, -10);
  scene.add(rimLight);

  // Interior / inner sanctum lights (consolidated)
  const interiorLight1 = new THREE.PointLight(0xffe4a0, 2.5, 50);
  interiorLight1.position.set(-4, 3, -22);
  scene.add(interiorLight1);
  const interiorLight2 = new THREE.PointLight(0xffe4a0, 2.5, 50);
  interiorLight2.position.set(4, 3, -22);
  scene.add(interiorLight2);
  const interiorCenter = new THREE.PointLight(0xffd700, 3, 45);
  interiorCenter.position.set(0, 2, -24);
  scene.add(interiorCenter);

  const marbleMaterial = new THREE.MeshStandardMaterial({
    color: MARBLE_WARM,
    roughness: 0.3,
    metalness: 0.1,
  });
  const statueMaterial = new THREE.MeshStandardMaterial({
    color: MARBLE_WARM,
    roughness: 0.25,
    metalness: 0.08,
  });

  // —— EXTERIOR: Parthenon temple ——
  const parthenon = createParthenonTemple(marbleMaterial);
  parthenon.position.set(0, 0, -16);
  parthenon.scale.set(0.5, 0.5, 0.5);
  scene.add(parthenon);

  const statueLeft = createGreekStatue(statueMaterial);
  statueLeft.position.set(-9, 0, -12);
  statueLeft.scale.set(0.6, 0.6, 0.6);
  statueLeft.rotation.y = 0.15;
  scene.add(statueLeft);

  const statueRight = createGreekStatue(statueMaterial);
  statueRight.position.set(9, 0, -12);
  statueRight.scale.set(0.6, 0.6, 0.6);
  statueRight.rotation.y = -0.15;
  scene.add(statueRight);

  const centerStatue = createGreekBust(statueMaterial);
  centerStatue.position.set(0, 1.2, -14.2);
  scene.add(centerStatue);

  const tholos = createTholos(marbleMaterial);
  tholos.position.set(-7, 0, -8);
  tholos.scale.set(0.4, 0.4, 0.4);
  tholos.rotation.y = 0.2;
  scene.add(tholos);

  const tholosRight = createTholos(marbleMaterial);
  tholosRight.position.set(7, 0, -8);
  tholosRight.scale.set(0.4, 0.4, 0.4);
  tholosRight.rotation.y = -0.2;
  scene.add(tholosRight);

  const stoa = createStoa(marbleMaterial);
  stoa.position.set(0, -0.3, -22);
  stoa.scale.set(0.45, 0.45, 0.45);
  scene.add(stoa);

  // —— INTERIOR: Greek monument courtyard with stones & waterfalls ——
  const interiorGroup = createInteriorMonument();
  interiorGroup.position.set(0, 0, -16);
  interiorGroup.scale.set(0.5, 0.5, 0.5);
  scene.add(interiorGroup);

  // —— INNER SANCTUM: Rear chamber (forward in Z, not below) ——
  const undergroundGroup = createUndergroundChamber(statueMaterial, marbleMaterial);
  undergroundGroup.position.set(0, 0, -22);
  undergroundGroup.scale.set(0.5, 0.5, 0.5);
  scene.add(undergroundGroup);

  const { waterfallParticles, waterfall2, waterfall3, dustParticles } = interiorGroup.userData as {
    waterfallParticles: THREE.Points;
    waterfall2: THREE.Points;
    waterfall3: THREE.Points;
    dustParticles: THREE.Points;
  };
  const { undergroundWaterfall, undergroundDust } = undergroundGroup.userData as {
    undergroundWaterfall: THREE.Points;
    undergroundDust: THREE.Points;
  };

  // Golden particles (exterior - reduced for performance)
  const particlesCount = 500;
  const particlesGeometry = new THREE.BufferGeometry();
  const particlesPositions = new Float32Array(particlesCount * 3);
  for (let i = 0; i < particlesCount; i++) {
    particlesPositions[i * 3] = (Math.random() - 0.5) * 45;
    particlesPositions[i * 3 + 1] = (Math.random() - 0.3) * 28;
    particlesPositions[i * 3 + 2] = (Math.random() - 0.5) * 35 - 10;
  }
  particlesGeometry.setAttribute('position', new THREE.BufferAttribute(particlesPositions, 3));
  const softTex = createSoftParticleTexture();
  const particles = new THREE.Points(
    particlesGeometry,
    new THREE.PointsMaterial({
      color: GOLD,
      size: 0.12,
      transparent: true,
      opacity: 0.65,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      map: softTex,
      depthWrite: false,
    })
  );
  scene.add(particles);

  const orbsCount = 40;
  const orbsGeometry = new THREE.BufferGeometry();
  const orbsPositions = new Float32Array(orbsCount * 3);
  for (let i = 0; i < orbsCount; i++) {
    orbsPositions[i * 3] = (Math.random() - 0.5) * 30;
    orbsPositions[i * 3 + 1] = (Math.random() - 0.2) * 18;
    orbsPositions[i * 3 + 2] = (Math.random() - 0.5) * 25 - 8;
  }
  orbsGeometry.setAttribute('position', new THREE.BufferAttribute(orbsPositions, 3));
  const orbs = new THREE.Points(
    orbsGeometry,
    new THREE.PointsMaterial({
      color: 0xffd700,
      size: 0.28,
      transparent: true,
      opacity: 0.45,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      map: softTex.clone(),
      depthWrite: false,
    })
  );
  scene.add(orbs);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({ color: 0x0d0d12, roughness: 1, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2;
  scene.add(ground);

  scene.fog = new THREE.FogExp2(0x0a0a12, 0.03);

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  let time = 0;
  const clock = new THREE.Clock();
  let mouseX = 0;
  let mouseY = 0;
  let targetX = 0;
  let targetY = 0;
  let scrollProgress = 0; // 0 = exterior, 0.5 = interior, 1 = underground

  document.addEventListener('mousemove', (e) => {
    targetX = (e.clientX / window.innerWidth - 0.5) * 0.5;
    targetY = (e.clientY / window.innerHeight - 0.5) * 0.3;
  });

  function setScrollProgress(p: number) {
    scrollProgress = Math.max(0, Math.min(1, p));
  }

  function animate() {
    requestAnimationFrame(animate);
    const delta = clock.getDelta();
    time += delta;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

    const t = easeInOut(scrollProgress);
    const mouseInfluence = 1 - t * 0.9;

    mouseX += (targetX - mouseX) * 0.02;
    mouseY += (targetY - mouseY) * 0.02;

    // 4-stage path: approach (0→0.25) → pass through entrance (0.25→0.5) → inside (0.5) → descend (0.5→1)
    const tApproach = Math.min(1, t * 4);           // 0→0.25: walk toward entrance
    const tEnter = Math.max(0, Math.min(1, (t - 0.25) * 4));  // 0.25→0.5: step through
    const tDescend = Math.max(0, (t - 0.5) * 2);   // 0.5→1: go underground

    let camX: number, camY: number, camZ: number;
    let lookX: number, lookY: number, lookZ: number;

    if (t < 0.25) {
      // Approaching the monument - forward walk
      camX = lerp(camExterior.x + mouseX * mouseInfluence, camThreshold.x, tApproach);
      camY = lerp(camExterior.y + mouseY * mouseInfluence, camThreshold.y, tApproach);
      camZ = lerp(camExterior.z, camThreshold.z, tApproach);
      lookX = lerp(lookExterior.x + mouseX * 0.3 * mouseInfluence, lookThreshold.x, tApproach);
      lookY = lerp(lookExterior.y + mouseY * 0.2 * mouseInfluence, lookThreshold.y, tApproach);
      lookZ = lerp(lookExterior.z, lookThreshold.z, tApproach);
    } else if (t < 0.5) {
      // Passing through columns into the interior
      camX = lerp(camThreshold.x, camInterior.x, tEnter);
      camY = lerp(camThreshold.y, camInterior.y, tEnter);
      camZ = lerp(camThreshold.z, camInterior.z, tEnter);
      lookX = lerp(lookThreshold.x, lookInterior.x, tEnter);
      lookY = lerp(lookThreshold.y, lookInterior.y, tEnter);
      lookZ = lerp(lookThreshold.z, lookInterior.z, tEnter);
    } else {
      // Descending to underground
      camX = lerp(camInterior.x, camUnderground.x, tDescend);
      camY = lerp(camInterior.y, camUnderground.y, tDescend);
      camZ = lerp(camInterior.z, camUnderground.z, tDescend);
      lookX = lerp(lookInterior.x, lookUnderground.x, tDescend);
      lookY = lerp(lookInterior.y, lookUnderground.y, tDescend);
      lookZ = lerp(lookInterior.z, lookUnderground.z, tDescend);
    }

    camera.position.set(camX, camY, camZ);
    camera.lookAt(lookX, lookY, lookZ);

    parthenon.position.y = Math.sin(time * 0.2) * 0.01;
    stoa.position.y = -0.3 + Math.sin(time * 0.25 + 0.5) * 0.01;
    tholos.position.y = Math.sin(time * 0.18) * 0.012;
    tholosRight.position.y = Math.sin(time * 0.18 + 1) * 0.012;

    undergroundGroup.position.y = Math.sin(time * 0.15) * 0.01;

    statueLeft.rotation.y = 0.1 + Math.sin(time * 0.15) * 0.02;
    statueLeft.position.y = Math.sin(time * 0.2) * 0.015;
    statueRight.rotation.y = -0.1 + Math.sin(time * 0.15 + 1) * 0.02;
    statueRight.position.y = Math.sin(time * 0.2 + 0.5) * 0.015;
    centerStatue.rotation.y = Math.sin(time * 0.12) * 0.03;
    centerStatue.position.y = 1.5 + Math.sin(time * 0.25) * 0.02;

    particlesMaterial.opacity = 0.7 * (1 - t * 0.9);
    orbsMaterial.opacity = 0.4 * (1 - t * 0.9);

    const posAttr = particlesGeometry.attributes.position;
    for (let i = 0; i < particlesCount; i++) {
      (posAttr.array as Float32Array)[i * 3 + 1] += Math.sin(time + i * 0.1) * 0.002;
      (posAttr.array as Float32Array)[i * 3] += Math.cos(time * 0.5 + i * 0.05) * 0.001;
      if ((posAttr.array as Float32Array)[i * 3 + 1] > 12) (posAttr.array as Float32Array)[i * 3 + 1] = -10;
      if ((posAttr.array as Float32Array)[i * 3 + 1] < -10) (posAttr.array as Float32Array)[i * 3 + 1] = 12;
    }
    posAttr.needsUpdate = true;

    const orbsAttr = orbsGeometry.attributes.position;
    for (let i = 0; i < orbsCount; i++) {
      (orbsAttr.array as Float32Array)[i * 3 + 1] += Math.sin(time * 0.3 + i * 0.2) * 0.003;
      (orbsAttr.array as Float32Array)[i * 3] += Math.cos(time * 0.2 + i * 0.15) * 0.002;
      if ((orbsAttr.array as Float32Array)[i * 3 + 1] > 9) (orbsAttr.array as Float32Array)[i * 3 + 1] = -8;
      if ((orbsAttr.array as Float32Array)[i * 3 + 1] < -8) (orbsAttr.array as Float32Array)[i * 3 + 1] = 9;
    }
    orbsAttr.needsUpdate = true;

    // Waterfall animation (interior)
    if (waterfallParticles) {
      const wp = waterfallParticles.geometry.attributes.position;
      const arr = wp.array as Float32Array;
      for (let i = 0; i < arr.length / 3; i++) {
        arr[i * 3 + 1] -= 0.08;
        if (arr[i * 3 + 1] < -4) arr[i * 3 + 1] = 5;
      }
      wp.needsUpdate = true;
    }
    if (waterfall2) {
      const w2 = waterfall2.geometry.attributes.position;
      const arr2 = w2.array as Float32Array;
      for (let i = 0; i < arr2.length / 3; i++) {
        arr2[i * 3 + 1] -= 0.06;
        if (arr2[i * 3 + 1] < -3) arr2[i * 3 + 1] = 6;
      }
      w2.needsUpdate = true;
    }
    if (waterfall3) {
      const w3 = waterfall3.geometry.attributes.position;
      const arr3 = w3.array as Float32Array;
      for (let i = 0; i < arr3.length / 3; i++) {
        arr3[i * 3 + 1] -= 0.06;
        if (arr3[i * 3 + 1] < -3) arr3[i * 3 + 1] = 6;
      }
      w3.needsUpdate = true;
    }
    if (dustParticles) {
      const dp = dustParticles.geometry.attributes.position;
      const darr = dp.array as Float32Array;
      for (let i = 0; i < darr.length / 3; i++) {
        darr[i * 3 + 1] += Math.sin(time * 0.5 + i * 0.05) * 0.003;
        darr[i * 3] += Math.cos(time * 0.3 + i * 0.03) * 0.002;
      }
      dp.needsUpdate = true;
    }
    if (undergroundWaterfall) {
      const uw = undergroundWaterfall.geometry.attributes.position;
      const uarr = uw.array as Float32Array;
      for (let i = 0; i < uarr.length / 3; i++) {
        uarr[i * 3 + 1] -= 0.07;
        if (uarr[i * 3 + 1] < -2) uarr[i * 3 + 1] = 9;
      }
      uw.needsUpdate = true;
    }
    if (undergroundDust) {
      const ud = undergroundDust.geometry.attributes.position;
      const udarr = ud.array as Float32Array;
      for (let i = 0; i < udarr.length / 3; i++) {
        udarr[i * 3 + 1] += Math.sin(time * 0.4 + i * 0.04) * 0.004;
        udarr[i * 3] += Math.cos(time * 0.25 + i * 0.02) * 0.003;
      }
      ud.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  const particlesMaterial = particles.material as THREE.PointsMaterial;
  const orbsMaterial = orbs.material as THREE.PointsMaterial;

  animate();

  return { camera, scene, renderer, setScrollProgress };
}

function createColumnGeometry(height = 8, radiusTop = 0.4, radiusBottom = 0.5): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 12);
}

/** Premium interior: grand naos with gold accents, marble, dramatic lighting */
function createInteriorMonument(): THREE.Group {
  const group = new THREE.Group();

  // Premium materials
  const marblePolished = new THREE.MeshStandardMaterial({
    color: 0xf8f6f2,
    roughness: 0.15,
    metalness: 0.08,
  });
  const marbleVeined = new THREE.MeshStandardMaterial({
    color: 0xece8e2,
    roughness: 0.2,
    metalness: 0.05,
  });
  const marbleDark = new THREE.MeshStandardMaterial({
    color: 0xd8d2c8,
    roughness: 0.25,
    metalness: 0.06,
  });
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: GOLD,
    roughness: 0.2,
    metalness: 0.9,
  });
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d7fa6,
    transparent: true,
    opacity: 0.85,
    roughness: 0.05,
    metalness: 0.3,
  });

  // Floor - single plane (optimized, was 255 hex meshes)
  const floorGeom = new THREE.PlaneGeometry(28, 20);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xf0ede8,
    roughness: 0.25,
    metalness: 0.05,
  });
  const floor = new THREE.Mesh(floorGeom, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -8);
  group.add(floor);

  // Key columns (8 instead of 16)
  const colGeom = createColumnGeometry(7, 0.28, 0.38);
  const colPositions: [number, number][] = [
    [-6, -6], [0, -6], [6, -6], [-4, 0], [4, 0], [-4, 4], [0, 4], [4, 4],
  ];
  colPositions.forEach(([x, z]) => {
    const col = new THREE.Mesh(colGeom, marblePolished);
    col.position.set(x, 3.5, z);
    group.add(col);
    const capital = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.38, 0.3, 12),
      goldMaterial
    );
    capital.position.set(x, 7.15, z);
    group.add(capital);
  });

  // Ceiling (simplified)
  const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(24, 0.4, 18),
    marbleDark
  );
  ceiling.position.set(0, 9, -8);
  group.add(ceiling);
  // Central rosette only
  const rosette = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 10, 6),
    goldMaterial
  );
  rosette.position.set(0, 9.3, -8);
  rosette.scale.set(1, 0.3, 1);
  group.add(rosette);

  const oculusRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.5, 0.15, 6, 24),
    goldMaterial
  );
  oculusRing.position.set(0, 8.8, -6);
  oculusRing.rotation.x = Math.PI / 2;
  group.add(oculusRing);

  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(22, 12, 0.5),
    marbleVeined
  );
  backWall.position.set(0, 4, -14);
  group.add(backWall);
  const goldFrieze = new THREE.Mesh(
    new THREE.BoxGeometry(23, 0.4, 0.6),
    goldMaterial
  );
  goldFrieze.position.set(0, 9.8, -14.2);
  group.add(goldFrieze);

  const basinBase = new THREE.Mesh(
    new THREE.CylinderGeometry(3.5, 3.8, 0.5, 20),
    marblePolished
  );
  basinBase.position.set(0, 0.25, -10);
  group.add(basinBase);
  const basinRim = new THREE.Mesh(
    new THREE.TorusGeometry(3.3, 0.12, 6, 24),
    goldMaterial
  );
  basinRim.position.set(0, 0.5, -10);
  basinRim.rotation.x = Math.PI / 2;
  group.add(basinRim);
  const waterSurface = new THREE.Mesh(
    new THREE.CylinderGeometry(3.2, 3.2, 0.08, 24),
    waterMaterial
  );
  waterSurface.position.set(0, 0.54, -10);
  group.add(waterSurface);
  const centerPillar = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.6, 1.5, 12),
    marblePolished
  );
  centerPillar.position.set(0, 1.29, -10);
  group.add(centerPillar);
  const centerUrn = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2),
    goldMaterial
  );
  centerUrn.position.set(0, 2.2, -10);
  group.add(centerUrn);

  const wfCount = 220;
  const wfGeom = new THREE.BufferGeometry();
  const wfPos = new Float32Array(wfCount * 3);
  for (let i = 0; i < wfCount; i++) {
    wfPos[i * 3] = (Math.random() - 0.5) * 3;
    wfPos[i * 3 + 1] = Math.random() * 12;
    wfPos[i * 3 + 2] = -13.8 + Math.random() * 0.3;
  }
  wfGeom.setAttribute('position', new THREE.BufferAttribute(wfPos, 3));
  const softTex = createSoftParticleTexture();
  const waterfallParticles = new THREE.Points(
    wfGeom,
    new THREE.PointsMaterial({
      color: 0x5aa5d0,
      size: 0.18,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      map: softTex.clone(),
      depthWrite: false,
    })
  );
  group.add(waterfallParticles);

  // Side waterfalls - two flanking cascades
  const wf2Geom = new THREE.BufferGeometry();
  const wf2Pos = new Float32Array(wfCount * 3);
  for (let i = 0; i < wfCount; i++) {
    wf2Pos[i * 3] = -8.5 + Math.random() * 0.4;
    wf2Pos[i * 3 + 1] = Math.random() * 10;
    wf2Pos[i * 3 + 2] = -9 + (Math.random() - 0.5) * 2;
  }
  wf2Geom.setAttribute('position', new THREE.BufferAttribute(wf2Pos, 3));
  const waterfall2 = new THREE.Points(
    wf2Geom,
    new THREE.PointsMaterial({
      color: 0x4a9bc5,
      size: 0.14,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      map: softTex.clone(),
      depthWrite: false,
    })
  );
  group.add(waterfall2);

  const wf3Geom = new THREE.BufferGeometry();
  const wf3Pos = new Float32Array(wfCount * 3);
  for (let i = 0; i < wfCount; i++) {
    wf3Pos[i * 3] = 8.5 - Math.random() * 0.4;
    wf3Pos[i * 3 + 1] = Math.random() * 10;
    wf3Pos[i * 3 + 2] = -9 + (Math.random() - 0.5) * 2;
  }
  wf3Geom.setAttribute('position', new THREE.BufferAttribute(wf3Pos, 3));
  const waterfall3 = new THREE.Points(
    wf3Geom,
    new THREE.PointsMaterial({
      color: 0x4a9bc5,
      size: 0.14,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      map: softTex.clone(),
      depthWrite: false,
    })
  );
  group.add(waterfall3);

  const dustCount = 120;
  const dustGeom = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 16;
    dustPos[i * 3 + 1] = Math.random() * 10;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 12 - 6;
  }
  dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustParticles = new THREE.Points(
    dustGeom,
    new THREE.PointsMaterial({
      color: GOLD,
      size: 0.1,
      transparent: true,
      opacity: 0.45,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      map: softTex.clone(),
      depthWrite: false,
    })
  );
  group.add(dustParticles);

  group.userData = {
    waterfallParticles,
    waterfall2,
    waterfall3,
    dustParticles,
  };
  return group;
}

/** Underground sanctuary: premium marble, gold, statues, reflective ponds */
function createUndergroundChamber(
  statueMaterial: THREE.Material,
  _marbleMaterial: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: GOLD,
    roughness: 0.2,
    metalness: 0.9,
  });
  const marblePolished = new THREE.MeshStandardMaterial({
    color: 0xf0ebe6,
    roughness: 0.2,
    metalness: 0.06,
  });
  const marbleDark = new THREE.MeshStandardMaterial({
    color: 0xd8d0c8,
    roughness: 0.25,
    metalness: 0.05,
  });
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x2d6a8a,
    transparent: true,
    opacity: 0.88,
    roughness: 0.05,
    metalness: 0.25,
  });

  // Floor - single plane
  const floorGeom = new THREE.PlaneGeometry(36, 28);
  const floor = new THREE.Mesh(floorGeom, marblePolished);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -2);
  group.add(floor);

  const colGeom = createColumnGeometry(5.5, 0.22, 0.3);
  const pillarPositions: [number, number][] = [
    [-9, -10], [9, -10], [-6, -2], [6, -2], [-6, 6], [6, 6], [0, -11], [0, 8],
  ];
  pillarPositions.forEach(([x, z]) => {
    const col = new THREE.Mesh(colGeom, marblePolished);
    col.position.set(x, 2.75, z);
    group.add(col);
    const capital = new THREE.Mesh(
      new THREE.CylinderGeometry(0.36, 0.3, 0.2, 12),
      goldMaterial
    );
    capital.position.set(x, 5.35, z);
    group.add(capital);
  });

  const statuePositions: [number, number, number, number][] = [
    [-6, 0, -6, 0.55], [6, 0, -5, 0.5], [-5, 0, 4, 0.48], [5, 0, 5, 0.52],
    [0, 0, -9, 0.6], [-3, 0, -3, 0.42], [4, 0, -2, 0.44], [-4, 0, 6, 0.46],
    [6, 0, 3, 0.48], [-6, 0, -2, 0.5],
  ];
  statuePositions.forEach(([x, y, z, scale], i) => {
    const statue = i % 4 === 0 ? createGreekBust(statueMaterial) : createGreekStatue(statueMaterial);
    statue.position.set(x, y, z);
    statue.scale.setScalar(scale);
    statue.rotation.y = (i % 4) * (Math.PI / 4);
    group.add(statue);
  });

  // Premium mini tholoi - refined proportions
  const miniTholosPositions: [number, number][] = [
    [-7, -4], [7, 4], [-3, 7], [5, -7],
  ];
  miniTholosPositions.forEach(([x, z]) => {
    const mini = createMiniTholos(marblePolished, goldMaterial);
    mini.position.set(x, 0, z);
    mini.rotation.y = 0;
    group.add(mini);
  });

  const pondData: [number, number, number, number][] = [
    [-4, 0, -2, 1.1], [5, 0, 2, 1], [0, 0, -6, 1.3], [3, 0, -4, 1.05],
  ];
  pondData.forEach(([x, , z, radius]) => {
    const pondBase = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 1.08, 0.2, 16),
      marblePolished
    );
    pondBase.position.set(x, 0.1, z);
    group.add(pondBase);
    const goldRim = new THREE.Mesh(
      new THREE.TorusGeometry(radius - 0.05, 0.06, 6, 16),
      goldMaterial
    );
    goldRim.position.set(x, 0.22, z);
    goldRim.rotation.x = Math.PI / 2;
    group.add(goldRim);
    const waterSurface = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.9, radius * 0.9, 0.04, 16),
      waterMaterial
    );
    waterSurface.position.set(x, 0.2, z);
    group.add(waterSurface);
  });

  // Central altar - marble with gold inlay
  const altarBase = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 0.5, 1.4),
    marblePolished
  );
  altarBase.position.set(0, 0.25, -11);
  group.add(altarBase);
  const altarTop = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.15, 1.6),
    marbleDark
  );
  altarTop.position.set(0, 0.575, -11);
  group.add(altarTop);
  const altarTrim = new THREE.Mesh(
    new THREE.BoxGeometry(2.65, 0.04, 0.15),
    goldMaterial
  );
  altarTrim.position.set(0, 0.64, -11);
  group.add(altarTrim);

  const wfCount = 180;
  const wfGeom = new THREE.BufferGeometry();
  const wfPos = new Float32Array(wfCount * 3);
  for (let i = 0; i < wfCount; i++) {
    wfPos[i * 3] = (Math.random() - 0.5) * 1.5;
    wfPos[i * 3 + 1] = Math.random() * 8 + 2;
    wfPos[i * 3 + 2] = -11.5 + (Math.random() - 0.5) * 0.5;
  }
  wfGeom.setAttribute('position', new THREE.BufferAttribute(wfPos, 3));
  const softTex = createSoftParticleTexture();
  const undergroundWaterfall = new THREE.Points(
    wfGeom,
    new THREE.PointsMaterial({
      color: 0x5ab0d8,
      size: 0.2,
      transparent: true,
      opacity: 0.88,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      map: softTex.clone(),
      depthWrite: false,
    })
  );
  group.add(undergroundWaterfall);

  const dustCount = 80;
  const dustGeom = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 20;
    dustPos[i * 3 + 1] = Math.random() * 6;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 18;
  }
  dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const undergroundDust = new THREE.Points(
    dustGeom,
    new THREE.PointsMaterial({
      color: GOLD,
      size: 0.12,
      transparent: true,
      opacity: 0.55,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      map: softTex.clone(),
      depthWrite: false,
    })
  );
  group.add(undergroundDust);

  group.userData = { undergroundWaterfall, undergroundDust };
  return group;
}

function createMiniTholos(
  material: THREE.Material,
  goldMaterial?: THREE.Material
): THREE.Group {
  const group = new THREE.Group();
  const colGeom = createColumnGeometry(1.6, 0.12, 0.16);
  const radius = 0.85;
  for (let i = 0; i < 10; i++) {
    const angle = (i / 10) * Math.PI * 2;
    const col = new THREE.Mesh(colGeom, material);
    col.position.set(Math.cos(angle) * radius, 0.8, Math.sin(angle) * radius);
    col.rotation.z = -angle;
    group.add(col);
  }
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(radius + 0.25, radius + 0.3, 0.12, 16),
    material
  );
  base.position.y = 0.06;
  group.add(base);
  const capital = goldMaterial
    ? new THREE.Mesh(
        new THREE.CylinderGeometry(radius + 0.05, radius, 0.1, 16),
        goldMaterial
      )
    : new THREE.Mesh(
        new THREE.CylinderGeometry(radius + 0.05, radius, 0.1, 16),
        material
      );
  capital.position.y = 1.68;
  group.add(capital);
  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.55, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    material
  );
  dome.position.y = 2.05;
  group.add(dome);
  return group;
}

function createParthenonTemple(material: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  const colGeom = createColumnGeometry(6, 0.35, 0.45);

  const step = new THREE.Mesh(new THREE.BoxGeometry(22, 0.4, 12), material);
  step.position.y = 0.2;
  group.add(step);
  const step2 = new THREE.Mesh(new THREE.BoxGeometry(20, 0.35, 10), material);
  step2.position.y = 0.575;
  group.add(step2);

  for (let i = 0; i < 8; i++) {
    const col = new THREE.Mesh(colGeom, material);
    col.position.set((i - 3.5) * 2.5, 3.35, 0);
    group.add(col);
  }
  for (let i = 0; i < 6; i++) {
    const col = new THREE.Mesh(colGeom, material);
    col.position.set((i - 2.5) * 2.8, 3.35, -4.2);
    group.add(col);
  }

  const entablature = new THREE.Mesh(new THREE.BoxGeometry(20, 1.2, 10.5), material);
  entablature.position.y = 6.95;
  group.add(entablature);

  const pedimentShape = new THREE.Shape();
  pedimentShape.moveTo(-10, 0);
  pedimentShape.lineTo(0, 3.5);
  pedimentShape.lineTo(10, 0);
  pedimentShape.lineTo(-10, 0);
  const pediment = new THREE.Mesh(new THREE.ShapeGeometry(pedimentShape), material);
  pediment.position.y = 8.1;
  pediment.rotation.x = -Math.PI / 2;
  group.add(pediment);

  const roof = new THREE.Mesh(new THREE.BoxGeometry(21, 0.5, 11), material);
  roof.position.y = 9.2;
  group.add(roof);

  return group;
}

function createTholos(material: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  const colGeom = createColumnGeometry(3, 0.2, 0.28);
  const radius = 2.2;

  const base = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.4, radius + 0.5, 0.3, 16), material);
  base.position.y = 0.15;
  group.add(base);

  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    const col = new THREE.Mesh(colGeom, material);
    col.position.set(Math.cos(angle) * radius, 1.8, Math.sin(angle) * radius);
    col.rotation.z = -angle;
    group.add(col);
  }

  const capital = new THREE.Mesh(new THREE.CylinderGeometry(radius + 0.1, radius + 0.15, 0.25, 16), material);
  capital.position.y = 3.4;
  group.add(capital);

  const dome = new THREE.Mesh(
    new THREE.SphereGeometry(radius * 0.7, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    material
  );
  dome.position.y = 4.2;
  group.add(dome);

  return group;
}

function createStoa(material: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  const colGeom = createColumnGeometry(4, 0.28, 0.35);
  const numCols = 14;
  const spacing = 1.8;

  const base = new THREE.Mesh(new THREE.BoxGeometry(numCols * spacing + 2, 0.25, 5), material);
  base.position.y = 0.125;
  group.add(base);

  for (let i = 0; i < numCols; i++) {
    const col = new THREE.Mesh(colGeom, material);
    col.position.set((i - numCols / 2 + 0.5) * spacing, 2.25, 0);
    group.add(col);
  }

  const architrave = new THREE.Mesh(new THREE.BoxGeometry(numCols * spacing + 0.5, 0.5, 4.5), material);
  architrave.position.y = 4.5;
  group.add(architrave);

  return group;
}

function createGreekStatue(material: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1, 0.5, 8), material));
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.5, 2.5, 12), material);
  torso.position.y = 1.75;
  group.add(torso);
  const chest = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.35, 0.8, 12), material);
  chest.position.y = 3.15;
  group.add(chest);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 10), material);
  head.position.y = 3.9;
  group.add(head);
  const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.4, 0.15, 8), material);
  crown.position.y = 4.15;
  group.add(crown);
  return group;
}

function createGreekBust(material: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 0.6, 8), material));
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.3, 0.4, 8), material);
  neck.position.y = 0.8;
  group.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.5, 14, 12), material);
  head.position.y = 1.4;
  group.add(head);
  const wreath = new THREE.Mesh(new THREE.TorusGeometry(0.52, 0.08, 8, 16), material);
  wreath.position.y = 1.7;
  wreath.rotation.x = Math.PI / 2;
  group.add(wreath);
  return group;
}
