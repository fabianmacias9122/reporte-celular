"""
Genera el manual de usuario del módulo de Reporte Celular en PDF.

Uso:
    python generar_manual.py

Salida:
    docs/manual/Manual_Reporte_Celular.pdf

Las imágenes deben estar en docs/manual/img/ con los nombres usados abajo.
"""

from __future__ import annotations

import os
from datetime import date

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT
from reportlab.lib.pagesizes import LETTER
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import (
    Image,
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from PIL import Image as PILImage


HERE = os.path.dirname(os.path.abspath(__file__))
IMG_DIR = os.path.join(HERE, "img")
OUTPUT = os.path.join(HERE, "Manual_Reporte_Celular.pdf")


# ─── Paleta inspirada en la app ──────────────────────────────────────────────
PRIMARY = colors.HexColor("#1d4ed8")      # azul botón principal
PRIMARY_DARK = colors.HexColor("#1e3a8a")
ACCENT = colors.HexColor("#16a34a")       # verde de etapas completas
SOFT_BG = colors.HexColor("#f1f5f9")
TEXT = colors.HexColor("#0f172a")
MUTED = colors.HexColor("#475569")


# ─── Estilos ─────────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

H_TITLE = ParagraphStyle(
    "HTitle",
    parent=styles["Title"],
    fontName="Helvetica-Bold",
    fontSize=28,
    leading=34,
    alignment=TA_CENTER,
    textColor=PRIMARY_DARK,
    spaceAfter=12,
)
H_SUBTITLE = ParagraphStyle(
    "HSubtitle",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=14,
    leading=18,
    alignment=TA_CENTER,
    textColor=MUTED,
    spaceAfter=18,
)
H1 = ParagraphStyle(
    "H1",
    parent=styles["Heading1"],
    fontName="Helvetica-Bold",
    fontSize=20,
    leading=24,
    textColor=PRIMARY_DARK,
    spaceBefore=10,
    spaceAfter=10,
)
H2 = ParagraphStyle(
    "H2",
    parent=styles["Heading2"],
    fontName="Helvetica-Bold",
    fontSize=14,
    leading=18,
    textColor=PRIMARY,
    spaceBefore=10,
    spaceAfter=6,
)
BODY = ParagraphStyle(
    "Body",
    parent=styles["Normal"],
    fontName="Helvetica",
    fontSize=10.5,
    leading=15,
    textColor=TEXT,
    alignment=TA_JUSTIFY,
    spaceAfter=6,
)
BULLET = ParagraphStyle(
    "Bullet",
    parent=BODY,
    leftIndent=14,
    bulletIndent=4,
    spaceAfter=2,
    alignment=TA_LEFT,
)
CAPTION = ParagraphStyle(
    "Caption",
    parent=styles["Italic"],
    fontName="Helvetica-Oblique",
    fontSize=9,
    leading=12,
    alignment=TA_CENTER,
    textColor=MUTED,
    spaceBefore=4,
    spaceAfter=14,
)
NOTE = ParagraphStyle(
    "Note",
    parent=BODY,
    backColor=SOFT_BG,
    borderColor=PRIMARY,
    borderWidth=0,
    leftIndent=10,
    rightIndent=10,
    spaceBefore=6,
    spaceAfter=10,
)


# ─── Helpers ─────────────────────────────────────────────────────────────────
def fitted_image(filename: str, max_w_cm: float = 16.0, max_h_cm: float = 18.0) -> Image:
    """Carga una imagen y la escala para encajar dentro de los límites dados, conservando proporción."""
    path = os.path.join(IMG_DIR, filename)
    with PILImage.open(path) as im:
        w, h = im.size
    max_w = max_w_cm * cm
    max_h = max_h_cm * cm
    ratio = min(max_w / w, max_h / h)
    return Image(path, width=w * ratio, height=h * ratio)


def figure(filename: str, caption: str, max_h_cm: float = 17.0):
    return [fitted_image(filename, max_h_cm=max_h_cm), Paragraph(caption, CAPTION)]


def bullets(items: list[str]) -> ListFlowable:
    return ListFlowable(
        [ListItem(Paragraph(t, BULLET), leftIndent=12) for t in items],
        bulletType="bullet",
        bulletColor=PRIMARY,
        bulletFontSize=8,
        leftIndent=10,
    )


def note(text: str) -> Paragraph:
    return Paragraph(f"<b>Nota:</b> {text}", NOTE)


# ─── Encabezado y pie de página ──────────────────────────────────────────────
def on_page(canvas, doc):
    canvas.saveState()
    width, height = LETTER

    # Banda superior
    canvas.setFillColor(PRIMARY_DARK)
    canvas.rect(0, height - 1.4 * cm, width, 1.4 * cm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 10)
    canvas.drawString(2 * cm, height - 0.9 * cm, "IAFCJ · Ministerio Celular")
    canvas.setFont("Helvetica", 9)
    canvas.drawRightString(width - 2 * cm, height - 0.9 * cm, "Manual de usuario · Reporte Celular")

    # Pie
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(2 * cm, 1 * cm, f"Generado el {date.today().isoformat()}")
    canvas.drawRightString(width - 2 * cm, 1 * cm, f"Página {doc.page}")

    canvas.restoreState()


# ─── Contenido ───────────────────────────────────────────────────────────────
def build_story() -> list:
    s: list = []

    # Portada
    s += [
        Spacer(1, 5 * cm),
        Paragraph("Manual de usuario", H_TITLE),
        Paragraph("Módulo de Reporte Celular", H_SUBTITLE),
        Spacer(1, 0.6 * cm),
        Paragraph(
            "Guía paso a paso para llenar el reporte semanal de la célula, "
            "consultar el historial y configurar las preferencias del sistema.",
            ParagraphStyle("PortInt", parent=BODY, alignment=TA_CENTER, fontSize=11, textColor=MUTED),
        ),
        Spacer(1, 4 * cm),
        Paragraph("IAFCJ · Iglesia Apostólica de la Fe en Cristo Jesús",
                  ParagraphStyle("PortFooter", parent=BODY, alignment=TA_CENTER, fontSize=10, textColor=MUTED)),
        Paragraph(f"Versión {date.today().strftime('%Y.%m')}",
                  ParagraphStyle("PortVer", parent=BODY, alignment=TA_CENTER, fontSize=10, textColor=MUTED)),
        PageBreak(),
    ]

    # ── 1. Introducción ──
    s += [
        Paragraph("1. Introducción", H1),
        Paragraph(
            "<b>Reporte Celular</b> es la herramienta web del Ministerio Celular de la IAFCJ "
            "para registrar la actividad semanal de cada célula durante el ciclo de 16 semanas "
            "del cuatrimestre. El reporte está dividido en cinco etapas que se llenan en orden: "
            "<b>Inicio</b> (datos de la célula y la semana), <b>Planeación</b> (reunión previa "
            "solo de hermanos donde se prepara la semana), <b>Alcance</b> (reunión abierta de "
            "la célula con visitas y amigos), <b>Culto</b> (asistencia al servicio dominical) "
            "y <b>Cierre</b> (observaciones y finalización del reporte).",
            BODY,
        ),
        Paragraph(
            "Cada semana del ciclo tiene una palabra clave (ORAR, ANOTAR, CONTACTAR, "
            "CONFIRMAR, DESATAR, LLEVAR, MOTIVAR, INTEGRAR, CONSOLIDAR, PREPARAR, "
            "SANTIFICAR, MATRICULAR, CONSERVAR, DOCTRINAR, DISCIPULAR, BAUTIZAR) que "
            "describe el énfasis pastoral. La app habilita la semana correspondiente "
            "según el calendario y guarda el avance como borrador hasta que se finaliza el reporte.",
            BODY,
        ),
        Paragraph("¿Qué encontrarás en este manual?", H2),
        bullets([
            "Cómo <b>iniciar sesión</b> y cerrar sesión en la app.",
            "Recorrido por la pantalla principal y la barra lateral.",
            "<b>Flujo rápido</b> para llenar un reporte de principio a fin.",
            "Detalle <b>campo por campo</b> de las cinco etapas del reporte.",
            "Cómo registrar visitas, niños, ofrendas y bautismos del cierre cuatrimestral.",
            "Cómo revisar tu <b>Historial</b> y la pantalla de <b>Seguimiento</b>.",
            "Cómo ajustar preferencias en <b>Configuración</b>.",
        ]),
        PageBreak(),
    ]

    # ── 2. Inicio de sesión ──
    s += [
        Paragraph("2. Inicio de sesión", H1),
        Paragraph(
            "Antes de capturar el reporte necesitas iniciar sesión. La pantalla de "
            "acceso aparece automáticamente cuando entras a la app o cuando cierras "
            "sesión con el botón <b>Salir</b>.",
            BODY,
        ),
        Paragraph("2.1 Pantalla de acceso", H2),
        Paragraph(
            "Verás un panel central con el logo de la IAFCJ, el título "
            "<b>Reporte Celular</b> y la indicación <i>Selecciona tu nombre para "
            "acceder</i>. Debajo aparece el campo <b>Usuario</b> y el botón "
            "<b>Entrar →</b> (deshabilitado mientras no escribas nada).",
            BODY,
        ),
        *figure("00-login.png", "Figura 1. Pantalla inicial de acceso.", max_h_cm=14),
        Paragraph("2.2 Paso 1 — escribe tu usuario", H2),
        bullets([
            "Escribe tu nombre de usuario en el formato <b>nombre.apellido</b> (por ejemplo: <i>fabian.macias</i>).",
            "El campo es <b>insensible a mayúsculas</b>, pero debe coincidir con el usuario que tu administrador dio de alta.",
            "Cuando el usuario es válido, el botón <b>Entrar →</b> se activa.",
            "Presiona <b>Entrar →</b> o la tecla <b>Enter</b> para continuar.",
        ]),
        *figure("00b-login-usuario.png", "Figura 2. Usuario capturado, botón Entrar habilitado.", max_h_cm=12),
        Paragraph("2.3 Paso 2 — escribe tu contraseña", H2),
        Paragraph(
            "Si el usuario existe, se muestra un nuevo campo: <b>Contraseña de "
            "[Tu nombre]</b>. Esto sirve también de confirmación visual de que estás "
            "entrando con la cuenta correcta.",
            BODY,
        ),
        bullets([
            "Escribe tu contraseña en el campo <b>Tu contraseña</b>.",
            "Presiona <b>Entrar →</b> para acceder.",
            "Si la contraseña es incorrecta, aparecerá un mensaje y podrás reintentar.",
        ]),
        *figure("00c-login-password.png", "Figura 3. Captura de contraseña tras validar el usuario.", max_h_cm=12),
        Paragraph("2.4 Primera vez que entras", H2),
        bullets([
            "Si tu administrador te dio una contraseña temporal, la app te pedirá <b>cambiarla</b> antes de continuar.",
            "Elige una contraseña que solo tú conozcas y guárdala en un lugar seguro.",
            "Si olvidaste tu contraseña, contacta al administrador para que te genere una nueva.",
        ]),
        Paragraph("2.5 Cerrar sesión", H2),
        Paragraph(
            "En la esquina superior derecha aparece tu nombre y el botón <b>Salir</b>. "
            "Haz clic en él cuando termines, especialmente si compartes la computadora "
            "o el teléfono con alguien más.",
            BODY,
        ),
        note(
            "Nunca compartas tu contraseña. Si crees que alguien más tiene acceso a tu "
            "cuenta, pide al administrador que la restablezca lo antes posible."
        ),
        PageBreak(),
    ]

    # ── 3. Pantalla principal ──
    s += [
        Paragraph("3. Pantalla principal y navegación", H1),
        Paragraph(
            "Al iniciar sesión verás el encabezado azul con el logo de la IAFCJ, "
            "el selector de idioma (ES / EN), tu nombre y el botón <b>Salir</b>. "
            "A la izquierda está la barra lateral con tres secciones: "
            "<b>Reporte</b>, <b>Seguimiento</b> y <b>Config.</b> En el centro se "
            "muestra la etapa activa del reporte, y debajo el panel <b>Historial · "
            "Mis reportes</b> con todas las semanas del cuatrimestre.",
            BODY,
        ),
        Paragraph("Pestañas de etapas", H2),
        Paragraph(
            "En la parte superior del formulario aparecen las cinco pestañas numeradas: "
            "<b>1 Inicio · 2 Planeación · 3 Alcance · 4 Culto · 5 Cierre</b>. "
            "Una palomita verde (✓) indica que la etapa ya tiene datos guardados. "
            "Puedes regresar a cualquier etapa anterior haciendo clic sobre su pestaña; "
            "los datos quedan guardados como borrador hasta que finalices el reporte.",
            BODY,
        ),
        note(
            "El botón <b>Guardar y continuar →</b> al final de cada etapa guarda el "
            "borrador y te lleva automáticamente a la siguiente."
        ),
        *figure("01-inicio.png", "Figura 4. Pantalla principal del reporte (etapa Inicio)."),
        PageBreak(),
    ]

    # ── 4. Flujo rápido ──
    s += [
        Paragraph("4. Flujo rápido para llenar un reporte", H1),
        Paragraph(
            "Si solo quieres llenar el reporte de la semana lo más rápido posible, "
            "sigue estos pasos en orden:",
            BODY,
        ),
        bullets([
            "<b>1.</b> Entra a <b>Reporte</b> en la barra lateral. La app abre la semana activa.",
            "<b>2.</b> En <b>Inicio</b>, confirma semana, líder, asistente, anfitrión, domicilio y fecha de la reunión.",
            "<b>3.</b> En <b>Planeación</b>, marca la asistencia de los hermanos a la reunión preparatoria (Presente / Faltó / Justificado / Sirviendo).",
            "<b>4.</b> En <b>Alcance</b>, marca asistencia a la célula, agrega visitas y amigos, captura niños y registra la ofrenda.",
            "<b>5.</b> En <b>Culto</b>, marca quiénes asistieron al servicio dominical (puedes copiar de Alcance con un clic).",
            "<b>6.</b> En <b>Cierre</b>, revisa las <b>Métricas del reporte</b>, escribe observaciones y presiona <b>Finalizar reporte</b>.",
        ]),
        Paragraph("Atajos útiles en cada etapa", H2),
        bullets([
            "<b>Todos en planeación / Todos a Alcance:</b> marca a todos los hermanos como Presentes en esa columna con un solo clic.",
            "<b>Todos a Alcance + Privilegios:</b> también activa el privilegio para todos.",
            "<b>Alcance → Culto</b> (en Culto): copia los presentes del Alcance al Culto.",
            "<b>Limpiar actividades:</b> regresa todos los miembros a “Sin marcar”.",
            "<b>Vista previa</b> (Cierre): muestra el reporte como se verá impreso, sin guardarlo.",
        ]),
        PageBreak(),
    ]

    # ── 5. Etapa 1: Inicio ──
    s += [
        Paragraph("5. Etapa 1 · Inicio del reporte", H1),
        Paragraph(
            "Aquí defines la <b>semana</b> que vas a reportar y el <b>equipo de la célula</b>. "
            "La app sugiere la semana activa según el calendario IAFCJ; las semanas "
            "bloqueadas o ya cerradas aparecen deshabilitadas en la lista.",
            BODY,
        ),
        Paragraph("5.1 Bloque “Captura” — datos de la semana", H2),
        bullets([
            "<b>Semana:</b> abre el desplegable y elige la semana del ciclo (1 a 16). Cada opción muestra el número, la fase (Ganar / Consolidar / Discipular) y la palabra clave (ORAR, ANOTAR, CONTACTAR…). Las marcadas con ★ corresponden a semanas de cierre.",
            "<b>Célula:</b> se muestra automáticamente con tu asignación. Si tienes más de una, elige la que vas a reportar.",
            "<b>Red, Sector, Zona y Distrito:</b> son datos descriptivos de tu célula y suelen venir precargados.",
            "El recuadro verde inferior muestra la <b>palabra clave</b> de la semana y una breve explicación pastoral del énfasis.",
        ]),
        Paragraph("5.2 Bloque “Equipo” — liderazgo y reunión", H2),
        bullets([
            "<b>Líder · catálogo:</b> selecciona del catálogo el nombre del líder de la célula.",
            "<b>Asistente · catálogo:</b> selecciona el asistente.",
            "<b>Anfitrión · catálogo:</b> selecciona la persona que presta su casa para la reunión.",
            "<b>Domicilio:</b> escribe la dirección donde se realizó la reunión.",
            "<b>Fecha de reunión:</b> elige el día en que se celebró la célula.",
            "<b>Miembros asignados a la célula:</b> lista de etiquetas con todos los integrantes activos. Si falta alguien, pídele al administrador agregarlo al catálogo.",
        ]),
        note(
            "Cuando termines, presiona <b>Guardar y continuar →</b>. La pestaña "
            "<b>1 Inicio</b> mostrará una palomita verde (✓) y avanzarás a "
            "<b>Planeación</b>."
        ),
        PageBreak(),
    ]

    # ── 6. Etapa 2: Planeación ──
    s += [
        Paragraph("6. Etapa 2 · Planeación", H1),
        Paragraph(
            "La <b>Planeación</b> es la <b>reunión previa solo de hermanos</b> (miembros de la "
            "célula). En ella se ora, se analiza la semana y se organiza cómo se llevará a cabo "
            "la <b>reunión de Alcance</b>: quién dirige, quién recibe a las visitas, a quiénes "
            "se va a invitar y los compromisos que cada hermano asume.",
            BODY,
        ),
        Paragraph(
            "En esta pantalla solo registras la asistencia de los <b>hermanos</b> a esa reunión "
            "preparatoria. Las visitas y amigos se capturan después, en la etapa de Alcance.",
            BODY,
        ),
        Paragraph("6.1 Tabla “Asistencia de miembros” — paso a paso", H2),
        bullets([
            "<b>Columna Miembro:</b> aparece el nombre y rol de cada hermano (Líder, Asistente, Anfitrión, Miembro).",
            "<b>Columna Estado semanal:</b> abre el desplegable y elige <b>Presente, Faltó, Justificado, Sirviendo</b> o déjalo en <b>Sin marcar</b>.",
            "<b>Columna Planeación ★:</b> marca la casilla de los hermanos que asistieron a la reunión de planeación.",
            "<b>Columna Observación:</b> escribe una nota breve por hermano si hace falta (ej. “llegó tarde”, “sirvió en culto general”, “fuera de la ciudad”).",
        ]),
        Paragraph("6.2 Atajos rápidos", H2),
        bullets([
            "<b>Todos en planeación:</b> marca de un solo clic la columna Planeación para todos los hermanos.",
            "<b>Limpiar actividades:</b> desmarca toda la columna y regresa el estado semanal a “Sin marcar”.",
        ]),
        Paragraph(
            "El indicador <b>0/9 marcados</b> en la parte superior derecha te recuerda cuántos "
            "hermanos llevas marcados. Debajo de la tabla, el bloque <b>Faltaron esta semana</b> "
            "lista a los hermanos cuyo estado quedó en “Faltó”.",
            BODY,
        ),
        note(
            "El número de hermanos en planeación se compara después con los que asistieron al "
            "Alcance, generando el indicador <b>Planeación → Alcance</b> en las métricas."
        ),
        *figure("02-planeacion.png", "Figura 5. Etapa de Planeación (reunión solo de hermanos).", max_h_cm=15),
        PageBreak(),
    ]

    # ── 7. Etapa 3: Alcance ──
    s += [
        Paragraph("7. Etapa 3 · Alcance", H1),
        Paragraph(
            "El <b>Alcance</b> es la reunión semanal abierta de la célula, donde participan "
            "<b>hermanos, amigos y visitas</b>. En esta etapa registras la asistencia, las "
            "visitas, los niños, la ofrenda y la supervisión que estuvo presente.",
            BODY,
        ),
        Paragraph(
            "En la parte superior verás los contadores: <b>Alcance · Amigos · Niños</b>, que "
            "se actualizan automáticamente conforme capturas datos.",
            BODY,
        ),
        Paragraph("7.1 Asistencia de miembros", H2),
        bullets([
            "<b>Estado semanal:</b> Presente / Faltó / Justificado / Sirviendo.",
            "<b>Columna Alcance:</b> marca a los hermanos que asistieron a la reunión de la célula.",
            "<b>Columna Privilegios ★:</b> se habilita al marcar Alcance y sirve para indicar que el hermano participó con un privilegio (alabanza, palabra, recibimiento, etc.).",
            "<b>Atajo “Todos a Alcance”:</b> marca a todos los hermanos como presentes.",
            "<b>Atajo “Todos a Alcance + Privilegios”:</b> marca presencia y privilegio a todos.",
        ]),
        Paragraph("7.2 Bloque “Visitas y amigos”", H2),
        Paragraph(
            "Aquí capturas a las personas no-miembros que asistieron al Alcance. Tienes dos formas:",
            BODY,
        ),
        bullets([
            "<b>Visita previa:</b> abre el desplegable “Elegir del historial” para reutilizar a alguien que ya asistió antes.",
            "<b>Nombre de la visita:</b> o escribe el nombre completo de una visita nueva.",
            "<b>Tipo:</b> elige <b>Amigo (no bautizado)</b> o <b>Visita (restauración)</b>.",
            "<b>Invitó:</b> selecciona qué hermano de la célula la invitó.",
            "<b>Casillas:</b> <b>Alcance</b> (asistió a la célula), <b>Primera vez</b> (es su primera asistencia) y <b>Conversión</b> (recibió a Cristo en esa reunión).",
            "Presiona <b>Agregar visita</b> para incorporarla a la tabla. Usa <b>Vaciar formulario</b> para limpiar los campos sin guardar.",
            "También puedes presionar <b>Agregar fila manual</b> para capturar varias visitas directamente en la tabla.",
        ]),
        Paragraph(
            "La tabla inferior muestra columnas: <b>Nombre, Invitó, Alcance, Primera vez, "
            "Conversión, Contactado, Teléfono, Observación, Acciones</b>. Puedes editar "
            "cualquier celda o eliminar una fila desde la columna Acciones.",
            BODY,
        ),
        Paragraph("7.3 Bloque “Niños”", H2),
        bullets([
            "<b>Niños precargados de la célula:</b> aparecen los hijos de los miembros; solo marca la casilla <b>Alcance</b> de los que asistieron.",
            "<b>Agregar niño de visita:</b> abre una fila para capturar un niño que llegó como visita (Niño, Responsable, Origen, Observación).",
            "<b>Limpiar niños:</b> desmarca todos los niños del Alcance.",
        ]),
        Paragraph("7.4 Bloque “Ofrendas y supervisión”", H2),
        bullets([
            "<b>Reunión de alcance · Ofrenda ($):</b> escribe el monto total recolectado en la célula.",
            "<b>Supervisión:</b> indica cuántas personas de Sup. Red, Sup. Sector, Sup. Zona, Sup. Región y Sup. Área asistieron a supervisar la reunión.",
        ]),
        *figure("03-alcance.png", "Figura 6. Etapa de Alcance.", max_h_cm=15),
        PageBreak(),
    ]

    # ── 8. Etapa 4: Culto ──
    s += [
        Paragraph("8. Etapa 4 · Culto", H1),
        Paragraph(
            "En <b>Culto</b> se reporta la asistencia de la célula al <b>servicio dominical</b> "
            "(culto general). Esto permite medir cuántos de los que asistieron a la célula "
            "también llegaron al culto, y cuántas visitas pasaron del Alcance al servicio.",
            BODY,
        ),
        Paragraph(
            "Arriba se muestran cinco contadores: <b>Planeación · Alcance · Culto · Amigos · "
            "Niños</b>, para que veas la conversión entre etapas mientras llenas.",
            BODY,
        ),
        Paragraph("8.1 Asistencia de miembros al culto", H2),
        bullets([
            "<b>Estado semanal:</b> mismo desplegable Presente / Faltó / Justificado / Sirviendo.",
            "<b>Columna Culto:</b> marca a los hermanos que asistieron al servicio dominical.",
            "<b>Atajo “Alcance → Culto”:</b> copia automáticamente como Presentes en Culto a todos los que estuvieron en Alcance. Es la forma más rápida de empezar.",
            "<b>Observación:</b> nota breve por hermano si aplica.",
        ]),
        Paragraph("8.2 Visitas y niños en el culto", H2),
        bullets([
            "En el bloque de visitas, marca la casilla <b>Culto</b> para las visitas que también llegaron al servicio dominical.",
            "Igual que en Alcance, puedes agregar visitas nuevas o elegirlas del historial.",
            "En el bloque de niños, marca los niños que asistieron al culto.",
        ]),
        *figure("04-culto.png", "Figura 7. Etapa de Culto.", max_h_cm=15),
        PageBreak(),
    ]

    # ── 9. Etapa 5: Cierre ──
    s += [
        Paragraph("9. Etapa 5 · Cierre del reporte", H1),
        Paragraph(
            "En <b>Cierre</b> revisas las métricas del reporte, escribes las observaciones de "
            "la semana y finalizas. Es la última etapa antes de que el reporte quede registrado.",
            BODY,
        ),
        Paragraph("9.1 Métricas del reporte (panel desplegable)", H2),
        Paragraph(
            "Haz clic en <b>Métricas del reporte ▾</b> para expandir el panel. Casi todas las "
            "celdas marcadas con <i>auto</i> se calculan solas a partir de lo capturado en las "
            "etapas previas; solo unas pocas se editan manualmente.",
            BODY,
        ),
        bullets([
            "<b>Planeación:</b> Miembros asistentes (auto), Miembros ausentes (auto).",
            "<b>Alcance:</b> Miembros asistentes, Miembros con privilegios, Amigos presentes, Conversiones, Niños presentes (todos auto).",
            "<b>Multiplicación (manual):</b> Hnos. en nueva célula, P.E. en nueva célula, Niños en nueva célula. <b>Asistieron al culto insp.</b> es auto.",
            "<b>Fase Ganar:</b> Padres espirituales, Amigos contactados, Amigos en E. Levántate, <b>Amigos en E.D.R. (manual)</b>, Amigos bautizados (auto).",
            "<b>Fase Consolidar (auto):</b> E1 Maduración, E2 Integración, E3 Ubicación, Evento Únete, Evento Re-encuentro, Evento Ministerios.",
            "<b>Fase Discipular (auto):</b> E1 Visión, E2 Carácter, E3 Perfil, Lanzamiento/Multiplicación.",
            "<b>Escuelas (auto):</b> Esc. Formativa, Esc. Padres Esp., Esc. Líderes, Esc. Supervisores.",
            "<b>Bautismos (auto):</b> 1er., 2do., 3er. Cuatrimestre y Total Año.",
        ]),
        note(
            "Los valores marcados como <i>auto</i> se recalculan al instante. Si necesitas "
            "ajustar uno, hazlo en la etapa correspondiente (no en el panel de métricas)."
        ),
        *figure("06-metricas.png", "Figura 9. Panel de métricas expandido.", max_h_cm=15),
        Paragraph("9.2 Notas del reporte", H2),
        bullets([
            "<b>Observaciones:</b> texto libre para anotar acuerdos, peticiones, seguimiento o cualquier nota relevante de la semana.",
            "<b>Vista previa:</b> abre una versión imprimible del reporte para revisar antes de guardar.",
            "<b>Limpiar:</b> borra el texto de observaciones.",
        ]),
        Paragraph("9.3 Finalizar el reporte", H2),
        Paragraph(
            "Cuando todo esté correcto, presiona el botón <b>Finalizar reporte</b>. La semana "
            "quedará marcada como completada en tu Historial y ya no podrás editarla desde la "
            "interfaz normal.",
            BODY,
        ),
        note(
            "Si necesitas corregir un reporte ya finalizado, contacta al administrador del "
            "sistema para que lo reabra."
        ),
        *figure("05-cierre.png", "Figura 8. Etapa de Cierre y notas del reporte.", max_h_cm=13),
        PageBreak(),
    ]

    # ── 10. Bautismos en cierre cuatrimestral ──
    s += [
        Paragraph("10. Bautismos del cierre cuatrimestral", H1),
        Paragraph(
            "En las semanas marcadas con estrella ★ (especialmente en <b>BAUTIZAR</b>, semana 16) "
            "se habilita el bloque <b>Bautismos · Cierre cuatrimestral</b> dentro de las etapas "
            "de Alcance y Culto. Aquí registras a las personas que se bautizaron durante el "
            "cuatrimestre.",
            BODY,
        ),
        Paragraph("Cómo registrar un bautismo", H2),
        bullets([
            "Presiona <b>Registrar bautismo</b>. Se abre una fila nueva.",
            "<b>Persona:</b> escribe el nombre completo o elige del historial de visitas.",
            "<b>Fecha:</b> selecciona la fecha del bautismo.",
            "<b>Origen:</b> indica de qué célula o ministerio proviene la persona.",
            "<b>Agregar como miembro al guardar:</b> marca esta casilla si la persona se promueve a miembro de tu célula. Al finalizar el reporte se agregará automáticamente.",
        ]),
        note(
            "Los bautismos pueden registrarse fuera del cierre, pero solo los del cierre "
            "habilitado se cuentan en las métricas anuales (1er, 2do, 3er Cuatrimestre y Total Año)."
        ),
        Paragraph(
            "El resumen <b>Bautismos del cierre del cuatrimestre</b> muestra el acumulado por "
            "trimestre y el total del año, lo que te permite ver de un vistazo el avance de la "
            "célula en este indicador.",
            BODY,
        ),
        PageBreak(),
    ]

    # ── 11. Historial y Seguimiento ──
    s += [
        Paragraph("11. Historial y Seguimiento", H1),
        Paragraph("11.1 Historial · Mis reportes (debajo del formulario)", H2),
        Paragraph(
            "Debajo del formulario de reporte aparece el panel <b>Mis reportes</b> con la "
            "rejilla de las 16 semanas del cuatrimestre. Cada botón muestra el número de "
            "semana y la palabra clave (ORAR, ANOTAR, CONTACTAR…). Los iconos te indican el "
            "estado:",
            BODY,
        ),
        bullets([
            "<b>Sin icono:</b> semana pendiente o no llegada todavía.",
            "<b>✎ (lápiz):</b> hay un borrador en proceso para esa semana.",
            "<b>✓ (palomita):</b> el reporte de esa semana está finalizado.",
            "<b>★ (estrella):</b> es una semana clave del ciclo (LLEVAR, SANTIFICAR, BAUTIZAR).",
            "<b>Botón deshabilitado:</b> aún no se habilita esa semana en el calendario.",
        ]),
        Paragraph(
            "Haz clic en cualquier semana del historial para abrir su reporte y consultarlo o "
            "continuarlo si está en borrador.",
            BODY,
        ),
        Paragraph("11.2 Seguimiento (barra lateral)", H2),
        Paragraph(
            "La sección <b>Seguimiento</b> está pensada para coordinadores y supervisores. "
            "Muestra el avance consolidado de las células del sector, con filtros por fase "
            "del ciclo:",
            BODY,
        ),
        bullets([
            "<b>Ganar (sem. 1–6) · Consolidar (7–12) · Discipular (13–15) · Cierre (16).</b>",
            "<b>Este cuatrimestre</b> o <b>Todo</b> según el periodo que quieras revisar.",
            "Por cada célula puedes ver el líder, la semana actual y el detalle de bautismos.",
            "Las celdas marcadas <b>Pendiente</b> permiten capturar el reporte directamente.",
        ]),
        *figure("07-seguimiento.png", "Figura 10. Pantalla de Seguimiento.", max_h_cm=14),
        PageBreak(),
    ]

    # ── 12. Configuración ──
    s += [
        Paragraph("12. Configuración", H1),
        Paragraph(
            "En <b>Config.</b> ajustas tus preferencias personales y consultas el contexto del "
            "año en curso.",
            BODY,
        ),
        bullets([
            "<b>Contexto del año:</b> muestra el cuatrimestre actual (Q1 Ene–Abr, Q2 May–Ago, Q3 Sep–Dic) según el calendario IAFCJ y las fechas exactas del periodo.",
            "<b>Preferencias de historial:</b> elige si en <b>Mis reportes</b> quieres ver solo el cuatrimestre actual o todos los cuatrimestres del año. Recuerda presionar <b>Guardar preferencias</b>.",
            "<b>Idioma:</b> alterna entre <b>Español</b> y <b>English</b>. El cambio aplica a toda la interfaz.",
        ]),
        *figure("08-config.png", "Figura 11. Pantalla de Configuración.", max_h_cm=14),
        PageBreak(),
    ]

    # ── 13. Buenas prácticas ──
    s += [
        Paragraph("13. Buenas prácticas y solución de problemas", H1),
        Paragraph("Buenas prácticas", H2),
        bullets([
            "Llena el reporte el mismo día de la reunión, mientras la información está fresca.",
            "Usa los atajos (<b>Todos a Alcance</b>, <b>Alcance → Culto</b>) para ahorrar tiempo.",
            "Revisa la <b>Vista previa</b> antes de finalizar para evitar correcciones posteriores.",
            "Mantén actualizado el catálogo de líderes y miembros con tu coordinador.",
            "Captura las visitas con su teléfono cuando sea posible: facilita el seguimiento.",
        ]),
        Paragraph("Si algo no funciona", H2),
        bullets([
            "<b>No puedo entrar:</b> verifica que tu usuario esté escrito en formato <i>nombre.apellido</i> y que la contraseña sea la actual; si no recuerdas, pide al administrador que la restablezca.",
            "<b>No puedo seleccionar una semana:</b> está bloqueada por el calendario o ya fue cerrada.",
            "<b>No aparece mi célula:</b> tu usuario aún no tiene asignación; contacta al administrador.",
            "<b>El reporte no guarda:</b> verifica tu conexión a internet y vuelve a intentarlo.",
            "<b>Cambio de idioma no se aplica:</b> recarga la página después de cambiar el idioma.",
            "<b>Ya finalicé pero necesito corregir:</b> contacta al administrador para que reabra el reporte.",
        ]),
        Spacer(1, 1 * cm),
        Paragraph(
            "Para soporte adicional o solicitar cambios, contacta al equipo del Ministerio Celular IAFCJ.",
            ParagraphStyle("End", parent=BODY, alignment=TA_CENTER, textColor=MUTED, fontSize=10),
        ),
    ]

    return s


def main() -> None:
    doc = SimpleDocTemplate(
        OUTPUT,
        pagesize=LETTER,
        leftMargin=2 * cm,
        rightMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=1.8 * cm,
        title="Manual de usuario · Reporte Celular",
        author="IAFCJ · Ministerio Celular",
    )
    doc.build(build_story(), onFirstPage=on_page, onLaterPages=on_page)
    print(f"PDF generado: {OUTPUT}")


if __name__ == "__main__":
    main()
