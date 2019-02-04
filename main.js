var scene, camera, renderer, boxes, colors, depths, raycaster, mouse, selected;

var SILVER = 1;
var BLACK = 2;
var YN = 30,
  XN = 60,
  START_X = XN / 2 - XN - 1,
  START_Y = YN / 2,
  SPACING = 0.2,
  MAX_DEPTH = 3,
  Z_DEPTH_STEP = 0.4;

var WIDTH = window.innerWidth,
  HEIGHT = window.innerHeight - 20;

function getMousePos(event) {
  var v = new THREE.Vector2();
  v.x = (event.clientX / WIDTH) * 2 - 1;
  v.y = -(event.clientY / HEIGHT) * 2 + 1;
  return v;
}

function onMouseDown(event) {
  event.preventDefault();
  mouse = getMousePos(event);
}

function onMouseMove(event) {
  event.preventDefault();
  mouse = getMousePos(event);
}
function onMouseUp(event) {
  event.preventDefault();
  mouse = getMousePos(event);
}

function onKeyDown(event) {
  event.preventDefault();
  if (event.which == 70) {
    // f
    changeDepthBy(1);
  } else if (event.which == 68) {
    // d
    changeDepthBy(-1);
  } else if (event.which == 67) {
    // c
    toggleColor();
  }
}

function updateColor(index) {
  switch (colors[index]) {
    case SILVER:
      boxes[index].material.color.set(0xaaaaaa);
      break;

    case BLACK:
      boxes[index].material.color.set(0x333333);
      break;

    default:
      boxes[index].material.color.set(0x00ccff);
  }
}

function updateBoxZ(index) {
  boxes[index].position.z = Z_DEPTH_STEP * depths[index];
}

function save() {
  var data = {
    colors: colors,
    depths: depths
  };

  navigator.clipboard.writeText(JSON.stringify(data));
}

function load(data) {
  for (var i = 0; i < depths.length; i++) {
    colors[i] = data.colors[i];
    depths[i] = data.depths[i];

    updateBoxZ(i);
    updateColor(i);
  }
}

function toggleColor() {
  if (selected) {
    // only for extruded
    if (depths[selected] > 0) {
      colors[selected] += 1;
      if (colors[selected] > 2) {
        colors[selected] = 1;
      }
      updateColor(selected);
      save();
    }
  }
}

function changeDepthBy(amount) {
  if (selected) {
    depths[selected] += amount;
    if (depths[selected] > MAX_DEPTH) depths[selected] = MAX_DEPTH;
    if (depths[selected] < 0) depths[selected] = 0;

    // when was raised for the first time, make it silver automatically
    if (amount > 0 && depths[selected] == 1) {
      colors[selected] = 1;
    }

    // reset color
    if (depths[selected] == 0) {
      colors[selected] = 0;
    }
    updateColor(selected);
    updateBoxZ(selected);
    save();
  }
}

init();
render();

// Sets up the scene.
function init() {
  // Create the scene and set the scene size.
  scene = new THREE.Scene();

  // Create a renderer and add it to the DOM.
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(WIDTH, HEIGHT);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);
  renderer.domElement.id = "context";

  // Create a camera, zoom it out from the model a bit, and add it to the scene.
  camera = new THREE.PerspectiveCamera(45, WIDTH / HEIGHT, 0.1, 1000);
  camera.position.set(0, 0, 45);
  scene.add(camera);

  var spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(0, YN / 2, 30);
  scene.add(spotLight);

  var backspotLight = new THREE.SpotLight(0xffffff);
  backspotLight.position.set(0, -YN / 2, -30);
  scene.add(backspotLight);

  // var spotLightHelper = new THREE.SpotLightHelper(spotLight);
  // scene.add(spotLightHelper);

  var controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.25;
  controls.screenSpacePanning = true;
  controls.minDistance = 1;
  controls.maxDistance = 500;
  controls.maxPolarAngle = Math.PI;

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();

  boxes = new Array();
  colors = new Array();
  depths = new Array();

  for (var y = 0; y < YN; y++)
    for (var x = 0; x < XN; x++) {
      var material = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
      var geometry = new THREE.BoxGeometry(1, 1, 5);
      var cube = new THREE.Mesh(geometry, material);
      colors.push(0);
      depths.push(0);
      boxes.push(cube);
      scene.add(cube);

      cube.position.x = START_X + (1 + SPACING) * x - (SPACING * XN) / 2 + 1.5;
      cube.position.y = START_Y - (1 + SPACING) * y + (SPACING * YN) / 2;
      cube.position.z = 0;
    }

  selected = null;
}

function render() {
  window.requestAnimationFrame(render);
  renderer.setClearColor(0xcccccc, 1);

  for (var i = 0; i < boxes.length; i++) {
    updateColor(i);
  }

  raycaster.setFromCamera(mouse, camera);
  var intersects = raycaster.intersectObjects(scene.children);

  if (intersects.length > 0) {
    var index = boxes.indexOf(intersects[0].object);
    if (index) {
      selected = index;
    }
  } else {
    selected = null;
  }

  renderer.render(scene, camera);
}

window.addEventListener("mousedown", onMouseDown, false);
window.addEventListener("mousemove", onMouseMove, false);
window.addEventListener("mouseup", onMouseUp, false);
document.addEventListener("keydown", onKeyDown, false);
