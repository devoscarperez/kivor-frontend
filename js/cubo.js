// KIVOR — Menú Cubo (prototipo). Primera capa: el cubo físico (giro
// libre con inercia y snap, iluminación por cara, flote). El tap que
// hunde una cara y el abanico de opciones (grafo de satélites) vienen
// en una siguiente pasada, una vez validado que el cubo en sí se
// siente sólido.

const cubo = document.getElementById("cubo");
const stage = document.getElementById("cuboStage");
const debugInfo = document.getElementById("debugInfo");
const caras = Array.from(document.querySelectorAll(".cara"));

// Normal local de cada cara (antes de rotar el cubo), en el mismo
// sistema de coordenadas que usa CSS (Y crece hacia abajo).
const NORMAL_POR_CARA = {
    "cara-frente": [0, 0, 1],
    "cara-atras": [0, 0, -1],
    "cara-derecha": [1, 0, 0],
    "cara-izquierda": [-1, 0, 0],
    "cara-arriba": [0, -1, 0],
    "cara-abajo": [0, 1, 0],
};

// Luz fija imaginaria: viene de adelante y un poco de arriba.
const LUZ = normalizar([0, -0.3, 0.95]);

let rotX = 0;
let rotY = 0;
let velX = 0; // grados / ms
let velY = 0;

let arrastrando = false;
let punteroId = null;
let ultimoX = 0;
let ultimoY = 0;
let ultimoT = 0;

let cuadroInercia = null;
let cuadroSnap = null;

const SENSIBILIDAD = 0.35; // grados por píxel arrastrado
const FRICCION = 0.94; // por cuadro, mientras hay inercia
const VELOCIDAD_MINIMA = 0.02; // grados/ms -debajo de esto, se corta la inercia

function normalizar(v) {
    const mag = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    return [v[0] / mag, v[1] / mag, v[2] / mag];
}

function rotarVectorY(v, gradosY) {
    const r = (gradosY * Math.PI) / 180;
    const cos = Math.cos(r), sin = Math.sin(r);
    return [v[0] * cos + v[2] * sin, v[1], -v[0] * sin + v[2] * cos];
}

function rotarVectorX(v, gradosX) {
    const r = (gradosX * Math.PI) / 180;
    const cos = Math.cos(r), sin = Math.sin(r);
    return [v[0], v[1] * cos - v[2] * sin, v[1] * sin + v[2] * cos];
}

function producto(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

// El orden importa: coincide con transform:rotateX(..) rotateY(..)
// que aplica cubo.js más abajo -rotateY se aplica primero (más
// interno), rotateX después (más externo), igual que hace CSS con
// esa misma lista de funciones.
function iluminarCaras() {
    caras.forEach((cara) => {
        let claseCara = null;
        for (const clase of cara.classList) {
            if (NORMAL_POR_CARA[clase]) { claseCara = clase; break; }
        }
        if (!claseCara) return;

        const normalLocal = NORMAL_POR_CARA[claseCara];
        const normalMundo = rotarVectorX(rotarVectorY(normalLocal, rotY), rotX);
        const brillo = producto(normalMundo, LUZ); // [-1, 1]
        const oscuridad = Math.max(0, Math.min(1, (1 - brillo) / 2)) * 0.55;

        cara.style.setProperty("--luz", oscuridad.toFixed(3));
    });
}

function aplicarTransform() {
    cubo.style.transform = `rotateX(${rotX}deg) rotateY(${rotY}deg)`;
    iluminarCaras();
    if (debugInfo) {
        debugInfo.textContent = `rotX=${rotX.toFixed(1)} rotY=${rotY.toFixed(1)} velX=${velX.toFixed(3)} velY=${velY.toFixed(3)}`;
    }
}

function pausarFlote(pausar) {
    stage.classList.toggle("sin-flote", pausar);
}

function cancelarAnimacionesEnCurso() {
    if (cuadroInercia) { cancelAnimationFrame(cuadroInercia); cuadroInercia = null; }
    if (cuadroSnap) { cancelAnimationFrame(cuadroSnap); cuadroSnap = null; }
}

function alIniciarArrastre(e) {
    cancelarAnimacionesEnCurso();
    arrastrando = true;
    punteroId = e.pointerId;
    cubo.setPointerCapture(punteroId);
    cubo.classList.add("arrastrando");
    pausarFlote(true);

    ultimoX = e.clientX;
    ultimoY = e.clientY;
    ultimoT = performance.now();
    velX = 0;
    velY = 0;
}

function alMoverArrastre(e) {
    if (!arrastrando || e.pointerId !== punteroId) return;

    const ahora = performance.now();
    const dx = e.clientX - ultimoX;
    const dy = e.clientY - ultimoY;
    // Tope de 48ms (~3 cuadros a 60fps): si el dedo se detiene un
    // instante a mitad del arrastre sin soltar, o el dispositivo tiene
    // un bache, no queremos que ese hueco de tiempo se lea como "lo
    // arrastró clavado 300ms" y dispare una velocidad instantánea
    // absurda al soltar.
    const dt = Math.min(48, Math.max(1, ahora - ultimoT));

    const deltaY = dx * SENSIBILIDAD;
    const deltaX = -dy * SENSIBILIDAD;

    rotY += deltaY;
    rotX += deltaX;

    // Velocidad angular instantánea, para la inercia al soltar.
    velY = deltaY / dt;
    velX = deltaX / dt;

    ultimoX = e.clientX;
    ultimoY = e.clientY;
    ultimoT = ahora;

    aplicarTransform();
}

function alSoltarArrastre(e) {
    if (!arrastrando || e.pointerId !== punteroId) return;
    arrastrando = false;
    cubo.releasePointerCapture(punteroId);
    cubo.classList.remove("arrastrando");

    iniciarInercia();
}

function iniciarInercia() {
    let ultimoCuadro = performance.now();

    function cuadro(ahora) {
        // Mismo tope que en el arrastre: si el navegador pausó/saltó
        // requestAnimationFrame por un rato (pestaña en segundo plano,
        // dispositivo ocupado) y vuelve con un salto de tiempo enorme,
        // no se traduce en un salto de rotación absurdo -se comprobó
        // con un repro: sin este tope, un solo cuadro con dt gigante
        // mandaba el cubo a girar miles de grados de golpe.
        const dt = Math.min(48, ahora - ultimoCuadro);
        ultimoCuadro = ahora;

        rotY += velY * dt;
        rotX += velX * dt;

        // FRICCION está calibrada como "por cuadro de ~16ms" -aplicarla
        // una vez por llamada a requestAnimationFrame (como se hacía
        // antes) depende de que los cuadros lleguen a un ritmo parejo.
        // En un celular con pantalla de 90/120Hz, con el navegador
        // ocupado, o en este mismo entorno headless (se comprobó: el
        // cubo terminó girando miles de grados de más en vez de
        // frenar), dt varía, y una fricción "por cuadro" deja de tener
        // sentido. Escalar el exponente por dt/16 la vuelve
        // independiente de cuántos cuadros por segundo lleguen de
        // verdad.
        const decaimiento = Math.pow(FRICCION, dt / 16);
        velY *= decaimiento;
        velX *= decaimiento;

        aplicarTransform();

        if (Math.abs(velY) > VELOCIDAD_MINIMA || Math.abs(velX) > VELOCIDAD_MINIMA) {
            cuadroInercia = requestAnimationFrame(cuadro);
        } else {
            cuadroInercia = null;
            velX = 0;
            velY = 0;
            iniciarSnap();
        }
    }

    cuadroInercia = requestAnimationFrame(cuadro);
}

// El eje Y calza en la cara real más cercana (múltiplo de 90°). El
// eje X siempre vuelve a 0 -nunca queda "en reposo" mostrando el
// techo o el piso de marca, aunque arrastrar hacia arriba/abajo
// durante el gesto sí los deja ver de pasada.
function iniciarSnap() {
    const inicioY = rotY;
    const inicioX = rotX;
    const destinoY = Math.round(rotY / 90) * 90;
    const destinoX = Math.round(rotX / 360) * 360;
    const duracionMs = 320;
    const inicioT = performance.now();

    function facilitar(t) { return 1 - Math.pow(1 - t, 3); } // ease-out cubic

    function cuadro(ahora) {
        const t = Math.min(1, (ahora - inicioT) / duracionMs);
        const f = facilitar(t);

        rotY = inicioY + (destinoY - inicioY) * f;
        rotX = inicioX + (destinoX - inicioX) * f;
        aplicarTransform();

        if (t < 1) {
            cuadroSnap = requestAnimationFrame(cuadro);
        } else {
            cuadroSnap = null;
            pausarFlote(false);
        }
    }

    cuadroSnap = requestAnimationFrame(cuadro);
}

cubo.addEventListener("pointerdown", alIniciarArrastre);
cubo.addEventListener("pointermove", alMoverArrastre);
cubo.addEventListener("pointerup", alSoltarArrastre);
cubo.addEventListener("pointercancel", alSoltarArrastre);

aplicarTransform();
