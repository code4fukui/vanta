import { THREE, scene, camera, renderer } from "https://code4fukui.github.io/egxr.js/egxr.js";
import { Boid } from "./src/Boid.js";

const options = {
  quantity: 5,
  birdSize: 0.5,
  colorMode: "",
  color1: 0xcf0000,
  color2: 0x7f0000,
  width: 300,
  height: 300,
  depth: 300,
  neighborhoodRadius: 0.3,
  maxSpeed: 0.3,
  maxSteerForce: 0.3,
  separation: 9000,
  avoidWalls: false,
};

const thdistance = 10;

const getNewCol = (order, options) => {
  const color1 = options.color1 != null ? options.color1 : 0x440000
  const color2 = options.color2 != null ? options.color2 : 0x660000
  const c1 = new THREE.Color(color1)
  const c2 = new THREE.Color(color2)
  const gradient = options.colorMode.indexOf('Gradient') != -1
  let c, dist
  if (gradient) {
    // each vertex has a different color
    dist = Math.random()
  } else {
    // each vertex has the same color
    dist = order
  }

  if (options.colorMode.indexOf('variance') == 0) {
    const r2 = (c1.r + Math.random() * c2.r).clamp(0,1)
    const g2 = (c1.g + Math.random() * c2.g).clamp(0,1)
    const b2 = (c1.b + Math.random() * c2.b).clamp(0,1)
    c = new THREE.Color(r2, g2, b2)
  } else if (options.colorMode.indexOf('mix') == 0) {
    // Naive color arithmetic
    c = new THREE.Color(color1 + dist * color2)
  } else {
    // Linear interpolation
    c = c1.lerp(c2, dist)
  }
  return c
}

const getNewBirdGeometryBasic = (options={}) => {
  const scope = new THREE.BufferGeometry()
  const points = []
  function v( x, y, z ) {
    const s = 1.5 * (options.birdSize || 1)
    points.push( new THREE.Vector3( x*s, y*s, z*s ) )
  }
  v(   5,   0,   0 )
  v( - 5, - 1,   1 )
  v( - 5,   0,   0 )
  v( - 5, - 2, - 1 )
  v(   0,   2, - 6 )
  v(   0,   2,   6 )
  v(   2,   0,   0 )
  v( - 3,   0,   0 )
  scope.setFromPoints(points)

  const indices = []
  indices.push( 0, 2, 1 )
  // f3( 0, 3, 2 )
  indices.push( 4, 7, 6 )
  indices.push( 5, 6, 7 )
  scope.setIndex(indices)

  // this.computeCentroids()
  return scope
}

const BIRD_V = 1;

const boids = [];
const birds = [];
const numBirds = 6 * Math.pow(2, options.quantity)
for (let i = 0; i < numBirds; i++) {
  const boid = boids[i] = new Boid(options);
  boid.position.x = (Math.random() * 2 - 1) * options.width;
  boid.position.y = (Math.random() * 2 - 1) * options.height;
  //boid.position.y = Math.random() * options.height;
  boid.position.z = (Math.random() * 2 - 1) * options.depth;
  boid.velocity.x = (Math.random() * 2 - 1) * BIRD_V;
  boid.velocity.y = (Math.random() * 2 - 1) * BIRD_V;
  boid.velocity.z = (Math.random() * 2 - 1) * BIRD_V;
  //boid.setWorldSize( 500, 500, 300 )

  const gradient = options.colorMode.indexOf('Gradient') != -1

  const newBirdGeo = getNewBirdGeometryBasic(options)
  const numV = newBirdGeo.attributes.position.length

  const bird = birds[i] = new THREE.Mesh(
    newBirdGeo,
    new THREE.MeshBasicMaterial( {
      //color: 0xffffff,
      color: getNewCol(i / numBirds, options),
      side: THREE.DoubleSide,
      // colors: THREE.VertexColors,
      // vertexColors: THREE.VertexColors,
    })
  );
  bird.phase = Math.floor(Math.random() * 62.83)
  bird.position.x = boids[i].position.x
  bird.position.y = boids[i].position.y
  bird.position.z = boids[i].position.z
  scene.add( bird )
}

const repulseBirds = (pos, thdistance) => {
  const vector = pos.clone();
  for (let i = 0, il = boids.length; i < il; i++) {
    const boid = boids[i];
    vector.z = boid.position.z;
    boid.repulse(vector, thdistance);
  }
};

//const FLIP_V = 0.1;
const FLIP_V = 0.3;

const updateBirds = () => {
  for (let i = 0, il = birds.length; i < il; i++) {
    const boid = boids[i]
    boid.run(boids)
    const bird = birds[i]
    // color = bird.material.color
    // color.r = color.g = color.b = ( 500 - bird.position.z ) / 1000
    bird.rotation.y = Math.atan2(-boid.velocity.z, boid.velocity.x)
    bird.rotation.z = Math.asin(boid.velocity.y / boid.velocity.length())
    // Flapping
    bird.phase = (bird.phase + FLIP_V * (Math.max(0, bird.rotation.z) + 0.1)) % 62.83;

    const tip1 = 5 * 3 + 1;
    const tip2 = 4 * 3 + 1;
    const array = bird.geometry.attributes.position.array;
    array[tip1] = array[tip2] = Math.sin(bird.phase) * 5 * options.birdSize;
    bird.geometry.attributes.position.needsUpdate = true
    bird.geometry.computeVertexNormals()

    bird.position.x = boids[i].position.x
    bird.position.y = boids[i].position.y
    bird.position.z = boids[i].position.z
  }
};

scene.background = new THREE.Color(0x000000);

renderer.setAnimationLoop(() => {
  repulseBirds(camera.position, thdistance);
  updateBirds();
	renderer.render(scene, camera);
});

document.body.onkeydown = (e) => {
  const key = e.key;
  const D = 0.5;
  if (key == "ArrowDown") {
    camera.position.z += D;
  } else if (key == "ArrowUp") {
    camera.position.z -= D;
  } else if (key == "ArrowLeft") {
    camera.position.x -= D;
  } else if (key == "ArrowRight") {
    camera.position.x += D;
  }
};

export { scene, renderer };
