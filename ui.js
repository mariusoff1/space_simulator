const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

let camera = null;
let controls = null;
let clickableMeshes = [];
let meshToTelemetry = null;

let focusedTelemetry = null;
let focusedTarget = null;
let isTweening = false;
let lastFocusPosition = new THREE.Vector3();

const infoPanel = document.getElementById('info-panel');
const infoName = document.getElementById('info-name');
const infoSpeed = document.getElementById('info-speed');
const infoDistance = document.getElementById('info-distance');
const infoDistanceLabel = document.getElementById('info-distance-label');
const infoRevolutions = document.getElementById('info-revolutions');

function focusOn(mesh, telemetry) {
  isTweening = true;
  controls.enabled = false;

  const targetPos = mesh.position.clone();
  const radius = telemetry.isStar ? 8 : telemetry.planet.radius;
  const desiredDistance = radius * 8 + 4;

  const directionFromTarget = camera.position.clone().sub(targetPos);
  if (directionFromTarget.length() < 0.001) {
    directionFromTarget.set(0, 1, 2);
  }
  directionFromTarget.normalize();

  const newCameraPos = targetPos.clone().addScaledVector(directionFromTarget, desiredDistance);

  new TWEEN.Tween(camera.position)
    .to({ x: newCameraPos.x, y: newCameraPos.y, z: newCameraPos.z }, 1500)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start();

  new TWEEN.Tween(controls.target)
    .to({ x: targetPos.x, y: targetPos.y, z: targetPos.z }, 1500)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onComplete(() => {
      isTweening = false;
      controls.enabled = true;
      focusedTelemetry = telemetry;
      focusedTarget = mesh;
      lastFocusPosition.copy(mesh.position);
    })
    .start();
}

function clearFocus() {
  focusedTelemetry = null;
  focusedTarget = null;
  infoPanel.style.display = 'none';
}

function onClick(event) {
  if (isTweening) return;

  pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(clickableMeshes);

  if (intersects.length > 0) {
    const hitMesh = intersects[0].object;
    const telemetry = meshToTelemetry.get(hitMesh.uuid);
    focusOn(hitMesh, telemetry);
  } else {
    clearFocus();
  }
}

export function initUI(sceneCamera, sceneControls, meshesToClick, telemetryMap) {
  camera = sceneCamera;
  controls = sceneControls;
  clickableMeshes = meshesToClick;
  meshToTelemetry = telemetryMap;

  window.addEventListener('click', onClick);
}

function updateInfoPanel() {
  if (!focusedTelemetry) {
    infoPanel.style.display = 'none';
    return;
  }

  infoPanel.style.display = 'block';

  if (focusedTelemetry.isStar) {
    infoName.textContent = 'Sun';
    infoSpeed.textContent = '0.00 u/s';
    infoDistanceLabel.textContent = 'Distance to Sun';
    infoDistance.textContent = '0.00 u';
    infoRevolutions.textContent = '-';
    return;
  }

  const planet = focusedTelemetry.planet;
  const speed = planet.velocity.length();
  const center = planet.parent ? planet.parent.position : new THREE.Vector3(0, 0, 0);
  const distance = planet.position.clone().sub(center).length();
  const revolutions = Math.abs(planet.totalAngle) / (2 * Math.PI);

  infoName.textContent = planet.name;
  infoSpeed.textContent = speed.toFixed(2) + ' u/s';
  infoDistanceLabel.textContent = planet.parentLabel;
  infoDistance.textContent = distance.toFixed(2) + ' u';
  infoRevolutions.textContent = revolutions.toFixed(3);
}

function updateCameraFollow() {
  if (!focusedTarget || isTweening) return;

  const delta = focusedTarget.position.clone().sub(lastFocusPosition);
  camera.position.add(delta);
  controls.target.add(delta);
  lastFocusPosition.copy(focusedTarget.position);
}

export function updateUI() {
  updateCameraFollow();
  updateInfoPanel();
}