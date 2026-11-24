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
let inicioXArrastre = 0;
let inicioYArrastre = 0;
let inicioTArrastre = 0;

let cuadroInercia = null;
let cuadroSnap = null;

let menuAbierto = false;
let caraActiva = null;

const SENSIBILIDAD = 0.35; // grados por píxel arrastrado
const FRICCION = 0.94; // por cuadro, mientras hay inercia
const VELOCIDAD_MINIMA = 0.02; // grados/ms -debajo de esto, se corta la inercia
const TAP_DISTANCIA_MAX = 10; // px -por debajo de esto, es un tap, no un arrastre
const TAP_DURACION_MAX = 350; // ms

// Datos reales del menú (ver la reorganización hecha en core.menu):
// 3 caras de menú + la cara del juego, que no lleva a un abanico de
// opciones -por ahora un simple aviso, el juego en sí es una pieza
// aparte, pendiente.
const MENU_DATA = {
    tickets: { nombre: "Tickets", hijos: ["Tickets Mágico", "Cierre Ticket", "Ticket Fome"] },
    negocio: { nombre: "Negocio", hijos: ["Clientes", "Ventas", "Reportes"] },
    configuracion: { nombre: "Configuración", hijos: ["Servicios", "Código de Barra", "Carga de Precios", "Mantenedores", "Bandeja WhatsApp"] },
};

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
    punteroId = e.pointerId;
    cubo.setPointerCapture(punteroId);
    inicioXArrastre = e.clientX;
    inicioYArrastre = e.clientY;
    inicioTArrastre = performance.now();

    if (menuAbierto) {
        // Con el menú abierto no se gira el cubo -solo se espera a ver
        // si esto termina siendo un tap (eso sí cierra el menú, en
        // alSoltarArrastre -> manejarTap).
        return;
    }

    cancelarAnimacionesEnCurso();
    arrastrando = true;
    cubo.classList.add("arrastrando");
    pausarFlote(true);

    ultimoX = e.clientX;
    ultimoY = e.clientY;
    ultimoT = inicioTArrastre;
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
    if (e.pointerId !== punteroId) return;
    cubo.releasePointerCapture(punteroId);

    const distancia = Math.hypot(e.clientX - inicioXArrastre, e.clientY - inicioYArrastre);
    const duracion = performance.now() - inicioTArrastre;
    const fueTap = distancia < TAP_DISTANCIA_MAX && duracion < TAP_DURACION_MAX;

    if (arrastrando) {
        arrastrando = false;
        cubo.classList.remove("arrastrando");

        if (!fueTap) {
            iniciarInercia();
            return;
        }

        // Fue un tap, no un arrastre -no tiene sentido arrancar la
        // inercia con una velocidad casi nula.
        velX = 0;
        velY = 0;
        pausarFlote(false);
    }

    if (fueTap) manejarTap();
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
            // Antes acá se forzaba un snap a la cara de menú más
            // cercana (Y a un múltiplo de 90°, X siempre de vuelta a
            // 0) -se sacó a pedido: el cubo se siente más natural si
            // a veces se queda donde quedó en vez de ajustarse siempre
            // solo. obtenerCaraFrente() (la misma matemática del
            // sombreado) sigue encontrando la cara más al frente para
            // el tap sin importar el ángulo exacto, así que esto no
            // le quita nada a la interacción -la única vez que se
            // sigue corrigiendo el ángulo es si el tap cae justo en el
            // techo/piso de marca (ver manejarTap), para no dejar un
            // toque sin ningún efecto visible.
            if (!menuAbierto) pausarFlote(false);
        }
    }

    cuadroInercia = requestAnimationFrame(cuadro);
}

// Lleva rotX/rotY a un destino puntual con una animación corta -ya no
// se usa después de cada arrastre (ver iniciarInercia), solo como
// arreglo puntual cuando el tap cae en una cara no interactiva (ver
// manejarTap): en vez de un toque que no hace nada, se acomoda a la
// cara de menú real más cercana.
function iniciarAjuste(destinoY, destinoX) {
    const inicioY = rotY;
    const inicioX = rotX;
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
            if (!menuAbierto) pausarFlote(false);
        }
    }

    cuadroSnap = requestAnimationFrame(cuadro);
}

// El secreto del cubo: tocar (sin arrastrar) la cara que está de
// frente la "hunde" y abre el abanico de sus opciones. La cara del
// juego es la excepción (no lleva a un abanico, ver MENU_DATA). Para
// volver: tocar la misma cara hundida de nuevo, tocar afuera del
// cubo/abanico, o el botón "Volver" -tres caminos al mismo lugar,
// pero el botón es el único visible sin tener que descubrirlo (el
// cubo es la navegación principal, no un secreto -lo habitual no
// puede depender solo de un gesto oculto).
function obtenerCaraFrente() {
    let mejorCara = null;
    let mejorProducto = -Infinity;

    caras.forEach((cara) => {
        let claseCara = null;
        for (const clase of cara.classList) {
            if (NORMAL_POR_CARA[clase]) { claseCara = clase; break; }
        }
        if (!claseCara) return;

        const normalMundo = rotarVectorX(rotarVectorY(NORMAL_POR_CARA[claseCara], rotY), rotX);
        const p = producto(normalMundo, [0, 0, 1]);
        if (p > mejorProducto) {
            mejorProducto = p;
            mejorCara = cara;
        }
    });

    return mejorCara;
}

function manejarTap() {
    if (menuAbierto) {
        cerrarMenu();
        return;
    }

    const caraFrente = obtenerCaraFrente();
    if (!caraFrente) return;

    const tipo = caraFrente.dataset.cara;
    if (!tipo) {
        // Tocó el techo/piso de marca (no interactivo) -en vez de un
        // toque sin ningún efecto, acomoda a la cara de menú real más
        // cercana. Único caso donde el ángulo se sigue corrigiendo
        // (ver iniciarInercia): un tap sin efecto se siente roto, un
        // reposo natural después de arrastrar no.
        const destinoY = Math.round(rotY / 90) * 90;
        iniciarAjuste(destinoY, 0);
        return;
    }

    if (tipo === "juego") {
        mostrarToastCubo("El juego todavía no está listo — próximamente.");
        return;
    }

    abrirMenu(caraFrente, tipo);
}

// El abanico de satélites (grafo/estrella) se sacó -no se veía bien.
// Reemplazo pendiente: el mismo cubo recargado con las opciones del
// siguiente nivel, con una vuelta completa marcando el cambio (ver
// conversación). abrirMenu/cerrarMenu quedan mínimos mientras tanto:
// solo hunden/sueltan la cara, sin ningún listado todavía.
function abrirMenu(caraEl, tipo) {
    const datos = MENU_DATA[tipo];
    if (!datos) return;

    menuAbierto = true;
    caraActiva = caraEl;
    caraEl.classList.add("hundida");
    pausarFlote(true);
    document.getElementById("botonVolver").hidden = false;
}

function cerrarMenu() {
    if (!menuAbierto) return;

    menuAbierto = false;
    if (caraActiva) caraActiva.classList.remove("hundida");
    caraActiva = null;
    pausarFlote(false);
    document.getElementById("botonVolver").hidden = true;
}

let toastCuboTimeout = null;
function mostrarToastCubo(texto) {
    const toast = document.getElementById("toastCubo");
    if (!toast) return;

    toast.textContent = texto;
    toast.classList.add("visible");

    clearTimeout(toastCuboTimeout);
    toastCuboTimeout = setTimeout(() => toast.classList.remove("visible"), 2500);
}

// Tocar afuera del cubo también cierra -mismo criterio ya usado en el
// Ticket Mágico. Tocar el cubo mismo (incluida la cara hundida) lo
// maneja manejarTap() vía el flujo normal de puntero, no este
// listener -por eso acá se ignora explícitamente.
document.addEventListener("click", (e) => {
    if (!menuAbierto) return;
    if (e.target.closest("#botonVolver")) return;
    if (e.target.closest("#cubo")) return;

    cerrarMenu();
});

document.getElementById("botonVolver").addEventListener("click", cerrarMenu);

cubo.addEventListener("pointerdown", alIniciarArrastre);
cubo.addEventListener("pointermove", alMoverArrastre);
cubo.addEventListener("pointerup", alSoltarArrastre);
cubo.addEventListener("pointercancel", alSoltarArrastre);

aplicarTransform();
