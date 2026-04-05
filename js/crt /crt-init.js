// Escena básica
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

// Geometría simple (pantalla)
const geometry = new THREE.PlaneGeometry(1.6, 1.2);

// Material básico (negro por ahora)
const material = new THREE.MeshBasicMaterial({ color: 0x000000 });

// Mesh
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

// Render loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
