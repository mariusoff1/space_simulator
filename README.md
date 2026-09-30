# 3D Solar System Simulator

An interactive 3D simulation of the Solar System that runs in the browser. Planets and the Moon are moved by a real Newtonian gravity integrator (not pre-scripted circular paths), rendered with [Three.js](https://threejs.org/), and can be clicked to zoom in and read live telemetry.

## Features

- **N-body style gravity**: each body is accelerated by the Sun, and the Moon is also attracted by the Earth.
- **Live telemetry panel**: click a body to see its orbital speed, distance to its parent (Sun or Earth) and number of completed revolutions.
- **Smooth camera focus**: animated zoom-in on the selected body (Tween.js), then the camera follows it as it orbits.
- **Fading orbit trails**: each body leaves a colored trail that fades out over its last 150 positions.
- **Textured planets** with a graceful fallback to a plain grey material if a texture file is missing.
- **Saturn's rings** with custom UV mapping and a tilted, transparent ring texture.
- **Asteroid belt**: 500 instanced, randomly sized, spinning asteroids drawn with a single `InstancedMesh`.
- **Free camera** with orbit controls (rotate, pan, zoom) and damping.

## Getting started

### Prerequisites

- A modern browser with WebGL support.
- A way to serve static files locally. The project uses ES modules (`<script type="module">`), which browsers block when a page is opened directly from `file://`.
- An internet connection, since Three.js and Tween.js are loaded from CDNs.

### Run it

1. Clone or download the repository.
2. Make sure the textures are in a `textures/` folder (see [Textures](#textures)).
3. Start any local web server from the project root, for example:

   ```bash
   # Python 3
   python -m http.server 8000

   # or Node.js
   npx serve .
   ```

4. Open `http://localhost:8000` in your browser.

## Controls

| Action | Result |
| --- | --- |
| Left-click + drag | Rotate the camera |
| Right-click + drag | Pan |
| Mouse wheel | Zoom |
| Click on a planet, the Moon or the Sun | Zoom in, follow the body and open its telemetry panel |
| Click in the void | Release focus and hide the panel |

## Project structure

```
.
├── index.html        # Page layout, info panel and CDN script tags
├── style.css         # Styling of the HUD (info panel and instructions)
├── script.js         # Scene setup, meshes, trails, asteroid belt, main loop
├── physics.js        # Gravity, integration and revolution tracking
├── planetsData.js    # Data for each planet (size, distance, texture, trail color...)
├── ui.js             # Raycasting, camera focus/follow and telemetry panel
└── textures/         # Image assets (not included in the code files)
```

## How it works

### Physics (`physics.js`)

The simulation uses arbitrary units (`u`) rather than real-world scale:

| Constant | Value | Meaning |
| --- | --- | --- |
| `G` | `1` | Gravitational constant |
| `sunMass` | `10000` | Mass of the Sun |
| `dt` | `0.01` | Time step per frame |

- **Acceleration**: for every body, `a = G·M / r²` directed toward the Sun. Bodies that have a `parent` (the Moon) also receive the attraction of that parent.
- **Initial conditions**: each planet starts on the x-axis with the circular orbital velocity `v = √(G·M / r)`, pointing along the z-axis. The Moon starts around the Earth with the Earth's velocity plus its own circular velocity around the Earth.
- **Integration**: accelerations are computed for all bodies first, then velocities and positions are updated with a semi-implicit (symplectic) Euler step, which keeps orbits stable over long runs.
- **Revolutions**: the angle of each body around its center (Sun or parent) is unwrapped frame by frame and accumulated, so the revolution count is the total angle divided by 2π.

Planets do not attract each other, and the Earth is not pulled by the Moon. Only the Sun-planet and Earth-Moon interactions are modeled. Asteroids are not integrated with the physics engine: they move along pre-computed circular orbits with a slight random inclination.

### Rendering (`script.js`)

- The scene contains a star-field sphere (rendered from the inside), an emissive Sun and a `PointLight` placed at the origin.
- Each planet is a textured `SphereGeometry`; trails are `THREE.Line` objects whose vertex colors fade along a circular buffer.
- The asteroid belt orbits between distances 32 and 45 units.

### Interaction (`ui.js`)

A `Raycaster` detects which mesh is clicked. A Tween.js animation moves the camera and the orbit-controls target to the selected body. Afterwards, the camera is translated every frame by the body's displacement so that it keeps following it.

## Customization

### Add or edit a planet

Edit `planetsData.js`. Each entry supports:

```js
{
  name: 'Earth',
  radius: 2,                      // visual radius
  distance: 25,                   // initial distance to the Sun
  texture: './textures/terre.jpg',
  trailColor: 0x4488ff,
  mass: 100,                      // needed if the body has a satellite
  satellite: { /* name, radius, distance, mass, texture, trailColor */ },
  ring: { /* innerRadius, outerRadius, texture, tilt */ }
}
```

### Tune the simulation

- Change `G`, `sunMass` or `dt` in `physics.js` to speed up, slow down or reshape the orbits.
- Change `maxTrailPoints` in `script.js` for longer or shorter trails.
- Change `asteroidCount` and the radius range in `script.js` to modify the asteroid belt.

## Textures

The code expects the following files in a `textures/` folder:

`soleil.jpg`, `etoiles.jpg`, `mercure.jpg`, `venus.jpg`, `terre.jpg`, `lune.jpg`, `mars.jpg`, `jupiter.jpg`, `saturne.jpg`, `saturne_anneau.png`, `uranus.jpg`, `neptune.jpg`

If a planet or moon texture is missing, it falls back to a grey material. The Sun, the star field and Saturn's ring have no fallback, so make sure those files are present. Free planetary maps can be found, for example, on [Solar System Scope](https://www.solarsystemscope.com/textures/).

## Built with

- [Three.js](https://threejs.org/) r128 (including `OrbitControls`)
- [Tween.js](https://github.com/tweenjs/tween.js) 18.6.4
- Vanilla JavaScript (ES modules), HTML and CSS

## Limitations

- Distances, sizes, masses and speeds are **not to scale**; the goal is a readable and stable visualization, not astronomical accuracy.
- Planet-planet interactions and the Earth's reaction to the Moon are ignored.
- The time step is tied to the frame rate, so the simulation runs faster on high-refresh-rate displays.

## Author

Physics & graphics simulation by **Marius FAKA**.

## License

Add your license here (for example MIT).
