"""
Genera el manual PDF del Consolidado semanal (workflow supervisor → coordinador).

Uso:
    python generar_manual_consolidado.py

Salida:
    docs/manual/Manual_Consolidado_Semanal.pdf

Reusa la paleta y estilos del manual principal (`generar_manual.py`).
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
    ListFlowable,
    ListItem,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


HERE = os.path.dirname(os.path.abspath(__file__))
OUTPUT = os.path.join(HERE, "Manual_Consolidado_Semanal.pdf")


# ─── Paleta (idéntica al manual principal) ────────────────────────────────
PRIMARY = colors.HexColor("#1d4ed8")
PRIMARY_DARK = colors.HexColor("#1e3a8a")
ACCENT = colors.HexColor("#16a34a")
SOFT_BG = colors.HexColor("#f1f5f9")
TEXT = colors.HexColor("#0f172a")
MUTED = colors.HexColor("#475569")
WARN_BG = colors.HexColor("#fef3c7")
SUCCESS_BG = colors.HexColor("#dcfce7")
INFO_BG = colors.HexColor("#dbeafe")


# ─── Estilos ──────────────────────────────────────────────────────────────
styles = getSampleStyleSheet()

H_TITLE = ParagraphStyle("HTitle", parent=styles["Title"], fontName="Helvetica-Bold",
                         fontSize=28, leading=34, alignment=TA_CENTER,
                         textColor=PRIMARY_DARK, spaceAfter=12)
H_SUBTITLE = ParagraphStyle("HSubtitle", parent=styles["Normal"], fontName="Helvetica",
                            fontSize=14, leading=18, alignment=TA_CENTER,
                            textColor=MUTED, spaceAfter=18)
H1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName="Helvetica-Bold",
                    fontSize=20, leading=24, textColor=PRIMARY_DARK,
                    spaceBefore=10, spaceAfter=10)
H2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Helvetica-Bold",
                    fontSize=14, leading=18, textColor=PRIMARY,
                    spaceBefore=10, spaceAfter=6)
BODY = ParagraphStyle("Body", parent=styles["Normal"], fontName="Helvetica",
                      fontSize=10.5, leading=15, textColor=TEXT,
                      alignment=TA_JUSTIFY, spaceAfter=6)
BULLET = ParagraphStyle("Bullet", parent=BODY, leftIndent=14, bulletIndent=4,
                        spaceAfter=2, alignment=TA_LEFT)
NOTE = ParagraphStyle("Note", parent=BODY, backColor=SOFT_BG, leftIndent=10,
                      rightIndent=10, spaceBefore=6, spaceAfter=10)
WARN = ParagraphStyle("Warn", parent=BODY, backColor=WARN_BG, leftIndent=10,
                      rightIndent=10, spaceBefore=6, spaceAfter=10)


def bullets(items: list[str]) -> ListFlowable:
    return ListFlowable(
        [ListItem(Paragraph(t, BULLET), leftIndent=12) for t in items],
        bulletType="bullet", bulletColor=PRIMARY,
        bulletFontSize=8, leftIndent=10,
    )


def note(text: str) -> Paragraph:
    return Paragraph(f"<b>Nota:</b> {text}", NOTE)


def warn(text: str) -> Paragraph:
    return Paragraph(f"<b>⚠️ Atención:</b> {text}", WARN)


def state_table() -> Table:
    """Tabla visual del flujo de estados."""
    data = [
        [Paragraph("<b>Estado</b>", BODY), Paragraph("<b>¿Qué significa?</b>", BODY),
         Paragraph("<b>Acción posible</b>", BODY)],
        [Paragraph("<b>🟠 Pendiente</b>", BODY),
         Paragraph("El supervisor aún no envía la semana. El coordinador <b>NO</b> ve datos detallados.", BODY),
         Paragraph("Supervisor: <i>Revisado · enviar</i>", BODY)],
        [Paragraph("<b>🔵 Revisado</b>", BODY),
         Paragraph("Datos validados por el supervisor. El coordinador ya puede revisarlos.", BODY),
         Paragraph("Coordinador: <i>Acusar recibido</i><br/>Cualquiera: <i>Regresar a pendiente</i>", BODY)],
        [Paragraph("<b>🟢 Recibido</b>", BODY),
         Paragraph("El coordinador acusó recibido. Proceso cerrado.", BODY),
         Paragraph("Coordinador: <i>Regresar a pendiente</i> (si hace falta corrección)", BODY)],
    ]
    t = Table(data, colWidths=[3.5 * cm, 7.5 * cm, 5.5 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY_DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


def roles_table() -> Table:
    data = [
        [Paragraph("<b>Rol</b>", BODY), Paragraph("<b>¿Qué ve?</b>", BODY)],
        [Paragraph("<b>Supervisor</b>", BODY),
         Paragraph("Solo el sector que supervisa. Puede revisar y enviar al coordinador.", BODY)],
        [Paragraph("<b>Coordinador</b>", BODY),
         Paragraph("Todos los sectores (selector de supervisor). No ve datos en bruto "
                   "hasta que el supervisor envía. Acusa recibido.", BODY)],
        [Paragraph("<b>Coordinador-supervisor</b>", BODY),
         Paragraph("Actúa como supervisor en su propio sector; como coordinador en los demás.", BODY)],
    ]
    t = Table(data, colWidths=[4.5 * cm, 12.0 * cm])
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), PRIMARY_DARK),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]))
    return t


# ─── Encabezado y pie ─────────────────────────────────────────────────────
def on_page(canvas, doc):
    canvas.saveState()
    width, height = LETTER
    canvas.setFillColor(PRIMARY_DARK)
    canvas.rect(0, height - 1.4 * cm, width, 1.4 * cm, fill=1, stroke=0)
    canvas.setFillColor(colors.white)
    canvas.setFont("Helvetica-Bold", 10)
    canvas.drawString(2 * cm, height - 0.9 * cm, "IAFCJ · Ministerio Celular")
    canvas.setFont("Helvetica", 9)
    canvas.drawRightString(width - 2 * cm, height - 0.9 * cm,
                           "Consolidado semanal · Manual")
    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8)
    canvas.drawString(2 * cm, 1 * cm, f"Generado el {date.today().isoformat()}")
    canvas.drawRightString(width - 2 * cm, 1 * cm, f"Página {doc.page}")
    canvas.restoreState()


# ─── Contenido ────────────────────────────────────────────────────────────
def build_story() -> list:
    s: list = []

    # Portada
    s += [
        Spacer(1, 4 * cm),
        Paragraph("Consolidado semanal", H_TITLE),
        Paragraph("Workflow supervisor → coordinador, descarga y compartir", H_SUBTITLE),
        Spacer(1, 0.6 * cm),
        Paragraph(
            "Guía paso a paso para revisar, aprobar y compartir los reportes semanales "
            "agregados por sector. Pensado para supervisores y coordinadores.",
            ParagraphStyle("PortInt", parent=BODY, alignment=TA_CENTER,
                           fontSize=11, textColor=MUTED),
        ),
        Spacer(1, 3 * cm),
        Paragraph("IAFCJ · Iglesia Apostólica de la Fe en Cristo Jesús",
                  ParagraphStyle("PortFooter", parent=BODY, alignment=TA_CENTER,
                                 fontSize=10, textColor=MUTED)),
        Paragraph(f"Versión {date.today().strftime('%Y.%m')}",
                  ParagraphStyle("PortVer", parent=BODY, alignment=TA_CENTER,
                                 fontSize=10, textColor=MUTED)),
        PageBreak(),
    ]

    # 1. ¿Qué es?
    s += [
        Paragraph("1. ¿Qué es el Consolidado semanal?", H1),
        Paragraph(
            "Es una vista que agrupa, en una sola tabla, todos los reportes de las "
            "células que pertenecen a un sector durante una semana específica. "
            "Permite comparar de un vistazo cuántos miembros asistieron, cuánta "
            "ofrenda hubo, cuántos amigos visitaron, etc., <b>célula por célula</b>, "
            "y ver el <b>acumulado total del sector</b> (columna derecha).",
            BODY,
        ),
        Paragraph("Lo encuentras en:", H2),
        bullets([
            "Pestaña <b>Seguimiento</b> (barra superior).",
            "Sub-tab <b>Consolidado semanal</b>.",
        ]),
        Paragraph("Funciones principales:", H2),
        bullets([
            "<b>Comparar</b> todas las células del sector en una semana.",
            "<b>Aprobar</b> el envío del paquete al coordinador (workflow de 3 estados).",
            "<b>Descargar</b> la tabla como imagen PNG.",
            "<b>Compartir</b> el resumen por WhatsApp con un solo tap.",
            "<b>Ver reporte completo</b> de cada célula con el botón 🔍.",
        ]),
        Spacer(1, 0.4 * cm),
    ]

    # 2. ¿Quién ve qué?
    s += [
        Paragraph("2. ¿Quién ve qué?", H1),
        roles_table(),
        Spacer(1, 0.4 * cm),
    ]

    # 3. Flujo de aprobación
    s += [
        Paragraph("3. Flujo de aprobación", H1),
        Paragraph(
            "El consolidado tiene tres estados encadenados. Cada cambio queda registrado "
            "con la fecha y la persona que lo ejecutó.",
            BODY,
        ),
        state_table(),
        Spacer(1, 0.3 * cm),
        Paragraph(
            "Diagrama simplificado: <b>Pendiente</b> ─(supervisor envía)→ "
            "<b>Revisado</b> ─(coordinador acusa)→ <b>Recibido</b>. Desde cualquier "
            "estado distinto de Pendiente se puede usar <b>Regresar a pendiente</b> "
            "para reabrir el flujo.",
            BODY,
        ),
        PageBreak(),
    ]

    # 4. Guía Supervisor
    s += [
        Paragraph("4. Guía para el Supervisor", H1),
        Paragraph("4.1 Entrar a la vista", H2),
        bullets([
            "Inicia sesión con tu usuario.",
            "Ve a <b>Seguimiento</b> en la barra superior.",
            "Abre el sub-tab <b>Consolidado semanal</b>.",
        ]),
        note("El sistema muestra automáticamente tu sector — no necesitas elegirlo."),
        Paragraph("4.2 Elegir la semana", H2),
        bullets([
            "Por defecto se muestra la <b>semana anterior</b> (la que acaba de cerrar).",
            "Cambia el selector de <b>Semana</b> si quieres ver otra.",
            "El <b>verbo del trimestre</b> (ORAR, ANOTAR, etc.) aparece junto a tu nombre.",
        ]),
        Paragraph("4.3 Revisar los números", H2),
        bullets([
            "Cada <b>columna</b> es una célula de tu sector.",
            "Las <b>filas</b> son las métricas: planeación, alcance, culto inspirador.",
            "La columna <b>Total</b> (derecha, resaltada) es la suma del sector.",
            "El chip <b>X/Y células con reporte</b> indica cuántas células ya enviaron datos.",
            "En móvil, la primera columna y la columna Total quedan fijas con sombra mientras deslizas las demás por debajo.",
        ]),
        Paragraph("4.4 Ver el reporte completo de una célula", H2),
        Paragraph(
            "Toca el botón <b>🔍</b> que aparece junto al número de célula en el "
            "encabezado de la tabla. Se abre el reporte completo en modo solo lectura, "
            "exactamente como lo capturó el líder.",
            BODY,
        ),
        Paragraph("4.5 Enviar al coordinador", H2),
        bullets([
            "Verifica que los números cuadren.",
            "Pulsa <b>Revisado · enviar al coordinador</b>.",
            "El estado cambia a <b>Revisado y enviado</b>, y se registra tu nombre y la fecha.",
            "A partir de ese momento el coordinador ya puede ver los datos.",
        ]),
        warn("Si necesitas corregir algo después de enviar, pulsa <b>Regresar a "
             "pendiente</b> y vuelve a enviar cuando esté listo."),
        Paragraph("4.6 Descargar / compartir", H2),
        bullets([
            "<b>⬇️ PNG</b> — descarga la tabla completa como imagen.",
            "<b>WhatsApp</b> — abre el selector nativo de tu celular para enviar imagen + texto directo a un contacto o grupo.",
        ]),
        PageBreak(),
    ]

    # 5. Guía Coordinador
    s += [
        Paragraph("5. Guía para el Coordinador", H1),
        Paragraph("5.1 Entrar a la vista", H2),
        bullets([
            "Inicia sesión.",
            "<b>Seguimiento</b> → <b>Consolidado semanal</b>.",
            "Aparece un <b>selector de Supervisor</b>: elige el sector que quieres revisar.",
        ]),
        Paragraph("5.2 Elegir semana y supervisor", H2),
        bullets([
            "Combinaciones independientes: cambia <b>supervisor</b> y <b>semana</b> sin perder el contexto.",
            "Por defecto se muestra la semana anterior.",
        ]),
        Paragraph("5.3 Esperar al supervisor (estado Pendiente)", H2),
        Paragraph(
            "Si el supervisor aún no ha enviado la semana, verás el mensaje "
            "<b>“⏳ Esperando revisión del supervisor”</b> y no se muestran los "
            "números crudos. Esto evita que tomes decisiones con datos sin validar.",
            BODY,
        ),
        Paragraph("5.4 Cuando el supervisor envía (estado Revisado)", H2),
        bullets([
            "Ya ves la tabla completa con todas las células.",
            "En la barra superior aparece: <i>Revisado y enviado por [Nombre] el [fecha]</i>.",
            "Tu botón disponible: <b>Acusar recibido</b>.",
        ]),
        Paragraph("5.5 Acusar recibido", H2),
        bullets([
            "Revisa el consolidado.",
            "Pulsa <b>Acusar recibido</b>.",
            "El estado cambia a <b>Recibido por coordinador</b> con tu nombre y fecha.",
        ]),
        warn("Si detectas un problema y necesitas que el supervisor corrija, pulsa "
             "<b>Regresar a pendiente</b>. Ambos verán el cambio inmediatamente."),
        Paragraph("5.6 Comparar varios sectores", H2),
        Paragraph(
            "Solo cambia el selector de <b>Supervisor</b> en la parte superior y "
            "la tabla se actualiza sin recargar.",
            BODY,
        ),
        Paragraph("5.7 Descargar / compartir", H2),
        Paragraph(
            "Las mismas opciones que el supervisor: <b>⬇️ PNG</b> y <b>WhatsApp</b>.",
            BODY,
        ),
        PageBreak(),
    ]

    # 6. Funciones compartidas
    s += [
        Paragraph("6. Funciones compartidas", H1),
        Paragraph("6.1 🔍 Vista previa del reporte de una célula", H2),
        bullets([
            "Disponible para ambos roles.",
            "Se abre como modal de solo lectura.",
            "Dentro del modal también puedes descargar PNG o compartir solo ese reporte por WhatsApp.",
        ]),
        Paragraph("6.2 ⬇️ Descargar PNG", H2),
        bullets([
            "Captura visual exacta de lo que ves en pantalla.",
            "Los botones de acción se ocultan automáticamente en la imagen.",
            "En móvil, la tabla se expande temporalmente al ancho completo para que la imagen incluya <b>todas</b> las columnas, no solo lo visible.",
            "El nombre del archivo incluye sector/célula y semana, por ejemplo: <i>reporte-A-S12.png</i> o <i>reporte-celula6-S12.png</i>.",
        ]),
        Paragraph("6.3 🟢 Compartir por WhatsApp", H2),
        Paragraph("<b>En celular (Android / iOS) — el caso ideal:</b>", BODY),
        bullets([
            "Toca <b>WhatsApp</b>.",
            "Se abre el selector nativo del sistema.",
            "Elige WhatsApp → contacto o grupo → enviar.",
            "Se envían <b>imagen y texto juntos</b>, en un solo mensaje.",
        ]),
        Paragraph("<b>En computadora (PC / Mac):</b>", BODY),
        bullets([
            "Toca <b>WhatsApp</b>.",
            "Se descarga la imagen PNG.",
            "Aparece un aviso: <i>“Se descargó la imagen. Adjúntala manualmente con el clip 📎”</i>.",
            "Se abre WhatsApp Web con el resumen ya escrito.",
            "Adjunta la imagen descargada con el ícono 📎.",
        ]),
        note("La mejor experiencia es <b>desde celular</b>: un solo tap → envío directo."),
        Paragraph("6.4 Formato del mensaje de texto", H2),
        Paragraph(
            "El texto que se envía por WhatsApp tiene este formato (con totales del sector):",
            BODY,
        ),
        Paragraph(
            "📊 <b>Reporte semanal · Sector A</b><br/>"
            "Supervisor: Carlos Martínez<br/>"
            "Semana 12 · ANOTAR<br/>"
            "Células reportadas: 4/4<br/><br/>"
            "<b>PLANEACIÓN</b><br/>"
            "• Miembros bautizados: 25<br/>"
            "• Miembros asistentes: 18<br/>"
            "• Miembros ausentes: 7<br/><br/>"
            "<b>ALCANCE</b><br/>"
            "• Miembros asistentes: 16<br/>"
            "• Con privilegios: 4<br/>"
            "• Amigos: 8<br/>"
            "• En restauración: 2<br/>"
            "• Niños: 5<br/>"
            "• Ofrenda: $1,250.00<br/><br/>"
            "<b>CULTO INSPIRADOR</b><br/>"
            "• Miembros: 20<br/>"
            "• Amigos: 6<br/>"
            "• En restauración: 1<br/>"
            "• Niños: 4",
            ParagraphStyle("Mono", parent=BODY, backColor=SOFT_BG,
                           leftIndent=10, rightIndent=10,
                           spaceBefore=4, spaceAfter=10,
                           fontName="Helvetica", fontSize=9.5),
        ),
        PageBreak(),
    ]

    # 7. FAQ
    s += [
        Paragraph("7. Preguntas frecuentes", H1),
        Paragraph("<b>¿Por qué no veo datos siendo coordinador?</b>", BODY),
        Paragraph(
            "Porque el supervisor de ese sector aún no ha enviado la semana. Espera "
            "el envío o pídele al supervisor que la cierre.",
            BODY,
        ),
        Paragraph("<b>¿Puedo editar un reporte desde aquí?</b>", BODY),
        Paragraph(
            "No, esta vista es de <b>solo lectura</b>. La captura/edición de cada "
            "célula se hace en su propio flujo (líder o quien capture). Aquí solo "
            "se revisa, aprueba y comparte.",
            BODY,
        ),
        Paragraph("<b>¿Qué pasa si el supervisor envía y el coordinador no acusa recibido?</b>", BODY),
        Paragraph(
            "Nada se rompe; queda en estado <b>Revisado y enviado</b> hasta que el "
            "coordinador lo acuse o lo regrese a pendiente.",
            BODY,
        ),
        Paragraph("<b>¿La imagen se ve igual en cualquier celular?</b>", BODY),
        Paragraph(
            "Sí. La captura incluye toda la tabla aunque en pantalla solo veas un "
            "fragmento por el scroll horizontal.",
            BODY,
        ),
        Paragraph("<b>¿WhatsApp guarda el mensaje en mis enviados?</b>", BODY),
        Paragraph(
            "Sí, exactamente igual que cualquier envío manual: queda en tu chat.",
            BODY,
        ),
        Paragraph("<b>¿Funciona offline?</b>", BODY),
        Paragraph(
            "La vista funciona si ya estaba cargada, pero <b>enviar / aprobar / "
            "compartir</b> requieren conexión a internet.",
            BODY,
        ),
    ]

    return s


def main() -> None:
    doc = SimpleDocTemplate(
        OUTPUT, pagesize=LETTER,
        leftMargin=2 * cm, rightMargin=2 * cm,
        topMargin=2 * cm, bottomMargin=2 * cm,
        title="Manual · Consolidado semanal",
        author="IAFCJ · Ministerio Celular",
    )
    doc.build(build_story(), onFirstPage=on_page, onLaterPages=on_page)
    print(f"PDF generado: {OUTPUT}")


if __name__ == "__main__":
    main()
