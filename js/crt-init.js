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


// 👇 AGREGA ESTO
renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.zIndex = "9999";


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
    const element = document.getElementById("login-texture");

    html2canvas(element, {
        backgroundColor: "#000",
        useCORS: true
    }).then(canvas => {
        console.log("TEXTURA OK");

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        material.map = texture;
        material.needsUpdate = true;
    });
}

// Primera captura
setTimeout(updateTexture, 800);

// Loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();
