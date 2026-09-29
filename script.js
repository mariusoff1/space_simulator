import { planetsData } from './planetsData.js';
import { sunMass, circularVelocity, angleAround, updatePhysics } from './physics.js';
import { initUI, updateUI } from './ui.js';

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  5000
);
camera.position.set(0, 60, 140);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

const textureLoader = new THREE.TextureLoader();

const starGeometry = new THREE.SphereGeometry(2000, 64, 64);
const starTexture = textureLoader.load('./textures/etoiles.jpg');
const starMaterial = new THREE.MeshBasicMaterial({ map: starTexture, side: THREE.BackSide });
const starField = new THREE.Mesh(starGeometry, starMaterial);
scene.add(starField);

const sunTexture = textureLoader.load('./textures/soleil.jpg');
const sunGeometry = new THREE.SphereGeometry(8, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({ map: sunTexture });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

const sunLight = new THREE.PointLight(0xffffff, 2, 0, 0);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

const maxTrailPoints = 150;
const planets = [];
const meshToTelemetry = new Map();
meshToTelemetry.set(sun.uuid, { isStar: true, name: 'Sun' });

function createTrail(colorHex) {
  const baseColor = new THREE.Color(colorHex);
  const positions = new Float32Array(maxTrailPoints * 3);
  const colors = new Float32Array(maxTrailPoints * 3);

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setDrawRange(0, 0);

  const material = new THREE.LineBasicMaterial({ vertexColors: true });
  const line = new THREE.Line(geometry, material);
  scene.add(line);

  return {
    line, geometry, positions, colors, baseColor,
    buffer: [], writeIndex: 0
  };
}

function loadMaterialWithFallback(texturePath) {
  const material = new THREE.MeshStandardMaterial({ color: 0x888888 });
  textureLoader.load(
    texturePath,
    (loadedTexture) => {
      material.map = loadedTexture;
      material.color.set(0xffffff);
      material.needsUpdate = true;
    },
    undefined,
    () => { material.color.set(0x888888); }
  );
  return material;
}

function fixRingUVs(geometry, innerRadius, outerRadius) {
  const pos = geometry.attributes.position;
  const uv = geometry.attributes.uv;
  const v3 = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v3.fromBufferAttribute(pos, i);
    const radius = v3.length();
    const u = (radius - innerRadius) / (outerRadius - innerRadius);
    uv.setXY(i, u, 1);
  }
  uv.needsUpdate = true;
}

let saturnRing = null;
let saturnMesh = null;

planetsData.forEach((data) => {
  const geometry = new THREE.SphereGeometry(data.radius, 64, 64);
  const material = loadMaterialWithFallback(data.texture);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);

  const position = new THREE.Vector3(data.distance, 0, 0);
  const velocity = new THREE.Vector3(0, 0, circularVelocity(sunMass, data.distance));
  mesh.position.copy(position);

  const trail = createTrail(data.trailColor);

  const planet = {
    name: data.name,
    mesh, radius: data.radius,
    position, velocity,
    mass: data.mass || null,
    trail,
    parent: null,
    parentLabel: 'Distance to Sun',
    previousAngle: angleAround(position, new THREE.Vector3(0, 0, 0)),
    totalAngle: 0
  };

  planets.push(planet);
  meshToTelemetry.set(mesh.uuid, { isStar: false, planet });

  if (data.ring) {
    const ringGeometry = new THREE.RingGeometry(data.ring.innerRadius, data.ring.outerRadius, 64);
    fixRingUVs(ringGeometry, data.ring.innerRadius, data.ring.outerRadius);

    const ringTexture = textureLoader.load(data.ring.texture);
    const ringMaterial = new THREE.MeshBasicMaterial({
      map: ringTexture,
      side: THREE.DoubleSide,
      transparent: true
    });

    const ring = new THREE.Mesh(ringGeometry, ringMaterial);
    ring.rotation.x = Math.PI / 2 - data.ring.tilt;
    ring.position.copy(position);
    scene.add(ring);

    saturnRing = ring;
    saturnMesh = mesh;
  }

  if (data.satellite) {
    const sat = data.satellite;
    const satGeometry = new THREE.SphereGeometry(sat.radius, 32, 32);
    const satMaterial = loadMaterialWithFallback(sat.texture);
    const satMesh = new THREE.Mesh(satGeometry, satMaterial);
    scene.add(satMesh);

    const satPosition = new THREE.Vector3().addVectors(position, new THREE.Vector3(sat.distance, 0, 0));
    const satOrbitalSpeed = circularVelocity(data.mass, sat.distance);
    const satVelocity = new THREE.Vector3().addVectors(velocity, new THREE.Vector3(0, 0, satOrbitalSpeed));
    satMesh.position.copy(satPosition);

    const satTrail = createTrail(sat.trailColor);

    const moonPlanet = {
      name: sat.name,
      mesh: satMesh, radius: sat.radius,
      position: satPosition, velocity: satVelocity,
      mass: sat.mass,
      trail: satTrail,
      parent: planet,
      parentLabel: 'Distance to Earth',
      previousAngle: angleAround(satPosition, position),
      totalAngle: 0
    };

    planets.push(moonPlanet);
    meshToTelemetry.set(satMesh.uuid, { isStar: false, planet: moonPlanet });
  }
});

const asteroidCount = 500;
const asteroidGeometry = new THREE.IcosahedronGeometry(0.25, 0);
const asteroidMaterial = new THREE.MeshStandardMaterial({ color: 0x8a8a8a });
const asteroidBelt = new THREE.InstancedMesh(asteroidGeometry, asteroidMaterial, asteroidCount);
scene.add(asteroidBelt);

const asteroidDummy = new THREE.Object3D();
const asteroids = [];

for (let i = 0; i < asteroidCount; i++) {
  const radius = 32 + Math.random() * (45 - 32);
  const angle = Math.random() * Math.PI * 2;
  const angularSpeed = circularVelocity(sunMass, radius) / radius;
  const inclination = (Math.random() - 0.5) * 0.3;
  const scale = 0.4 + Math.random() * 1.3;
  const spinSpeed = (Math.random() - 0.5) * 0.05;

  asteroids.push({ radius, angle, angularSpeed, inclination, scale, spinSpeed, spin: 0 });
}

function updateAsteroids() {
  for (let i = 0; i < asteroidCount; i++) {
    const a = asteroids[i];
    a.angle += a.angularSpeed * 0.01;
    a.spin += a.spinSpeed;

    const inPlaneX = Math.cos(a.angle) * a.radius;
    const inPlaneZ = Math.sin(a.angle) * a.radius;

    const x = inPlaneX;
    const y = inPlaneZ * Math.sin(a.inclination);
    const z = inPlaneZ * Math.cos(a.inclination);

    asteroidDummy.position.set(x, y, z);
    asteroidDummy.rotation.set(a.spin, a.spin * 0.7, a.spin * 0.4);
    asteroidDummy.scale.setScalar(a.scale);
    asteroidDummy.updateMatrix();

    asteroidBelt.setMatrixAt(i, asteroidDummy.matrix);
  }
  asteroidBelt.instanceMatrix.needsUpdate = true;
}

function addTrailPoint(planet) {
  const trail = planet.trail;

  if (trail.buffer.length < maxTrailPoints) {
    trail.buffer.push(planet.position.clone());
  } else {
    trail.buffer[trail.writeIndex].copy(planet.position);
    trail.writeIndex = (trail.writeIndex + 1) % maxTrailPoints;
  }

  const count = trail.buffer.length;
  const startIndex = trail.buffer.length < maxTrailPoints ? 0 : trail.writeIndex;

  for (let i = 0; i < count; i++) {
    const sourceIndex = (startIndex + i) % maxTrailPoints;
    const point = trail.buffer[sourceIndex];

    const posOffset = i * 3;
    trail.positions[posOffset] = point.x;
    trail.positions[posOffset + 1] = point.y;
    trail.positions[posOffset + 2] = point.z;

    const fade = count > 1 ? i / (count - 1) : 1;
    const colOffset = i * 3;
    trail.colors[colOffset] = trail.baseColor.r * fade;
    trail.colors[colOffset + 1] = trail.baseColor.g * fade;
    trail.colors[colOffset + 2] = trail.baseColor.b * fade;
  }

  trail.geometry.attributes.position.needsUpdate = true;
  trail.geometry.attributes.color.needsUpdate = true;
  trail.geometry.setDrawRange(0, count);
}

const clickableMeshes = [sun, ...planets.map((p) => p.mesh)];
initUI(camera, controls, clickableMeshes, meshToTelemetry);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function animate(time) {
  requestAnimationFrame(animate);

  TWEEN.update(time);
  updatePhysics(planets);
  planets.forEach((planet) => addTrailPoint(planet));
  updateAsteroids();

  if (saturnRing && saturnMesh) {
    saturnRing.position.copy(saturnMesh.position);
  }

  updateUI();

  controls.update();
  renderer.render(scene, camera);
}

animate();