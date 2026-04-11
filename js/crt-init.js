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

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x000000, 0);

renderer.domElement.style.position = "fixed";
renderer.domElement.style.top = "0";
renderer.domElement.style.left = "0";
renderer.domElement.style.zIndex = "9999";
renderer.domElement.style.pointerEvents = "none";

document.body.appendChild(renderer.domElement);

// ==========================
// TEXTURA INICIAL
// ==========================
const initialTexture = new THREE.Texture();
initialTexture.needsUpdate = true;

// ==========================
// SHADERS CRT
// ==========================
const vertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const fragmentShader = `
uniform sampler2D uTexture;
uniform float uTime;
varying vec2 vUv;

// Barrel distortion
vec2 crtCurve(vec2 uv) {
    uv = uv * 2.0 - 1.0;
    vec2 offset = abs(uv.yx) / vec2(6.0, 4.0);
    uv += uv * offset * offset;
    uv = uv * 0.5 + 0.5;
    return uv;
}

float scanline(vec2 uv) {
    return sin(uv.y * 900.0) * 0.04;
}

float grille(vec2 uv) {
    return sin(uv.x * 1200.0) * 0.02;
}

float flicker(float t) {
    return sin(t * 18.0) * 0.01;
}

void main() {
    vec2 uv = crtCurve(vUv);

    // fuera de pantalla
    if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
        gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
        return;
    }

    // chromatic aberration
    float shift = 0.0025;
    float r = texture2D(uTexture, uv + vec2( shift, 0.0)).r;
    float g = texture2D(uTexture, uv).g;
    float b = texture2D(uTexture, uv + vec2(-shift, 0.0)).b;

    vec3 color = vec3(r, g, b);

    // scanlines + grille
    color -= scanline(uv);
    color -= grille(uv);

    // glow center
    float glow = 1.0 - distance(vUv, vec2(0.5)) * 1.2;
    color += glow * 0.06;

    // vignette fuerte CRT
    float vig = smoothstep(0.95, 0.25, distance(vUv, vec2(0.5)));
    color *= vig;

    // flicker
    color += flicker(uTime);

    // contraste leve
    color = pow(color, vec3(0.95));

    gl_FragColor = vec4(color, 1.0);
}
`;

// ==========================
// MATERIAL CRT
// ==========================
const material = new THREE.ShaderMaterial({
    uniforms: {
        uTexture: { value: initialTexture },
        uTime: { value: 0 }
    },
    vertexShader,
    fragmentShader
});

// ==========================
// PLANO
// ==========================
const geometry = new THREE.PlaneGeometry(1.6, 1.2, 32, 32);
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

// ==========================
// CAPTURA HTML
// ==========================
let textureApplied = false;

function captureOnceStable() {
    console.log("CAPTURANDO CRT...");
    const element = document.getElementById("login-texture");

    html2canvas(element, {
        backgroundColor: "#000000",
        useCORS: true,
        scale: 1
    }).then((canvas) => {
        if (textureApplied) return;

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;

        material.uniforms.uTexture.value = texture;
        material.needsUpdate = true;

        // element.style.visibility = "hidden";
        textureApplied = true;

        console.log("CRT TEXTURA OK");
    }).catch((err) => {
        console.error("ERROR html2canvas:", err);
    });
}

//window.addEventListener("load", () => {
//    requestAnimationFrame(() => {
//        requestAnimationFrame(() => {
//            captureOnceStable();
//        });
//    });
//});
window.startCRT = captureOnceStable;

// ==========================
// RESIZE
// ==========================
window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// ==========================
// LOOP
// ==========================
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    material.uniforms.uTime.value = clock.getElapsedTime();
    renderer.render(scene, camera);
}

animate();

