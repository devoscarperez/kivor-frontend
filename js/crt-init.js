// ==========================
// ESCENA BASE
// ==========================
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);
camera.position.z = 2;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);

// 🔥 ESTA LÍNEA ES LA CLAVE
renderer.setClearColor(0x000000, 0);

// Canvas arriba de todo
renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.zIndex = "9999";

document.body.appendChild(renderer.domElement);

// ==========================
// PLANO (pantalla)
// ==========================
const geometry = new THREE.PlaneGeometry(1.6, 1.2);

const material = new THREE.MeshBasicMaterial({
    map: new THREE.Texture() // 🔥 clave
});
material.map.needsUpdate = true;

const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

// ==========================
// RENDER LOOP
// ==========================
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

animate();

let textureApplied = false;

function captureOnceStable() {
    const element = document.getElementById("login-texture");

    html2canvas(element, {
        backgroundColor: "#000",
        useCORS: true
    }).then(canvas => {

        if (textureApplied) return;

        console.log("CAPTURA FINAL OK");

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        material.map = texture;
        material.needsUpdate = true;

        // 🔥 ESTA LÍNEA ES LA CLAVE
        element.style.visibility = "hidden";

        textureApplied = true;
    });
}

// 🔥 clave: esperar 2 frames reales de render
window.addEventListener("load", () => {
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            captureOnceStable();
        });
    });
});
