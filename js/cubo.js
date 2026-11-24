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

let transicionEnCurso = false;
let pilaNavegacion = []; // nodos de MENU_RAIZ visitados -vacío = en la raíz
let nivelHijosActuales = []; // los hasta-4 nodos reales mostrados ahora mismo, en orden de cara

const SENSIBILIDAD = 0.35; // grados por píxel arrastrado
const FRICCION = 0.94; // por cuadro, mientras hay inercia
const VELOCIDAD_MINIMA = 0.02; // grados/ms -debajo de esto, se corta la inercia
const TAP_DISTANCIA_MAX = 10; // px -por debajo de esto, es un tap, no un arrastre
const TAP_DURACION_MAX = 350; // ms

// Árbol real del menú (ver la reorganización hecha en core.menu).
// "configuracion" tiene 5 hijos propios, uno más de los 4 que caben
// en el cubo -por ahora se agrupan 2 bajo "+1 más" (temporal, a la
// espera de una reagrupación real del contenido). Un nodo con
// exactamente 1 hijo (Clientes, Reportes, Mantenedores) se salta
// solo al tocarlo -ver resolverDestino: no tiene sentido mostrar un
// cubo con un solo lado útil.
// "ruta" viene literal de menu_path en core.menu (se pidió la
// consulta real, no son rutas inventadas) -solo las hojas la tienen,
// los grupos no apuntan a ninguna página propia.
const MENU_RAIZ = [
    {
        id: "tickets", nombre: "Tickets", hijos: [
            { id: "tickets_magico", nombre: "Tickets Mágico", ruta: "ticketm.html" },
            { id: "cierre_ticket", nombre: "Cierre Ticket", ruta: "cierre-tickets.html" },
            { id: "ticket_fome", nombre: "Ticket Fome", ruta: "ticket.html" },
        ],
    },
    {
        id: "negocio", nombre: "Negocio", hijos: [
            { id: "clientes", nombre: "Clientes", hijos: [
                { id: "solicitar_datos_cliente", nombre: "Solicitar datos cliente", ruta: "customer-express-generate.html" },
            ]},
            { id: "ventas", nombre: "Ventas", hijos: [
                { id: "carga_ventas", nombre: "Carga de Ventas", ruta: "ventas-lyl-carga.html" },
                { id: "analisis_ventas_kpis", nombre: "Análisis de Ventas y KPIs", ruta: "ventas-lyl-analisis.html" },
                { id: "analisis_ventas", nombre: "Análisis de Ventas", ruta: "ventas-lyl-reporte.html" },
                { id: "analisis_kpis", nombre: "Análisis de KPIs", ruta: "ventas-lyl-kpis.html" },
            ]},
            { id: "reportes", nombre: "Reportes", hijos: [
                { id: "ganancias_mensuales", nombre: "Ganancias Mensuales", ruta: "ganancias-mensuales.html" },
            ]},
        ],
    },
    {
        id: "configuracion", nombre: "Configuración", hijos: [
            { id: "servicios", nombre: "Servicios", ruta: "servicios-profesional.html" },
            { id: "codigo_barra", nombre: "Código de Barra", ruta: "lector-codigo-barra.html" },
            { id: "carga_precios", nombre: "Carga de Precios", ruta: "precios-servicios-carga.html" },
            { id: "mas", nombre: "+1 más", hijos: [
                { id: "mantenedores", nombre: "Mantenedores", hijos: [
                    { id: "mantenedor_precios", nombre: "Mantenedor de Precios", ruta: "mantenedor-precios.html" },
                ]},
                { id: "bandeja_whatsapp", nombre: "Bandeja WhatsApp", ruta: "bandeja-whatsapp.html" },
            ]},
        ],
    },
    { id: "juego", nombre: "Juego", esJuego: true },
];

// Los 4 nodos de MENU_RAIZ ya llenan el cubo exacto (3 grupos + el
// juego) -nunca sobra ni falta un lado en la raíz, por eso no
// necesita la lógica de "Volver"/cara vacía que sí usan los niveles
// más profundos (ver aplicarContenidoNivel).
const ORDEN_CARAS = ["cara-frente", "cara-derecha", "cara-atras", "cara-izquierda"];

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

    if (transicionEnCurso) {
        // Mientras el cubo está dando la vuelta entre niveles no se
        // gira a mano -solo se espera a ver si esto termina siendo un
        // tap, que de todos modos no hace nada hasta que termine la
        // transición (ver manejarTap).
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
            pausarFlote(false);
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
            pausarFlote(false);
        }
    }

    cuadroSnap = requestAnimationFrame(cuadro);
}

// El secreto del cubo: tocar (sin arrastrar) la cara que está de
// frente, si tiene más opciones, hunde esa cara y el cubo da una
// vuelta completa -a mitad de camino, cuando ninguna cara mira al
// usuario, se cambian las etiquetas por las del nivel nuevo. Sigue
// siendo el mismo cubo todo el tiempo, nunca se reemplaza -solo gira
// y, al completar la vuelta, "ya es otro". Si la opción tocada es
// final (sin hijos), no hay vuelta -salta directo (por ahora, sin
// páginas reales conectadas, con un aviso).
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
    if (transicionEnCurso) return;

    const caraFrente = obtenerCaraFrente();
    if (!caraFrente) return;

    if (caraFrente.classList.contains("cara-vacia")) return; // lado sobrante, sin contenido

    // Hundir brevemente la cara tocada -feedback táctil inmediato,
    // independiente de si lo que sigue es un aviso, un salto directo
    // o la vuelta completa. Se saca sola; no queda pegada esperando
    // un "cerrar" como en el diseño anterior.
    caraFrente.classList.add("hundida");
    setTimeout(() => caraFrente.classList.remove("hundida"), 160);

    if (caraFrente.classList.contains("cara-volver")) {
        irANivelAnterior();
        return;
    }

    if (!("nodoIndice" in caraFrente.dataset)) {
        // Tocó el techo/piso de marca (no interactivo) -en vez de un
        // toque sin ningún efecto, acomoda a la cara de menú real más
        // cercana. Único caso donde el ángulo se sigue corrigiendo
        // (ver iniciarInercia): un tap sin efecto se siente roto, un
        // reposo natural después de arrastrar no.
        const destinoY = Math.round(rotY / 90) * 90;
        iniciarAjuste(destinoY, 0);
        return;
    }

    const nodo = nivelHijosActuales[Number(caraFrente.dataset.nodoIndice)];
    if (!nodo) return;

    if (nodo.esJuego) {
        mostrarToastCubo("El juego todavía no está listo — próximamente.");
        return;
    }

    const destino = resolverDestino(nodo);
    if (destino.tipo === "hoja") {
        // Opción final -ruta real (menu_path de core.menu), navega
        // directo, sin aviso ni confirmación.
        if (destino.nodo.ruta) navegarA(destino.nodo.ruta);
        return;
    }

    entrarANivel(destino.nodo);
}

// Envuelto en su propia función (en vez de usar window.location.href
// directo en manejarTap) para poder interceptarlo en las pruebas
// headless -reasignar window.location.href ahí mismo no es seguro en
// todos los navegadores (se comprobó: romper eso rompía en cadena el
// resto del script de la prueba, incluida la simulación de
// requestAnimationFrame).
function navegarA(ruta) {
    window.location.href = ruta;
}

// Un nodo con exactamente 1 hijo se salta solo -no tiene sentido
// mostrar un cubo con un único lado útil. Si ese único hijo también
// tiene un único hijo, sigue saltando (recursivo) hasta encontrar un
// grupo con 2+ hijos reales, o una hoja de verdad.
function resolverDestino(nodo) {
    if (nodo.hijos && nodo.hijos.length === 1) {
        return resolverDestino(nodo.hijos[0]);
    }
    if (nodo.hijos && nodo.hijos.length > 1) {
        return { tipo: "grupo", nodo };
    }
    return { tipo: "hoja", nodo };
}

// Pinta hasta 4 nodos reales en las caras laterales. Si sobra algún
// lado (menos de 4 hijos): el primer lado sobrante se vuelve la cara
// "Volver" -un camino físico más, además del botón de arriba-, el
// resto (como mucho queda 1 más, dado que los nodos de 1 solo hijo ya
// se resolvieron antes de llegar acá) queda en blanco, sin función.
// La raíz (MENU_RAIZ) nunca entra por acá -siempre tiene exactamente
// 4 nodos (3 grupos + el juego), nunca sobra ni falta un lado.
function aplicarContenidoNivel(hijos, { permitirVolver }) {
    nivelHijosActuales = hijos.slice(0, 4);

    ORDEN_CARAS.forEach((clase, i) => {
        const caraEl = cubo.querySelector("." + clase);
        const label = caraEl.querySelector(".cara-label");
        caraEl.classList.remove("cara-vacia", "cara-volver");
        label.classList.remove("cara-label-logo");

        if (i < nivelHijosActuales.length) {
            caraEl.dataset.nodoIndice = String(i);
            label.textContent = nivelHijosActuales[i].nombre;
        } else if (permitirVolver && i === nivelHijosActuales.length) {
            delete caraEl.dataset.nodoIndice;
            caraEl.classList.add("cara-volver");
            label.textContent = "← Volver";
        } else {
            delete caraEl.dataset.nodoIndice;
            caraEl.classList.add("cara-vacia");
            label.textContent = "";
        }
    });
}

function entrarANivel(nodo) {
    pilaNavegacion.push(nodo);
    document.getElementById("botonVolver").hidden = false;
    transicionCubo(() => aplicarContenidoNivel(nodo.hijos, { permitirVolver: true }), 1);
}

function irANivelAnterior() {
    if (pilaNavegacion.length === 0 || transicionEnCurso) return;

    pilaNavegacion.pop();
    const padre = pilaNavegacion[pilaNavegacion.length - 1];
    const quedanNiveles = pilaNavegacion.length > 0;

    document.getElementById("botonVolver").hidden = !quedanNiveles;

    if (padre) {
        transicionCubo(() => aplicarContenidoNivel(padre.hijos, { permitirVolver: true }), -1);
    } else {
        transicionCubo(() => aplicarContenidoNivel(MENU_RAIZ, { permitirVolver: false }), -1);
    }
}

// La vuelta completa que marca el cambio: gira 360° en el mismo eje
// que ya usa el arrastre (dirección +1 al entrar a un nivel, -1 al
// volver, para que se sienta como "ir" y "deshacer"), y a mitad de
// camino (t=0.5, cuando por construcción ninguna cara mira de frente
// al usuario) cambia las etiquetas en silencio. Como la vuelta es de
// 360° completos, aterriza exactamente en el mismo ángulo de pantalla
// en el que empezó -el mismo lugar, pero ya mostrando otra cosa.
function transicionCubo(aplicarCambio, direccion) {
    cancelarAnimacionesEnCurso();
    transicionEnCurso = true;
    pausarFlote(true);

    const inicioY = rotY;
    const destinoY = rotY + 360 * direccion;
    const duracionMs = 560;
    const inicioT = performance.now();
    let cambioAplicado = false;

    function facilitar(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; } // ease-in-out

    function cuadro(ahora) {
        const t = Math.min(1, (ahora - inicioT) / duracionMs);
        const f = facilitar(t);

        rotY = inicioY + (destinoY - inicioY) * f;
        aplicarTransform();

        if (!cambioAplicado && t >= 0.5) {
            cambioAplicado = true;
            aplicarCambio();
        }

        if (t < 1) {
            cuadroSnap = requestAnimationFrame(cuadro);
        } else {
            cuadroSnap = null;
            transicionEnCurso = false;
            pausarFlote(false);
        }
    }

    cuadroSnap = requestAnimationFrame(cuadro);
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

document.getElementById("botonVolver").addEventListener("click", irANivelAnterior);

cubo.addEventListener("pointerdown", alIniciarArrastre);
cubo.addEventListener("pointermove", alMoverArrastre);
cubo.addEventListener("pointerup", alSoltarArrastre);
cubo.addEventListener("pointercancel", alSoltarArrastre);

aplicarContenidoNivel(MENU_RAIZ, { permitirVolver: false });
aplicarTransform();
