import * as THREE from "https://cdn.skypack.dev/three@0.132.2";
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js";

let scene, camera, renderer, flappy, loader;
let gameStarted = false;
window.addEventListener("click", () => {
  if (!gameStarted) {
    animate();
    gameStarted = true;
  } else {
  }
});

const obstacle = {
  width: 4,
  maxHeight: 30,
  vertSpace: 12,
  horSpace: 1,
};

const surface = {
  width: 30,
  height: 0.1,
  depth: 400,
  x: 0,
  y: -1,
  z: -200,
};

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 10, 20);
  camera.lookAt(0, 0, 0);

  // Set up lights
  const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
  scene.add(ambientLight);

  const sun = new THREE.DirectionalLight(0xffffcc);
  sun.position.set(1, 10, 0);
  scene.add(sun);

  // Add flappy bird to scene
  loader = new GLTFLoader();
  loader.load(
    "assets/flappy_bird_3d_vertex_colors/scene.gltf",
    function (gltf) {
      console.log(gltf);
      flappy = gltf.scene;
      flappy.rotation.y = Math.PI / 2;
      scene.add(flappy);
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );

  // Add surface to the scene
  addSurface();

  // Add obstacles to the scene
  addObstacle();

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // Set up event listeners
  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "w":
        camera.position.z -= 1;
        break;
      case "s":
        camera.position.z += 1;
        break;
      case "a":
        camera.position.x -= 1;
        break;
      case "d":
        camera.position.x += 1;
        break;
      case "q":
        camera.position.y += 1;
        break;
      case "e":
        camera.position.y -= 1;
        break;
      case " ":
        flappy.children[0].children[0].children[0].children[0].children[0].children[3].rotation.z += 0.2;
        flappy.rotation.z += 0.05;
        flappy.position.y += 0.5;
        camera.position.y += 0.5;
        break;
      case "ArrowLeft":
        flappy.position.x -= 1;
        camera.position.x -= 1;
        break;
      case "ArrowRight":
        flappy.position.x += 1;
        camera.position.x += 1;
        break;
    }
  });
}

init();

function animate() {
  requestAnimationFrame(animate);
  const speed = 0.15;
  flappy.position.z -= speed;
  camera.position.z -= speed;
  if (flappy) {
    // flappy.rotation.x += 0.01;
    // flappy.rotation.y += 0.01;
  }
  renderer.render(scene, camera);
}
animate();

function addSurface() {
  console.log("Add Surface");
  const y = 0;

  const geometry = new THREE.BoxGeometry(
    surface.width,
    surface.height,
    surface.depth
  );
  const color = new THREE.Color(`hsl(30, 100%, 50%)`);
  const material = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(surface.x, surface.y, surface.z); // x, y, z
  scene.add(mesh);
}

function addObstacle() {
  console.log("Add obstacle");
  const space = surface.width / 3;
  const width = space / 2 - obstacle.horSpace;
  let x;
  for (let i = -1; i < 2; i++) {
    x = i * space + (-i * obstacle.horSpace) / 2;

    createObstacle(x, width);
  }
}

function createObstacle(x, width) {
  // Create bottom obstacle
  const height = Math.random() * (obstacle.maxHeight - obstacle.vertSpace);
  const geometry = new THREE.CylinderGeometry(width, width, height, 32);
  const material = new THREE.MeshLambertMaterial({ color: 0xffff00 });
  const cylinder = new THREE.Mesh(geometry, material);
  cylinder.position.set(x, height / 2, -20);
  scene.add(cylinder);

  // Create top obstacle
  const height2 = obstacle.maxHeight - height - obstacle.vertSpace;
  const geometry2 = new THREE.CylinderGeometry(width, width, height2, 32);
  const material2 = new THREE.MeshLambertMaterial({ color: 0xffff00 });
  const cylinder2 = new THREE.Mesh(geometry2, material2);
  cylinder2.position.set(x, obstacle.maxHeight - height2 / 2, -20);
  scene.add(cylinder2);
}

/* const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const cube = new THREE.Mesh(geometry, material);
scene.add(cube); */
