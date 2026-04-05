// Escena
const scene = new THREE.Scene();

// Cámara
const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 2;

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 📦 CAPTURAR HTML
const element = document.getElementById("login-texture");

// Crear canvas
const canvas = document.createElement("canvas");
canvas.width = 800;
canvas.height = 600;

const ctx = canvas.getContext("2d");

// Dibujar fondo (temporal)
ctx.fillStyle = "#000";
ctx.fillRect(0, 0, canvas.width, canvas.height);

// Crear textura
const texture = new THREE.CanvasTexture(canvas);

// Geometría
const geometry = new THREE.PlaneGeometry(1.6, 1.2);

// Material con textura
const material = new THREE.MeshBasicMaterial({
    map: texture
});

// Mesh
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

// Loop
function animate() {
    requestAnimationFrame(animate);

    texture.needsUpdate = true;

    renderer.render(scene, camera);
}

animate();
