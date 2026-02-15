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

/** Dense grainy starfield texture - tiny irregular specks, varying brightness */
function createStarfieldTexture(): THREE.CanvasTexture {
  const w = 2048;
  const h = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, w, h);
  const dotCount = 12000;
  for (let i = 0; i < dotCount; i++) {
    const x = Math.random() * w;
    const y = Math.random() * h;
    const size = Math.random() < 0.7 ? 1 : Math.random() < 0.2 ? 2 : 3;
    const brightness = 0.25 + Math.random() * 0.75;
    const grey = Math.floor(200 + Math.random() * 55);
    ctx.fillStyle = `rgba(${grey},${grey},${Math.min(255, grey + 30)},${brightness})`;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  // Extra stars in bottom half of canvas (fills lower part of view)
  const bottomDotCount = 9000;
  for (let i = 0; i < bottomDotCount; i++) {
    const x = Math.random() * w;
    const y = h * 0.4 + Math.random() * h * 0.6; // y from 40% to 100% (bottom 60%)
    const size = Math.random() < 0.75 ? 1 : Math.random() < 0.2 ? 2 : 3;
    const brightness = 0.3 + Math.random() * 0.7;
    const grey = Math.floor(195 + Math.random() * 60);
    ctx.fillStyle = `rgba(${grey},${grey},${Math.min(255, grey + 35)},${brightness})`;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
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
    antialias: false,
    powerPreference: 'high-performance',
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.25));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const ambient = new THREE.AmbientLight(0x404050, 0.55);
  scene.add(ambient);
  const sunLight = new THREE.DirectionalLight(0xfff5e6, 0.9);
  sunLight.position.set(5, 10, 5);
  scene.add(sunLight);
  const sunLightLeft = new THREE.DirectionalLight(0xfff5e6, 0.85);
  sunLightLeft.position.set(-5, 10, 5);
  scene.add(sunLightLeft);
  const fillLight = new THREE.DirectionalLight(0xe8dcc8, 0.5);
  fillLight.position.set(-5, 5, -5);
  scene.add(fillLight);
  const fillLightRight = new THREE.DirectionalLight(0xe8dcc8, 0.5);
  fillLightRight.position.set(5, 5, -5);
  scene.add(fillLightRight);
  const rimLight = new THREE.DirectionalLight(0xd4af37, 0.25);
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

  // —— Additional monuments ——
  const obeliskLeft = createObelisk(marbleMaterial);
  obeliskLeft.position.set(-12, 0, -6);
  obeliskLeft.scale.set(0.35, 0.35, 0.35);
  obeliskLeft.rotation.y = 0.1;
  scene.add(obeliskLeft);

  const obeliskRight = createObelisk(marbleMaterial);
  obeliskRight.position.set(12, 0, -6);
  obeliskRight.scale.set(0.35, 0.35, 0.35);
  obeliskRight.rotation.y = -0.1;
  scene.add(obeliskRight);

  const gateway = createGateway(marbleMaterial);
  gateway.position.set(0, 0, -26);
  gateway.scale.set(0.5, 0.5, 0.5);
  scene.add(gateway);

  const altarMonument = createOutdoorAltar(marbleMaterial);
  altarMonument.position.set(0, 0, -18);
  altarMonument.scale.set(0.4, 0.4, 0.4);
  scene.add(altarMonument);

  const tholosBack = createTholos(marbleMaterial);
  tholosBack.position.set(-5, 0, -28);
  tholosBack.scale.set(0.3, 0.3, 0.3);
  tholosBack.rotation.y = 0.3;
  scene.add(tholosBack);

  const tholosBackR = createTholos(marbleMaterial);
  tholosBackR.position.set(5, 0, -28);
  tholosBackR.scale.set(0.3, 0.3, 0.3);
  tholosBackR.rotation.y = -0.3;
  scene.add(tholosBackR);

  const steleLeft = createStele(marbleMaterial);
  steleLeft.position.set(-14, 0, -14);
  steleLeft.scale.set(0.5, 0.5, 0.5);
  steleLeft.rotation.y = 0.15;
  scene.add(steleLeft);

  const steleRight = createStele(marbleMaterial);
  steleRight.position.set(14, 0, -14);
  steleRight.scale.set(0.5, 0.5, 0.5);
  steleRight.rotation.y = -0.15;
  scene.add(steleRight);

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

  const particlesCount = 200;
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

  const orbsCount = 24;
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

  // Space theme: dense starfield
  const starsCount = 2500;
  const starsGeometry = new THREE.BufferGeometry();
  const starsPositions = new Float32Array(starsCount * 3);
  const starsColors = new Float32Array(starsCount * 3);
  const starColorsHex = [0xffffff, 0xffeedd, 0xddffff, 0xffddff, 0xddddff]; // white, warm, cyan, pink, blue
  for (let i = 0; i < starsCount; i++) {
    starsPositions[i * 3] = (Math.random() - 0.5) * 180;
    starsPositions[i * 3 + 1] = Math.random() * 80 - 15;
    starsPositions[i * 3 + 2] = (Math.random() - 0.5) * 160 - 70;
    const c = starColorsHex[i % starColorsHex.length];
    starsColors[i * 3] = ((c >> 16) & 255) / 255;
    starsColors[i * 3 + 1] = ((c >> 8) & 255) / 255;
    starsColors[i * 3 + 2] = (c & 255) / 255;
  }
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starsPositions, 3));
  starsGeometry.setAttribute('color', new THREE.BufferAttribute(starsColors, 3));
  const stars = new THREE.Points(
    starsGeometry,
    new THREE.PointsMaterial({
      color: 0xffffff,
      vertexColors: true,
      size: 0.14,
      transparent: true,
      opacity: 0.95,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      map: softTex.clone(),
      depthWrite: false,
    })
  );
  scene.add(stars);

  // Bottom/horizon stars - dense in lower sky (above ground y=-2, visible at bottom of view)
  const bottomStarsCount = 2800;
  const bottomStarsGeom = new THREE.BufferGeometry();
  const bottomStarsPos = new Float32Array(bottomStarsCount * 3);
  const bottomStarsColors = new Float32Array(bottomStarsCount * 3);
  for (let i = 0; i < bottomStarsCount; i++) {
    bottomStarsPos[i * 3] = (Math.random() - 0.5) * 260;
    bottomStarsPos[i * 3 + 1] = (Math.random() * 0.7) * 25 - 2; // y: -2 to 15 (horizon + low sky)
    bottomStarsPos[i * 3 + 2] = (Math.random() - 0.5) * 240 - 100;
    const c = starColorsHex[i % starColorsHex.length];
    bottomStarsColors[i * 3] = ((c >> 16) & 255) / 255;
    bottomStarsColors[i * 3 + 1] = ((c >> 8) & 255) / 255;
    bottomStarsColors[i * 3 + 2] = (c & 255) / 255;
  }
  bottomStarsGeom.setAttribute('position', new THREE.BufferAttribute(bottomStarsPos, 3));
  bottomStarsGeom.setAttribute('color', new THREE.BufferAttribute(bottomStarsColors, 3));
  const bottomStarsMat = new THREE.PointsMaterial({
    color: 0xffffff,
    vertexColors: true,
    size: 0.14,
    transparent: true,
    opacity: 0.92,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    map: softTex.clone(),
    depthWrite: false,
  });
  const bottomStars = new THREE.Points(bottomStarsGeom, bottomStarsMat);
  scene.add(bottomStars);

  // Nebula-like distant glow particles
  const nebulaCount = 150;
  const nebulaGeom = new THREE.BufferGeometry();
  const nebulaPos = new Float32Array(nebulaCount * 3);
  for (let i = 0; i < nebulaCount; i++) {
    nebulaPos[i * 3] = (Math.random() - 0.5) * 120;
    nebulaPos[i * 3 + 1] = (Math.random() - 0.3) * 70 - 35; // extend to bottom
    nebulaPos[i * 3 + 2] = (Math.random() - 0.5) * 100 - 60;
  }
  nebulaGeom.setAttribute('position', new THREE.BufferAttribute(nebulaPos, 3));
  const nebula = new THREE.Points(
    nebulaGeom,
    new THREE.PointsMaterial({
      color: 0x4a3f7a,
      size: 0.4,
      transparent: true,
      opacity: 0.15,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      map: softTex.clone(),
      depthWrite: false,
    })
  );
  scene.add(nebula);

  const nebula2Pos = new Float32Array(nebulaCount * 3);
  for (let i = 0; i < nebulaCount * 3; i++) nebula2Pos[i] = (Math.random() - 0.5) * 110;
  const nebula2Geom = new THREE.BufferGeometry();
  nebula2Geom.setAttribute('position', new THREE.BufferAttribute(nebula2Pos, 3));
  const nebula2 = new THREE.Points(
    nebula2Geom,
    new THREE.PointsMaterial({
      color: 0x2a4a6a,
      size: 0.35,
      transparent: true,
      opacity: 0.12,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      map: softTex.clone(),
      depthWrite: false,
    })
  );
  scene.add(nebula2);

  // Ground: dark reflective surface (cosmic floor)
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 80),
    new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.95,
      metalness: 0.1,
      emissive: 0x050508,
    })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -2;
  scene.add(ground);

  const starfieldTex = createStarfieldTexture();
  scene.background = starfieldTex;
  scene.fog = new THREE.FogExp2(0x000000, 0.02);

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
    tholosBack.position.y = Math.sin(time * 0.16 + 0.7) * 0.01;
    tholosBackR.position.y = Math.sin(time * 0.16 + 0.3) * 0.01;
    obeliskLeft.position.y = Math.sin(time * 0.17) * 0.008;
    obeliskRight.position.y = Math.sin(time * 0.17 + 0.6) * 0.008;
    gateway.position.y = Math.sin(time * 0.14 + 0.2) * 0.01;
    altarMonument.position.y = Math.sin(time * 0.19) * 0.01;
    steleLeft.position.y = Math.sin(time * 0.18 + 0.4) * 0.008;
    steleRight.position.y = Math.sin(time * 0.18 + 0.8) * 0.008;

    undergroundGroup.position.y = Math.sin(time * 0.15) * 0.01;

    statueLeft.rotation.y = 0.1 + Math.sin(time * 0.15) * 0.02;
    statueLeft.position.y = Math.sin(time * 0.2) * 0.015;
    statueRight.rotation.y = -0.1 + Math.sin(time * 0.15 + 1) * 0.02;
    statueRight.position.y = Math.sin(time * 0.2 + 0.5) * 0.015;
    centerStatue.rotation.y = Math.sin(time * 0.12) * 0.03;
    centerStatue.position.y = 1.5 + Math.sin(time * 0.25) * 0.02;

    particlesMaterial.opacity = 0.7 * (1 - t * 0.9);
    orbsMaterial.opacity = 0.4 * (1 - t * 0.9);
    starsMaterial.opacity = 0.95 * (1 - t * 0.85);
    bottomStarsMaterial.opacity = 0.9 * (1 - t * 0.85);
    nebulaMaterial.opacity = 0.15 * (1 - t * 0.9);
    nebula2Material.opacity = 0.12 * (1 - t * 0.9);

    // Exterior particles: skip update when fully faded (t > 0.8)
    if (t < 0.85) {
      const posAttr = particlesGeometry.attributes.position;
      const parr = posAttr.array as Float32Array;
      const drift = time * 0.002;
      for (let i = 0; i < particlesCount; i++) {
        parr[i * 3 + 1] += (i % 3 - 1) * 0.003 + drift;
        if (parr[i * 3 + 1] > 12) parr[i * 3 + 1] = -10;
        if (parr[i * 3 + 1] < -10) parr[i * 3 + 1] = 12;
      }
      posAttr.needsUpdate = true;

      const orbsAttr = orbsGeometry.attributes.position;
      const oarr = orbsAttr.array as Float32Array;
      for (let i = 0; i < orbsCount; i++) {
        oarr[i * 3 + 1] += 0.002;
        if (oarr[i * 3 + 1] > 9) oarr[i * 3 + 1] = -8;
      }
      orbsAttr.needsUpdate = true;
    }

    // Interior particles: only update when interior visible (t > 0.15)
    if (t > 0.12) {
      if (waterfallParticles) {
        const arr = (waterfallParticles.geometry.attributes.position.array as Float32Array);
        const len = arr.length / 3;
        for (let i = 0; i < len; i++) {
          arr[i * 3 + 1] -= 0.08;
          if (arr[i * 3 + 1] < -4) arr[i * 3 + 1] = 5;
        }
        waterfallParticles.geometry.attributes.position.needsUpdate = true;
      }
      if (waterfall2) {
        const arr = (waterfall2.geometry.attributes.position.array as Float32Array);
        for (let i = 0; i < arr.length / 3; i++) {
          arr[i * 3 + 1] -= 0.06;
          if (arr[i * 3 + 1] < -3) arr[i * 3 + 1] = 6;
        }
        waterfall2.geometry.attributes.position.needsUpdate = true;
      }
      if (waterfall3) {
        const arr = (waterfall3.geometry.attributes.position.array as Float32Array);
        for (let i = 0; i < arr.length / 3; i++) {
          arr[i * 3 + 1] -= 0.06;
          if (arr[i * 3 + 1] < -3) arr[i * 3 + 1] = 6;
        }
        waterfall3.geometry.attributes.position.needsUpdate = true;
      }
      if (dustParticles) {
        const darr = dustParticles.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < darr.length / 3; i++) darr[i * 3 + 1] += 0.002;
        dustParticles.geometry.attributes.position.needsUpdate = true;
      }
    }

    // Inner sanctum: only when t > 0.45
    if (t > 0.4) {
      if (undergroundWaterfall) {
        const uarr = undergroundWaterfall.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < uarr.length / 3; i++) {
          uarr[i * 3 + 1] -= 0.07;
          if (uarr[i * 3 + 1] < -2) uarr[i * 3 + 1] = 9;
        }
        undergroundWaterfall.geometry.attributes.position.needsUpdate = true;
      }
      if (undergroundDust) {
        const udarr = undergroundDust.geometry.attributes.position.array as Float32Array;
        for (let i = 0; i < udarr.length / 3; i++) udarr[i * 3 + 1] += 0.003;
        undergroundDust.geometry.attributes.position.needsUpdate = true;
      }
    }

    renderer.render(scene, camera);
  }

  const particlesMaterial = particles.material as THREE.PointsMaterial;
  const orbsMaterial = orbs.material as THREE.PointsMaterial;
  const starsMaterial = stars.material as THREE.PointsMaterial;
  const bottomStarsMaterial = bottomStars.material as THREE.PointsMaterial;
  const nebulaMaterial = nebula.material as THREE.PointsMaterial;
  const nebula2Material = nebula2.material as THREE.PointsMaterial;

  animate();

  return { camera, scene, renderer, setScrollProgress };
}

function createColumnGeometry(height = 8, radiusTop = 0.4, radiusBottom = 0.5): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(radiusTop, radiusBottom, height, 10);
}

/** Premium interior: grand naos with gold accents, marble, dramatic lighting */
function createInteriorMonument(): THREE.Group {
  const group = new THREE.Group();

  // Premium materials - refined for grand interior
  const marblePolished = new THREE.MeshStandardMaterial({
    color: 0xfaf8f5,
    roughness: 0.12,
    metalness: 0.12,
  });
  const marbleVeined = new THREE.MeshStandardMaterial({
    color: 0xebe6df,
    roughness: 0.18,
    metalness: 0.08,
  });
  const marbleDark = new THREE.MeshStandardMaterial({
    color: 0xc9c2b8,
    roughness: 0.22,
    metalness: 0.1,
  });
  const goldMaterial = new THREE.MeshStandardMaterial({
    color: GOLD,
    roughness: 0.15,
    metalness: 0.95,
  });
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a8fb8,
    transparent: true,
    opacity: 0.9,
    roughness: 0.02,
    metalness: 0.4,
  });

  // Floor - main plane with decorative border
  const floorGeom = new THREE.PlaneGeometry(28, 20);
  const floorMat = new THREE.MeshStandardMaterial({
    color: 0xf5f1eb,
    roughness: 0.18,
    metalness: 0.08,
  });
  const floor = new THREE.Mesh(floorGeom, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -8);
  group.add(floor);
  // Floor border - gold band
  const floorBorder = new THREE.Mesh(
    new THREE.RingGeometry(13.8, 14.2, 32),
    goldMaterial
  );
  floorBorder.rotation.x = -Math.PI / 2;
  floorBorder.position.set(0, 0.02, -8);
  group.add(floorBorder);
  // Corner accents
  [-1, 1].forEach((sx) =>
    [-1, 1].forEach((sz) => {
      const accent = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.08, 1.5),
        goldMaterial
      );
      accent.position.set(sx * 12, 0.04, -8 + sz * 8.5);
      group.add(accent);
    })
  );

  // Entrances (arched openings) instead of solid pillars - starfield visible through arches
  const pierW = 1.5;
  const pierH = 7;
  const pierD = 0.5;
  const openW = 3.5;
  // Left wall: 3 entrances
  [[-9, -6], [-9, 0], [-9, 4]].forEach(([x, z]) => {
    const leftPier = new THREE.Mesh(new THREE.BoxGeometry(pierW, pierH, pierD), marblePolished);
    leftPier.position.set(x - openW / 2 - pierW / 2, pierH / 2, z);
    group.add(leftPier);
    const rightPier = new THREE.Mesh(new THREE.BoxGeometry(pierW, pierH, pierD), marblePolished);
    rightPier.position.set(x + openW / 2 + pierW / 2, pierH / 2, z);
    group.add(rightPier);
    const topArch = new THREE.Mesh(new THREE.BoxGeometry(openW + pierW * 2, 0.7, pierD), marblePolished);
    topArch.position.set(x, pierH + 0.35, z);
    group.add(topArch);
    const archGold = new THREE.Mesh(new THREE.BoxGeometry(openW + pierW * 2 + 0.2, 0.12, pierD + 0.1), goldMaterial);
    archGold.position.set(x, pierH + 0.75, z);
    group.add(archGold);
  });
  // Right wall: 3 entrances
  [[9, -6], [9, 0], [9, 4]].forEach(([x, z]) => {
    const leftPier = new THREE.Mesh(new THREE.BoxGeometry(pierW, pierH, pierD), marblePolished);
    leftPier.position.set(x - openW / 2 - pierW / 2, pierH / 2, z);
    group.add(leftPier);
    const rightPier = new THREE.Mesh(new THREE.BoxGeometry(pierW, pierH, pierD), marblePolished);
    rightPier.position.set(x + openW / 2 + pierW / 2, pierH / 2, z);
    group.add(rightPier);
    const topArch = new THREE.Mesh(new THREE.BoxGeometry(openW + pierW * 2, 0.7, pierD), marblePolished);
    topArch.position.set(x, pierH + 0.35, z);
    group.add(topArch);
    const archGold = new THREE.Mesh(new THREE.BoxGeometry(openW + pierW * 2 + 0.2, 0.12, pierD + 0.1), goldMaterial);
    archGold.position.set(x, pierH + 0.75, z);
    group.add(archGold);
  });

  // Ceiling - coffered style with cornice
  const cornice = new THREE.Mesh(
    new THREE.BoxGeometry(26, 0.3, 20),
    marbleDark
  );
  cornice.position.set(0, 8.85, -8);
  group.add(cornice);
  const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(24, 0.35, 18),
    marbleDark
  );
  ceiling.position.set(0, 9.2, -8);
  group.add(ceiling);
  // Gold cornice trim
  const corniceTrim = new THREE.Mesh(
    new THREE.BoxGeometry(26.2, 0.12, 20.2),
    goldMaterial
  );
  corniceTrim.position.set(0, 9.45, -8);
  group.add(corniceTrim);
  // Rosettes in a pattern
  [[-4, -4], [0, -4], [4, -4], [-4, 0], [0, 0], [4, 0], [-4, 4], [0, 4], [4, 4]].forEach(([x, z]) => {
    const r = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 6), goldMaterial);
    r.position.set(x, 9.45, -8 + z);
    r.scale.set(1, 0.4, 1);
    group.add(r);
  });

  const oculusRing = new THREE.Mesh(
    new THREE.TorusGeometry(2.8, 0.2, 8, 32),
    goldMaterial
  );
  oculusRing.position.set(0, 8.6, -6);
  oculusRing.rotation.x = Math.PI / 2;
  group.add(oculusRing);
  const oculusInner = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.2, 0.1, 24),
    new THREE.MeshStandardMaterial({ color: 0x87ceeb, transparent: true, opacity: 0.6, roughness: 0.05, metalness: 0.2 })
  );
  oculusInner.position.set(0, 8.5, -6);
  group.add(oculusInner);

  // Back wall - solid with gold banding
  const backWall = new THREE.Mesh(
    new THREE.BoxGeometry(22, 12, 0.5),
    marbleVeined
  );
  backWall.position.set(0, 4, -14);
  group.add(backWall);
  const goldFrieze = new THREE.Mesh(
    new THREE.BoxGeometry(23, 0.5, 0.6),
    goldMaterial
  );
  goldFrieze.position.set(0, 9.9, -14.2);
  group.add(goldFrieze);
  [-6, 0, 6].forEach((bx) => {
    const band = new THREE.Mesh(new THREE.BoxGeometry(0.15, 11, 0.55), goldMaterial);
    band.position.set(bx, 4.5, -14.25);
    group.add(band);
  });

  // Central fountain - grand design
  const basinBase = new THREE.Mesh(
    new THREE.CylinderGeometry(3.6, 4, 0.6, 24),
    marblePolished
  );
  basinBase.position.set(0, 0.3, -10);
  group.add(basinBase);
  const basinStep = new THREE.Mesh(
    new THREE.CylinderGeometry(3.3, 3.5, 0.15, 24),
    marbleDark
  );
  basinStep.position.set(0, 0.58, -10);
  group.add(basinStep);
  const basinRim = new THREE.Mesh(
    new THREE.TorusGeometry(3.2, 0.15, 8, 28),
    goldMaterial
  );
  basinRim.position.set(0, 0.68, -10);
  basinRim.rotation.x = Math.PI / 2;
  group.add(basinRim);
  const waterSurface = new THREE.Mesh(
    new THREE.CylinderGeometry(3, 3, 0.1, 28),
    waterMaterial
  );
  waterSurface.position.set(0, 0.72, -10);
  group.add(waterSurface);
  // Low pedestal only (no tall pillar) - open fountain center
  const lowPedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.65, 0.4, 12),
    marblePolished
  );
  lowPedestal.position.set(0, 0.92, -10);
  group.add(lowPedestal);
  const centerUrn = new THREE.Mesh(
    new THREE.SphereGeometry(0.55, 14, 12, 0, Math.PI * 2, 0, Math.PI / 2),
    goldMaterial
  );
  centerUrn.position.set(0, 1.4, -10);
  group.add(centerUrn);
  // Fountain flank statues
  const statueMat = new THREE.MeshStandardMaterial({ color: 0xf8f6f2, roughness: 0.2, metalness: 0.08 });
  const leftBust = createGreekBust(statueMat);
  leftBust.position.set(-5.5, 0, -10);
  leftBust.scale.setScalar(0.35);
  leftBust.rotation.y = 0.3;
  group.add(leftBust);
  const rightBust = createGreekBust(statueMat);
  rightBust.position.set(5.5, 0, -10);
  rightBust.scale.setScalar(0.35);
  rightBust.rotation.y = -0.3;
  group.add(rightBust);

  const wfCount = 100;
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
      color: 0x6bc4e8,
      size: 0.2,
      transparent: true,
      opacity: 0.95,
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
      color: 0x5ab8dc,
      size: 0.16,
      transparent: true,
      opacity: 0.9,
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
      color: 0x5ab8dc,
      size: 0.16,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      map: softTex.clone(),
      depthWrite: false,
    })
  );
  group.add(waterfall3);

  const dustCount = 60;
  const dustGeom = new THREE.BufferGeometry();
  const dustPos = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i++) {
    dustPos[i * 3] = (Math.random() - 0.5) * 18;
    dustPos[i * 3 + 1] = Math.random() * 12;
    dustPos[i * 3 + 2] = (Math.random() - 0.5) * 14 - 6;
  }
  dustGeom.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
  const dustParticles = new THREE.Points(
    dustGeom,
    new THREE.PointsMaterial({
      color: GOLD,
      size: 0.12,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      map: softTex.clone(),
      depthWrite: false,
    })
  );
  group.add(dustParticles);

  // Interior ambient light for warm glow
  const fountainLight = new THREE.PointLight(0xffeedd, 4, 25);
  fountainLight.position.set(0, 4, -10);
  group.add(fountainLight);

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
    roughness: 0.15,
    metalness: 0.95,
  });
  const marblePolished = new THREE.MeshStandardMaterial({
    color: 0xf5f0ea,
    roughness: 0.16,
    metalness: 0.1,
  });
  const marbleDark = new THREE.MeshStandardMaterial({
    color: 0xcec6bc,
    roughness: 0.2,
    metalness: 0.08,
  });
  const waterMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a7a9e,
    transparent: true,
    opacity: 0.92,
    roughness: 0.03,
    metalness: 0.35,
  });

  // Floor with decorative border
  const floorGeom = new THREE.PlaneGeometry(36, 28);
  const floor = new THREE.Mesh(floorGeom, marblePolished);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, -2);
  group.add(floor);
  const floorBorder = new THREE.Mesh(
    new THREE.RingGeometry(17.5, 18.2, 40),
    goldMaterial
  );
  floorBorder.rotation.x = -Math.PI / 2;
  floorBorder.position.set(0, 0.02, -2);
  group.add(floorBorder);

  // Entrances instead of pillars - arched openings
  const pw = 1.2;
  const ph = 5;
  const pd = 0.4;
  const ow = 2.8;
  const sanctumEntrances: [number, number][] = [
    [-9, -10], [9, -10], [-6, -2], [6, -2], [-6, 6], [6, 6],
  ];
  sanctumEntrances.forEach(([x, z]) => {
    const lp = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, pd), marblePolished);
    lp.position.set(x - ow / 2 - pw / 2, ph / 2, z);
    group.add(lp);
    const rp = new THREE.Mesh(new THREE.BoxGeometry(pw, ph, pd), marblePolished);
    rp.position.set(x + ow / 2 + pw / 2, ph / 2, z);
    group.add(rp);
    const ta = new THREE.Mesh(new THREE.BoxGeometry(ow + pw * 2, 0.6, pd), marblePolished);
    ta.position.set(x, ph + 0.3, z);
    group.add(ta);
    const ag = new THREE.Mesh(new THREE.BoxGeometry(ow + pw * 2 + 0.15, 0.1, pd + 0.08), goldMaterial);
    ag.position.set(x, ph + 0.65, z);
    group.add(ag);
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
    [-4, 0, -2, 1.15], [5, 0, 2, 1.05], [0, 0, -6, 1.35], [3, 0, -4, 1.08],
  ];
  pondData.forEach(([x, , z, radius]) => {
    const pondBase = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius * 1.1, 0.25, 18),
      marblePolished
    );
    pondBase.position.set(x, 0.125, z);
    group.add(pondBase);
    const goldRim = new THREE.Mesh(
      new THREE.TorusGeometry(radius - 0.04, 0.08, 8, 20),
      goldMaterial
    );
    goldRim.position.set(x, 0.28, z);
    goldRim.rotation.x = Math.PI / 2;
    group.add(goldRim);
    const waterSurface = new THREE.Mesh(
      new THREE.CylinderGeometry(radius * 0.88, radius * 0.88, 0.05, 20),
      waterMaterial
    );
    waterSurface.position.set(x, 0.26, z);
    group.add(waterSurface);
  });

  // Central altar - refined with gold accents
  const altarBase = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.55, 1.5),
    marblePolished
  );
  altarBase.position.set(0, 0.275, -11);
  group.add(altarBase);
  const altarBaseTrim = new THREE.Mesh(
    new THREE.BoxGeometry(2.55, 0.06, 1.55),
    goldMaterial
  );
  altarBaseTrim.position.set(0, 0.56, -11);
  group.add(altarBaseTrim);
  const altarTop = new THREE.Mesh(
    new THREE.BoxGeometry(2.7, 0.18, 1.7),
    marbleDark
  );
  altarTop.position.set(0, 0.655, -11);
  group.add(altarTop);
  const altarTrim = new THREE.Mesh(
    new THREE.BoxGeometry(2.75, 0.05, 0.2),
    goldMaterial
  );
  altarTrim.position.set(0, 0.75, -11);
  group.add(altarTrim);
  const altarUrn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.25, 0.5, 12),
    goldMaterial
  );
  altarUrn.position.set(0, 1.15, -11);
  group.add(altarUrn);

  // Underground ceiling and back entrance
  const sanctumCeiling = new THREE.Mesh(
    new THREE.BoxGeometry(34, 0.35, 26),
    marbleDark
  );
  sanctumCeiling.position.set(0, 5.9, -2);
  group.add(sanctumCeiling);
  const sanctumCornice = new THREE.Mesh(
    new THREE.BoxGeometry(34.5, 0.1, 26.5),
    goldMaterial
  );
  sanctumCornice.position.set(0, 6.1, -2);
  group.add(sanctumCornice);
  // Back wall - solid
  const backWallSanctum = new THREE.Mesh(
    new THREE.BoxGeometry(32, 12, 0.4),
    marblePolished
  );
  backWallSanctum.position.set(0, 4, -14);
  group.add(backWallSanctum);
  const backWallFrieze = new THREE.Mesh(
    new THREE.BoxGeometry(32.5, 0.4, 0.5),
    goldMaterial
  );
  backWallFrieze.position.set(0, 10.1, -14.2);
  group.add(backWallFrieze);

  const wfCount = 80;
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

  const dustCount = 35;
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
      size: 0.14,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      map: softTex.clone(),
      depthWrite: false,
    })
  );
  group.add(undergroundDust);

  const altarLight = new THREE.PointLight(0xffe8b0, 3, 30);
  altarLight.position.set(0, 3, -11);
  group.add(altarLight);

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

function createObelisk(material: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.6), material);
  base.position.y = 0.2;
  group.add(base);
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.12, 0.2, 6, 8),
    material
  );
  shaft.position.y = 3.4;
  group.add(shaft);
  const pyramid = new THREE.Mesh(
    new THREE.ConeGeometry(0.18, 0.8, 4),
    material
  );
  pyramid.position.y = 7.2;
  group.add(pyramid);
  return group;
}

function createGateway(material: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  const colGeom = createColumnGeometry(5, 0.35, 0.45);
  const leftCol = new THREE.Mesh(colGeom, material);
  leftCol.position.set(-2.5, 2.5, 0);
  group.add(leftCol);
  const rightCol = new THREE.Mesh(colGeom, material);
  rightCol.position.set(2.5, 2.5, 0);
  group.add(rightCol);
  const architrave = new THREE.Mesh(new THREE.BoxGeometry(6, 0.8, 1.2), material);
  architrave.position.y = 5.4;
  group.add(architrave);
  const pediment = new THREE.Mesh(new THREE.BoxGeometry(6.2, 0.5, 1.5), material);
  pediment.position.y = 5.9;
  group.add(pediment);
  const base = new THREE.Mesh(new THREE.BoxGeometry(7, 0.3, 2), material);
  base.position.y = 0.15;
  group.add(base);
  return group;
}

function createOutdoorAltar(material: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  const goldMat = new THREE.MeshStandardMaterial({
    color: GOLD,
    roughness: 0.2,
    metalness: 0.9,
  });
  const base = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.5, 1.5), material);
  base.position.y = 0.25;
  group.add(base);
  const top = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.15, 1.8), material);
  top.position.y = 0.575;
  group.add(top);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(2.9, 0.06, 0.2), goldMat);
  trim.position.set(0, 0.66, -0.95);
  group.add(trim);
  const urn = new THREE.Mesh(
    new THREE.CylinderGeometry(0.25, 0.3, 0.6, 10),
    goldMat
  );
  urn.position.set(0, 1.1, 0);
  group.add(urn);
  return group;
}

function createStele(material: THREE.Material): THREE.Group {
  const group = new THREE.Group();
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 0.6), material);
  base.position.y = 0.15;
  group.add(base);
  const shaft = new THREE.Mesh(new THREE.BoxGeometry(0.5, 3.5, 0.25), material);
  shaft.position.y = 2.05;
  group.add(shaft);
  const cap = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.25, 0.35), material);
  cap.position.y = 3.925;
  group.add(cap);
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
  const numCols = 10;
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
