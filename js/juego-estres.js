// KIVOR — Spa Run (minijuego antiestrés del cubo). Runner de un solo
// toque: tocar la pantalla salta. Pensado como una pausa corta entre
// clientas, no como un desafío de reflejos -por eso los hitboxes son
// generosos (ver COLISION_TOLERANCIA) y la dificultad sube despacio.

const escenario = document.getElementById("juegoEscenario");
const pista = document.getElementById("juegoPista");
const estilista = document.getElementById("estilista");
const pelo = estilista.querySelector(".estilista-pelo");
const elementoPuntaje = document.getElementById("puntajeActual");
const pantallaInicio = document.getElementById("pantallaInicio");
const pantallaFin = document.getElementById("pantallaFin");
const textoMejorInicio = document.getElementById("mejorPuntajeInicio");
const textoPuntajeFinal = document.getElementById("puntajeFinalTexto");

const CLAVE_MEJOR_PUNTAJE = "kivor_spa_run_mejor";

const GRAVEDAD = 0.0022; // px/ms² -con VELOCIDAD_SALTO da un arco de ~140px y ~700ms en el aire
const VELOCIDAD_SALTO = -0.78; // px/ms (negativo = hacia arriba)

const VELOCIDAD_INICIAL = 0.26; // px/ms de los obstáculos
const VELOCIDAD_MAXIMA = 0.5;
const RAMPA_VELOCIDAD = 0.000006; // px/ms añadidos por ms transcurrido

const INTERVALO_MIN_INICIAL = 1150; // ms entre obstáculos, al empezar
const INTERVALO_MAX_INICIAL = 1800;
const INTERVALO_MIN_FINAL = 750; // piso del intervalo aunque la velocidad siga subiendo -no se vuelve injusto
const INTERVALO_MAX_FINAL = 1150;

// El pelo flamea más fuerte y más rápido a medida que sube la
// velocidad -mismo "progreso" (0 a 1 entre inicial y máxima) que ya
// se usa para el intervalo de obstáculos, ver cuadro(). Mientras
// jugando, esto reemplaza por completo la animación CSS de reposo
// (ver .estilista.jugando en el css): una animación CSS infinita
// siempre gana sobre un transform inline, así que no alcanzaba con
// setear el style desde acá sin antes apagarla.
const PELO_FRECUENCIA_MIN = 0.006; // rad/ms
const PELO_FRECUENCIA_MAX = 0.017;
const PELO_AMPLITUD_MIN = 7; // grados
const PELO_AMPLITUD_MAX = 24;
const PELO_ELEVACION_MAX = 12; // px que se levanta hacia atrás a velocidad máxima
let fasePelo = 0;

// Hitbox de la estilista más angosta que el div visual (el uniforme
// "visualmente" la toca antes de que sea justo que pierda) -mismo
// criterio para los obstáculos, ver colisionan().
const COLISION_TOLERANCIA = 10; // px de margen perdonado por lado

const TIPOS_OBSTACULO = ["carrito", "sillon", "frasco", "secador", "peineta", "cepillo"];
const MARCADO_INTERNO = {
    carrito: '<div class="carrito-bandeja"></div><div class="carrito-cuerpo"></div><div class="carrito-rueda"></div><div class="carrito-rueda"></div>',
    sillon: '<div class="sillon-respaldo"></div><div class="sillon-asiento"></div><div class="sillon-pata"></div><div class="sillon-pata"></div>',
    frasco: '<div class="frasco-cuerpo"></div><div class="frasco-tapa"></div>',
    secador: '<div class="secador-cuerpo"></div><div class="secador-mango"></div><div class="secador-cable"></div>',
    peineta: '<div class="peineta-lomo"></div><div class="peineta-dientes"></div>',
    cepillo: '<div class="cepillo-cabeza"></div><div class="cepillo-mango"></div>',
};

// Objetos chicos de mano -los únicos candidatos a salir "gigantes"
// (ver crearObstaculo). Un carrito o un sillón gigante no tendría la
// misma gracia visual (ya son grandes de por sí); un secador/peineta/
// cepillo del porte de la estilista sí es la sorpresa graciosa que se
// pidió, y de paso exige saltar mejor sincronizado -no todos, solo
// algunos al azar.
const TIPOS_GIGANTE_ELEGIBLES = ["secador", "peineta", "cepillo"];
const PROBABILIDAD_GIGANTE = 0.3;
const ESCALA_GIGANTE_MIN = 1.8;
const ESCALA_GIGANTE_MAX = 2.6;

let estado = "esperando"; // esperando | jugando | terminado
let posicionY = 0; // 0 = en el piso, negativo = elevada (coincide con translateY)
let velocidadY = 0;
let enElPiso = true;

let velocidadActual = VELOCIDAD_INICIAL;
let tiempoInicio = 0;
let tiempoUltimoCuadro = 0;
let tiempoProximoObstaculo = 0;
let puntaje = 0;

let obstaculos = []; // { el, x }
let cuadroJuego = null;

function obtenerMejorPuntaje() {
    return Number(localStorage.getItem(CLAVE_MEJOR_PUNTAJE) || "0");
}

function guardarMejorPuntajeSiCorresponde(valor) {
    if (valor > obtenerMejorPuntaje()) {
        localStorage.setItem(CLAVE_MEJOR_PUNTAJE, String(valor));
    }
}

function actualizarPuntajeEnPantalla() {
    elementoPuntaje.textContent = String(puntaje);
}

function elegirIntervaloProximoObstaculo() {
    // A medida que la velocidad sube, el intervalo se acorta -pero
    // nunca por debajo del piso final, para no convertir esto en un
    // juego de reflejos puros (ver nota de archivo).
    const progreso = Math.min(1, (velocidadActual - VELOCIDAD_INICIAL) / (VELOCIDAD_MAXIMA - VELOCIDAD_INICIAL));
    const min = INTERVALO_MIN_INICIAL + (INTERVALO_MIN_FINAL - INTERVALO_MIN_INICIAL) * progreso;
    const max = INTERVALO_MAX_INICIAL + (INTERVALO_MAX_FINAL - INTERVALO_MAX_INICIAL) * progreso;
    return min + Math.random() * (max - min);
}

function crearObstaculo() {
    const tipo = TIPOS_OBSTACULO[Math.floor(Math.random() * TIPOS_OBSTACULO.length)];
    const esGigante = TIPOS_GIGANTE_ELEGIBLES.includes(tipo) && Math.random() < PROBABILIDAD_GIGANTE;
    const escala = esGigante ? ESCALA_GIGANTE_MIN + Math.random() * (ESCALA_GIGANTE_MAX - ESCALA_GIGANTE_MIN) : 1;

    const el = document.createElement("div");
    el.className = `obstaculo obstaculo-${tipo}` + (esGigante ? " obstaculo-gigante" : "");
    el.innerHTML = MARCADO_INTERNO[tipo];
    pista.appendChild(el);

    const x = pista.clientWidth;
    el.style.transform = `translateX(${x}px) scale(${escala})`;
    obstaculos.push({ el, x, escala });
}

function limpiarObstaculos() {
    obstaculos.forEach((o) => o.el.remove());
    obstaculos = [];
}

function saltar() {
    if (!enElPiso) return;
    velocidadY = VELOCIDAD_SALTO;
    enElPiso = false;
    estilista.classList.remove("corriendo");
    estilista.classList.add("saltando");
}

function colisionan(rectA, rectB) {
    return (
        rectA.left + COLISION_TOLERANCIA < rectB.right - COLISION_TOLERANCIA &&
        rectA.right - COLISION_TOLERANCIA > rectB.left + COLISION_TOLERANCIA &&
        rectA.top + COLISION_TOLERANCIA < rectB.bottom &&
        rectA.bottom > rectB.top + COLISION_TOLERANCIA
    );
}

function cuadro(ahora) {
    const dt = Math.min(48, ahora - tiempoUltimoCuadro); // mismo tope que cubo.js -evita saltos si el navegador pausó el rAF
    tiempoUltimoCuadro = ahora;
    const tiempoTranscurrido = ahora - tiempoInicio;

    velocidadActual = Math.min(VELOCIDAD_MAXIMA, VELOCIDAD_INICIAL + tiempoTranscurrido * RAMPA_VELOCIDAD);
    const progresoVelocidad = (velocidadActual - VELOCIDAD_INICIAL) / (VELOCIDAD_MAXIMA - VELOCIDAD_INICIAL);

    // Pelo al viento: más rápido y con más vuelo a medida que sube la
    // velocidad, y se levanta hacia atrás (translateY negativo).
    const frecuenciaPelo = PELO_FRECUENCIA_MIN + (PELO_FRECUENCIA_MAX - PELO_FRECUENCIA_MIN) * progresoVelocidad;
    fasePelo += frecuenciaPelo * dt;
    const amplitudPelo = PELO_AMPLITUD_MIN + (PELO_AMPLITUD_MAX - PELO_AMPLITUD_MIN) * progresoVelocidad;
    const anguloPelo = Math.sin(fasePelo) * amplitudPelo;
    const elevacionPelo = -PELO_ELEVACION_MAX * progresoVelocidad;
    pelo.style.transform = `translateY(${elevacionPelo}px) rotate(${anguloPelo}deg)`;

    // Física del salto.
    if (!enElPiso) {
        velocidadY += GRAVEDAD * dt;
        posicionY += velocidadY * dt;
        if (posicionY >= 0) {
            posicionY = 0;
            velocidadY = 0;
            enElPiso = true;
            estilista.classList.remove("saltando");
            estilista.classList.add("corriendo");
        }
    }
    estilista.style.transform = `translateY(${posicionY}px)`;

    // Obstáculos: avanzan hacia la izquierda y se descartan al salir.
    for (let i = obstaculos.length - 1; i >= 0; i--) {
        const o = obstaculos[i];
        o.x -= velocidadActual * dt;
        o.el.style.transform = `translateX(${o.x}px) scale(${o.escala})`;
        if (o.x + o.el.clientWidth < 0) {
            o.el.remove();
            obstaculos.splice(i, 1);
        }
    }

    if (tiempoTranscurrido >= tiempoProximoObstaculo) {
        crearObstaculo();
        tiempoProximoObstaculo = tiempoTranscurrido + elegirIntervaloProximoObstaculo();
    }

    const rectEstilista = estilista.getBoundingClientRect();
    for (const o of obstaculos) {
        if (colisionan(rectEstilista, o.el.getBoundingClientRect())) {
            terminarJuego();
            return;
        }
    }

    puntaje = Math.floor(tiempoTranscurrido / 100);
    actualizarPuntajeEnPantalla();

    cuadroJuego = requestAnimationFrame(cuadro);
}

function empezarJuego() {
    estado = "jugando";
    pantallaInicio.hidden = true;
    pantallaFin.hidden = true;

    limpiarObstaculos();
    posicionY = 0;
    velocidadY = 0;
    enElPiso = true;
    velocidadActual = VELOCIDAD_INICIAL;
    puntaje = 0;
    actualizarPuntajeEnPantalla();

    estilista.classList.remove("saltando");
    estilista.classList.add("corriendo", "jugando");
    estilista.style.transform = "translateY(0px)";
    fasePelo = 0;

    tiempoInicio = performance.now();
    tiempoUltimoCuadro = tiempoInicio;
    tiempoProximoObstaculo = elegirIntervaloProximoObstaculo();

    cuadroJuego = requestAnimationFrame(cuadro);
}

function terminarJuego() {
    estado = "terminado";
    if (cuadroJuego) { cancelAnimationFrame(cuadroJuego); cuadroJuego = null; }

    estilista.classList.remove("corriendo", "saltando", "jugando");
    pelo.style.transform = "";
    guardarMejorPuntajeSiCorresponde(puntaje);

    const mejor = obtenerMejorPuntaje();
    textoPuntajeFinal.innerHTML = `Puntaje: <strong>${puntaje}</strong> — Mejor: ${mejor}`;
    pantallaFin.hidden = false;
}

function alTocarEscenario() {
    if (estado === "esperando") {
        empezarJuego();
    } else if (estado === "jugando") {
        saltar();
    }
    // En "terminado" los botones de la pantalla de fin son los que
    // deciden qué sigue -un toque suelto ahí no debería reiniciar sin
    // que la clienta llegue a ver su puntaje.
}

escenario.addEventListener("pointerdown", alTocarEscenario);

document.getElementById("botonReintentar").addEventListener("click", (e) => {
    e.stopPropagation();
    empezarJuego();
});

document.getElementById("botonVolverJuego").addEventListener("click", () => {
    window.location.href = "cubo.html";
});
document.getElementById("botonVolverFin").addEventListener("click", (e) => {
    e.stopPropagation();
    window.location.href = "cubo.html";
});

textoMejorInicio.textContent = obtenerMejorPuntaje() > 0 ? `Mejor puntaje: ${obtenerMejorPuntaje()}` : "";
