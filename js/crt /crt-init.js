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

// Elemento HTML real
const element = document.getElementById("login-texture");

// Crear textura inicial
let texture;

// Crear plano
const geometry = new THREE.PlaneGeometry(1.6, 1.2);
const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

// 🔥 FUNCIÓN PARA CAPTURAR HTML
function updateTexture() {
    html2canvas(element).then(canvas => {
        texture = new THREE.CanvasTexture(canvas);
        material.map = texture;
        material.needsUpdate = true;
    });
}

// Primera captura
updateTexture();

// Loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
