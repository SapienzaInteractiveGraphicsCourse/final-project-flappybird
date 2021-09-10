import * as THREE from "https://cdn.skypack.dev/three@0.132.2";
// const THREE = require("three");
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js";

let scene, camera, renderer, loader, world;
let speed = 0.25;
let gameStarted = false;
let gameOver = false;
let score = 0;
window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case " ":
      if (!gameStarted) {
        document.getElementById("gamestart").style.display = "none";
        setupEventListeners();
        animate();
        gameStarted = true;
      }
  }
});

const obstacle = {
  width: 4,
  maxHeight: 40,
  vertSpace: 16,
  horSpace: 1,
  depthSpace: 50,
};

const surface = {
  width: 30,
  height: 0.1,
  depth: 10000,
  x: 0,
  y: 0,
  z: -200,
};

const obstacles = [];

const box = { three: null, cannon: null };
const flappy = { three: null, cannon: null };

function init() {
  world = new CANNON.World();
  world.gravity.set(0, 0, 30);
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 40;

  scene = new THREE.Scene();

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 10, -10);
  camera.lookAt(0, 0, -10);
  camera.position.set(0, 10, -14);

  // Set up lights
  const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
  scene.add(ambientLight);

  const sun = new THREE.DirectionalLight(0xffffcc);
  sun.position.set(1, 10, -10);
  scene.add(sun);

  // Add flappy bird to scene
  loader = new GLTFLoader();
  loader.load(
    "assets/flappy_bird_3d/scene.gltf",
    function (gltf) {
      console.log(gltf);
      flappy.three =
        gltf.scene.children[0].children[0].children[0].children[0].children[1];
      flappy.three.rotation.y = Math.PI;
      flappy.three.rotation.x = -Math.PI / 2;
      flappy.three.position.z = -10;
      console.log(
        gltf.scene.children[0].children[0].children[0].children[0].children[1]
      );

      scene.add(flappy.three);
      const sphere = new CANNON.Sphere(1.5);
      let mass = 1;
      const body = new CANNON.Body({ mass, shape: sphere });
      body.position.set(0, 0, -10);
      flappy.cannon = body;
      flappy.cannon.position.copy(flappy.three.position);
      flappy.cannon.quaternion.copy(flappy.three.quaternion);
      // flappy.cannon.quaternion.x += 2;
      console.log(flappy);
      world.addBody(body);
      flappy.cannon.addEventListener("collide", function (e) {
        console.log("Collision detected", e);
        gameOver = true;
        document.getElementById("gameend").style.display = "flex";
        document.getElementById("endscore").innerHTML = score;
      });

      const wing1 = flappy.three.children[2];
      const wing2 = flappy.three.children[3];
      function wingRotate(wing, angle) {
        return new TWEEN.Tween(wing.rotation).to(
          {
            z: angle,
          },
          100
        );
      }
      const tweenA1 = wingRotate(wing1, 0);
      const tweenB1 = wingRotate(wing1, Math.PI / 4);
      const tweenA2 = wingRotate(wing2, 0);
      const tweenB2 = wingRotate(wing2, -Math.PI / 4);
      tweenA1.chain(tweenB1);
      tweenB1.chain(tweenA1);
      tweenB1.start();
      tweenA2.chain(tweenB2);
      tweenB2.chain(tweenA2);
      tweenB2.start();
      renderer.render(scene, camera);
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );

  // Add surface to the scene
  addSurface();

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  renderer.render(scene, camera);
}

init();

function animate() {
  if (!gameOver) {
    requestAnimationFrame(animate);
  }
  TWEEN.update();
  if (flappy.cannon) {
    flappy.cannon.position.y -= speed;
    if (flappy.cannon.position.z < -obstacle.maxHeight) {
      flappy.cannon.velocity.z = 1;
    }
    const body = flappy.three;

    if (flappy.cannon.velocity.z > 2) {
      flappyRotateZ(body, (-3 * Math.PI) / 4);
    } else if (flappy.cannon.velocity.z < -2) {
      flappyRotateZ(body, -Math.PI / 4);
    } else {
      flappyRotateZ(body, -Math.PI / 2);
    }

    if (
      flappy.cannon.position.y <=
      obstacles[0].three.position.y - obstacle.width - 2
    ) {
      score += 1;
      if (score % 2 === 0) {
        speed += 0.02;
      }
      document.getElementById("score").innerHTML = score;
      console.log(score);
      for (let i = 0; i < 6; i++) {
        obstacles[i].three.geometry.dispose();
        obstacles[i].three.material.dispose();
        scene.remove(obstacles[i].three);
      }
      obstacles.splice(0, 6);
      addObstacle(
        obstacles[obstacles.length - 1].three.position.y - obstacle.depthSpace
      );
    }
  }
  updatePhysics();
  renderer.render(scene, camera);
}
// animate();

function updatePhysics() {
  world.step(1 / 60);
  obstacles.forEach((element) => {
    element.three.position.copy(element.cannon.position);
    element.three.quaternion.copy(element.cannon.quaternion);
  });
  if (flappy.three) {
    flappy.three.position.copy(flappy.cannon.position);
    // flappy.three.quaternion.copy(flappy.cannon.quaternion);
    camera.position.x = flappy.cannon.position.x;
    camera.position.z = flappy.cannon.position.z - 4;
    camera.position.y = flappy.cannon.position.y + 10;
  }
}

function addSurface() {
  // Three JS
  const geometry = new THREE.BoxGeometry(
    surface.width,
    surface.depth,
    surface.height
  );
  const color = new THREE.Color(`hsl(30, 100%, 50%)`);
  const material = new THREE.MeshLambertMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, -150, 0); // x, y, z
  scene.add(mesh);

  // Cannon JS
  const shape = new CANNON.Box(
    new CANNON.Vec3(surface.width / 2, surface.depth / 2, surface.height / 2)
  );
  let mass = 0;
  const body = new CANNON.Body({ mass, shape });
  body.position.set(0, -150, 0);
  world.addBody(body);

  const numObstacleRows = surface.depth / (30 * obstacle.depthSpace);
  for (let y = 1; y < numObstacleRows; y++) {
    addObstacle(-y * obstacle.depthSpace);
  }
}

function addObstacle(y) {
  const space = surface.width / 3;
  const width = space / 2 - obstacle.horSpace;
  let x;
  for (let i = -1; i < 2; i++) {
    x = i * space + (-i * obstacle.horSpace) / 2;

    createObstacle(x, y, width);
  }
}

function createObstacle(x, y, width) {
  // Create bottom obstacle
  const height = Math.random() * (obstacle.maxHeight - obstacle.vertSpace);

  const geometry = new THREE.CylinderGeometry(width, width, height, 32);
  geometry.rotateX(Math.PI / 2);
  const material = new THREE.MeshLambertMaterial({ color: 0xffff00 });
  const cylinder = new THREE.Mesh(geometry, material);
  cylinder.position.set(x, y, -height / 2);
  // Cannon JS
  const shape = new CANNON.Cylinder(width, width, height, 32);
  const massive = 0;
  const body = new CANNON.Body({ mass: massive, shape: shape });
  body.position.set(x, y, -height / 2);

  scene.add(cylinder);
  world.addBody(body);
  obstacles.push({ three: cylinder, cannon: body });

  // Create top obstacle
  const height2 = obstacle.maxHeight - height - obstacle.vertSpace;
  const geometry2 = new THREE.CylinderGeometry(width, width, height2, 32);
  geometry2.rotateX(Math.PI / 2);
  const material2 = new THREE.MeshLambertMaterial({ color: 0xffff00 });
  const cylinder2 = new THREE.Mesh(geometry2, material2);
  cylinder2.position.set(x, y, -obstacle.maxHeight + height2 / 2);
  scene.add(cylinder2);

  const shape2 = new CANNON.Cylinder(width, width, height2, 32);
  const mass2 = 0;
  const body2 = new CANNON.Body({ mass: mass2, shape: shape2 });
  body2.position.set(x, y, -obstacle.maxHeight + height2 / 2);
  world.addBody(body2);
  obstacles.push({ three: cylinder2, cannon: body2 });
}

function flappyRotateZ(body, angle) {
  var tween = new TWEEN.Tween(body.rotation)
    .to(
      {
        x: angle,
      },
      200
    )
    .start();
}

function setupEventListeners() {
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
        if (flappy.cannon.velocity.z > 5) {
          flappy.cannon.velocity.z = -10;
        } else {
          // flappy.cannon.velocity.z -= 15;
          flappy.cannon.applyImpulse(
            new CANNON.Vec3(0, 0, -15),
            new CANNON.Vec3(
              flappy.cannon.position.x,
              flappy.cannon.position.y,
              flappy.cannon.position.z
            )
          );
        }
        break;
      case "ArrowLeft":
        // box.cannon.position.x -= 1;
        if (flappy.cannon.position.x > -5) {
          var tween = new TWEEN.Tween(flappy.cannon.position)
            .to(
              {
                x:
                  flappy.cannon.position.x -
                  surface.width / 3 +
                  obstacle.horSpace / 2,
              },
              100
            )
            .start();
          var tween = new TWEEN.Tween(flappy.three.rotation)
            .to({ z: -Math.PI / 8 }, 100)
            .chain(new TWEEN.Tween(flappy.three.rotation).to({ z: 0 }, 100))
            .start();
        }
        break;
      case "ArrowRight":
        // box.cannon.position.x += 1;
        if (flappy.cannon.position.x < 5) {
          var tween = new TWEEN.Tween(flappy.cannon.position)
            .to(
              {
                x:
                  flappy.cannon.position.x +
                  surface.width / 3 -
                  obstacle.horSpace / 2,
              },
              100
            )
            .start();
          var tween = new TWEEN.Tween(flappy.three.rotation)
            .to({ z: Math.PI / 8 }, 100)
            .chain(new TWEEN.Tween(flappy.three.rotation).to({ z: 0 }, 100))
            .start();
        }
        break;
    }
  });
}
