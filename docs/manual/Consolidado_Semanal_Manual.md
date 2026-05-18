# 📊 Consolidado Semanal — Manual de uso

Módulo del sistema de **Reporte Celular** para supervisar, aprobar y compartir
los reportes de todas las células de un sector en una semana.

> Pestaña: **Seguimiento → Consolidado semanal**

---

## Índice

1. [¿Qué es el Consolidado semanal?](#qué-es-el-consolidado-semanal)
2. [¿Quién ve qué?](#quién-ve-qué)
3. [Flujo de aprobación](#flujo-de-aprobación)
4. [Guía para el **Supervisor**](#guía-para-el-supervisor)
5. [Guía para el **Coordinador**](#guía-para-el-coordinador)
6. [Funciones compartidas](#funciones-compartidas)
7. [Preguntas frecuentes](#preguntas-frecuentes)

---

## ¿Qué es el Consolidado semanal?

Es una vista que agrupa, **en una sola tabla**, todos los reportes de las
células que pertenecen a un sector durante una semana específica. Permite:

- Comparar de un vistazo cuántos miembros asistieron, cuánta ofrenda hubo,
  cuántos amigos visitaron, etc., **célula por célula**.
- Ver el **acumulado total del sector** (columna derecha).
- **Aprobar** el envío del paquete al coordinador.
- **Descargar** la tabla como imagen PNG.
- **Compartir** el resumen por WhatsApp con un solo tap.

---

## ¿Quién ve qué?

| Rol | ¿Qué ve? |
|---|---|
| **Supervisor** | Solo el sector que él/ella supervisa. Puede revisar y enviar al coordinador. |
| **Coordinador** | Todos los sectores (selector de supervisor). **No** ve los datos en bruto hasta que el supervisor envía el paquete. Acusa recibido. |
| **Coordinador-supervisor** (es ambos) | Actúa como supervisor en su propio sector; como coordinador en los demás. |

---

## Flujo de aprobación

```
┌──────────────┐   Supervisor    ┌──────────────────────┐  Coordinador  ┌──────────────────────┐
│  Pendiente   │ ─────────────▶  │ Revisado y enviado   │ ────────────▶ │ Recibido por         │
│  de revisión │  envía          │ al coordinador       │  acusa recibo │ coordinador          │
└──────────────┘                 └──────────────────────┘               └──────────────────────┘
       ▲                                   │
       └───────────── "Regresar a pendiente" ──────────────┐
                    (supervisor o coordinador)              ▼
```

Estados:

- 🟠 **Pendiente de revisión** — el supervisor aún no envía la semana. El coordinador NO ve los datos detallados.
- 🔵 **Revisado y enviado al coordinador** — el coordinador ya puede ver los datos.
- 🟢 **Recibido por coordinador** — proceso cerrado.

Cada estado se guarda con la fecha y la persona que ejecutó la acción.

---

## Guía para el **Supervisor**

### 1. Entrar a la vista

1. Inicia sesión con tu usuario.
2. Ve a la pestaña **Seguimiento** (barra superior).
3. Dentro del seguimiento, abre el sub-tab **Consolidado semanal**.

> El sistema te muestra **automáticamente tu sector** (no necesitas elegirlo).

### 2. Elegir la semana

- Por defecto se muestra la **semana anterior** (la que acaba de cerrar).
- Cambia el selector de **Semana** si quieres ver otra.
- El **Verbo** del trimestre (planeación / alcance / culto) aparece junto al
  nombre del supervisor.

### 3. Revisar los números

- Cada **columna** = una célula de tu sector.
- Las **filas** son las métricas: planeación, alcance, culto inspirador.
- La columna **Total** (derecha, resaltada) es la suma del sector.
- El chip **X/Y células con reporte** indica cuántas células ya enviaron datos.

> En móvil, la primera columna (etiquetas) y la columna **Total** quedan fijas
> con sombra mientras deslizas las columnas de células por debajo.

### 4. Ver el reporte completo de una célula

- Toca el botón **🔍** que aparece junto al número de célula en el encabezado.
- Se abre el reporte completo en modo solo lectura (mismo formato que el del líder).

### 5. Enviar al coordinador

1. Verifica que los números cuadren.
2. Pulsa **Revisado · enviar al coordinador**.
3. El estado cambia a **Revisado y enviado**, y se registra tu nombre y la fecha.
4. A partir de ese momento el coordinador puede ver los datos.

> ⚠️ Si necesitas corregir algo después, pulsa **Regresar a pendiente** y vuelve
> a enviar cuando esté listo. El coordinador volverá a ver el estado pendiente.

### 6. Descargar / compartir

- **⬇️ PNG** — descarga la tabla completa como imagen.
- **WhatsApp** — abre el selector nativo de tu celular para enviar
  **imagen + texto** directo a un contacto o grupo.

---

## Guía para el **Coordinador**

### 1. Entrar a la vista

1. Inicia sesión.
2. **Seguimiento → Consolidado semanal**.
3. Aparece un **selector de Supervisor**: elige el sector que quieres revisar.

### 2. Elegir semana y supervisor

- Combinaciones independientes: puedes cambiar de **supervisor** y de
  **semana** sin perder el contexto.
- Por defecto se muestra la semana anterior.

### 3. Esperar al supervisor (estado Pendiente)

Si el supervisor **aún no ha enviado** la semana, verás:

```
⏳ Esperando revisión del supervisor

El detalle estará disponible cuando [Nombre del supervisor]
revise y envíe los datos de esta semana.
```

No se muestran los números crudos — esto evita que tomes decisiones con datos
sin validar.

### 4. Cuando el supervisor envía (estado Revisado)

- Ya ves la tabla completa con todas las células.
- En la barra superior aparece: "Revisado y enviado por [Nombre] el [fecha]".
- Tu botón disponible: **Acusar recibido**.

### 5. Acusar recibido

1. Revisa el consolidado.
2. Pulsa **Acusar recibido**.
3. El estado cambia a **Recibido por coordinador** con tu nombre y fecha.

> Si detectas un problema y necesitas que el supervisor corrija, pulsa
> **Regresar a pendiente**. Ambos verán el cambio.

### 6. Comparar varios sectores

Solo cambia el selector de **Supervisor** en la parte superior y la tabla se
actualiza sin recargar.

### 7. Descargar / compartir

Las mismas opciones que el supervisor:

- **⬇️ PNG** — guarda la imagen del consolidado.
- **WhatsApp** — comparte imagen + resumen.

---

## Funciones compartidas

### 🔍 Vista previa del reporte de una célula

- Disponible para ambos roles.
- Se abre como modal de solo lectura.
- Dentro del modal también puedes:
  - **⬇️ PNG** — descargar ese reporte individual.
  - **WhatsApp** — compartir solo ese reporte.

### ⬇️ Descargar PNG

- Captura visual exacta de lo que ves en pantalla.
- Los botones de acción se ocultan automáticamente en la imagen.
- El nombre del archivo incluye sector/célula y semana, por ejemplo:
  `reporte-A-S12.png` o `reporte-celula6-S12.png`.

### 🟢 Compartir por WhatsApp

**En celular (Android / iOS):**

1. Toca **WhatsApp**.
2. Se abre el selector nativo del sistema.
3. Elige **WhatsApp** → contacto o grupo → enviar.
4. Se envían **imagen y texto juntos**, en un solo mensaje.

**En computadora (PC / Mac):**

1. Toca **WhatsApp**.
2. Se descarga la imagen PNG.
3. Aparece un aviso: *"Se descargó la imagen. Adjúntala manualmente con el clip 📎"*.
4. Se abre WhatsApp Web con el resumen ya escrito.
5. Adjunta la imagen descargada con el ícono 📎.

> 💡 La mejor experiencia es **desde celular**: un solo tap → envío directo.

### Formato del mensaje de texto (WhatsApp)

```
📊 *Reporte semanal · Sector A*
Supervisor: Carlos Martínez
Semana 12 · ANOTAR
Células reportadas: 4/4

*PLANEACIÓN*
• Miembros bautizados: 25
• Miembros asistentes: 18
• Miembros ausentes: 7

*ALCANCE*
• Miembros asistentes: 16
• Con privilegios: 4
• Amigos: 8
• En restauración: 2
• Niños: 5
• Ofrenda: $1,250.00

*CULTO INSPIRADOR*
• Miembros: 20
• Amigos: 6
• En restauración: 1
• Niños: 4
```

---

## Preguntas frecuentes

**¿Por qué no veo datos siendo coordinador?**
Porque el supervisor de ese sector aún no ha enviado la semana. Espera el
envío o pídele al supervisor que la cierre.

**¿Puedo editar un reporte desde aquí?**
No, esta vista es de **solo lectura**. La captura/edición de cada célula se
hace en su propio flujo (líder o quien capture). Aquí solo se revisa, aprueba
y comparte.

**¿Qué pasa si el supervisor envía y luego el coordinador no acusa recibido?**
Nada se rompe; queda en estado **Revisado y enviado** hasta que el coordinador
lo acuse o lo regrese a pendiente.

**¿La imagen se ve igual en cualquier celular?**
Sí, la captura usa lo que está en pantalla. Si quieres una imagen más
"institucional", úsala desde escritorio (pantalla más grande).

**¿WhatsApp guarda el mensaje en mis Sent?**
Sí, exactamente igual que cualquier envío manual: se queda en tu chat.

**¿Funciona offline?**
La vista funciona si ya estaba cargada, pero **enviar / aprobar / compartir**
requieren conexión a internet.

---

*Documento generado para el equipo de coordinadores y supervisores.*
*Versión: mayo 2026.*
