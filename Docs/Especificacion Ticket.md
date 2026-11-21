# EL TICKET MÁGICO E INTELIGENTE
## Visión, diseño y propuesta funcional

### 1. Concepto y visión

Queremos transformar el ticket de atención en una interfaz única, funcional, intuitiva, inteligente y entretenida.

**El ticket no será un elemento dentro de la interfaz. El ticket será la interfaz.**

Desde él, el usuario podrá consultar, gestionar y actualizar toda la información necesaria, sin abandonar su estructura ni recurrir a ventanas emergentes.

La inspiración visual es un **ticket clásico de los años 80**, que conserve fielmente su forma, proporciones, colores y personalidad, pero que esconda múltiples funcionalidades interactivas.

Queremos secretos dentro del ticket.

Cada sección será como un pequeño cajón secreto que, al descubrirlo, revelará nuevas posibilidades. El ticket parecerá sencillo, pero contendrá un mundo de funcionalidades escondidas.

La magia estará en descubrir todo lo que puede hacer sin que deje de parecer un ticket.

**Nuestra ambición es crear una interfaz que sorprenda por su originalidad, pero que destaque especialmente por su simplicidad y utilidad.**

### 2. Una pantalla, un ticket

La interfaz estará diseñada para gestionar los tickets del día, cuyo volumen será relativamente pequeño:

- Mínimo: 1 ticket.
- Promedio: 6 tickets.
- Máximo estimado: 24 tickets.

Por este volumen, no necesitamos una interfaz tradicional basada en tablas, listas y filtros permanentemente visibles.

**En la pantalla del celular siempre habrá un único ticket como protagonista.**

El ticket dispondrá de todo el ancho útil de la pantalla, respetando únicamente los márgenes necesarios.

No compartirá el espacio horizontal con otros tickets.

Esto permitirá aprovechar mejor las dimensiones del celular y ofrecer mayor protagonismo a los textos, números, objetos y elementos interactivos.

Los filtros tradicionales desaparecerán de la pantalla principal. La búsqueda y selección de tickets deberá resolverse mediante mecanismos sencillos, integrados en la experiencia del propio ticket.

El usuario nunca trabajará visualmente con dos tickets al mismo tiempo.

### 3. Navegación entre tickets

Los tickets estarán ordenados cronológicamente según su fecha de agendamiento (*Booking Date*), registrada en la cabecera.

Al ingresar, se mostrará el primer ticket del conjunto seleccionado.

El número del ticket, aunque no sea un dato operativo prioritario, se convertirá en un elemento interactivo de navegación.

Desde él, el usuario podrá:

- Avanzar al siguiente ticket.
- Retroceder al ticket anterior.
- Conocer cuántos tickets existen en el conjunto seleccionado.
- Identificar cuál está visualizando.
- Consultar cuántas atenciones contiene el ticket actual.

**Propuesta:** El número podría funcionar como un pequeño mecanismo de navegación oculto, manteniendo su apariencia de numeración impresa.

Por ejemplo, tocar sus extremos podría permitir avanzar o retroceder, mientras que tocar el número podría revelar un índice compacto de los tickets disponibles.

La navegación deberá ser rápida, natural y sin cambios de pantalla.

### 4. Información principal del ticket

Los elementos que deben tener mayor protagonismo visual son:

**Nombre de la clienta titular**

Debe ser claramente visible y permitir su modificación directamente desde el ticket.

**Booking Date**

Fecha y hora de agendamiento, presentadas de forma destacada para identificar rápidamente cuándo está programada la atención.

**Número del ticket**

Elemento visual tradicional que también permitirá navegar entre los tickets disponibles.

**Abono**

Debe tener una presencia destacada y permitir ingresar o actualizar su monto directamente.

**Cantidad de atenciones**

Indicador integrado que permitirá conocer y explorar las atenciones asociadas al ticket.

Estos elementos deberán mantener una jerarquía visual clara, sin romper la estética original.

### 5. Los cajones secretos: funcionalidades ocultas

Cada sección del ticket tendrá una función visible y otras que podrán descubrirse mediante la interacción.

El objetivo es que el usuario encuentre nuevas capacidades de manera natural, sin enfrentarse a una interfaz sobrecargada.

#### 5.1. El secreto del nombre

Al tocar el nombre de la clienta titular, esa misma sección se transformará temporalmente en un buscador.

El usuario podrá escribir, por ejemplo, «Alicia», y consultar todas las clientas cuyos nombres contengan ese texto.

Los resultados deberán poder recorrerse dentro del propio ticket hasta seleccionar a la clienta correspondiente.

Una vez seleccionada, la sección recuperará su apariencia original mostrando el nuevo nombre.

No se utilizarán ventanas emergentes.

#### 5.2. El secreto del abono

Al tocar el monto del abono, este se transformará en un campo editable.

El usuario podrá ingresar o modificar el monto y guardar el cambio directamente.

Una vez confirmado, el valor volverá a mostrarse con su formato original.

La operación deberá ser inmediata, sencilla y segura, comunicando claramente si el cambio fue guardado.

#### 5.3. El secreto de las atenciones

Al interactuar con la cantidad de atenciones, el ticket permitirá consultar las existentes o incorporar una nueva.

El ingreso seguirá una secuencia sencilla:

1. Seleccionar una clienta o reutilizar la titular del ticket.
2. Buscar y seleccionar a la profesional correspondiente.
3. Ingresar la fecha y hora de agendamiento.
4. Confirmar y guardar la nueva atención.

Todo el proceso deberá desarrollarse dentro del ticket.

Las secciones necesarias se activarán temporalmente y luego recuperarán su apariencia original.

#### 5.4. El secreto de la navegación

El número impreso del ticket permitirá desplazarse entre los tickets disponibles.

La navegación deberá sentirse como una funcionalidad propia del objeto y no como un control externo añadido posteriormente.

#### 5.5. Nuevos secretos por descubrir

El diseño podrá incorporar otras funcionalidades ocultas que aporten utilidad real.

Cada nueva capacidad deberá responder a una necesidad concreta.

**Los secretos deben sorprender, pero nunca dificultar las tareas habituales.**

Las acciones importantes deberán ser fáciles de encontrar, incluso para una persona que utiliza el ticket por primera vez.

### 6. La regla de oro: el ticket nunca desaparece

Este es el principio más importante del diseño.

**El ticket no abrirá paneles que lo oculten. Transformará temporalmente sus propias secciones para permitir cada operación y luego recuperará su apariencia original.**

Las funcionalidades deberán integrarse sin que se perciban uniones, módulos o componentes independientes.

Aunque internamente esté construido con múltiples elementos HTML, visualmente deberá sentirse como una sola pieza.

No queremos una colección de formularios disfrazados de ticket.

Queremos un ticket auténtico cuyas distintas partes cobren vida cuando el usuario interactúe con ellas.

La experiencia debe ser continua, natural y sorprendente.

### 7. Proporciones y aprovechamiento de la pantalla

El ticket será el único protagonista de la pantalla y dispondrá de todo el ancho útil del celular.

Esto representa una oportunidad importante: al no compartir espacio horizontal con otros tickets, podremos aprovechar mejor las dimensiones disponibles para mejorar la legibilidad, la distribución de los elementos y la comodidad de las interacciones.

**El tamaño del ticket será la referencia para dimensionar todos sus componentes.**

Los textos, números, espacios, márgenes, iconos, botones y áreas visuales deberán mantener proporciones coherentes con las dimensiones del ticket.

No queremos simplemente agrandar el ticket.

Queremos que todos sus elementos crezcan o se ajusten de manera equilibrada, conservando su identidad visual y aprovechando inteligentemente el espacio disponible.

#### 7.1. Proporcionalidad

Los tamaños de los textos y objetos deberán guardar relación con las dimensiones del ticket.

Cuando cambie el ancho disponible, el diseño deberá ajustarse de manera armónica.

Esto no significa que absolutamente todos los elementos deban crecer en la misma proporción. Algunos necesitarán límites mínimos o máximos para mantener su legibilidad y utilidad.

#### 7.2. Aprovechamiento del espacio

El ticket ocupará el máximo ancho útil del celular, sin deformar sus proporciones originales.

Su forma y silueta deberán conservarse.

Si las proporciones del ticket generan una altura superior a la pantalla, se permitirá el desplazamiento vertical natural, evitando comprimir los elementos hasta volverlos ilegibles.

#### 7.3. Legibilidad

Los textos importantes deberán ser fáciles de leer, especialmente:

- Nombre de la clienta titular.
- Fecha y hora de agendamiento.
- Abono.
- Número del ticket.
- Cantidad de atenciones.

La legibilidad será una prioridad, pero siempre respetando el carácter visual del ticket.

#### 7.4. Equilibrio visual

Ningún elemento deberá crecer desproporcionadamente ni alterar la estética general.

Los espacios vacíos también formarán parte del diseño.

No será necesario llenar cada rincón del ticket con información.

#### 7.5. Interacción táctil

Las zonas interactivas deberán ser cómodas para los dedos.

**El tamaño visual de un elemento y el tamaño de su área táctil no tienen por qué ser iguales.**

Por ejemplo, un número pequeño y elegante podrá tener una zona invisible más amplia que facilite tocarlo.

Esto será especialmente importante para los cajones secretos.

#### 7.6. Adaptabilidad

El ticket deberá funcionar correctamente en celulares de distintos tamaños y resoluciones.

La experiencia deberá conservar su identidad, tanto en pantallas pequeñas como grandes.

### 8. El ticket perfecto será el resultado de experimentar

No debemos asumir que encontraremos las proporciones ideales en el primer diseño.

**El ticket perfecto será el resultado de muchas pruebas, observaciones y ajustes.**

Experimentaremos con:

- Tamaños de letra y jerarquías visuales.
- Distribución de espacios.
- Dimensiones de los elementos.
- Áreas táctiles.
- Transiciones y animaciones.
- Comportamiento de los cajones secretos.
- Navegación entre tickets.
- Búsqueda y selección de información.
- Visualización en diferentes celulares.

Cada prueba deberá acercarnos a un equilibrio entre estética, legibilidad, funcionalidad y comodidad.

La referencia no será únicamente cómo se ve el ticket en una pantalla de computador, sino principalmente **cómo se ve, se siente y se utiliza en la mano, desde un celular real**.

No adaptaremos al usuario a las limitaciones del ticket.

Perfeccionaremos el ticket hasta que se adapte naturalmente al usuario.

### 9. Viabilidad técnica

La solución es completamente viable utilizando tecnologías web convencionales.

**HTML**

Definirá la estructura y el contenido del ticket.

**CSS**

Permitirá conservar el diseño vintage, sus proporciones, colores, tipografías, transiciones y adaptación al celular.

Podremos utilizar unidades relativas al tamaño del propio ticket, como las unidades de contenedor de CSS, complementadas con límites mínimos y máximos mediante `clamp()`.

De esta manera, los textos y componentes podrán adaptarse al ancho disponible sin volverse demasiado pequeños ni exageradamente grandes.

**JavaScript**

Dará vida a los cajones secretos y gestionará las interacciones, búsquedas, navegación, edición y actualización dinámica de la información.

**API y PostgreSQL**

Permitirán consultar, actualizar y almacenar los datos de manera segura.

No será necesario construir un ticket HTML diferente para cada atención.

**Un único componente podrá representar dinámicamente todos los tickets**, cambiando su contenido según la navegación del usuario.

El principal desafío no será tecnológico, sino de diseño e interacción: conseguir que todas las funcionalidades convivan sin alterar la apariencia original.

La implementación deberá priorizar simplicidad, velocidad, seguridad y facilidad de mantenimiento.

### 10. Principios fundamentales de la experiencia

El Ticket Mágico deberá cumplir los siguientes principios:

1. **Una sola pantalla:** El ticket es el centro de toda la experiencia.
2. **Una sola identidad visual:** Siempre debe parecer un ticket clásico de los años 80.
3. **Secretos funcionales:** Cada interacción podrá descubrir una nueva capacidad.
4. **Sin ventanas emergentes:** Las operaciones ocurrirán dentro del ticket.
5. **Interacciones reversibles:** Después de cada operación, el ticket recuperará su apariencia original.
6. **Proporciones equilibradas:** Los componentes se adaptarán al tamaño del ticket.
7. **Rapidez:** Las acciones habituales deberán requerir el mínimo esfuerzo posible.
8. **Seguridad:** Los cambios deberán guardarse correctamente y comunicar su resultado.
9. **Descubrimiento intuitivo:** Los secretos deben sorprender, pero nunca confundir.
10. **Simplicidad técnica:** La solución debe ser fácil de construir, evolucionar y mantener.

### 11. La magia del ticket

La inspiración es el **ticket dorado de la fábrica de chocolates**.

Un objeto aparentemente sencillo, con una estética reconocible, que esconde algo extraordinario.

Queremos trasladar esa sensación a la experiencia digital.

El ticket podrá incorporar pequeños detalles de brillo, movimiento y animación que respondan a determinadas interacciones.

Estos efectos deberán ser sutiles, elegantes y funcionales, sin distraer ni ralentizar la operación.

Imaginemos que una sección revela discretamente una nueva funcionalidad, que un número cobra vida al tocarlo o que un pequeño brillo acompaña una acción completada.

No necesitamos grandes efectos visuales.

Necesitamos pequeños detalles que hagan sentir que el ticket está vivo.

**Queremos que el usuario descubra secretos en el ticket. Que cada parte tenga vida. Que explorar sus posibilidades resulte entretenido.**

Pero la magia no estará solamente en los efectos visuales.

La verdadera magia será que el usuario pueda hacer muchas cosas de manera extraordinariamente sencilla.

### 12. Próximo paso: desarrollar y refinar la propuesta

A partir del diseño visual existente, necesitamos desarrollar una propuesta funcional que resuelva:

1. Cómo se activan y despliegan los cajones secretos.
2. Cómo se navega entre tickets.
3. Cómo se buscan y seleccionan clientas y profesionales.
4. Cómo se editan los datos directamente.
5. Cómo se incorporan y consultan las atenciones.
6. Cómo se comunican los cambios guardados y los posibles errores.
7. Cómo se dimensionan proporcionalmente los textos y componentes.
8. Cómo se aprovecha todo el ancho útil del celular.
9. Cómo mantener intacta la apariencia del ticket durante las interacciones.
10. Cómo perfeccionar progresivamente el diseño mediante pruebas reales.

No debemos intentar resolver toda la experiencia de una sola vez.

Primero construiremos un ticket visualmente fiel al diseño original y perfectamente proporcionado.

Después incorporaremos las funcionalidades de manera progresiva, evaluando cómo cada una afecta la experiencia y la apariencia del conjunto.

Finalmente, perfeccionaremos los detalles, las transiciones, los secretos y los efectos visuales.

**Cada funcionalidad deberá ganarse su lugar dentro del ticket.**

No agregaremos elementos simplemente porque sean técnicamente posibles.

Todo deberá tener una razón de existir y aportar valor al usuario.

### 13. Nuestra visión final

Queremos crear algo diferente.

Una interfaz que no parezca una aplicación tradicional.

Un ticket que conserve el encanto de un objeto físico de los años 80, pero que tenga la inteligencia y las capacidades de una aplicación moderna.

Un ticket donde cada elemento pueda esconder una función, donde las operaciones sean rápidas y naturales, y donde el usuario descubra progresivamente nuevas posibilidades.

Una experiencia diseñada especialmente para el celular, aprovechando su pantalla, sus capacidades táctiles y su cercanía con el usuario.

**Un solo ticket. Una sola pantalla. Muchos secretos.**

**Simple por fuera, inteligente por dentro y mágico al descubrirlo.**

Y una última convicción:

**El ticket perfecto no nacerá de una única propuesta. Será el resultado de imaginar, construir, probar, observar y perfeccionar tantas veces como sea necesario.**

---

## 14. Decisiones tomadas (actualización de desarrollo)

Esta sección registra decisiones concretas ya tomadas sobre la visión descrita arriba. La visión no cambia; esto es lo que ya se definió para empezar a construirla.

### 14.1 Dos tickets, un mismo objeto visual, dos propósitos distintos

- **Ticket real** (`ticketm.html`): el de producción. Sin ayuda visible, sin pistas, sin nada que delate dónde están los secretos. Un boleto hermoso y nostálgico, nada más — tal como exige la regla de oro (sección 6).
- **Ticket sandbox** (pendiente de construir): datos de ejemplo, sin consecuencias reales — nada se guarda. **No es una pantalla de ayuda para un usuario confundido.** Es una herramienta de **evangelización y marketing**: mostrar, a un salón de belleza que todavía no usa Kivor (o a cualquier persona a quien haya que convencer), la ventaja de tener una sola interfaz para todo, en vez de saltar de ventana en ventana.
- El sandbox **no será** una captura de pantalla del ticket llena de globitos de explicación — ese es exactamente el formato "manual" que se quiere evitar, porque aburre. Será el mismo ticket, vivo y tocable, con una pista mínima que invita a tocar cualquier zona. Cada toque revela — con una pequeña animación, no un bloque de texto — qué hace esa zona, una por una, en el orden que decida explorar quien lo use. El aprendizaje ocurre en el acto de explorar, no antes ni aparte, igual que en un juego.

### 14.2 Paleta y proporciones definidas: "Papel cálido"

De tres paletas propuestas sobre la misma silueta de ticket, se eligió **Papel cálido**:

- Fondo: `#FBF2E4` → `#F2E0C2` (gradiente diagonal sutil + grano de papel)
- Tinta: `#7A2142` (bordes, marco, talón, número, reglas divisorias)
- Texto: `#4E4E4E` (principal) · `#96898A` (secundario: etiquetas y pie de Cre/Act)

Decisión de proporciones, confirmada tras comprobar el problema en la práctica: **el ticket no fuerza una relación de aspecto fija.** Su alto se ajusta al contenido real. Una proporción de aspecto fija combinada con recorte (`overflow:hidden`) provoca que el texto se superponga en pantallas angostas de celular — se comprobó visualmente y se corrigió. El aspecto "ancho y corto" de ticket clásico se logra con padding y tamaños tipográficos cuidados, no recortando ni forzando una caja. Esto es consistente con la sección 7.2 del documento, que ya permitía el desplazamiento vertical antes que comprimir hasta volver ilegible.

Regla de tamaño: el dato principal (nombre, fecha, status, profesional, monto) nunca baja de 16px. Las etiquetas secundarias y el pie de Cre/Act pueden ser más pequeños (12–13px).

### 14.3 Navegación entre tickets: visible, no 100% secreta

El principio #9 ("los secretos deben sorprender, pero nunca dificultar las tareas habituales") se aplicó así: moverse entre tickets es una tarea habitual — ocurre en cada sesión — así que **no puede depender únicamente de un secreto oculto** que un usuario nuevo no tiene forma de adivinar.

- Mecanismo principal, visible: deslizar (swipe), un gesto ya conocido en celulares.
- Mecanismo secundario, de descubrimiento: tocar el número impreso del ticket (tal como ya proponía la sección 3), como acelerador adicional, no como único camino.

### 14.4 Estados del ticket, en español

Todo el contenido visible es en español, sin excepción — incluyendo los valores de los datos, no solo las etiquetas. Tabla de traducción confirmada para `ticket_status`:

| Valor en base de datos | Texto en español |
|---|---|
| Inactive | Inactivo |
| Assigned | Asignado |
| Started | Iniciado |
| Completed | Completado |
| Approved | Aprobado |
| Finished | Finalizado |

Nota de deuda heredada: el color semántico de `Completed`, `Approved` y `Finished` todavía no está definido en ningún lugar del sistema (hueco ya existente y reconocido en `ticket.js`). `ticketm.html` hereda ese mismo vacío (los muestra en gris neutro) en lugar de inventar una regla de negocio nueva sin aprobación.

### 14.5 Plan de construcción en etapas

Siguiendo el orden que ya proponía la sección 12 del documento:

- **Etapa 1 (construida):** ticket visualmente fiel, proporcionado, conectado a datos reales (`GET /ticket`), navegación entre los tickets del día. Sin cajones secretos todavía.
- **Etapa 2 (próxima):** primer cajón secreto — el abono. Se eligió por ser el de menor riesgo (un solo dato numérico) y porque su endpoint (`PATCH /ticket/{id}/booking-deposit`) ya existe y ya se usa hoy en producción, solo vía modal.
- **Etapa 3:** el resto de los secretos (nombre con búsqueda de clienta, atenciones/profesionales). El secreto de las atenciones (clienta → profesional → fecha → confirmar) necesita su propio ejercicio de diseño antes de estimarse — es el único que podría obligar al ticket a crecer de alto durante la operación.

### 14.6 Archivos del desarrollo

Nuevos, sin modificar nada existente: `ticketm.html`, `css/ticketm.css`, `js/ticketm.js`. Reutilizan `js/api.js` y los endpoints ya existentes (`GET /ticket` hoy; `/customer`, `/booking-deposit`, `/professionals` en las próximas etapas). El listado actual (`ticket.html`, `ticket.js`, `ticket.css`) sigue intacto en producción.

### 14.7 Precisiones del mock v2 (`Especificacion ticket mágico.pptx`)

Un segundo documento, más detallado, confirmó y precisó varias decisiones:

**Filtros.** Confirmado: siempre disponibles, pero escondidos hasta que el usuario decide mostrarlos — exactamente la huella (fecha con chevron + panel) ya construida. No es una excepción a la regla, es la forma correcta de cumplirla.

**Navegación entre tickets — gesto específico.** No es un swipe genérico sobre la tarjeta: es un **arrastre vertical** (arriba/abajo) hecho específicamente sobre el número del ticket, en el talón. Arrastrar hacia arriba avanza al siguiente; hacia abajo, al anterior. Los botones de flecha visibles se mantienen como respaldo fácil de descubrir (principio #9: la navegación es una tarea habitual, no puede depender solo de un secreto).

**Número del ticket — formato y tamaño.** Siempre 5 dígitos con ceros a la izquierda (ej. `00001`), y el número debe ocupar todo el espacio disponible del talón, no un tamaño de letra fijo y modesto.

**Antigüedad del ticket — definición correcta.** Se calcula sobre `ticket_booking_date` (la fecha/hora de agendamiento de la cabecera), no sobre `ticket_status_changed_at` ni sobre `ticket_created_at`. Ejemplo que lo justifica: una clienta agendada hoy a las 10:00 y sin resolver a las 19:00 — ahí está el problema que la antigüedad debe mostrar.

**Contador de posición.** Formato compacto `01-05` (ticket 1 de 5 en la consulta actual), no la frase "Ticket 1 de 5".

**Un quinto secreto, no contemplado en la visión original: el estado.** Arrastrar el dedo horizontalmente sobre el status lo avanza o retrocede en el orden `Inactive → Assigned → Started → Completed → Approved → Finished`, llamando a `PATCH /ticket/{id}/status` (ya existe). Pendiente de construir, junto con el resto de los secretos.

**Atenciones — el detalle de la "ficha".** Cuando un ticket tiene más de una atención, cada una se muestra como una ficha (`Clienta – Profesional – Fecha hora`) que se arrastra horizontalmente para moverse entre las atenciones del mismo ticket, con su propio contador `01-03` (atención 1 de 3). La fecha de agendamiento de la cabecera del ticket no necesariamente coincide con la de la primera atención — son datos relacionados pero distintos. Detalle para la Etapa 3, registrado aquí para no perderlo.

**Pendiente de confirmar:** si el pie `Cre: ... · Act: ...` (timestamps de creación/actualización) se mantiene o se elimina — no apareció en la lista de campos importantes del mock v2, pero tampoco se confirmó su eliminación todavía.
