export const G = 1;
export const sunMass = 10000;
export const dt = 0.01;

export function circularVelocity(mass, radius) {
  return Math.sqrt((G * mass) / radius);
}

export function angleAround(position, center) {
  const relX = position.x - center.x;
  const relZ = position.z - center.z;
  return Math.atan2(relZ, relX);
}

export function computeAcceleration(planet) {
  const acceleration = new THREE.Vector3(0, 0, 0);

  const toSun = new THREE.Vector3().subVectors(new THREE.Vector3(0, 0, 0), planet.position);
  const sunDistSq = toSun.lengthSq();
  const sunForceMag = (G * sunMass) / sunDistSq;
  acceleration.add(toSun.normalize().multiplyScalar(sunForceMag));

  if (planet.parent) {
    const toParent = new THREE.Vector3().subVectors(planet.parent.position, planet.position);
    const parentDistSq = toParent.lengthSq();
    const parentForceMag = (G * planet.parent.mass) / parentDistSq;
    acceleration.add(toParent.normalize().multiplyScalar(parentForceMag));
  }

  return acceleration;
}

export function updateRevolutionTracking(planet) {
  const center = planet.parent ? planet.parent.position : new THREE.Vector3(0, 0, 0);
  const currentAngle = angleAround(planet.position, center);
  let delta = currentAngle - planet.previousAngle;

  if (delta > Math.PI) delta -= 2 * Math.PI;
  if (delta < -Math.PI) delta += 2 * Math.PI;

  planet.totalAngle += delta;
  planet.previousAngle = currentAngle;
}

export function updatePhysics(planets) {
  const accelerations = planets.map((planet) => computeAcceleration(planet));

  planets.forEach((planet, index) => {
    planet.velocity.addScaledVector(accelerations[index], dt);
    planet.position.addScaledVector(planet.velocity, dt);
    planet.mesh.position.copy(planet.position);
    planet.mesh.rotation.y += 0.01;
    updateRevolutionTracking(planet);
  });
}