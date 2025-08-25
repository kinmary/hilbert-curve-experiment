import * as THREE from "three";
import GUI from "lil-gui";
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import * as GeometryUtils from 'three/addons/utils/GeometryUtils.js';

/**
 * Base
 */
//Debug
const gui = new GUI();

//Canvas
const canvas = document.querySelector("canvas.webgl");

//Scene
const scene = new THREE.Scene();

/**
 * Objects
 */
//Hilbert Curve 3D
const positions3D = [];
const colors3D = []

const coordinates3D = GeometryUtils.hilbert3D(new THREE.Vector3(0, 0, 0), 20); //default iterations = 1
const spline3D = new THREE.CatmullRomCurve3(coordinates3D);
const divisions3D = Math.round(12 * coordinates3D.length);

const point = new THREE.Vector3();
const color = new THREE.Color();
for(let i = 0; i < divisions3D; i++){
    const t = i / divisions3D; //to normalize 0..1
    
    spline3D.getPoint(t, point)
    positions3D.push(point.x, point.y, point.z);

    color.setHSL(t, 1.0, 0.5, THREE.SRGBColorSpace);
    colors3D.push(color.r, color.g, color.b)
}

const line3DGeometry = new LineGeometry();
line3DGeometry.setPositions(positions3D)
line3DGeometry.setColors(colors3D)

const line3DMaterial = new LineMaterial({
    linewidth: 6,
    vertexColors: true,
    dashed: false,
    worldUnits: true,
    // alphaToCoverage: true
})

const line3D = new Line2(line3DGeometry, line3DMaterial);
line3D.computeLineDistances()
// line3D.scale.set(1, 1, 1)
scene.add(line3D)

/**
 * Sizes
 */
const sizes = {
  width: window.innerWidth,
  height: window.innerHeight,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

// --- helpers: visible size in world units at a given Z (PerspectiveCamera)
function getVisibleHeightAtZ(z, camera) {
  const vFov = THREE.MathUtils.degToRad(camera.fov);
  const dist = Math.abs((new THREE.Vector3(0,0,z)).z - camera.position.z);
  return 2 * Math.tan(vFov / 2) * dist;
}
function getVisibleWidthAtZ(z, camera) {
  return getVisibleHeightAtZ(z, camera) * camera.aspect;
}

// get object's half-size (radius) in world units (accounts for scale)
function getHalfExtentsYandX(obj) {
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  box.getSize(size);
  return { halfY: size.y * 0.5, halfX: size.x * 0.5 };
}

// recompute bounds in world units at the object's current depth
function getWorldBoundsForObject(camera, obj) {
  const objPos = obj.getWorldPosition(new THREE.Vector3());
  const { halfY, halfX } = getHalfExtentsYandX(obj);

  const visH = getVisibleHeightAtZ(objPos.z, camera);
  const visW = getVisibleWidthAtZ(objPos.z, camera);

  // bounds centered around camera lookAt (assumes scene center)
  const yMax =  visH * 0.5 - halfY;
  const yMin = -visH * 0.5 + halfY;

  const xMax =  visW * 0.5 - halfX;
  const xMin = -visW * 0.5 + halfX;

  return { yMin, yMax, xMin, xMax };
}


window.addEventListener("resize", () => {
  //Update sizes
  sizes.width = window.innerWidth;
  sizes.height = window.innerHeight;
  sizes.pixelRatio = Math.min(window.devicePixelRatio, 2);

  //Update camera
  camera.aspect = sizes.width / sizes.height;
  camera.updateProjectionMatrix();

  //Update renderer
  renderer.setSize(sizes.width, sizes.height);
  renderer.setPixelRatio(sizes.pixelRatio);
  // Update line material resolution for correct width/dashes when needed
  if (line3DMaterial.resolution) {
    line3DMaterial.resolution.set(sizes.width, sizes.height);
  }
});

/**
 * Camera
 */
const camera = new THREE.PerspectiveCamera(25, sizes.width / sizes.height, 0.1, 500);
camera.position.set(10, 0, 150);
scene.add(camera);

//Controls
const controls = new OrbitControls(camera, canvas);
// controls.enableDamping = true;
controls.enableRotate = false;
controls.enablePan = false;
controls.minDistance = 150;
controls.maxDistance = 300;

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
});
renderer.setSize(sizes.width, sizes.height);
renderer.setPixelRatio(sizes.pixelRatio);
// const backgroundColor = new THREE.Color();
// backgroundColor.setHSL(Math.random(), 1, 0.8);
// scene.background = backgroundColor;
// renderer.setClearColor();

// Ensure LineMaterial knows the render resolution (used for width/dashes in screen space)
if (line3DMaterial.resolution) {
  line3DMaterial.resolution.set(sizes.width, sizes.height);
}

/**
 * Debug GUI controls
 */
const params = {
  lineWidth: line3DMaterial.linewidth ?? 1,
  worldUnits: !!line3DMaterial.worldUnits,
  dashed: !!line3DMaterial.dashed,
  dashSize: line3DMaterial.dashSize ?? 1,
  gapSize: line3DMaterial.gapSize ?? 1,
  dashScale: line3DMaterial.dashScale ?? 1,
  dashOffset: line3DMaterial.dashOffset ?? 0,
  alphaToCoverage: !!line3DMaterial.alphaToCoverage,
  opacity: line3DMaterial.opacity ?? 1,
  scale: line3D.scale.x,
  paused: false
};

// Line folder
const fLine = gui.addFolder("Line");
fLine.add(params, "lineWidth", 0.1, 20, 0.1).name("width").onChange((v) => {
  line3DMaterial.linewidth = v;
  line3DMaterial.needsUpdate = true;
});
fLine.add(params, "worldUnits").name("worldUnits").onChange((v) => {
  line3DMaterial.worldUnits = v;
  line3DMaterial.needsUpdate = true;
});
fLine.add(params, "opacity", 0, 1, 0.01).name("opacity").onChange((v) => {
  line3DMaterial.opacity = v;
  line3DMaterial.transparent = v < 1;
  line3DMaterial.needsUpdate = true;
});
fLine.add(params, "dashed").name("dashed").onChange((v) => {
  line3DMaterial.dashed = v;
  line3DMaterial.needsUpdate = true;
  // required for dashed lines
  line3D.computeLineDistances();
});
fLine.add(params, "dashSize", 0.1, 10, 0.1).name("dashSize").onChange((v) => {
  line3DMaterial.dashSize = v;
});
fLine.add(params, "gapSize", 0.1, 10, 0.1).name("gapSize").onChange((v) => {
  line3DMaterial.gapSize = v;
});
fLine.add(params, "dashScale", 0.1, 10, 0.1).name("dashScale").onChange((v) => {
  line3DMaterial.dashScale = v;
});
fLine.add(params, "dashOffset", -5, 5, 0.01).name("dashOffset").onChange((v) => {
  line3DMaterial.dashOffset = v;
});
fLine.add(params, "alphaToCoverage").name("alphaToCoverage").onChange((v) => {
  // Effective only with WebGL2 + MSAA
  line3DMaterial.alphaToCoverage = v;
  line3DMaterial.needsUpdate = true;
});
fLine.add(params, "scale", 0.1, 10, 0.1).name("object scale").onChange((v) => {
  line3D.scale.set(v, v, v);
});
fLine.add(params, "paused").name("animation");

/**
 * Animate
 */
const clock = new THREE.Clock();
let prev = clock.getElapsedTime();
let vy = 5;         // world units / sec
let vx = 10;          // set nonzero to bounce in X too

function tick() {
  const t = clock.getElapsedTime();
  const dt = t - prev; prev = t;

  if (!params.paused) {
    // spin
    line3D.rotation.y = t * 0.15;
    line3D.rotation.x = t * 0.05;

    // world-space bounds at current depth
    const bounds = getWorldBoundsForObject(camera, line3D);

    // integrate
    let y = line3D.position.y + vy * dt;
    let x = line3D.position.x + vx * dt;

    // Y bounce (with overshoot reflection)
    if (y > bounds.yMax) { y = bounds.yMax - (y - bounds.yMax); vy *= -1; }
    else if (y < bounds.yMin) { y = bounds.yMin + (bounds.yMin - y); vy *= -1; }

    // X bounce (enable if vx != 0)
    if (x > bounds.xMax) { x = bounds.xMax - (x - bounds.xMax); vx *= -1; }
    else if (x < bounds.xMin) { x = bounds.xMin + (bounds.xMin - x); vx *= -1; }

    line3D.position.set(x, y, line3D.position.z);
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}
tick();
