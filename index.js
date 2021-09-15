import * as THREE from "https://cdn.skypack.dev/three@0.132.2";
// const THREE = require("three");
import { GLTFLoader } from "https://cdn.skypack.dev/three@0.132.2/examples/jsm/loaders/GLTFLoader.js";

let scene, camera, renderer, loader, world, fpsInterval, then, now, elapsed;
let coin;
let speed = 0.3;
let gameStarted = false;
let gameOver = false;
let score = 0;
let highscore = localStorage.getItem("highscore");
export { score };

window.addEventListener("keydown", (e) => {
  switch (e.key) {
    case " ":
      if (!gameStarted) {
        document.getElementById("gamestart").style.display = "none";
        setupEventListeners();
        fpsInterval = 1000 / 60;
        then = Date.now();
        animate();
        gameStarted = true;
      }
  }
});

document.addEventListener("touchend", (e) => {
  if (!gameStarted) {
    document.getElementById("gamestart").style.display = "none";
    setupEventListeners();
    fpsInterval = 1000 / 60;
    then = Date.now();
    animate();
    gameStarted = true;
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
  world.gravity.set(0, 0, 35);
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
  camera.position.set(0, 10, -26.2);

  // Set up lights
  const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
  scene.add(ambientLight);

  const sun = new THREE.DirectionalLight(0xffffcc);
  sun.position.set(10, 10, -10);
  scene.add(sun);

  // Add flappy bird to scene
  loader = new GLTFLoader();
  /* loader.load("assets/super_mario_coin/scene.gltf", function (gltf) {
    coin = gltf.scene;
    coin.rotation.x = Math.PI / 2;
    coin.rotation.y = Math.PI;
    coin.position.x = 0;
    coin.position.y = -20;
    coin.position.z = -10;
    coin.scale.x = 0.05;
    coin.scale.y = 0.05;
    coin.scale.z = 0.05;
    console.log(coin);
    console.log(gltf);
    const coinTween = new TWEEN.Tween(coin.rotation).to(
      {
        y: -Math.PI,
      },
      500
    );
    const coinTween2 = new TWEEN.Tween(coin.rotation).to(
      {
        y: Math.PI,
      },
      500
    );
    coinTween.chain(coinTween2);
    coinTween2.chain(coinTween);
    coinTween.start();
    const coinTween3 = new TWEEN.Tween(coin.position).to(
      {
        z: -12,
      },
      500
    );
    const coinTween4 = new TWEEN.Tween(coin.position).to(
      {
        z: -10,
      },
      500
    );
    coinTween3.chain(coinTween4);
    coinTween4.chain(coinTween3);
    coinTween3.start();
    scene.add(coin);
  }); */
  loader.load(
    "assets/flappy_bird_3d/scene.gltf",
    function (gltf) {
      console.log(gltf);
      flappy.three =
        gltf.scene.children[0].children[0].children[0].children[0].children[1];
      flappy.three.rotation.y = Math.PI;
      flappy.three.rotation.x = -Math.PI / 2;
      flappy.three.position.z = -25;
      console.log(
        gltf.scene.children[0].children[0].children[0].children[0].children[1]
      );

      scene.add(flappy.three);
      const sphere = new CANNON.Sphere(1.2);
      let mass = 1;
      const body = new CANNON.Body({ mass, shape: sphere });
      body.position.set(0, 0, -25);
      flappy.cannon = body;
      flappy.cannon.position.copy(flappy.three.position);
      flappy.cannon.quaternion.copy(flappy.three.quaternion);
      // flappy.cannon.quaternion.x += 2;
      console.log(flappy);
      world.addBody(body);
      flappy.cannon.addEventListener("collide", function (e) {
        console.log("Collision detected", e);
        gameOver = true;
        document.getElementById("scorecard").style.display = "none";
        document.getElementById("gameend").style.display = "flex";
        document.getElementById("endscore").innerHTML = score;
        if ((highscore && score > highscore) || !highscore) {
          document.getElementById("newhighscore").style.display = "flex";
          highscore = score;
          localStorage.setItem("highscore", score);
        }
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
  now = Date.now();
  elapsed = now - then;
  if (elapsed > fpsInterval) {
    then = now - (elapsed % fpsInterval);
    TWEEN.update();
    if (flappy.cannon) {
      flappy.cannon.position.y -= speed;
      if (flappy.cannon.position.z < -obstacle.maxHeight + 2) {
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
    camera.position.z = flappy.cannon.position.z - 1.2;
    camera.position.y = flappy.cannon.position.y + 10;
  }
}

function addSurface() {
  const wall = new THREE.BoxGeometry(
    surface.height,
    surface.depth,
    obstacle.maxHeight
  );
  const colorSky = new THREE.Color(`hsl(201, 100%, 50%)`);
  const materialWall = new THREE.MeshBasicMaterial({ color: colorSky });
  const meshWall = new THREE.Mesh(wall, materialWall);
  meshWall.position.set(-surface.width / 2, -150, -obstacle.maxHeight / 2); // x, y, z
  scene.add(meshWall);
  const wall2 = new THREE.BoxGeometry(
    surface.height,
    surface.depth,
    obstacle.maxHeight
  );
  const newWall = new THREE.Mesh(wall2, materialWall);
  newWall.position.set(surface.width / 2, -150, -obstacle.maxHeight / 2); // x, y, z
  scene.add(newWall);
  const roofgeo = new THREE.BoxGeometry(
    surface.width,
    surface.depth,
    surface.height
  );
  const roof = new THREE.Mesh(roofgeo, materialWall);
  roof.position.set(0, -150, -obstacle.maxHeight); // x, y, z
  scene.add(roof);

  // Three JS
  const geometry = new THREE.BoxGeometry(
    surface.width,
    surface.depth,
    surface.height
  );
  const color = new THREE.Color(`hsl(30, 100%, 50%)`);
  const material = new THREE.MeshToonMaterial({ color });
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
  let height = Math.random() * (obstacle.maxHeight - obstacle.vertSpace);
  if (height < 3) {
    height = 3;
  } else if (height > obstacle.maxHeight - obstacle.vertSpace - 3) {
    height = obstacle.maxHeight - obstacle.vertSpace - 3;
  }
  const geometry = new THREE.CylinderGeometry(width, width, height, 32);
  geometry.rotateX(Math.PI / 2);
  const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
  const cylinder = new THREE.Mesh(geometry, material);
  cylinder.position.set(x, y, -height / 2);
  const topgeom = new THREE.CylinderGeometry(width + 0.5, width + 0.5, 3, 32);
  topgeom.rotateX(Math.PI / 2);
  const topcyl = new THREE.Mesh(topgeom, material);
  topcyl.position.set(x, y, -height + 1.5);
  scene.add(topcyl);
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
  const material2 = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
  const cylinder2 = new THREE.Mesh(geometry2, material2);
  cylinder2.position.set(x, y, -obstacle.maxHeight + height2 / 2);
  scene.add(cylinder2);

  const topgeom2 = new THREE.CylinderGeometry(width + 0.5, width + 0.5, 3, 32);
  topgeom2.rotateX(Math.PI / 2);
  const topcyl2 = new THREE.Mesh(topgeom2, material2);
  topcyl2.position.set(x, y, -obstacle.maxHeight + height2 - 1.5);
  scene.add(topcyl2);

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
  function jump() {
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
  }

  function moveRight() {
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
  }

  function moveLeft() {
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
  }
  // Set up event listeners
  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case " ":
        jump();
        break;
      case "ArrowLeft":
        moveLeft();
        break;
      case "ArrowRight":
        moveRight();
        break;
      case "a":
        moveLeft();
        break;
      case "d":
        moveRight();
        break;
    }
  });
  let click = false;
  let firstX = null;
  let firstY = null;
  document.addEventListener("touchstart", (e) => {
    e.preventDefault();
    const firstTouch = e.touches[0];
    firstX = firstTouch.clientX;
    firstY = firstTouch.clientY;
    click = true;
  });
  document.addEventListener("touchmove", (evt) => {
    evt.preventDefault();
    if (!firstX || !firstY) {
      return;
    }
    var xUp = evt.touches[0].clientX;
    var yUp = evt.touches[0].clientY;

    var xDiff = firstX - xUp;
    var yDiff = firstY - yUp;

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      /*most significant*/
      if (xDiff > 0) {
        /* right swipe */
        moveRight();
      } else {
        /* left swipe */
        moveLeft();
      }
    }
    click = false;
  });
  document.addEventListener("touchend", (e) => {
    e.preventDefault();
    if (click) {
      jump();
    }
  });
}
