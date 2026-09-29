export const planetsData = [
  {
    name: 'Mercury',
    radius: 1,
    distance: 12,
    texture: './textures/mercure.jpg',
    trailColor: 0xaaaaaa
  },
  {
    name: 'Venus',
    radius: 1.6,
    distance: 18,
    texture: './textures/venus.jpg',
    trailColor: 0xffa500
  },
  {
    name: 'Earth',
    radius: 2,
    distance: 25,
    texture: './textures/terre.jpg',
    trailColor: 0x4488ff,
    mass: 100,
    satellite: {
      name: 'Moon',
      radius: 0.4,
      distance: 3.5,
      mass: 0.1,
      texture: './textures/lune.jpg',
      trailColor: 0xffffff
    }
  },
  {
    name: 'Mars',
    radius: 1.4,
    distance: 32,
    texture: './textures/mars.jpg',
    trailColor: 0xff0000
  },
  {
    name: 'Jupiter',
    radius: 4.2,
    distance: 45,
    texture: './textures/jupiter.jpg',
    trailColor: 0xd2b48c
  },
  {
    name: 'Saturn',
    radius: 3.5,
    distance: 58,
    texture: './textures/saturne.jpg',
    trailColor: 0xe8d9a0,
    ring: {
      innerRadius: 4.5,
      outerRadius: 8,
      texture: './textures/saturne_anneau.png',
      tilt: 0.45
    }
  },
  {
    name: 'Uranus',
    radius: 2.2,
    distance: 72,
    texture: './textures/uranus.jpg',
    trailColor: 0x9fe8f5
  },
  {
    name: 'Neptune',
    radius: 2.1,
    distance: 85,
    texture: './textures/neptune.jpg',
    trailColor: 0x4169e1
  }
];