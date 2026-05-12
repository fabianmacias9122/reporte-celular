import { t, setLang, currentLang, applyStaticTranslations } from './i18n.js';

const API_BASE_URL = window.location.origin;

// ── RCM oficial IAFCJ – 3 etapas, 16 semanas, 3 eventos catalizadores ──
const RCM_WEEKS = [
  // ETAPA 1 – GANAR (semanas 1–6) · Evento catalizador: Levántate / Fiesta del Amigo
  { week: 1,  phase: "GANAR",      phaseLabel: "Ganar",      verb: "ORAR",       verbDesc: "Intercesión por las almas — pedir a Dios un amigo específico.",          event: null,              eventType: null,                                 purpose: null },
  { week: 2,  phase: "GANAR",      phaseLabel: "Ganar",      verb: "ANOTAR",     verbDesc: "Registrar al amigo/familiar y asumir responsabilidad espiritual.",        event: null,              eventType: null,                                 purpose: null },
  { week: 3,  phase: "GANAR",      phaseLabel: "Ganar",      verb: "CONTACTAR",  verbDesc: "Visitar o llamar al contacto e invitar al proceso.",                      event: null,              eventType: null,                                 purpose: null },
  { week: 4,  phase: "GANAR",      phaseLabel: "Ganar",      verb: "CONFIRMAR",  verbDesc: "Asegurar la asistencia al evento Levántate.",                             event: null,              eventType: null,                                 purpose: null },
  { week: 5,  phase: "GANAR",      phaseLabel: "Ganar",      verb: "DESATAR",    verbDesc: "Oración de guerra espiritual para romper cadenas.",                       event: null,              eventType: null,                                 purpose: null },
  { week: 6,  phase: "GANAR",      phaseLabel: "Ganar",      verb: "LLEVAR",     verbDesc: "Llevar al invitado a la Fiesta del Amigo / evento Levántate.",            event: "Levántate",       eventType: "Evangelístico",                      purpose: "Primer llamado y atención a necesidades personales, familiares y espirituales.", rcmKey: "levantate" },
  // ETAPA 2 – CONSOLIDAR (semanas 7–11) · Evento catalizador: Restauración (Encuentro)
  { week: 7,  phase: "CONSOLIDAR", phaseLabel: "Consolidar", verb: "MOTIVAR",    verbDesc: "Animación para asistir al Encuentro / Restauración.",                     event: null,              eventType: null,                                 purpose: null },
  { week: 8,  phase: "CONSOLIDAR", phaseLabel: "Consolidar", verb: "INTEGRAR",   verbDesc: "Incorporar al amigo a la célula, cultos y fraternidades.",                 event: null,              eventType: null,                                 purpose: null },
  { week: 9,  phase: "CONSOLIDAR", phaseLabel: "Consolidar", verb: "CONSOLIDAR", verbDesc: "Afirmar la fe del nuevo creyente.",                                        event: null,              eventType: null,                                 purpose: null },
  { week: 10, phase: "CONSOLIDAR", phaseLabel: "Consolidar", verb: "PREPARAR",   verbDesc: "Preparación para el encuentro con Dios.",                                  event: null,              eventType: null,                                 purpose: null },
  { week: 11, phase: "CONSOLIDAR", phaseLabel: "Consolidar", verb: "SANTIFICAR", verbDesc: "Consagración para el Evento de Restauración (Encuentro).",                 event: "Restauración",    eventType: "Sanidad interior y liberación espiritual", purpose: "Sanar áreas internas y fortalecer la fe.", rcmKey: "restauracion" },
  // ETAPA 3 – DISCIPULAR (semanas 12–16) · Evento catalizador: Cielos Abiertos / Pesca Milagrosa
  { week: 12, phase: "DISCIPULAR", phaseLabel: "Discipular", verb: "MATRICULAR", verbDesc: "Inscripción al discipulado.",                                              event: null,              eventType: null,                                 purpose: null },
  { week: 13, phase: "DISCIPULAR", phaseLabel: "Discipular", verb: "CONSERVAR",  verbDesc: "Cuidado del nuevo convertido.",                                            event: null,              eventType: null,                                 purpose: null },
  { week: 14, phase: "DISCIPULAR", phaseLabel: "Discipular", verb: "DOCTRINAR",  verbDesc: "Enseñanza de los fundamentos de la fe.",                                   event: null,              eventType: null,                                 purpose: null },
  { week: 15, phase: "DISCIPULAR", phaseLabel: "Discipular", verb: "DISCIPULAR", verbDesc: "Formación como nuevo líder/discípulo.",                                    event: null,              eventType: null,                                 purpose: null },
  { week: 16, phase: "DISCIPULAR", phaseLabel: "Discipular", verb: "BAUTIZAR",   verbDesc: "La Pesca Milagrosa — Evento de Bautismos en agua.",                        event: "Cielos Abiertos", eventType: "Bautismos en agua",                  purpose: "Bautismos, llenura espiritual y envío al discipulado.", rcmKey: "cielosAbiertos" },
];

// Total de semanas del ciclo — derivado de RCM_WEEKS (configurable via settings)
function getRcmTotalWeeks() {
  return RCM_WEEKS.length;
}

// Rango de semanas por fase — calculado DINÁMICAMENTE desde RCM_WEEKS para que
// cuando se agreguen/quiten semanas o se mueva la fase de alguna, los rangos
// reflejen el estado actual sin tener que editar nada más.
function getPhaseWeekRanges() {
  const ranges = {};
  RCM_WEEKS.forEach(w => {
    const r = ranges[w.phase];
    if (!r) {
      ranges[w.phase] = { weekStart: w.week, weekEnd: w.week };
    } else {
      if (w.week < r.weekStart) r.weekStart = w.week;
      if (w.week > r.weekEnd)   r.weekEnd   = w.week;
    }
  });
  return ranges;
}

// Compat — se mantiene el nombre por si algún tercero lo lee, pero ya es dinámico.
const PHASE_WEEK_RANGES = new Proxy({}, {
  get: (_t, key) => getPhaseWeekRanges()[key],
  ownKeys: () => Object.keys(getPhaseWeekRanges()),
  getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
});

function getRcmWeekInfo(weekNumber) {
  const w = parseInt(weekNumber, 10);
  const max = getRcmTotalWeeks();
  if (!w || w < 1 || w > max) return null;
  const info = RCM_WEEKS.find((r) => r.week === w);
  if (!info) return null;
  const range = getPhaseWeekRanges()[info.phase];
  return { ...info, ...range, isEventWeek: !!info.event };
}

// Apply coordinator overrides stored in app_settings.rcm_weeks_config (JSON array)
// Soporta DOS formatos:
//   A) Legacy: array de overrides parciales { week, verb?, verbDesc?, event?, eventType? }
//      → aplica sobre las semanas existentes, NO altera la cantidad total.
//   B) Nuevo: array completo de semanas { week, phase, phaseLabel, verb, verbDesc, event, eventType, rcmKey }
//      → reemplaza RCM_WEEKS por completo (permite agregar/quitar semanas).
//   Detección: si TODOS los entries traen phase + verb, se considera formato B.
function applyRcmWeeksConfig() {
  const raw = appSettings?.rcm_weeks_config;
  if (!raw) return;
  let cfg;
  try { cfg = JSON.parse(raw); } catch { return; }
  if (!Array.isArray(cfg) || cfg.length === 0) return;

  const isFullConfig = cfg.every(e => e && typeof e === "object"
    && typeof e.phase === "string" && typeof e.verb === "string"
    && Number.isInteger(e.week));

  if (isFullConfig) {
    // Reemplazo completo — ordenado por week para mantener invariantes.
    const sorted = [...cfg].sort((a, b) => a.week - b.week);
    RCM_WEEKS.length = 0;
    sorted.forEach((e, idx) => {
      RCM_WEEKS.push({
        week:       idx + 1, // re-numerar para evitar huecos
        phase:      String(e.phase || "GANAR").toUpperCase(),
        phaseLabel: e.phaseLabel || titleCase(e.phase || "Ganar"),
        verb:       e.verb || "",
        verbDesc:   e.verbDesc || "",
        event:      e.event || null,
        eventType:  e.eventType || null,
        purpose:    e.purpose || null,
        rcmKey:     e.rcmKey || null,
      });
    });
    return;
  }

  // Legacy: aplica como overrides parciales.
  cfg.forEach(ov => {
    const entry = RCM_WEEKS.find(w => w.week === ov.week);
    if (!entry) return;
    if (ov.verb      !== undefined) entry.verb      = ov.verb      || entry.verb;
    if (ov.verbDesc  !== undefined) entry.verbDesc  = ov.verbDesc;
    if (ov.event     !== undefined) entry.event     = ov.event     || null;
    if (ov.eventType !== undefined) entry.eventType = ov.eventType || null;
    if (ov.phase     !== undefined && ov.phase) {
      entry.phase      = String(ov.phase).toUpperCase();
      entry.phaseLabel = ov.phaseLabel || titleCase(ov.phase);
    }
  });
}

function titleCase(s) {
  const x = String(s || "").toLowerCase();
  return x.charAt(0).toUpperCase() + x.slice(1);
}

const reportForm = document.querySelector("#report-form");
const resetButton = document.querySelector("#reset-button");
const reportTableBody = document.querySelector("#report-table-body");
const reportCount = document.querySelector("#report-count");
const feedback = document.querySelector("#feedback");
const healthStatus = document.querySelector("#health-status");
const heroCaption = document.querySelector("#hero-caption");
const healthStatusDot = document.querySelector("#health-status-dot");
const metricSections = document.querySelector("#metric-sections");
const reportView = document.querySelector("#report-view");
const dashboardView = document.querySelector("#seg-tab-dashboard");
const adminView = document.querySelector("#admin-view");
const settingsView = document.querySelector("#settings-view");
const seguimientoView = document.querySelector("#seguimiento-view");
const showReportViewButton = document.querySelector("#show-report-view");
const showDashboardViewButton = document.querySelector("#show-dashboard-view");
const showAdminViewButton = document.querySelector("#show-admin-view");
const showSettingsViewButton = document.querySelector("#show-settings-view");
const showSeguimientoViewButton = document.querySelector("#show-seguimiento-view");
const adminSectionNav = document.querySelector("#admin-section-nav");
const adminSectionButtons = Array.from(document.querySelectorAll(".admin-section-button"));
const weekField = document.querySelector("#week-field");
const rcmPhaseIndicator = document.querySelector("#rcm-phase-indicator");
const cellField = document.querySelector("#cell-field");
const leaderField = document.querySelector("#leader-field");
const assistantField = document.querySelector("#assistant-field");
const hostField = document.querySelector("#host-field");
const reportAddress = document.querySelector("#report-address");
const reportMemberPills = document.querySelector("#report-member-pills");
const reportKidPills = document.querySelector("#report-kid-pills");
const memberCountChip = document.querySelector("#member-count-chip");
const attendanceProgressChip = document.querySelector("#attendance-progress-chip");
const attendanceSummaryCards = document.querySelector("#attendance-summary-cards");
const attendanceTableBody = document.querySelector("#attendance-table-body");
const absentMemberPills = document.querySelector("#absent-member-pills");
const visitorTableBody = document.querySelector("#visitor-table-body");
const kidsTableBody = document.querySelector("#kids-table-body");
const baptismTableBody = document.querySelector("#baptism-table-body");
const addVisitorButton = document.querySelector("#add-visitor-button");
const addKidButton = document.querySelector("#add-kid-button");
const addBaptismButton = document.querySelector("#add-baptism-button");
const visitorQuickForm = document.querySelector("#visitor-quick-form");
const visitorQuickHistory = document.querySelector("#visitor-quick-history");
const visitorQuickName = document.querySelector("#visitor-quick-name");
const visitorQuickInvitedBy = document.querySelector("#visitor-quick-invited-by");
const visitorQuickReach = document.querySelector("#visitor-quick-reach");
const visitorQuickSunday = document.querySelector("#visitor-quick-sunday");
const visitorQuickFirstVisit = document.querySelector("#visitor-quick-first-visit");
const visitorQuickConverted = document.querySelector("#visitor-quick-converted");
const addVisitorQuickButton = document.querySelector("#add-visitor-quick-button");
const resetVisitorQuickButton = document.querySelector("#reset-visitor-quick-button");
const visitorQuickEvent = document.querySelector("#visitor-quick-event");
const visitorEventToggleField = document.querySelector("#visitor-event-toggle-field");
const visitorEventToggleLabel = document.querySelector("#visitor-event-toggle-label");
const visitorEventColHeader = document.querySelector("#visitor-event-col-header");
const fillPlanningMembersButton = document.querySelector("#fill-planning-members");
const fillReachMembersButton = document.querySelector("#fill-reach-members");
const fillReachPrivilegesButton = document.querySelector("#fill-reach-privileges");
const copyPlanningToReachButton = document.querySelector("#copy-planning-to-reach");
const copyReachToSundayButton = document.querySelector("#copy-reach-to-sunday");
const markAllPrivilegesButton = document.querySelector("#mark-all-privileges");
const syncStatusFromActivitiesButton = document.querySelector("#sync-status-from-activities");
const clearMemberActivitiesButton = document.querySelector("#clear-member-activities");
const copyVisitorReachToSundayButton = document.querySelector("#copy-visitor-reach-to-sunday");
const markVisitorFirstVisitButton = document.querySelector("#mark-visitor-first-visit");
const clearVisitorActivitiesButton = document.querySelector("#clear-visitor-activities");
const copyKidReachToSundayButton = document.querySelector("#copy-kid-reach-to-sunday");
const clearKidActivitiesButton = document.querySelector("#clear-kid-activities");
const dashboardScopeTitle  = document.querySelector("#dashboard-scope-title");
const dashboardWeekChip = document.querySelector("#dashboard-week-chip");
const dashboardScopeChip = document.querySelector("#dashboard-scope-chip");
const dashboardPendingEyebrow = document.querySelector("#dashboard-pending-eyebrow");
const dashboardPeriodSelect = document.querySelector("#dashboard-period-select");
const dashboardSummaryGrid = document.querySelector("#dashboard-summary-grid");
const dashboardPendingCells = document.querySelector("#dashboard-pending-cells");
const reportContextStrip    = document.querySelector("#report-context-strip");
const segTotalsPanel        = document.querySelector("#seg-totals-panel");
const segTotalsBody         = document.querySelector("#seg-totals-body");
const rcsPending             = document.querySelector("#rcs-pending");
const rcsActivity            = document.querySelector("#rcs-activity");
const dashboardAbsenceAlerts = document.querySelector("#dashboard-absence-alerts");
const dashboardAbsenceTitle  = document.querySelector("#dashboard-absence-title");
const dashboardAbsenceLegend = document.querySelector("#absence-legend");
const memberDetailModal      = document.querySelector("#member-detail-modal");
const memberModalClose       = document.querySelector("#member-modal-close");
const memberModalName        = document.querySelector("#member-modal-name");
const memberModalPeriod      = document.querySelector("#member-modal-period");
const memberModalStats       = document.querySelector("#member-modal-stats");
const memberModalBody        = document.querySelector("#member-modal-body");
if (memberModalClose) memberModalClose.addEventListener("click", () => memberDetailModal?.close());
if (memberDetailModal) memberDetailModal.addEventListener("click", e => { if (e.target === memberDetailModal) memberDetailModal.close(); });
const dashboardRecentActivity = document.querySelector("#dashboard-recent-activity");
const dashboardMetricsSection = document.querySelector("#dashboard-metrics-section");
const dashboardMetricsToggle = document.querySelector("#dashboard-metrics-toggle");
const dashboardMetricsEyebrow = document.querySelector("#dashboard-metrics-eyebrow");
const dashboardMetricsBody = document.querySelector("#dashboard-metrics-body");
let activeMetricsScope = "total"; // "total" | "sector"
let activeDashboardTimeScope = "week"; // "week" | "quarter" | "year"

const peopleForm = document.querySelector("#people-form");
const peopleEditId = document.querySelector("#people-edit-id");
const peopleResetButton = document.querySelector("#people-reset-button");
const peopleTableBody = document.querySelector("#people-table-body");
const peopleFilterTabs = document.querySelector("#people-filter-tabs");
const peopleSearch = document.querySelector("#people-search");
const peopleGuardianFields = document.querySelector("#people-guardian-fields");
const peopleGuardianPerson = document.querySelector("#people-guardian-person");
const peopleGuardianName = document.querySelector("#people-guardian-name");
const peopleEditDialog  = /** @type {HTMLDialogElement|null} */ (document.querySelector("#people-edit-dialog"));
const peopleRcmDialog   = /** @type {HTMLDialogElement|null} */ (document.querySelector("#people-rcm-dialog"));
const peopleDialogTitle    = document.querySelector("#people-dialog-title");
const rcmDialogTitle       = document.querySelector("#rcm-dialog-title");
const peopleDialogInfoRow  = document.querySelector("#people-dialog-info-row");
const peopleDialogFnBadges = document.querySelector("#people-dialog-function-badges");
const peopleDialogCellBadge = document.querySelector("#people-dialog-cell-badge");
const peopleDialogCellSelect = /** @type {HTMLSelectElement|null} */ (document.querySelector("#people-dialog-cell-select"));
const peopleDialogCellRoleSelect = /** @type {HTMLSelectElement|null} */ (document.querySelector("#people-dialog-cell-role-select"));
const peopleDialogLeaderWarn = document.querySelector("#people-dialog-leader-warn");

const baptismSummaryPills = document.querySelector("#baptism-summary-pills");
const cellsForm = document.querySelector("#cells-form");
const cellsEditId = document.querySelector("#cells-edit-id");
const cellsResetButton = document.querySelector("#cells-reset-button");
const cellAdminSelect = document.querySelector("#cell-admin-select");
const cellSearch = document.querySelector("#cell-search");
const cellQuickList = null; // removed — replaced by cells table
const cellAdminBadge = null; // removed
const cellLeaderSelect    = document.querySelector("#cell-leader-select");
const cellAssistantSelect = document.querySelector("#cell-assistant-select");
const cellHostSelect      = document.querySelector("#cell-host-select");
const selectedCellName    = document.querySelector("#selected-cell-name");
const memberForm          = document.querySelector("#member-form");
const memberPersonSelect  = document.querySelector("#member-person-select");
const memberList          = document.querySelector("#member-list");
const cellMemberRoleTable = document.querySelector("#cell-member-role-table");
const cellEditDialog      = document.querySelector("#cell-edit-dialog");
const cellsTableBody      = document.querySelector("#cells-table-body");
const adminSummaryCards = document.querySelector("#admin-summary-cards");
const peopleRcmPanel = document.querySelector("#people-rcm-panel");

// All RCM milestone definitions — single source of truth for profile panel, badges & report counts
const RCM_MILESTONES = [
  // ── Fase Ganar ──────────────────────────────────────────────
  { key: "levantate",         label: "Levántate",           section: "ganar",      sectionLabel: "Fase Ganar",       type: "evento" },
  // ── Fase Consolidar ─────────────────────────────────────────
  { key: "e1Maduracion",      label: "E1 - Maduración",     section: "consolidar", sectionLabel: "Fase Consolidar",  type: "clase"  },
  { key: "e2Integracion",     label: "E2 - Integración",    section: "consolidar", sectionLabel: "Fase Consolidar",  type: "clase"  },
  { key: "e3Ubicacion",       label: "E3 - Ubicación",      section: "consolidar", sectionLabel: "Fase Consolidar",  type: "clase"  },
  { key: "eventoUnete",       label: "Evento Únete",        section: "consolidar", sectionLabel: "Fase Consolidar",  type: "evento" },
  { key: "restauracion",      label: "Restauración",        section: "consolidar", sectionLabel: "Fase Consolidar",  type: "evento" },
  { key: "eventoReencuentro", label: "Evento Re-encuentro", section: "consolidar", sectionLabel: "Fase Consolidar",  type: "evento" },
  { key: "eventoMinisterios", label: "Evento Ministerios",  section: "consolidar", sectionLabel: "Fase Consolidar",  type: "evento" },
  { key: "reencuentro",       label: "Reencuentro",         section: "consolidar", sectionLabel: "Fase Consolidar",  type: "evento" },
  // ── Fase Discipular ─────────────────────────────────────────
  { key: "e1Vision",          label: "E1 - Visión",         section: "discipular", sectionLabel: "Fase Discipular",  type: "clase"  },
  { key: "e2Caracter",        label: "E2 - Carácter",       section: "discipular", sectionLabel: "Fase Discipular",  type: "clase"  },
  { key: "e3Perfil",          label: "E3 - Perfil",         section: "discipular", sectionLabel: "Fase Discipular",  type: "clase"  },
  { key: "lanzamiento",       label: "Lanzamiento/Multip.", section: "discipular", sectionLabel: "Fase Discipular",  type: "evento" },
  { key: "cielosAbiertos",    label: "Cielos Abiertos",     section: "discipular", sectionLabel: "Fase Discipular",  type: "evento" },
  // ── Escuelas ─────────────────────────────────────────────────
  { key: "escFormativa",      label: "Esc. Formativa",      section: "escuelas",   sectionLabel: "Escuelas",         type: "clase"  },
  { key: "escPadresEsp",      label: "Esc. Padres Esp.",    section: "escuelas",   sectionLabel: "Escuelas",         type: "clase"  },
  { key: "escLideres",        label: "Esc. Líderes",        section: "escuelas",   sectionLabel: "Escuelas",         type: "clase"  },
  { key: "escSupervisores",   label: "Esc. Supervisores",   section: "escuelas",   sectionLabel: "Escuelas",         type: "clase"  },
];

// All report sections matching the original PDF exactly
const METRIC_SECTION_DEFINITIONS = [
  { title: "Planeación",      fields: [["planningMembersPresent", "Miembros asistentes"], ["planningMembersAbsent", "Miembros ausentes"]] },
  { title: "Alcance",         fields: [["reachMembersPresent", "Miembros asistentes"], ["reachPrivilegedMembers", "Miembros con privilegios"], ["reachFriendsPresent", "Amigos presentes"], ["reachConversions", "Conversiones"], ["reachKidsPresent", "Niños presentes"]] },
  { title: "Multiplicación",  fields: [["multiplyBrothersNewCell", "Hnos. en nueva célula"], ["multiplyPEinNewCell", "P.E. en nueva célula"], ["multiplyKidsNewCell", "Niños en nueva célula"], ["multiplySundayAttendance", "Asistieron al culto insp."]] },
  { title: "Fase Ganar",      fields: [["winSpiritualParents", "Padres espirituales"], ["winFriendsContacted", "Amigos contactados"], ["winRiseEventFriends", "Amigos en E. Levántate"], ["winEDRFriends", "Amigos en E.D.R."], ["winBaptizedFriends", "Amigos bautizados"]] },
  { title: "Fase Consolidar", fields: [["consolidateE1", "E1 - Maduración"], ["consolidateE2", "E2 - Integración"], ["consolidateE3", "E3 - Ubicación"], ["consolidateJoinEvent", "Evento Únete"], ["consolidateReencuentro", "Evento Re-encuentro"], ["consolidateMinistries", "Evento Ministerios"]] },
  { title: "Fase Discipular", fields: [["discipleE1Vision", "E1 - Visión"], ["discipleE2Character", "E2 - Carácter"], ["discipleE3Profile", "E3 - Perfil"], ["discipleLaunchMultiply", "Lanzamiento/Multip."]] },
  { title: "Escuelas",        fields: [["schoolFormative", "Esc. Formativa"], ["schoolParents", "Esc. Padres Esp."], ["schoolLeaders", "Esc. Líderes"], ["schoolSupervisors", "Esc. Supervisores"]] },
  { title: "Bautismos",       fields: [["baptismFirstQuarter", "1er. Cuatr."], ["baptismSecondQuarter", "2do. Cuatr."], ["baptismThirdQuarter", "3er. Cuatr."], ["baptismYearTotal", "Total Año"]] },
];

// Auto-computed (readonly) field names
const AUTO_FIELDS = new Set([
  "planningMembersPresent", "planningMembersAbsent",
  "reachMembersPresent", "reachPrivilegedMembers", "reachFriendsPresent", "reachConversions", "reachKidsPresent",
  "multiplySundayAttendance",
  "winSpiritualParents", "winFriendsContacted", "winRiseEventFriends", "winBaptizedFriends",
  "consolidateE1", "consolidateE2", "consolidateE3", "consolidateJoinEvent", "consolidateReencuentro", "consolidateMinistries",
  "discipleE1Vision", "discipleE2Character", "discipleE3Profile", "discipleLaunchMultiply",
  "schoolFormative", "schoolParents", "schoolLeaders", "schoolSupervisors",
  "baptismFirstQuarter", "baptismSecondQuarter", "baptismThirdQuarter", "baptismYearTotal",
]);

let catalogs = { people: [], cells: [] };
let appSettings = {};   // loaded from /api/settings
let historyScope = "current"; // "current" = solo cuatrimestre activo, "all" = todo
let editingReportId = null;
let reportReadOnlyMode = false;  // true when viewing a closed-week report in the form
let suppressWeekChangeHandler = false;  // prevents re-entrant change events from form.reset()
let activePeopleFilter = "all";
let activePeopleSearch = "";
let activeCellSearch = "";
let currentMemberAttendance = [];
let currentVisitors = [];
let currentKids = [];
let currentBaptisms = [];
let reportsData = [];
let activeDashboardPeriod = "";

// ── AUTH ──────────────────────────────────────────────────────────────────
let currentUser = null;
const RC_SESSION_KEY = "rcSession";

const loginOverlay     = document.getElementById("login-overlay");
const loginPersonSelect = document.getElementById("login-person-select");
const loginBtn         = document.getElementById("login-btn");
const userChip         = document.getElementById("user-chip");
const userChipNameEl   = document.getElementById("user-chip-name");
const topbarMobileBtn      = document.getElementById("topbar-mobile-btn");
const topbarMobileCard     = document.getElementById("topbar-mobile-card");
const topbarMobileInitials = document.getElementById("topbar-mobile-initials");
const tmcUserName      = document.getElementById("tmc-user-name");
const tmcStatusDot     = document.getElementById("tmc-status-dot");
const tmcStatusText    = document.getElementById("tmc-status-text");
const tmcLogoutBtn     = document.getElementById("tmc-logout-btn");

function getCellForPerson(personId) {
  // Find cell where this person is leader or assistant (distinct from member assignment)
  const cell = (catalogs.cells || []).find(c =>
    c.leaderPersonId === personId || c.assistantPersonId === personId
  );
  return cell ? String(cell.cellNumber) : null;
}

function populateLoginSelect() {
  if (!loginPersonSelect) return;
  loginPersonSelect.innerHTML = `<option value="">${t("login.placeholder")}</option>`;

  // Coordinators first
  const coordinators = (catalogs.people || [])
    .filter(p => p.isCoordinator)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  if (coordinators.length) {
    const grpCoord = document.createElement("optgroup");
    grpCoord.label = "Coordinadores";
    coordinators.forEach(p => {
      const opt = document.createElement("option");
      opt.value = String(p.id);
      opt.textContent = p.name;
      opt.dataset.role = "coordinator";
      grpCoord.appendChild(opt);
    });
    loginPersonSelect.appendChild(grpCoord);
  }

  // Supervisors (non-coordinator)
  const supervisors = (catalogs.people || [])
    .filter(p => p.supervisorSector && !p.isCoordinator)
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  if (supervisors.length) {
    const grpSup = document.createElement("optgroup");
    grpSup.label = "Supervisores";
    supervisors.forEach(p => {
      const opt = document.createElement("option");
      opt.value = String(p.id);
      const cellNum = getCellForPerson(p.id) || p.assignedCellNumber || "";
      const cellLabel = cellNum ? ` · Célula ${cellNum}` : "";
      opt.textContent = `${p.name}${cellLabel} — Sector ${p.supervisorSector}`;
      grpSup.appendChild(opt);
    });
    loginPersonSelect.appendChild(grpSup);
  }

  // Leaders / Assistants (not coordinator, not supervisor) — derived from cell assignments
  const leaders = (catalogs.people || [])
    .filter(p => {
      if (p.isCoordinator || p.supervisorSector || p.role === "kid") return false;
      const id = String(p.id);
      return catalogs.cells.some(c => String(c.leaderPersonId) === id || String(c.assistantPersonId) === id);
    })
    .sort((a, b) => a.name.localeCompare(b.name, "es"));
  if (leaders.length) {
    const grpLdr = document.createElement("optgroup");
    grpLdr.label = "Líderes y Asistentes";
    leaders.forEach(p => {
      const opt = document.createElement("option");
      opt.value = String(p.id);
      const fn = getDerivedFunction(p);
      const fnLabel = fn === "leader" ? "Líder" : "Asistente";
      const cellNum = getCellForPerson(p.id) || p.assignedCellNumber || "";
      const cellLabel = cellNum ? ` · Célula ${cellNum}` : "";
      opt.textContent = `${p.name} — ${fnLabel}${cellLabel}`;
      grpLdr.appendChild(opt);
    });
    loginPersonSelect.appendChild(grpLdr);
  }
}

function applyUserSession(user) {
  currentUser = user;
  if (userChipNameEl) userChipNameEl.textContent = user.name;
  if (userChip) userChip.classList.remove("is-hidden");
  if (topbarMobileBtn) topbarMobileBtn.classList.remove("is-hidden");
  if (tmcUserName) tmcUserName.textContent = user.name;
  if (topbarMobileInitials) {
    const parts = user.name.trim().split(/\s+/);
    const initials = parts.length >= 2
      ? parts[0][0] + parts[parts.length - 1][0]
      : parts[0].slice(0, 2);
    topbarMobileInitials.textContent = initials.toUpperCase();
  }
  // Solo coordinadores pueden acceder a Catálogos
  if (!user.isAdmin && showAdminViewButton) {
    showAdminViewButton.classList.add("is-hidden");
  }
  // Seguimiento: visible para todos los usuarios. El sub-tab 'Seguimiento' solo para supervisor/coordinador.
  if (showSeguimientoViewButton) {
    showSeguimientoViewButton.classList.remove("is-hidden");
  }
  const segSubTab = document.querySelector(".seg-view-tab[data-segtab='seguimiento']");
  if (segSubTab) {
    segSubTab.hidden = !(user.isAdmin || user.isSupervisor);
  }
  // Settings visible a todos los usuarios logueados
  if (showSettingsViewButton) {
    showSettingsViewButton.classList.remove("is-hidden");
  }
  // Tarjeta de ciclo RCM solo para coordinador
  const cycleCard = document.getElementById("settings-cycle-card");
  if (cycleCard) cycleCard.hidden = !user.isAdmin;
  // Tarjeta de verbos RCM solo para coordinador
  const verbsCard = document.getElementById("settings-rcm-verbs-card");
  if (verbsCard) {
    verbsCard.hidden = !user.isAdmin;
    if (user.isAdmin) renderRcmVerbsTable();
  }
}

function restrictCellFieldToUser(user) {
  if (!user || user.isAdmin || !user.assignedCellNumber) return;
  const cn = String(user.assignedCellNumber);
  cellField.value = cn;
  cellField.disabled = true;
  // Remove options for other cells to make intent explicit
  Array.from(cellField.options).forEach(opt => {
    if (opt.value && opt.value !== cn) opt.remove();
  });
  syncReportWithCell(true);
}

loginPersonSelect?.addEventListener("change", () => {
  if (loginBtn) loginBtn.disabled = !loginPersonSelect.value;
});

loginBtn?.addEventListener("click", async () => {
  const val = loginPersonSelect?.value;
  if (!val) return;

  let user;
  if (val === "__coordinator__") {
    user = { personId: null, name: "Coordinador", role: "all", assignedCellNumber: null, supervisedSector: null, isAdmin: true, isSupervisor: false };
  } else {
    const person = (catalogs.people || []).find(p => String(p.id) === val);
    if (!person) return;
    user = {
      personId: person.id,
      name: person.name,
      role: person.role,
      assignedCellNumber: getCellForPerson(person.id) || person.assignedCellNumber || null,
      supervisedSector: person.supervisorSector || null,
      isAdmin: !!(person.isCoordinator),
      isSupervisor: !!(person.supervisorSector),
    };
  }

  sessionStorage.setItem(RC_SESSION_KEY, JSON.stringify(user));
  // Mantener overlay visible mientras se carga toda la sesión. Antes lo
  // ocultábamos al instante y en Render (cold-start) el usuario alcanzaba
  // a navegar a "Planeación" antes de que llegara la respuesta del reporte,
  // así que el formulario aparecía vacío hasta que refrescaba la página.
  if (loginOverlay) {
    const loginCard = loginOverlay.querySelector(".login-card");
    if (loginCard) loginCard.setAttribute("aria-busy", "true");
    if (loginBtn) { loginBtn.disabled = true; loginBtn.textContent = "Cargando…"; }
  }
  applyUserSession(user);
  restrictCellFieldToUser(user);
  // For admins/coordinators: ensure cellField is enabled (a prior non-admin session
  // may have disabled it) and pre-select their own cell if they lead one.
  if (user.isAdmin) {
    cellField.disabled = false;
    if (user.assignedCellNumber) {
      cellField.value = String(user.assignedCellNumber);
      syncReportWithCell(true);
    }
  }
  renderReports(reportsData);  // re-render historial with user filter applied
  renderSeguimiento(reportsData);
  const targetCell = user.assignedCellNumber || cellField.value;
  // Empieza siempre en "Inicio" para usuarios sin borrador. autoLoad lo cambiará
  // si encuentra un reporte existente.
  showStage("encabezado", { skipWeekCheck: true });
  try {
    // Re-cargar reports ANTES de buscar el borrador. Esto cubre el caso donde
    // el init inicial cargó reports con currentUser=null (sin filtro) o
    // donde un fetch falló silenciosamente. Garantiza que reportsData esté
    // fresco y filtrado correctamente para este usuario antes de auto-cargar.
    await loadReports();
    await autoAdvanceWeekForCell(targetCell);
    // Red de seguridad: si autoLoadExistingReportIfAny no encontró borrador
    // (editingReportId sigue null), garantizar que la UI esté en "Inicio".
    if (!editingReportId) {
      showStage("encabezado", { skipWeekCheck: true });
    }
  } finally {
    loginOverlay?.classList.add("is-hidden");
    if (loginBtn) { loginBtn.disabled = false; loginBtn.textContent = "Entrar →"; }
  }
  initGraceBanner(); // re-evaluar banner ahora que currentUser es conocido
});

userChip?.addEventListener("click", () => {
  sessionStorage.removeItem(RC_SESSION_KEY);
  window.location.reload();
});

// Mobile user menu
topbarMobileBtn?.addEventListener("click", (e) => {
  e.stopPropagation();
  const isOpen = !topbarMobileCard.hidden;
  topbarMobileCard.hidden = isOpen;
  topbarMobileBtn.setAttribute("aria-expanded", String(!isOpen));
});
tmcLogoutBtn?.addEventListener("click", () => {
  sessionStorage.removeItem(RC_SESSION_KEY);
  window.location.reload();
});
document.addEventListener("click", (e) => {
  if (!topbarMobileCard?.hidden && !topbarMobileCard.contains(e.target) && e.target !== topbarMobileBtn) {
    topbarMobileCard.hidden = true;
    topbarMobileBtn?.setAttribute("aria-expanded", "false");
  }
});
// ─────────────────────────────────────────────────────────────────────────

function applyPreviewFlags() {
  const params = new URLSearchParams(window.location.search);
  document.body.classList.toggle("force-mobile-preview", params.get("mobile") === "1");
}

function setActiveAdminSectionButton(targetId) {
  adminSectionButtons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.adminTarget === targetId);
  });
}

function goToAdminSection(targetId) {
  const section = document.getElementById(targetId);
  if (!section) {
    return;
  }
  setActiveAdminSectionButton(targetId);
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

const topbarRouteLabel = document.querySelector("#topbar-route-label");

function activateSegTab(tabName) {
  // Regular users (no admin, no supervisor) can only see dashboard sub-tab
  const canSeeSeg = currentUser?.isAdmin || currentUser?.isSupervisor;
  if (tabName === "seguimiento" && !canSeeSeg) tabName = "dashboard";

  const tabs = document.querySelectorAll("#seg-view-tab-bar .seg-view-tab");
  tabs.forEach(btn => btn.classList.toggle("is-active", btn.dataset.segtab === tabName));
  const segPanel = document.getElementById("seg-tab-seguimiento");
  const dashPanel = document.getElementById("seg-tab-dashboard");
  if (segPanel)  segPanel.hidden  = tabName !== "seguimiento";
  if (dashPanel) dashPanel.hidden = tabName !== "dashboard";
  if (tabName === "dashboard") renderDashboard(reportsData);
  if (tabName === "seguimiento") renderSeguimiento(reportsData);
}

function showView(viewName) {
  // "dashboard" is now a sub-tab inside seguimiento
  const resolvedView = viewName === "dashboard" ? "seguimiento" : viewName;
  // Default sub-tab: dashboard for regular users, seguimiento for admin/supervisor
  const defaultSegTab = (currentUser?.isAdmin || currentUser?.isSupervisor) ? "seguimiento" : "dashboard";
  const segTab = viewName === "dashboard" ? "dashboard" : defaultSegTab;

  const isReportView      = resolvedView === "report";
  const isAdminView       = resolvedView === "admin";
  const isSettingsView    = resolvedView === "settings";
  const isSeguimientoView = resolvedView === "seguimiento";
  reportView.hidden       = !isReportView;
  adminView.hidden        = !isAdminView;
  if (settingsView)    settingsView.hidden    = !isSettingsView;
  if (seguimientoView) seguimientoView.hidden = !isSeguimientoView;
  showReportViewButton.classList.toggle("is-active", isReportView);
  showAdminViewButton.classList.toggle("is-active", isAdminView);
  showSettingsViewButton?.classList.toggle("is-active", isSettingsView);
  showSeguimientoViewButton?.classList.toggle("is-active", isSeguimientoView);
  if (topbarRouteLabel) {
    const activeBtn = [showReportViewButton, showAdminViewButton, showSettingsViewButton, showSeguimientoViewButton]
      .find(b => b?.classList.contains("is-active"));
    topbarRouteLabel.textContent = activeBtn?.querySelector("span[data-i18n]")?.textContent
      ?? activeBtn?.dataset.label
      ?? "Reporte de Célula";
  }
  if (isAdminView) {
    setActiveAdminSectionButton("admin-overview-section");
  }
  if (isSettingsView) {
    renderSettingsForm();
  }
  if (isSeguimientoView) {
    activateSegTab(segTab);
  }
}

async function request(path, options = {}) {
  // Retry con backoff para sobrevivir al cold-start de Render: el primer fetch
  // puede fallar con "TypeError: Failed to fetch" mientras el servicio despierta.
  // Solo reintentamos errores de red (no errores HTTP ya recibidos) y solo
  // métodos idempotentes GET/HEAD por defecto. Para mutaciones, un único intento.
  const method = String(options.method || "GET").toUpperCase();
  const isIdempotent = method === "GET" || method === "HEAD";
  const maxAttempts = isIdempotent ? 5 : 1;
  let attempt = 0;
  let lastErr = null;

  while (attempt < maxAttempts) {
    attempt++;
    try {
      const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: {
          "Content-Type": "application/json",
          ...(options.headers || {}),
        },
        ...options,
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({ message: "Error inesperado" }));
        throw new Error(payload.message || "Error inesperado");
      }

      if (response.status === 204) {
        return null;
      }

      return response.json();
    } catch (err) {
      lastErr = err;
      // Solo reintentar errores de red (TypeError: Failed to fetch). Si el
      // servidor respondió con HTTP error, no reintentamos.
      const isNetworkError = err instanceof TypeError;
      if (!isNetworkError || attempt >= maxAttempts) {
        throw err;
      }
      // Backoff: 1s, 2s, 4s, 6s (total ~13s, suficiente para el cold-start)
      const delayMs = Math.min(6000, 1000 * Math.pow(2, attempt - 1));
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  throw lastErr || new Error("Error inesperado");
}

function setFeedback(message, isError = false) {
  feedback.hidden = false;
  feedback.textContent = message;
  feedback.style.background = isError ? "#fdf0ee" : "#edf7f2";
  feedback.style.color = isError ? "#7a1f14" : "#145c38";
  feedback.style.borderColor = isError ? "#e8b4ae" : "#91d5b3";
  clearTimeout(setFeedback._timer);
  setFeedback._timer = setTimeout(clearFeedback, isError ? 6000 : 3500);
}

function clearFeedback() {
  feedback.hidden = true;
  feedback.textContent = "";
}

// Custom confirm dialog — replaces native confirm()
function appConfirm(message, title = "Confirmar") {
  return new Promise((resolve) => {
    const dlg   = document.getElementById("app-confirm-dialog");
    const msgEl = document.getElementById("app-confirm-message");
    const titleEl = document.getElementById("app-confirm-title");
    const okBtn = document.getElementById("app-confirm-ok");
    const cancelBtn = document.getElementById("app-confirm-cancel");
    if (!dlg || !msgEl || !okBtn || !cancelBtn) { resolve(window.confirm(message)); return; }
    if (titleEl) titleEl.textContent = title;
    msgEl.textContent = message;
    dlg.showModal();
    const cleanup = (result) => {
      okBtn.removeEventListener("click", onOk);
      cancelBtn.removeEventListener("click", onCancel);
      dlg.removeEventListener("click", onBackdrop);
      dlg.close();
      resolve(result);
    };
    const onOk      = () => cleanup(true);
    const onCancel  = () => cleanup(false);
    const onBackdrop = (e) => { if (e.target === dlg) cleanup(false); };
    okBtn.addEventListener("click", onOk);
    cancelBtn.addEventListener("click", onCancel);
    dlg.addEventListener("click", onBackdrop);
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleString("es-MX");
}

function formatShortDate(value) {
  if (!value) {
    return "-";
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
    const [year, month, day] = String(value).split("-");
    return `${day}/${month}/${year}`;
  }
  return formatDate(value);
}

function getReportYear(report) {
  const rawDate = report?.formData?.reportDate || report?.reportDate || "";
  return String(rawDate).slice(0, 4);
}

function getReportQuarter(report) {
  const rawDate = report?.formData?.reportDate || report?.reportDate || "";
  const month = parseInt(String(rawDate).slice(5, 7), 10) - 1; // 0-indexed
  if (isNaN(month) || month < 0) return 1;
  return month <= 3 ? 1 : month <= 7 ? 2 : 3;
}

function getCurrentQuarter() {
  const month = new Date().getMonth();
  return month <= 3 ? 1 : month <= 7 ? 2 : 3;
}

function getReportWeek(report) {
  return String(report?.formData?.week || report?.week || "");
}

function getReportAttendanceSummary(report) {
  const summary = report?.formData?.attendanceSummary || {};
  const present = Number(summary.present || 0) + Number(summary.service || 0);
  const absent = Number(summary.absent || 0);
  const justified = Number(summary.justified || 0);
  const visitors = Number(summary.visitors || report?.formData?.reachFriendsPresent || 0);
  return { present, absent, justified, visitors };
}

function getReportPeriodKey(report) {
  const year = getReportYear(report) || String(new Date().getFullYear());
  const quarter = getReportQuarter(report);
  const week = getReportWeek(report).padStart(2, "0");
  return `${year}-Q${quarter}-W${week}`;
}

function parsePeriodKey(periodKey) {
  const s = String(periodKey || "");
  // Full weekly key: "2026-Q2-W05"
  const weekMatch = s.match(/^(\d+)-Q(\d+)-W(\d+)$/);
  if (weekMatch) {
    return { year: Number(weekMatch[1]), quarter: Number(weekMatch[2]), week: Number(weekMatch[3]) };
  }
  // Quarter key: "2026-Q2"
  const qMatch = s.match(/^(\d+)-Q(\d+)$/);
  if (qMatch) {
    return { year: Number(qMatch[1]), quarter: Number(qMatch[2]), week: 0 };
  }
  // Year key: "2026"
  const yMatch = s.match(/^(\d{4})$/);
  if (yMatch) {
    return { year: Number(yMatch[1]), quarter: 0, week: 0 };
  }
  return { year: 0, quarter: 1, week: 0 };
}

function isNextPeriod(previousKey, currentKey) {
  const previous = parsePeriodKey(previousKey);
  const current = parsePeriodKey(currentKey);
  // Consecutive week within the same quarter
  if (current.year === previous.year && current.quarter === previous.quarter && current.week === previous.week + 1) {
    return true;
  }
  // Última semana del ciclo → Week 1 of next quarter (same year, Q1→Q2 or Q2→Q3)
  const lastWeek = getRcmTotalWeeks();
  if (previous.week === lastWeek && current.week === 1 && current.year === previous.year && current.quarter === previous.quarter + 1) {
    return true;
  }
  // Última semana del ciclo → Week 1 of Q1 next year (Q3 → Q1)
  if (previous.week === lastWeek && current.week === 1 && previous.quarter === 3 && current.quarter === 1 && current.year === previous.year + 1) {
    return true;
  }
  return false;
}

function normalizeVisitorName(name) {
  return String(name || "").trim().toLowerCase();
}

function getVisitorHistory() {
  const visitorMap = new Map();
  getScopedReports(reportsData).forEach((report) => {
    const visitors = Array.isArray(report?.formData?.visitors) ? report.formData.visitors : [];
    visitors.forEach((visitor) => {
      const normalizedName = normalizeVisitorName(visitor?.name);
      if (!normalizedName) {
        return;
      }
      const previous = visitorMap.get(normalizedName) || { name: String(visitor?.name || "").trim(), invitedBy: "", phone: "", converted: false, visitCount: 0 };
      visitorMap.set(normalizedName, {
        name: previous.name || String(visitor?.name || "").trim(),
        invitedBy: String(visitor?.invitedBy || previous.invitedBy || "").trim(),
        phone: String(visitor?.phone || previous.phone || "").trim(),
        converted: Boolean(visitor?.converted) || Boolean(previous.converted),
        visitCount: previous.visitCount + 1,
      });
    });
  });
  return Array.from(visitorMap.values()).sort((left, right) => left.name.localeCompare(right.name, "es"));
}

function findVisitorHistoryByName(name) {
  const normalizedName = normalizeVisitorName(name);
  if (!normalizedName) {
    return null;
  }
  return getVisitorHistory().find((visitor) => normalizeVisitorName(visitor.name) === normalizedName) || null;
}

function renderVisitorHistoryOptions() {
  if (!(visitorQuickHistory instanceof HTMLSelectElement)) {
    return;
  }
  const options = getVisitorHistory().map((visitor) => `<option value="${escapeHtml(visitor.name)}">${escapeHtml(visitor.name)}</option>`).join("");
  visitorQuickHistory.innerHTML = `<option value="">Elegir del historial</option>${options}`;
}

function applyQuickVisitorHistory(name) {
  const visitor = findVisitorHistoryByName(name);
  if (!visitor) {
    return;
  }
  if (visitorQuickInvitedBy instanceof HTMLSelectElement && !visitorQuickInvitedBy.value) {
    visitorQuickInvitedBy.value = visitor.invitedBy || leaderField.value || assistantField.value || "";
  }
  if (visitorQuickFirstVisit instanceof HTMLInputElement) {
    visitorQuickFirstVisit.checked = false;
  }
  if (visitorQuickConverted instanceof HTMLInputElement) {
    visitorQuickConverted.checked = Boolean(visitor.converted);
  }
}

function applyVisitorHistoryToRow(visitor) {
  const history = findVisitorHistoryByName(visitor.name);
  if (!history) {
    return;
  }
  if (!String(visitor.invitedBy || "").trim()) {
    visitor.invitedBy = history.invitedBy || visitor.invitedBy;
  }
  if (!String(visitor.phone || "").trim()) {
    visitor.phone = history.phone || visitor.phone;
  }
  if (visitor.firstVisit) {
    visitor.firstVisit = false;
  }
  visitor.converted = Boolean(visitor.converted || history.converted);
}

function getAbsenceAlertSeverity(entry) {
  if (entry.streak >= 4) {
    return "critical";
  }
  if (entry.streak >= 3) {
    return entry.status === "justified" ? "warning" : "high";
  }
  return entry.status === "justified" ? "soft" : "medium";
}

// ── SCOPE HELPERS (filtra por rol de usuario activo) ─────────────────────────
function getScopedCells() {
  if (!currentUser || currentUser.isAdmin) return catalogs.cells;
  if (currentUser.isSupervisor && currentUser.supervisedSector) {
    return catalogs.cells.filter(c => String(c.sector || "").trim() === String(currentUser.supervisedSector).trim());
  }
  const cellNum = String(currentUser.assignedCellNumber || "");
  return catalogs.cells.filter(c => String(c.cellNumber) === cellNum);
}

function getScopedReports(reports) {
  if (!currentUser || currentUser.isAdmin) return reports;
  if (currentUser.isSupervisor && currentUser.supervisedSector) {
    const sectorCellNums = new Set(
      catalogs.cells
        .filter(c => String(c.sector || "").trim() === String(currentUser.supervisedSector).trim())
        .map(c => String(c.cellNumber))
    );
    return reports.filter(r => sectorCellNums.has(String(r.cellNumber || r.formData?.cellNumber || "")));
  }
  const cellNum = String(currentUser.assignedCellNumber || "");
  return reports.filter(r => String(r.cellNumber || r.formData?.cellNumber || "") === cellNum);
}

function getDashboardScopeLabel() {
  if (!currentUser || currentUser.isAdmin) return null;
  if (currentUser.isSupervisor && currentUser.supervisedSector) {
    return `Sector ${currentUser.supervisedSector}`;
  }
  if (currentUser.assignedCellNumber) return `Célula ${currentUser.assignedCellNumber}`;
  return null;
}
// ─────────────────────────────────────────────────────────────────────────────

function getDashboardPeriods(reports) {
  const uniquePeriods = new Map();
  reports.forEach((report) => {
    const key = getReportPeriodKey(report);
    uniquePeriods.set(key, {
      key,
      year: getReportYear(report) || String(new Date().getFullYear()),
      quarter: getReportQuarter(report),
      week: getReportWeek(report),
    });
  });

  // Always include the current RCM week/quarter so it appears even without reports
  // Usar semana real (sin gracia) para que el dashboard refleje la semana actual,
  // no la anterior cuando estamos dentro del periodo de gracia.
  const currentWeek = String(getQuarterWeekNumber()).padStart(2, "0");
  const currentYear = String(new Date().getFullYear());
  const currentQuarter = getCurrentQuarter();
  const currentKey = `${currentYear}-Q${currentQuarter}-W${currentWeek}`;
  if (!uniquePeriods.has(currentKey)) {
    uniquePeriods.set(currentKey, { key: currentKey, year: currentYear, quarter: currentQuarter, week: String(Number(currentWeek)) });
  }

  return Array.from(uniquePeriods.values()).sort((left, right) => right.key.localeCompare(left.key));
}

function renderDashboardPeriodOptions(reports) {
  if (activeDashboardTimeScope === "year") {
    // Show distinct years
    const years = [...new Set(reports.map(r => getReportYear(r)).filter(Boolean))].sort((a, b) => b.localeCompare(a));
    const currentYear = String(new Date().getFullYear());
    if (!years.includes(currentYear)) years.unshift(currentYear);
    const desiredYear = (activeDashboardPeriod.match(/^(\d{4})/) || [])[1] || currentYear;
    activeDashboardPeriod = years.includes(desiredYear) ? desiredYear : years[0];
    dashboardPeriodSelect.innerHTML = years.map(y =>
      `<option value="${escapeHtml(y)}">${escapeHtml(y)}</option>`
    ).join("");
    dashboardPeriodSelect.value = activeDashboardPeriod;
    return;
  }

  if (activeDashboardTimeScope === "quarter") {
    // Show distinct year-quarter combos
    const qMap = new Map();
    reports.forEach(r => {
      const y = getReportYear(r); const q = String(getReportQuarter(r));
      if (y && q) qMap.set(`${y}-Q${q}`, { year: y, quarter: q });
    });
    const currentYear = String(new Date().getFullYear());
    const currentQ    = String(getCurrentQuarter());
    const cqKey = `${currentYear}-Q${currentQ}`;
    if (!qMap.has(cqKey)) qMap.set(cqKey, { year: currentYear, quarter: currentQ });
    const sorted = Array.from(qMap.values()).sort((a, b) =>
      b.year !== a.year ? b.year.localeCompare(a.year) : b.quarter.localeCompare(a.quarter)
    );
    const desiredQ = activeDashboardPeriod.match(/^(\d{4}-Q\d)/) ? activeDashboardPeriod.slice(0, 7) : cqKey;
    activeDashboardPeriod = sorted.find(q => `${q.year}-Q${q.quarter}` === desiredQ)
      ? desiredQ : `${sorted[0].year}-Q${sorted[0].quarter}`;
    const qLabel = q => q === "1" ? "Ene–Abr" : q === "2" ? "May–Ago" : "Sep–Dic";
    dashboardPeriodSelect.innerHTML = sorted.map(({ year, quarter }) =>
      `<option value="${year}-Q${quarter}">${escapeHtml(`C${quarter} ${qLabel(quarter)} ${year}`)}</option>`
    ).join("");
    dashboardPeriodSelect.value = activeDashboardPeriod;
    return;
  }

  // Default: weekly
  const periods = getDashboardPeriods(reports);
  const currentWeek    = String(getQuarterWeekNumber()).padStart(2, "0");
  const currentYear    = String(new Date().getFullYear());
  const currentQuarter = getCurrentQuarter();
  const currentKey     = `${currentYear}-Q${currentQuarter}-W${currentWeek}`;
  const desiredKey = activeDashboardPeriod || currentKey;
  activeDashboardPeriod = periods.some(p => p.key === desiredKey) ? desiredKey : periods[0]?.key || "";
  dashboardPeriodSelect.innerHTML = periods.map(p =>
    `<option value="${escapeHtml(p.key)}">${escapeHtml(`Sem. ${p.week} · C${p.quarter} ${p.year}`)}</option>`
  ).join("");
  dashboardPeriodSelect.value = activeDashboardPeriod;
}

function formatRole(role) {
  switch (role) {
    case "coordinator": return t("role.coordinator");
    case "supervisor":  return t("role.supervisor");
    case "leader":      return t("role.leader");
    case "assistant":   return t("role.assistant");
    case "host":        return t("role.host");
    case "member":      return t("role.member");
    case "kid":         return t("role.kid");
    default:            return t("role.member");
  }
}

function getDerivedFunction(person) {
  if (person.role === "kid") return "kid";
  if (person.isCoordinator) return "coordinator";
  if (person.supervisorSector) return "supervisor";
  const id = String(person.id);
  for (const cell of catalogs.cells) {
    if (String(cell.leaderPersonId)    === id) return "leader";
    if (String(cell.assistantPersonId) === id) return "assistant";
    if (String(cell.hostPersonId)      === id) return "host";
  }
  return "member";
}

// Returns all concurrent functions (coordinator+leader, supervisor+host, etc.)
function getDerivedFunctions(person) {
  if (person.role === "kid") return ["kid"];
  const fns = [];
  if (person.isCoordinator)    fns.push("coordinator");
  if (person.supervisorSector) fns.push("supervisor");
  const id = String(person.id);
  for (const cell of catalogs.cells) {
    if (String(cell.leaderPersonId)    === id) { fns.push("leader");    break; }
    if (String(cell.assistantPersonId) === id) { fns.push("assistant"); break; }
    if (String(cell.hostPersonId)      === id) { fns.push("host");      break; }
  }
  return fns.length ? fns : ["member"];
}

function getCellMembers(cell) {
  return (Array.isArray(cell?.members) ? cell.members : []).filter((member) => member.role !== "kid");
}

function getCellKids(cell) {
  return (Array.isArray(cell?.members) ? cell.members : []).filter((member) => member.role === "kid");
}

function getGuardianDisplay(person) {
  return String(person?.guardianName || "").trim();
}

function getReportDateValue() {
  const dateField = reportForm.elements.namedItem("reportDate");
  return dateField instanceof HTMLInputElement ? String(dateField.value || "").trim() : "";
}

function getReportYearValue() {
  return getReportDateValue().slice(0, 4) || String(new Date().getFullYear());
}

function getDateValueParts(dateValue) {
  const [yearText = "", monthText = "", dayText = ""] = String(dateValue || "").split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  if (!year || !month || !day) {
    return null;
  }
  return { year, month, day };
}

function getStartOfIsoWeek(date) {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function getBaptismCaptureStatus(dateValue = getReportDateValue()) {
  const parts = getDateValueParts(dateValue);
  if (!parts) {
    return {
      isAllowed: false,
      message: "Selecciona la fecha del reporte para habilitar el cierre de bautismos.",
    };
  }
  if (![4, 8, 12].includes(parts.month)) {
    return {
      isAllowed: false,
      message: "Los bautismos solo se capturan en el cierre del cuatrimestre: abril, agosto y diciembre.",
    };
  }
  const reportDate = new Date(parts.year, parts.month - 1, parts.day);
  const lastDayOfMonth = new Date(parts.year, parts.month, 0);
  const closingWeekStart = getStartOfIsoWeek(lastDayOfMonth);
  if (reportDate < closingWeekStart || reportDate.getMonth() !== lastDayOfMonth.getMonth()) {
    return {
      isAllowed: false,
      message: "Los bautismos se registran solo en la ultima semana del cuatrimestre.",
    };
  }
  return {
    isAllowed: true,
    message: `Cierre habilitado para ${lastDayOfMonth.toLocaleString("es-MX", { month: "long" })}.`,
  };
}

function getBaptismQuarter(dateValue) {
  const month = Number(String(dateValue || "").slice(5, 7));
  if (!month || Number.isNaN(month)) {
    return 0;
  }
  if (month <= 4) {
    return 1;
  }
  if (month <= 8) {
    return 2;
  }
  return 3;
}

function normalizeBaptisms(savedBaptisms = []) {
  if (!Array.isArray(savedBaptisms)) {
    return [];
  }
  return savedBaptisms.map((entry) => ({
    name: String(entry?.name || "").trim(),
    baptismDate: String(entry?.baptismDate || "").trim(),
    source: String(entry?.source || "report").trim() || "report",
    note: String(entry?.note || "").trim(),
    promoteToMember: entry?.promoteToMember !== false,
  }));
}

function getBaptismRegistrationMessage(captureStatus) {
  return captureStatus.isAllowed
    ? captureStatus.message
    : "Fuera del cierre cuatrimestral. Puedes registrarlo para agregarlo como miembro; el conteo anual solo se actualiza en la ultima semana del cuatrimestre.";
}

function formatBaptismSource(source) {
  if (String(source || "").trim() === "fuera-cierre") {
    return "Fuera de cierre";
  }
  return "Cierre";
}

function countBaptismsToPromote(baptisms = []) {
  return normalizeBaptisms(baptisms).filter((entry) => entry.name && entry.promoteToMember).length;
}

function getBaptismHistoryByCell(cellNumber, year, excludeReportId = null) {
  return reportsData
    .filter((report) => String(report.id) !== String(excludeReportId || "")
      && String(report.cellNumber || report.formData?.cellNumber || "") === String(cellNumber || "")
      && getReportYear(report) === String(year || "")
      && getBaptismCaptureStatus(report?.formData?.reportDate || report?.reportDate || "").isAllowed)
    .flatMap((report) => normalizeBaptisms(report?.formData?.baptisms));
}

function computeBaptismMetrics() {
  const cellNumber = String(cellField.value || "").trim();
  const reportYear = getReportYearValue();
  const currentReportBaptisms = getBaptismCaptureStatus().isAllowed ? normalizeBaptisms(currentBaptisms) : [];
  const allBaptisms = [...getBaptismHistoryByCell(cellNumber, reportYear, editingReportId), ...currentReportBaptisms];
  const counts = { 1: 0, 2: 0, 3: 0, total: 0 };
  allBaptisms.forEach((entry) => {
    const quarter = getBaptismQuarter(entry.baptismDate);
    if (quarter >= 1 && quarter <= 3) {
      counts[quarter] += 1;
      counts.total += 1;
    }
  });
  return counts;
}

function getGuardianCandidates(selectedPersonId = "") {
  return catalogs.people.filter((person) => person.role !== "kid" && String(person.id) !== String(selectedPersonId || ""));
}

function renderGuardianSelect(selectedPersonId = "") {
  if (!(peopleGuardianPerson instanceof HTMLSelectElement)) {
    return;
  }
  renderSelect(
    peopleGuardianPerson,
    getGuardianCandidates(selectedPersonId).map((person) => ({ value: String(person.id), label: `${person.name} · ${formatRole(getDerivedFunction(person))}` })),
    "Selecciona responsable"
  );
}

function syncPeopleGuardianFields() {
  const isKidCheckbox = /** @type {HTMLInputElement|null} */ (document.getElementById("people-is-kid"));
  if (!isKidCheckbox) return;
  const isKid = isKidCheckbox.checked;
  if (peopleGuardianFields) peopleGuardianFields.hidden = !isKid;
  if (!isKid) {
    if (peopleGuardianPerson instanceof HTMLSelectElement) peopleGuardianPerson.value = "";
    if (peopleGuardianName instanceof HTMLInputElement) peopleGuardianName.value = "";
  }
}

function getQuarterWeekNumber(dateValue = "") {
  const sourceDate = String(dateValue || "").trim() ? new Date(`${dateValue}T12:00:00`) : new Date();
  if (Number.isNaN(sourceDate.getTime())) return 1;

  // Use configured cycle start date if available
  const cycleStartStr = appSettings.cycle_start_date;
  if (cycleStartStr && /^\d{4}-\d{2}-\d{2}$/.test(cycleStartStr)) {
    const cycleStart = new Date(`${cycleStartStr}T00:00:00`);
    if (!Number.isNaN(cycleStart.getTime())) {
      const ref = new Date(sourceDate.getFullYear(), sourceDate.getMonth(), sourceDate.getDate());
      ref.setHours(0, 0, 0, 0);
      cycleStart.setHours(0, 0, 0, 0);
      const diffDays = Math.floor((ref - cycleStart) / 86400000);
      if (diffDays < 0) return 1;

      // week_start_day: 0=Dom, 1=Lun, ..., 6=Sab (igual que JS getDay())
      // Si no está configurado, se usa el día de la semana del inicio del ciclo
      const weekStartDay = (appSettings.week_start_day !== undefined && appSettings.week_start_day !== "")
        ? parseInt(appSettings.week_start_day, 10)
        : cycleStart.getDay();

      const startDow = cycleStart.getDay();
      let daysToFirst = (weekStartDay - startDow + 7) % 7;
      if (daysToFirst === 0) daysToFirst = 7; // la siguiente ocurrencia, no el mismo día

      if (diffDays < daysToFirst) return 1;
      return Math.max(1, Math.min(getRcmTotalWeeks(), Math.floor((diffDays - daysToFirst) / 7) + 2));
    }
  }

  // Fallback: quarter-based
  const month = sourceDate.getMonth();
  const quarterStartMonth = month <= 3 ? 0 : month <= 7 ? 4 : 8;
  const quarterStart = new Date(sourceDate.getFullYear(), quarterStartMonth, 1);
  quarterStart.setHours(0, 0, 0, 0);
  const current = new Date(sourceDate.getFullYear(), sourceDate.getMonth(), sourceDate.getDate());
  current.setHours(0, 0, 0, 0);
  const diffDays = Math.floor((current - quarterStart) / 86400000);
  return Math.max(1, Math.min(getRcmTotalWeeks(), Math.floor(diffDays / 7) + 1));
}

function getCurrentWeekNumber() {
  const graceHours = parseInt(appSettings?.report_grace_hours ?? "0", 10) || 0;
  if (graceHours > 0) {
    // Check if we're within the grace period after week rollover
    const now = new Date();
    const weekStartDay = parseInt(appSettings?.week_start_day ?? "0", 10);
    const todayDow = now.getDay();
    if (todayDow === weekStartDay) {
      // It's the first day of the new week — check if still within grace hours
      const hoursElapsed = now.getHours() + now.getMinutes() / 60;
      if (hoursElapsed < graceHours) {
        // Still in grace period: return previous week number
        // NOTE: must pass ISO string (YYYY-MM-DD) — Date objects cause NaN inside getQuarterWeekNumber
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        const yStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;
        return Math.max(1, getQuarterWeekNumber(yStr));
      }
    }
  }
  return getQuarterWeekNumber();
}

function syncWeekFieldWithReportDate(force = false) {
  const reportDateVal = getReportDateValue();
  // If there's a specific report date typed, use it directly.
  // Otherwise use getCurrentWeekNumber() which respects grace hours.
  const suggestedWeek = reportDateVal
    ? String(getQuarterWeekNumber(reportDateVal))
    : String(getCurrentWeekNumber());
  if (force || !String(weekField.value || "").trim()) {
    weekField.value = suggestedWeek;
  }
}

function initGraceBanner() {
  const banner     = document.getElementById("grace-banner");
  const bannerText = document.getElementById("grace-banner-text");
  const closeBtn   = document.getElementById("grace-banner-close");
  const captureBtn = document.getElementById("grace-banner-capture");
  if (!banner || !bannerText) return;

  let _timer = null;

  function getGraceInfo() {
    const graceHours = parseInt(appSettings?.report_grace_hours ?? "0", 10) || 0;
    if (graceHours <= 0) return null;
    const weekStartDay = parseInt(appSettings?.week_start_day ?? "0", 10);
    const now = new Date();
    if (now.getDay() !== weekStartDay) return null;
    const msElapsed = (now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()) * 1000 + now.getMilliseconds();
    const msGrace   = graceHours * 3600 * 1000;
    const msLeft    = msGrace - msElapsed;
    if (msLeft <= 0) return null;
    return { msLeft };
  }

  function formatCountdown(ms) {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  function tick() {
    const info = getGraceInfo();
    if (!info) {
      banner.hidden = true;
      if (_timer) { clearInterval(_timer); _timer = null; }
      return;
    }
    const prevWeekNum = getCurrentWeekNumber(); // already returns prev week during grace

    // Hide banner if the current user already submitted a report for the grace week
    if (currentUser) {
      const cell = currentUser.assignedCellNumber ? String(currentUser.assignedCellNumber) : null;
      const cycleStart = appSettings?.cycle_start_date;
      const alreadySubmitted = reportsData.some(r => {
        if (cell && String(r.cellNumber || r.formData?.cellNumber || "") !== cell) return false;
        const rWeek = Number(getReportWeek(r));
        if (rWeek !== prevWeekNum) return false;
        // Only count reports within this cycle
        if (cycleStart) {
          const rDate = String(r.reportDate || r.formData?.reportDate || "");
          return rDate >= cycleStart;
        }
        return true;
      });
      if (alreadySubmitted) {
        banner.hidden = true;
        if (_timer) { clearInterval(_timer); _timer = null; }
        return;
      }
    }

    bannerText.innerHTML =
      `<strong>¿Ya enviaste tu reporte de la semana ${prevWeekNum}?</strong> ` +
      `Tienes <strong>${formatCountdown(info.msLeft)}</strong> de prórroga antes de que cierre el periodo.`;
    banner.hidden = false;
  }

  closeBtn?.addEventListener("click", () => {
    banner.hidden = true;
    if (_timer) { clearInterval(_timer); _timer = null; }
  });

  // Botón "Capturar ahora" — abre el formulario en la semana de gracia (semana anterior)
  captureBtn?.addEventListener("click", () => {
    const prevWeek = getCurrentWeekNumber();
    const cell = currentUser?.assignedCellNumber || cellField.value;
    if (cell) {
      cellField.value = String(cell);
      syncReportWithCell(true);
    }
    // Repoblar para que la semana de gracia esté habilitada
    populateWeekOptions();
    weekField.value = String(prevWeek);
    syncPhaseIndicator();
    showView("report");
    showStage("encabezado", { skipWeekCheck: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  tick();
  if (!banner.hidden) {
    _timer = setInterval(tick, 1000);
  }
}

function renderMetricSections() {
  metricSections.innerHTML = METRIC_SECTION_DEFINITIONS.map((section) => {
    const isAllAuto = section.fields.every(([name]) => AUTO_FIELDS.has(name));
    const eyebrow = isAllAuto ? "Auto" : "Manual";
    return `
    <section class="panel panel-soft metric-card">
      <div>
        <p class="eyebrow">${eyebrow}</p>
        <h2>${escapeHtml(section.title)}</h2>
      </div>
      <div class="metric-fields">
        ${section.fields.map(([name, label]) => {
          const isAuto = AUTO_FIELDS.has(name);
          return `
          <label class="metric-field${isAuto ? " is-auto" : ""}">
            <span>${escapeHtml(label)}${isAuto ? '<em class="metric-auto-tag">auto</em>' : ""}</span>
            <input name="${escapeHtml(name)}" type="number" min="0" step="${isAuto ? "1" : "0.01"}" value="0"${isAuto ? " readonly" : ""}>
          </label>`;
        }).join("")}
      </div>
    </section>`;
  }).join("");
}

function populateWeekOptions() {
  // realWeek: the actual current week ignoring grace (used as max allowed and default selection)
  const realWeek  = getQuarterWeekNumber();
  const graceHours = parseInt(appSettings?.report_grace_hours ?? "0", 10) || 0;

  // During grace period the previous week is also selectable (only if no report yet)
  const inGrace = graceHours > 0 && (() => {
    const weekStartDay = parseInt(appSettings?.week_start_day ?? "0", 10);
    const now = new Date();
    if (now.getDay() !== weekStartDay) return false;
    const hoursElapsed = now.getHours() + now.getMinutes() / 60;
    return hoursElapsed < graceHours;
  })();

  // Set of past weeks for the current cell+cycle that ALREADY have a report
  const cell = String(cellField?.value || "").trim();
  const cycleStartStr = appSettings?.cycle_start_date;
  const reportedPastWeeks = new Set();
  if (cell && cycleStartStr) {
    (reportsData || []).forEach(r => {
      const rCell = String(r.cellNumber || r.formData?.cellNumber || "").trim();
      if (rCell !== cell) return;
      const rWeek = Number(getReportWeek(r));
      if (!rWeek || rWeek >= realWeek) return;
      const rDraft = r.formData?._draft === true || r.formData?._draft === "true";
      if (rDraft) return; // un borrador no cuenta como entregado
      const rDate = String(r.reportDate || r.formData?.reportDate || "");
      if (!rDate || rDate < cycleStartStr) return; // skip reports from previous cycles
      reportedPastWeeks.add(rWeek);
    });
  }

  weekField.innerHTML = Array.from({ length: getRcmTotalWeeks() }, (_, index) => {
    const value = String(index + 1);
    const num   = index + 1;
    const info  = getRcmWeekInfo(value);
    const phaseLabel = info ? info.phaseLabel : "";
    const verbPart   = info && info.verb ? ` · ${info.verb}` : "";
    const eventMark  = info && info.isEventWeek ? " ★" : "";

    let disabled = false;
    let note = "";
    if (num > realWeek) {
      disabled = true; note = " (no disponible)";
    } else if (num < realWeek) {
      // Past week
      if (reportedPastWeeks.has(num)) {
        disabled = true; note = " ✓ entregado";
      } else if (inGrace && num === realWeek - 1) {
        disabled = false; note = " · gracia";
      } else {
        disabled = true; note = " 🔒 cerrada";
      }
    }
    return `<option value="${value}"${disabled ? " disabled" : ""}>${value} — ${phaseLabel}${verbPart}${eventMark}${note}</option>`;
  }).join("");

  // Always force-select the real current week (not grace-adjusted)
  weekField.value = String(realWeek);
}

function syncPhaseIndicator() {
  if (!rcmPhaseIndicator) return;
  const info = getRcmWeekInfo(weekField.value);
  if (!info) { rcmPhaseIndicator.classList.add("is-hidden"); return; }
  const phaseKey = info.phase.toLowerCase();
  const rangeText = info.weekStart && info.weekEnd && info.weekStart !== info.weekEnd
    ? `Semanas ${info.weekStart}–${info.weekEnd}`
    : `Semana ${info.week}`;

  const verbHtml = info.verb
    ? `<span class="phase-indicator-verb"><strong>${escapeHtml(info.verb)}</strong> — ${escapeHtml(info.verbDesc)}</span>`
    : "";

  const eventHtml = info.isEventWeek && info.event
    ? `<span class="phase-indicator-event is-event-week">
        ★ Evento: <strong>${escapeHtml(info.event)}</strong>
        <em class="phase-indicator-event-type">${escapeHtml(info.eventType)}</em>
        <span class="phase-indicator-purpose">${escapeHtml(info.purpose)}</span>
       </span>`
    : "";

  rcmPhaseIndicator.innerHTML = `
    <span class="phase-badge phase-badge-${phaseKey}">${escapeHtml(info.phaseLabel || info.phase)}</span>
    <span class="phase-indicator-range">${escapeHtml(rangeText)}</span>
    ${verbHtml}
    ${eventHtml}
  `;
  rcmPhaseIndicator.classList.remove("is-hidden");
  rcmPhaseIndicator.dataset.phase = phaseKey;
  syncEventWeekVisitorUI(info);
}

function syncEventWeekVisitorUI(info) {
  const isEventWeek = info?.isEventWeek && info?.event;
  const eventName = isEventWeek ? info.event : null;

  // column header in the visitor table
  if (visitorEventColHeader) {
    visitorEventColHeader.hidden = !isEventWeek;
    if (isEventWeek) visitorEventColHeader.textContent = eventName;
  }

  // toggle in the quick-add form
  if (visitorEventToggleField) {
    visitorEventToggleField.hidden = !isEventWeek;
    if (visitorQuickEvent) visitorQuickEvent.checked = false;
  }
  if (visitorEventToggleLabel && isEventWeek) {
    visitorEventToggleLabel.textContent = eventName;
  }

  // re-render the table to add/remove the event column
  renderVisitorTable();
}

function findCellById(id) {
  return catalogs.cells.find((cell) => String(cell.id) === String(id || ""));
}

function findCellByNumber(cellNumber) {
  return catalogs.cells.find((cell) => String(cell.cellNumber) === String(cellNumber || ""));
}

function findFirstCellWithMembers() {
  return catalogs.cells.find((cell) => getCellMembers(cell).length || getCellKids(cell).length);
}

function getPeopleByRole(role) {
  // leader / assistant / host: any adult member can serve in these roles now
  if (role === "leader" || role === "assistant" || role === "host") {
    return catalogs.people.filter(p => p.role !== "kid");
  }
  return catalogs.people.filter((person) => person.role === role || person.role === "all");
}

function getVisiblePeople() {
  const DERIVED_FILTERS = ["coordinator","supervisor","leader","assistant","host"];
  return catalogs.people.filter((person) => {
    let matchesRole = true;
    if (activePeopleFilter === "kid")    matchesRole = person.role === "kid";
    else if (activePeopleFilter === "member") matchesRole = person.role !== "kid" && getDerivedFunction(person) === "member";
    else if (DERIVED_FILTERS.includes(activePeopleFilter)) matchesRole = getDerivedFunctions(person).includes(activePeopleFilter);
    // "all" matches everything
    const haystack = `${person.name} ${person.email || ""} ${person.phone || ""} ${person.assignedCellNumber || ""}`.toLowerCase();
    const matchesSearch = !activePeopleSearch || haystack.includes(activePeopleSearch);
    return matchesRole && matchesSearch;
  });
}

function getPersonAssignmentLabel(person) {
  if (Number(person?.assignedCellCount || 0) > 1) {
    return `Duplicado en ${person.assignedCellCount} células`;
  }
  if (person?.assignedCellNumber) {
    return `Célula ${person.assignedCellNumber}`;
  }
  return "Sin célula";
}

function getVisibleCells() {
  return catalogs.cells.filter((cell) => {
    const haystack = `${cell.cellNumber} ${cell.networkName || ""} ${cell.sector || ""} ${cell.zoneName || ""} ${cell.districtName || ""}`.toLowerCase();
    return !activeCellSearch || haystack.includes(activeCellSearch);
  });
}

function renderSelect(selectElement, options, placeholder) {
  selectElement.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>${options.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join("")}`;
}

function renderReportPersonSelects() {
  renderSelect(leaderField, getPeopleByRole("leader").map((person) => ({ value: person.name, label: person.name })), "Selecciona líder");
  renderSelect(assistantField, getPeopleByRole("assistant").map((person) => ({ value: person.name, label: person.name })), "Selecciona asistente");
  renderSelect(hostField, getPeopleByRole("host").map((person) => ({ value: person.name, label: person.name })), "Selecciona anfitrión");
}

function renderCellRoleSelects() {
  renderSelect(cellLeaderSelect, getPeopleByRole("leader").map((person) => ({ value: String(person.id), label: person.name })), "Sin líder");
  renderSelect(cellAssistantSelect, getPeopleByRole("assistant").map((person) => ({ value: String(person.id), label: person.name })), "Sin asistente");
  renderSelect(cellHostSelect, getPeopleByRole("host").map((person) => ({ value: String(person.id), label: person.name })), "Sin anfitrión");
}

function renderCellOptions() {
  const options = catalogs.cells.map((cell) => {
    const memberCount = getCellMembers(cell).length;
    const kidCount = getCellKids(cell).length;
    const memberLabel = `${memberCount} miembro${memberCount === 1 ? "" : "s"}`;
    const kidLabel = `${kidCount} niño${kidCount === 1 ? "" : "s"}`;
    return { value: cell.cellNumber, label: `${cell.cellNumber} · ${cell.networkName || "Sin red"} · ${memberLabel} · ${kidLabel}` };
  });
  renderSelect(cellField, options, "Selecciona célula");

  const adminOptions = catalogs.cells.map((cell) => ({ value: String(cell.id), label: `Célula ${cell.cellNumber}` }));
  renderSelect(cellAdminSelect, adminOptions, "Crear nueva célula");
}

function renderPeopleRows() {
  const visiblePeople = getVisiblePeople();
  if (!visiblePeople.length) {
    peopleTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">Sin personas registradas.</td></tr>';
    const pg = document.getElementById("people-card-grid");
    if (pg) pg.innerHTML = '<p class="pc-empty">Sin personas registradas.</p>';
    return;
  }

  // Group order: coordinator → supervisor → leader → assistant → host → member → kid
  const GROUP_ORDER = ["coordinator", "supervisor", "leader", "assistant", "host", "member", "kid"];
  const GROUP_LABELS = {
    coordinator: "Coordinadores",
    supervisor:  "Supervisores",
    leader:      "Líderes",
    assistant:   "Asistentes",
    host:        "Anfitriones",
    member:      "Miembros",
    kid:         "Niños",
  };

  // Assign each person to their top group (getDerivedFunction returns highest)
  const groups = {};
  GROUP_ORDER.forEach(g => groups[g] = []);
  visiblePeople.forEach(p => groups[getDerivedFunction(p)].push(p));

  const buildPersonData = (person) => {
    const isTrackable = person.role !== "kid";
    const rcm = person.rcmProgress || {};
    const activeCount = RCM_MILESTONES.filter(m => rcm[m.key]).length;
    const totalCount = RCM_MILESTONES.length;
    const rcmPct = Math.round((activeCount / totalCount) * 100);
    const rcmCell = isTrackable
      ? `<button type="button" class="rcm-inline-btn" data-action="open-rcm" data-id="${person.id}">
           <span class="rcm-inline-bar"><span class="rcm-inline-fill" style="width:${rcmPct}%"></span></span>
           <span class="rcm-inline-label">${activeCount}/${totalCount}</span>
         </button>`
      : `<span class="member-admin-caption">—</span>`;
    return { isTrackable, rcmCell, activeCount, totalCount, rcmPct };
  };

  const buildRow = (person) => {
    const { rcmCell } = buildPersonData(person);
    return `
    <tr>
      <td data-label="Nombre">
        <strong>${escapeHtml(person.name)}</strong><br>
        <span class="member-admin-caption">${escapeHtml(getGuardianDisplay(person) || person.phone || person.email || "Sin contacto")}</span>
      </td>
      <td data-label="Función">${getDerivedFunctions(person).map(fn => `<span class="fn-tag fn-tag--${fn}">${escapeHtml(formatRole(fn))}</span>`).join(" ")}</td>
      <td data-label="Asignación"><span class="catalog-assignment-chip${person.assignedCellNumber ? "" : " is-unassigned"}">${escapeHtml(getPersonAssignmentLabel(person))}</span></td>
      <td class="col-rcm" data-label="Progreso RCM">${rcmCell}</td>
      <td data-label="Acciones">
        <div class="row-actions">
          <button type="button" data-action="edit-person" data-id="${person.id}" data-tooltip="Editar datos de ${escapeHtml(person.name)}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg> Editar</button>
          <button type="button" class="danger" data-action="delete-person" data-id="${person.id}" data-tooltip="Eliminar permanentemente a ${escapeHtml(person.name)}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg> Eliminar</button>
        </div>
      </td>
    </tr>`;
  };

  const buildPersonCard = (person) => {
    const { rcmCell, activeCount, totalCount, rcmPct, isTrackable } = buildPersonData(person);
    const fns = getDerivedFunctions(person).map(fn => `<span class="fn-tag fn-tag--${fn}">${escapeHtml(formatRole(fn))}</span>`).join(" ");
    const assignment = `<span class="catalog-assignment-chip${person.assignedCellNumber ? "" : " is-unassigned"}">${escapeHtml(getPersonAssignmentLabel(person))}</span>`;
    return `<details class="pc-card">
      <summary class="pc-sum">
        <div class="pc-row1"><span class="pc-name">${escapeHtml(person.name)}</span>${assignment}</div>
        <div class="pc-fns">${fns}</div>
        ${isTrackable ? `<div class="pc-rcm-row"><span class="rcm-inline-bar pc-rcm-bar"><span class="rcm-inline-fill" style="width:${rcmPct}%"></span></span><span class="pc-rcm-label">${activeCount}/${totalCount}</span></div>` : ""}
      </summary>
      <div class="pc-body">
        ${isTrackable ? `
        <button type="button" class="rcm-action-btn" data-action="open-rcm" data-id="${person.id}">
          <span class="rcm-action-header">
            <svg class="rcm-action-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
            <span class="rcm-action-label">Proceso R.C.M</span>
            <span class="rcm-action-badge">${activeCount}<span class="rcm-action-total">/${totalCount}</span></span>
          </span>
          <span class="rcm-action-track"><span class="rcm-action-fill" style="width:${rcmPct}%"></span></span>
        </button>` : ""}
        <div class="pc-actions">
          <button type="button" class="pc-icon-btn" data-action="edit-person" data-id="${person.id}" title="Editar datos de ${escapeHtml(person.name)}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg></button>
          <button type="button" class="pc-icon-btn danger" data-action="delete-person" data-id="${person.id}" title="Eliminar a ${escapeHtml(person.name)}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>
        </div>
      </div>
    </details>`;
  };

  // Always render flat — group headers removed per request
  peopleTableBody.innerHTML = visiblePeople.map(buildRow).join("");
  const peopleCardGrid = document.getElementById("people-card-grid");
  if (peopleCardGrid) peopleCardGrid.innerHTML = visiblePeople.map(buildPersonCard).join("");
}

function renderPeopleFilterTabs() {
  const buttons = peopleFilterTabs.querySelectorAll(".filter-tab");
  buttons.forEach((button) => {
    button.classList.toggle("is-active", button.dataset.roleFilter === activePeopleFilter);
  });
  const sel = document.getElementById("people-filter-select");
  if (sel) sel.value = activePeopleFilter;
}

function renderAdminSummary() {
  // Count roles directly from cell FKs — avoids getDerivedFunction priority masking
  const leaderIds    = new Set(catalogs.cells.map(c => c.leaderPersonId).filter(Boolean).map(String));
  const assistantIds = new Set(catalogs.cells.map(c => c.assistantPersonId).filter(Boolean).map(String));
  const hostIds      = new Set(catalogs.cells.map(c => c.hostPersonId).filter(Boolean).map(String));
  const coordinators = catalogs.people.filter(p => p.isCoordinator).length;
  const supervisors  = catalogs.people.filter(p => p.supervisorSector).length;

  const kids    = catalogs.people.filter(p => p.role === "kid").length;
  const members = catalogs.people.filter(p => p.role !== "kid").length;

  const assignedMemberIds = new Set(
    catalogs.cells.flatMap(getCellMembers).map(m => String(m.id))
  );
  const unassignedMembers = catalogs.people.filter(
    p => p.role !== "kid" && !assignedMemberIds.has(String(p.id))
  ).length;
  const cellsWithoutLeader = catalogs.cells.filter(c => !c.leaderPersonId).length;

  const cards = [
    ["Células",       catalogs.cells.length, "Total registradas"],
    ["Líderes",       leaderIds.size,         "Asignados como líder"],
    ["Asistentes",    assistantIds.size,       "Asignados como asistente"],
    ["Anfitriones",   hostIds.size,            "Casas anfitrionas"],
    ["Coordinadores", coordinators,            "Con rol de coordinador"],
    ["Supervisores",  supervisors,             "Con sector asignado"],
    ["Miembros",      members,                 "Total adultos registrados"],
    ["Sin célula",    unassignedMembers,        "Adultos no asignados"],
    ["Niños",         kids,                    "Cargados por responsable"],
    ["Sin líder",     cellsWithoutLeader,       "Células por cubrir"],
  ];

  adminSummaryCards.innerHTML = cards.map(([label, value, hint]) => `
    <article class="summary-card">
      <span class="summary-label">${escapeHtml(label)}</span>
      <strong class="summary-value">${escapeHtml(String(value))}</strong>
      <span class="summary-hint">${escapeHtml(hint)}</span>
    </article>
  `).join("");
}

function renderCellQuickList() {
  // No-op: replaced by renderCellsTable
}

function renderCellsTable() {
  if (!cellsTableBody) return;
  const visibleCells = getVisibleCells();
  if (!visibleCells.length) {
    cellsTableBody.innerHTML = '<tr><td colspan="5" class="empty-state">Sin células registradas.</td></tr>';
    const cg = document.getElementById("cells-card-grid");
    if (cg) cg.innerHTML = '<p class="pc-empty">Sin células registradas.</p>';
    return;
  }
  const buildCellCard = (cell) => {
    const leader = catalogs.people.find(p => String(p.id) === String(cell.leaderPersonId));
    const memberCount = getCellMembers(cell).length;
    const kidCount = getCellKids(cell).length;
    const leaderName = leader ? escapeHtml(leader.name) : '<span class="pc-muted">Sin líder</span>';
    const membersText = `${memberCount} miembro${memberCount !== 1 ? "s" : ""}${kidCount ? ` · ${kidCount} niño${kidCount !== 1 ? "s" : ""}` : ""}`;
    return `<details class="pc-card">
      <summary class="pc-sum">
        <span class="pc-name">Célula ${escapeHtml(String(cell.cellNumber))}</span>
        <span class="pc-caption">${leaderName}</span>
      </summary>
      <div class="pc-body">
        <div class="pc-row">${escapeHtml(cell.networkName || "—")} · Sector ${escapeHtml(cell.sector || "—")}</div>
        <div class="pc-row">${membersText}</div>
        <div class="pc-actions">
          <button type="button" data-action="edit-cell" data-id="${cell.id}" data-tooltip="Editar Célula ${escapeHtml(cell.cellNumber)}"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg></button>
          <button type="button" class="danger" data-action="delete-cell" data-id="${cell.id}" data-tooltip="Eliminar Célula ${escapeHtml(cell.cellNumber)}"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg></button>
        </div>
      </div>
    </details>`;
  };
  cellsTableBody.innerHTML = visibleCells.map(cell => {
    const leader = catalogs.people.find(p => String(p.id) === String(cell.leaderPersonId));
    const memberCount = getCellMembers(cell).length;
    const kidCount = getCellKids(cell).length;
    return `<tr>
      <td data-label="Célula"><strong>Célula ${escapeHtml(String(cell.cellNumber))}</strong></td>
      <td data-label="Red · Sector"><span class="member-admin-caption">${escapeHtml(cell.networkName || "—")} · Sector ${escapeHtml(cell.sector || "—")}</span></td>
      <td data-label="Líder">${leader ? escapeHtml(leader.name) : '<span class="member-admin-caption">Sin líder</span>'}</td>
      <td data-label="Miembros"><span class="member-admin-caption">${memberCount} miembro${memberCount !== 1 ? "s" : ""}${kidCount ? ` · ${kidCount} niño${kidCount !== 1 ? "s" : ""}` : ""}</span></td>
      <td data-label="Acciones">
        <div class="row-actions">
          <button type="button" data-action="edit-cell" data-id="${cell.id}" data-tooltip="Editar datos y miembros de Célula ${escapeHtml(cell.cellNumber)}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg> Editar</button>
          <button type="button" class="danger" data-action="delete-cell" data-id="${cell.id}" data-tooltip="Eliminar Célula ${escapeHtml(cell.cellNumber)} — los miembros quedan sin célula"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg> Eliminar</button>
        </div>
      </td>
    </tr>`;
  }).join("");
  const cellsCardGrid = document.getElementById("cells-card-grid");
  if (cellsCardGrid) cellsCardGrid.innerHTML = visibleCells.map(buildCellCard).join("");
}

function openCellEditDialog(cell = null) {
  populateCellsForm(cell);
  const titleEl = document.querySelector("#cell-dialog-title");
  if (titleEl) titleEl.textContent = cell ? `Editar: Célula ${cell.cellNumber}` : "Nueva célula";
  if (cellEditDialog) cellEditDialog.showModal();
}

// ── Member detail modal ───────────────────────────────────────────────────────
function openMemberDetail(memberKey, memberName, scopeReports, periodLabel) {
  if (!memberDetailModal) return;

  // Collect per-week data for this member across scopeReports (sorted chronologically)
  const sorted = [...scopeReports].sort((a, b) => {
    const ak = `${getReportYear(a)}-${getReportWeek(a).padStart(2, "0")}`;
    const bk = `${getReportYear(b)}-${getReportWeek(b).padStart(2, "0")}`;
    return ak.localeCompare(bk);
  });

  const EVENT_LABELS = { P: "Planeación", A: "Alcance", C: "Culto" };
  let totalP = 0, totalA = 0, totalC = 0, totalFaltas = 0, totalJust = 0, totalWeeks = 0;
  const weekRows = [];

  sorted.forEach(r => {
    const entries = Array.isArray(r.formData?.memberAttendance) ? r.formData.memberAttendance : [];
    const entry = entries.find(e => String(e.personId || e.name || "") === memberKey || e.name === memberName);
    if (!entry) return;
    totalWeeks++;
    const planning = Boolean(entry.planningAttended);
    const reach    = Boolean(entry.reachAttended);
    const sunday   = Boolean(entry.sundayAttended);
    const isFalta  = entry.status === "absent" || entry.status === "justified";
    const isJust   = entry.status === "justified";
    if (planning) totalP++;
    if (reach)    totalA++;
    if (sunday)   totalC++;
    if (isFalta)  totalFaltas++;
    if (isJust)   totalJust++;

    const missed = [];
    if (!planning) missed.push("P");
    if (!reach)    missed.push("A");
    if (!sunday)   missed.push("C");

    const rd = r.formData?.reportDate || r.reportDate || "";
    const dateLabel = rd ? new Date(rd + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" }) : "";
    const weekNum = getReportWeek(r);

    weekRows.push({ weekNum, dateLabel, planning, reach, sunday, missed, isFalta, isJust });
  });

  if (totalWeeks === 0) {
    memberDetailModal.close();
    return;
  }

  const avgPct = Math.round(((totalP + totalA + totalC) / (totalWeeks * 3)) * 100);
  const barCls = avgPct >= 80 ? "attend-bar-good" : avgPct >= 50 ? "attend-bar-mid" : "attend-bar-low";

  // Header stats
  memberModalName.textContent   = memberName;
  memberModalPeriod.textContent = periodLabel;
  memberModalStats.innerHTML = `
    <div class="mdl-stat">
      <strong>${totalWeeks}</strong><span>semanas</span>
    </div>
    <div class="mdl-stat">
      <strong class="${totalFaltas > 0 ? "mdl-stat-bad" : "mdl-stat-good"}">${totalFaltas}</strong>
      <span>faltas${totalJust > 0 ? ` <em>(${totalJust} just.)</em>` : ""}</span>
    </div>
    <div class="mdl-stat-bar">
      <span class="mdl-stat-pct">${avgPct}%</span>
      <div class="attend-bar-track mdl-bar-track">
        <div class="attend-bar-fill ${barCls}" style="width:${avgPct}%"></div>
      </div>
      <span class="mdl-stat-label">asistencia promedio</span>
    </div>
    <div class="mdl-stat-events">
      <span class="mdl-ev-chip mdl-ev-p" title="Planeación">Plan. <strong>${totalP}/${totalWeeks}</strong></span>
      <span class="mdl-ev-chip mdl-ev-a" title="Alcance">Alc. <strong>${totalA}/${totalWeeks}</strong></span>
      <span class="mdl-ev-chip mdl-ev-c" title="Culto">Culto <strong>${totalC}/${totalWeeks}</strong></span>
    </div>
  `;

  // Week-by-week table
  const MONTHS = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const eventDot = (attended, label) => attended
    ? `<span class="mdl-dot mdl-dot-ok" title="${label}">✓</span>`
    : `<span class="mdl-dot mdl-dot-miss" title="Faltó a ${label}">✗</span>`;

  memberModalBody.innerHTML = `
    <table class="mdl-table">
      <thead><tr>
        <th>Sem.</th>
        <th>Fecha</th>
        <th title="Planeación">Plan.</th>
        <th title="Alcance">Alc.</th>
        <th title="Culto">Culto</th>
        <th>Estado</th>
      </tr></thead>
      <tbody>${weekRows.map(w => {
        const rowCls = w.isFalta ? (w.isJust ? " mdl-row-just" : " mdl-row-falta") : "";
        const statusBadge = w.isFalta
          ? `<span class="mdl-status-badge mdl-status-${w.isJust ? "just" : "absent"}">${w.isJust ? "Justificado" : "Falta"}</span>`
          : w.missed.length > 0
            ? `<span class="mdl-status-badge mdl-status-partial">Parcial</span>`
            : `<span class="mdl-status-badge mdl-status-ok">Completo</span>`;
        return `<tr class="${rowCls}">
          <td class="mdl-week">${w.weekNum}</td>
          <td class="mdl-date">${w.dateLabel}</td>
          <td class="mdl-ev">${eventDot(w.planning, "Planeación")}</td>
          <td class="mdl-ev">${eventDot(w.reach, "Alcance")}</td>
          <td class="mdl-ev">${eventDot(w.sunday, "Culto")}</td>
          <td>${statusBadge}</td>
        </tr>`;
      }).join("")}</tbody>
    </table>
  `;

  memberDetailModal.showModal();
}

// ── Visitor detail modal ──────────────────────────────────────────────────────
function openVisitorDetail(visitorKey, visitorName, scopeReports, periodLabel) {
  if (!memberDetailModal) return;

  const sorted = [...scopeReports].sort((a, b) => {
    const ak = `${getReportYear(a)}-${getReportWeek(a).padStart(2, "0")}`;
    const bk = `${getReportYear(b)}-${getReportWeek(b).padStart(2, "0")}`;
    return ak.localeCompare(bk);
  });

  let totalReach = 0, totalSunday = 0, converted = false, invitedBy = "";
  const weekRows = [];

  sorted.forEach(r => {
    const visitors = Array.isArray(r.formData?.visitors) ? r.formData.visitors : [];
    const entry = visitors.find(v => normalizeVisitorName(v.name) === visitorKey);
    if (!entry) return;
    const reach  = Boolean(entry.reachAttended);
    const sunday = Boolean(entry.sundayAttended);
    if (reach)  totalReach++;
    if (sunday) totalSunday++;
    if (entry.converted) converted = true;
    if (!invitedBy && entry.invitedBy) invitedBy = String(entry.invitedBy).trim();
    const rd = r.formData?.reportDate || r.reportDate || "";
    const dateLabel = rd ? new Date(rd + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" }) : "";
    weekRows.push({ weekNum: getReportWeek(r), dateLabel, reach, sunday });
  });

  const totalVisits = weekRows.length;
  if (totalVisits === 0) { memberDetailModal.close(); return; }

  const reachPct  = Math.round((totalReach  / totalVisits) * 100);
  const sundayPct = Math.round((totalSunday / totalVisits) * 100);
  const overallPct = Math.round(((totalReach + totalSunday) / (totalVisits * 2)) * 100);
  const barCls = overallPct >= 80 ? "attend-bar-good" : overallPct >= 50 ? "attend-bar-mid" : "attend-bar-low";

  memberModalPeriod.textContent = periodLabel;
  memberModalName.textContent   = visitorName;

  memberModalStats.innerHTML = `
    <div class="mdl-stat">
      <strong>${totalVisits}</strong><span>visitas</span>
    </div>
    <div class="mdl-stat">
      <strong class="mdl-stat-good">${converted ? "Sí" : "No"}</strong>
      <span>convertido</span>
    </div>
    ${invitedBy ? `<div class="mdl-stat"><strong style="font-size:1rem">${escapeHtml(invitedBy)}</strong><span>lo invitó</span></div>` : ""}
    <div class="mdl-stat-bar">
      <span class="mdl-stat-pct">${overallPct}%</span>
      <div class="attend-bar-track mdl-bar-track">
        <div class="attend-bar-fill ${barCls}" style="width:${overallPct}%"></div>
      </div>
      <span class="mdl-stat-label">asistencia promedio</span>
    </div>
    <div class="mdl-stat-events">
      <span class="mdl-ev-chip mdl-ev-a" title="Alcance">Alc. <strong>${totalReach}/${totalVisits}</strong> (${reachPct}%)</span>
      <span class="mdl-ev-chip mdl-ev-c" title="Culto">Culto <strong>${totalSunday}/${totalVisits}</strong> (${sundayPct}%)</span>
    </div>
  `;

  const eventDot = (attended, label) => attended
    ? `<span class="mdl-dot mdl-dot-ok" title="${label}">✓</span>`
    : `<span class="mdl-dot mdl-dot-miss" title="No asistió a ${label}">✗</span>`;

  memberModalBody.innerHTML = `
    <table class="mdl-table">
      <thead><tr>
        <th>Sem.</th>
        <th>Fecha</th>
        <th title="Alcance">Alc.</th>
        <th title="Culto dominical">Culto</th>
        <th>Asistencia</th>
      </tr></thead>
      <tbody>${weekRows.map(w => {
        const both = w.reach && w.sunday;
        const none = !w.reach && !w.sunday;
        const rowCls = none ? " mdl-row-falta" : "";
        const statusBadge = both
          ? `<span class="mdl-status-badge mdl-status-ok">Ambos eventos</span>`
          : !w.reach && w.sunday
            ? `<span class="mdl-status-badge mdl-status-partial">Solo culto</span>`
            : w.reach && !w.sunday
              ? `<span class="mdl-status-badge mdl-status-partial">Solo alcance</span>`
              : `<span class="mdl-status-badge mdl-status-absent">No asistió</span>`;
        return `<tr class="${rowCls}">
          <td class="mdl-week">${w.weekNum}</td>
          <td class="mdl-date">${w.dateLabel}</td>
          <td class="mdl-ev">${eventDot(w.reach,  "Alcance")}</td>
          <td class="mdl-ev">${eventDot(w.sunday, "Culto")}</td>
          <td>${statusBadge}</td>
        </tr>`;
      }).join("")}</tbody>
    </table>
  `;

  memberDetailModal.showModal();
}

// ── Totals panel (seguimiento tab) ───────────────────────────────────────────
function renderSegTotalsPanel(weeklyReps) {
  if (!segTotalsPanel || !segTotalsBody) return;
  if (!weeklyReps || weeklyReps.length === 0) { segTotalsPanel.hidden = true; return; }
  segTotalsPanel.hidden = false;

  // Get all sectors and cells from reports
  const sectors = [...new Set(weeklyReps.map(r => r.formData?.sector || r.sector || "?"))].sort();
  const cells   = [...new Set(weeklyReps.map(r => String(r.cellNumber || r.formData?.cellNumber || "?")))].sort((a,b) => Number(a)-Number(b));

  function buildRows(agg, label) {
    const max = Math.max(agg.planningPresent, agg.reachMembers, agg.sundayTotal, 1);
    const bar = (val, color) => `<div class="tot-bar-track"><div class="tot-bar" style="width:${Math.round((val/max)*100)}%;background:${color}"></div></div>`;
    const row = (label, val, color, hint) =>
      `<div class="tot-row">
        <span class="tot-row-label">${label}</span>
        ${bar(val, color)}
        <strong class="tot-row-val">${val}</strong>
        ${hint ? `<span class="tot-row-hint">${hint}</span>` : ''}
      </div>`;
    return `<div class="tot-group">
      <p class="tot-group-label">${escapeHtml(label)}</p>
      <div class="tot-rows">
        ${row('Plan. hermanos',    agg.planningPresent,  'var(--brand)',    agg.planningAbsent ? `${agg.planningAbsent} falta${agg.planningAbsent!==1?'s':''}` : '')}
        ${row('Alc. hermanos',     agg.reachMembers,     '#2d8a55',         (() => { const total = agg.planningPresent + agg.planningAbsent; const miss = total - agg.reachMembers; const parts = []; if (agg.reachPrivileged) parts.push(`${agg.reachPrivileged} ★`); if (miss > 0) parts.push(`${miss} falta${miss!==1?'s':''}`); return parts.join(' · '); })())}
        ${row('Alc. amigos',       agg.reachVisitors,    '#e0872a',         agg.reachConversions ? `${agg.reachConversions} conv.` : '')}
        ${row('Alc. niños',        agg.reachKids,        '#a367d9',         '')}
        ${row('Culto total',       agg.sundayTotal,      '#3a7bd5',         `${agg.sundayMembers} hmnos · ${agg.sundayVisitors} amigos · ${agg.sundayKids} niños`)}
        ${agg.absent ? row('Con falta',  agg.absent,  '#e05252', agg.justified ? `${agg.justified} just.` : '') : ''}
      </div>
    </div>`;
  }

  function renderScope(scope) {
    if (scope === 'total') {
      const agg = aggregateMetrics(weeklyReps);
      return `<div class="tot-scope-total">${buildRows(agg, `${weeklyReps.length} reporte${weeklyReps.length!==1?'s':''} esta semana`)}</div>`;
    }
    if (scope === 'sector') {
      return `<div class="tot-scope-grid">${sectors.map(sec => {
        const reps = weeklyReps.filter(r => (r.formData?.sector || r.sector || "?") === sec);
        const agg  = aggregateMetrics(reps);
        return buildRows(agg, `Sector ${sec} · ${reps.length} célula${reps.length!==1?'s':''}`);
      }).join('')}</div>`;
    }
    // cell
    return `<div class="tot-scope-grid">${cells.map(cellNum => {
      const reps = weeklyReps.filter(r => String(r.cellNumber || r.formData?.cellNumber || "?") === cellNum);
      const agg  = aggregateMetrics(reps);
      const leader = reps[0]?.leaderName || reps[0]?.formData?.leaderName || '';
      return buildRows(agg, `Célula ${cellNum}${leader ? ` · ${leader}` : ''}`);
    }).join('')}</div>`;
  }

  let currentScope = 'total';
  const render = () => { segTotalsBody.innerHTML = renderScope(currentScope); };
  render();

  // Wire tab buttons (remove old listeners by replacing node)
  const tabs = segTotalsPanel.querySelectorAll('.seg-totals-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      currentScope = tab.dataset.tscope;
      render();
    });
  });
}

// ── Dashboard para líderes (vista propia de célula por evento) ────────────────
function renderDashboardForLeader(reports) {
  const cellNum = currentUser?.assignedCellNumber
    ? String(currentUser.assignedCellNumber)
    : cellField?.value || "";

  const scopedReports = getScopedReports(reports);
  renderDashboardPeriodOptions(scopedReports);

  const { year: parsedYear, quarter: parsedQuarter, week: parsedWeek } = parsePeriodKey(activeDashboardPeriod);
  const selectedWeek    = String(parsedWeek    || getQuarterWeekNumber());
  const selectedYear    = String(parsedYear    || new Date().getFullYear());
  const selectedQuarter = String(parsedQuarter || getCurrentQuarter());

  // All reports for this cell
  const allCellReports = scopedReports.filter(r =>
    String(r.cellNumber || r.formData?.cellNumber || "") === cellNum
  );

  // Week report: always uses current week period (for absence alerts)
  const weekReport = allCellReports.find(r =>
    getReportWeek(r) === selectedWeek &&
    getReportYear(r) === selectedYear &&
    String(getReportQuarter(r)) === selectedQuarter
  );

  // Determine report set and labels based on active time scope
  let scopeReports, scopeChipText, scopeTitleText;
  if (activeDashboardTimeScope === "quarter") {
    // selectedQuarter from parsePeriodKey is 0 when key is "2026-Q2" format → use currentQuarter fallback
    const q = String(parsedQuarter || getCurrentQuarter());
    scopeReports   = allCellReports.filter(r => getReportYear(r) === selectedYear && String(getReportQuarter(r)) === q);
    scopeChipText  = `C${q} ${selectedYear}`;
    scopeTitleText = `Cuatrimestre ${q === "1" ? "Ene–Abr" : q === "2" ? "May–Ago" : "Sep–Dic"} ${selectedYear}`;
  } else if (activeDashboardTimeScope === "year") {
    scopeReports   = allCellReports.filter(r => getReportYear(r) === selectedYear);
    scopeChipText  = `Año ${selectedYear}`;
    scopeTitleText = `Año ${selectedYear}`;
  } else {
    scopeReports   = weekReport ? [weekReport] : [];
    scopeChipText  = `Sem. ${selectedWeek}`;
    scopeTitleText = `Semana ${selectedWeek}`;
  }

  dashboardWeekChip.textContent = scopeChipText;
  if (dashboardScopeChip) dashboardScopeChip.hidden = true;
  if (dashboardScopeTitle) dashboardScopeTitle.textContent = scopeTitleText;

  // Summary cards — differentiated by scope
  if (activeDashboardTimeScope === "week") {
    const agg = aggregateMetrics(scopeReports);
    dashboardSummaryGrid.innerHTML = [
      { label: "Planeación · hermanos", value: agg.planningPresent,    hint: "Presentes en planeación" },
      { label: "Planeación · ausentes", value: agg.absent + agg.justified, hint: "Faltas (justificadas incluidas)" },
      { label: "Alcance · hermanos",    value: agg.reachMembers,       hint: "Miembros en alcance" },
      { label: "Alcance · amigos",      value: agg.reachVisitors,      hint: "Visitas en alcance" },
      { label: "Alcance · niños",       value: agg.reachKids,          hint: "Niños en alcance" },
      { label: "Culto · hermanos",      value: agg.sundayMembers,      hint: "Miembros en culto dominical" },
      { label: "Culto · amigos",        value: agg.sundayVisitors,     hint: "Visitas en culto dominical" },
      { label: "Culto · niños",         value: agg.sundayKids,         hint: "Niños en culto" },
      ...(agg.reachConversions ? [{ label: "Conversiones", value: agg.reachConversions, hint: "Decisiones de fe" }] : []),
    ].map(({ label, value, hint }) => `
      <article class="summary-card summary-card-dashboard">
        <span class="summary-label">${escapeHtml(label)}</span>
        <strong class="summary-value">${escapeHtml(String(value))}</strong>
        <span class="summary-hint">${escapeHtml(hint)}</span>
      </article>
    `).join("");

  } else if (activeDashboardTimeScope === "quarter") {
    const ext = aggregateMetricsExtended(scopeReports);
    const qLabel = activeDashboardTimeScope === "quarter" ? scopeTitleText : "";
    dashboardSummaryGrid.innerHTML = [
      { label: "Sem. reportadas",       value: ext.n,                    hint: "Semanas con reporte en el cuatrimestre", cls: "accent-neutral" },
      { label: "Hermanos consistentes", value: ext.consistentMembers,    hint: "Presentes en ≥ 50% de semanas",          cls: "accent-success" },
      { label: "Prom. planeación",      value: ext.avgPlanning,          hint: "Promedio semanal de hermanos",           cls: "" },
      { label: "Prom. alcance",         value: ext.avgReachMembers,      hint: "Promedio semanal de hermanos en alcance", cls: "" },
      { label: "Prom. amigos · alcance",value: ext.avgReachVisitors,     hint: "Promedio semanal de amigos en alcance",  cls: "" },
      { label: "Prom. culto",           value: ext.avgSundayMembers,     hint: "Promedio semanal de hermanos en culto",  cls: "" },
      { label: "Prom. amigos · culto",  value: ext.avgSundayVisitors,    hint: "Promedio semanal de amigos en culto",    cls: "" },
      { label: "Conversiones",          value: ext.reachConversions,     hint: "Decisiones de fe en el cuatrimestre",   cls: "accent-faith" },
      { label: "Bautismos",             value: ext.baptisms,             hint: "Bautismos en el cuatrimestre",           cls: "accent-faith" },
    ].map(({ label, value, hint, cls }) => `
      <article class="summary-card summary-card-dashboard ${cls || ""}">
        <span class="summary-label">${escapeHtml(label)}</span>
        <strong class="summary-value">${escapeHtml(String(value))}</strong>
        <span class="summary-hint">${escapeHtml(hint)}</span>
      </article>
    `).join("");

  } else {
    // Year scope
    const ext  = aggregateMetricsExtended(scopeReports);
    const byQ  = aggregateByQuarter(allCellReports, selectedYear);
    const QNAMES = ["", "Ene–Abr", "May–Ago", "Sep–Dic"];
    const qTableRows = byQ.filter(q => q.n > 0).map(q => `
      <tr>
        <td>C${q.q} <span class="scope-q-range">${QNAMES[q.q]}</span></td>
        <td class="scope-q-num">${q.n}</td>
        <td class="scope-q-num">${q.conversions}</td>
        <td class="scope-q-num">${q.baptisms}</td>
        <td class="scope-q-num">${q.avgReach}</td>
      </tr>
    `).join("") || `<tr><td colspan="5" class="scope-q-empty">Sin reportes</td></tr>`;

    dashboardSummaryGrid.innerHTML = `
      <article class="summary-card summary-card-dashboard accent-neutral">
        <span class="summary-label">Sem. reportadas</span>
        <strong class="summary-value">${ext.n}</strong>
        <span class="summary-hint">Semanas con reporte en el año</span>
      </article>
      <article class="summary-card summary-card-dashboard accent-success">
        <span class="summary-label">Hermanos consistentes</span>
        <strong class="summary-value">${ext.consistentMembers}</strong>
        <span class="summary-hint">Presentes en ≥ 50% de semanas</span>
      </article>
      <article class="summary-card summary-card-dashboard accent-faith">
        <span class="summary-label">Conversiones</span>
        <strong class="summary-value">${ext.reachConversions}</strong>
        <span class="summary-hint">Decisiones de fe en el año</span>
      </article>
      <article class="summary-card summary-card-dashboard accent-faith">
        <span class="summary-label">Bautismos</span>
        <strong class="summary-value">${ext.baptisms}</strong>
        <span class="summary-hint">Bautismos en el año</span>
      </article>
      <article class="summary-card summary-card-dashboard">
        <span class="summary-label">Prom. planeación</span>
        <strong class="summary-value">${ext.avgPlanning}</strong>
        <span class="summary-hint">Promedio semanal de hermanos</span>
      </article>
      <article class="summary-card summary-card-dashboard">
        <span class="summary-label">Prom. alcance</span>
        <strong class="summary-value">${ext.avgReachMembers}</strong>
        <span class="summary-hint">Promedio semanal de hermanos en alcance</span>
      </article>
      <article class="summary-card summary-card-dashboard scope-table-card">
        <span class="summary-label">Comparativo por cuatrimestre</span>
        <table class="scope-q-table">
          <thead><tr><th></th><th>Sem.</th><th>Conv.</th><th>Baut.</th><th>Prom.alcance</th></tr></thead>
          <tbody>${qTableRows}</tbody>
        </table>
      </article>
    `;
  }

  // ── Alertas / Asistencia por miembro ────────────────────────────────────────
  const fd = weekReport?.formData || {};
  if (dashboardAbsenceAlerts) {
    if (activeDashboardTimeScope === "week") {
      // ── Vista semana: faltas por evento + racha ──────────────────────────────
      if (dashboardAbsenceTitle) dashboardAbsenceTitle.textContent = "Alertas de faltas";
      if (dashboardAbsenceLegend) dashboardAbsenceLegend.hidden = false;

      const weekEntries = Array.isArray(fd.memberAttendance) ? fd.memberAttendance : [];
      const sortedCellReports = [...allCellReports].sort((a, b) => {
        const ak = `${getReportYear(a)}-${getReportWeek(a).padStart(2, "0")}`;
        const bk = `${getReportYear(b)}-${getReportWeek(b).padStart(2, "0")}`;
        return ak.localeCompare(bk);
      });
      const streaks = new Map();
      sortedCellReports.forEach(r => {
        const pk = getReportPeriodKey(r);
        const entries = Array.isArray(r.formData?.memberAttendance) ? r.formData.memberAttendance : [];
        entries.forEach(entry => {
          const key = String(entry.personId || entry.name || "");
          const prev = streaks.get(key) || { name: entry.name || "", streak: 0, lastPeriodKey: "" };
          const isAbsent = entry.status === "absent" || entry.status === "justified";
          let nextStreak = 0;
          if (isAbsent) {
            nextStreak = prev.lastPeriodKey && isNextPeriod(prev.lastPeriodKey, pk) ? prev.streak + 1 : 1;
          }
          streaks.set(key, { name: entry.name || prev.name, streak: nextStreak, lastPeriodKey: pk, status: entry.status || "pending" });
        });
      });

      const seenKeys = new Set();
      const rows = [];
      if (weekReport) {
        weekEntries.forEach(entry => {
          const missed = [];
          if (!entry.planningAttended) missed.push("P");
          if (!entry.reachAttended)    missed.push("A");
          if (!entry.sundayAttended)   missed.push("C");
          if (missed.length === 0) return;
          const key = String(entry.personId || entry.name || "");
          seenKeys.add(key);
          const streakInfo = streaks.get(key);
          rows.push({ name: entry.name || "", missed, justified: entry.status === "justified", streak: streakInfo?.streak || 0 });
        });
        rows.sort((a, b) => b.missed.length - a.missed.length || b.streak - a.streak);
      }
      const onlyStreak = Array.from(streaks.values())
        .filter(e => e.streak >= 2 && !seenKeys.has(String(e.name)))
        .sort((a, b) => b.streak - a.streak);

      let html = "";
      if (rows.length) {
        const EVENT_LABELS = { P: "Planeación", A: "Alcance", C: "Culto" };
        html += rows.map(row => {
          const chipsCls = row.justified ? "alert-chip alert-chip-justified" : "alert-chip alert-chip-absent";
          const chips    = row.missed.map(ev => `<span class="${chipsCls}" title="${EVENT_LABELS[ev]}">${ev}</span>`).join("");
          const streakPill = row.streak >= 2
            ? `<span class="alert-streak-pill alert-streak-${row.streak >= 4 ? "critical" : row.streak >= 3 ? "high" : "medium"}">${row.streak}×</span>`
            : "";
          return `<div class="absence-row">
            <span class="absence-row-name">${escapeHtml(row.name)}</span>
            <span class="absence-row-chips">${chips}</span>
            ${streakPill}
          </div>`;
        }).join("");
      } else if (weekReport) {
        html += `<div class="quick-list-empty">Sin faltas esta semana. ✓</div>`;
      } else {
        html += `<div class="quick-list-empty">Sin reporte registrado esta semana.</div>`;
      }
      if (onlyStreak.length) {
        if (html) html += `<div class="alert-group-label" style="margin-top:10px">También en semanas anteriores</div>`;
        html += onlyStreak.slice(0, 5).map(e => {
          const cls = e.streak >= 4 ? "critical" : e.streak >= 3 ? "high" : "medium";
          return `<div class="absence-row">
            <span class="absence-row-name">${escapeHtml(e.name)}</span>
            <span class="absence-row-chips"></span>
            <span class="alert-streak-pill alert-streak-${cls}">${e.streak}×</span>
          </div>`;
        }).join("");
      }
      dashboardAbsenceAlerts.innerHTML = html || `<div class="quick-list-empty">Sin alertas.</div>`;

    } else {
      // ── Vista cuatrimestre / año: asistencia acumulada por miembro y amigos ──
      const periodLabel = activeDashboardTimeScope === "quarter" ? scopeTitleText : `Año ${selectedYear}`;
      if (dashboardAbsenceTitle) dashboardAbsenceTitle.textContent = `Seguimiento · ${periodLabel}`;
      if (dashboardAbsenceLegend) dashboardAbsenceLegend.hidden = true;

      // ── Hermanos ─────────────────────────────────────────────────────────────
      const memberStats = new Map(); // key → { key, name, weeks, planP, reachP, sundayP, absent, justified }
      scopeReports.forEach(r => {
        const entries = Array.isArray(r.formData?.memberAttendance) ? r.formData.memberAttendance : [];
        entries.forEach(e => {
          const key = String(e.personId || e.name || "");
          if (!key) return;
          const prev = memberStats.get(key) || { key, name: e.name || "", weeks: 0, planP: 0, reachP: 0, sundayP: 0, absent: 0, justified: 0 };
          prev.weeks += 1;
          if (e.planningAttended) prev.planP    += 1;
          if (e.reachAttended)    prev.reachP   += 1;
          if (e.sundayAttended)   prev.sundayP  += 1;
          if (e.status === "absent")    prev.absent   += 1;
          if (e.status === "justified") prev.justified += 1;
          memberStats.set(key, prev);
        });
      });

      // ── Amigos ───────────────────────────────────────────────────────────────
      const visitorStats = new Map(); // normalizedName → { name, invitedBy, visits, reachCount, sundayCount, converted }
      scopeReports.forEach(r => {
        const visitors = Array.isArray(r.formData?.visitors) ? r.formData.visitors : [];
        visitors.forEach(v => {
          const norm = normalizeVisitorName(v.name);
          if (!norm) return;
          const prev = visitorStats.get(norm) || { name: String(v.name || norm).trim(), invitedBy: String(v.invitedBy || "").trim(), visits: 0, reachCount: 0, sundayCount: 0, converted: false };
          prev.visits++;
          if (v.reachAttended)  prev.reachCount++;
          if (v.sundayAttended) prev.sundayCount++;
          if (v.converted)      prev.converted = true;
          if (!prev.invitedBy && v.invitedBy) prev.invitedBy = String(v.invitedBy).trim();
          visitorStats.set(norm, prev);
        });
      });

      // ── Build member rows ─────────────────────────────────────────────────────
      const buildMemberRows = () => {
        if (memberStats.size === 0) return `<tr><td colspan="3" class="attend-empty">Sin datos de asistencia en este periodo.</td></tr>`;
        const sorted = [...memberStats.values()].sort((a, b) => {
          const pctA = a.weeks > 0 ? (a.planP + a.reachP + a.sundayP) / (a.weeks * 3) : 0;
          const pctB = b.weeks > 0 ? (b.planP + b.reachP + b.sundayP) / (b.weeks * 3) : 0;
          return pctA - pctB || a.name.localeCompare(b.name);
        });
        return sorted.map(m => {
          const avgPct = m.weeks > 0 ? Math.round(((m.planP + m.reachP + m.sundayP) / (m.weeks * 3)) * 100) : 0;
          const barCls = avgPct >= 80 ? "attend-bar-good" : avgPct >= 50 ? "attend-bar-mid" : "attend-bar-low";
          const absTotal = m.absent + m.justified;
          const faltasCell = absTotal === 0
            ? `<span class="attend-ok-badge">✓ Sin faltas</span>`
            : `<span class="attend-abs-badge">${absTotal} sem.</span>${m.justified > 0 ? ` <span class="attend-just-badge">${m.justified} just.</span>` : ""}`;
          const allSame = m.planP === m.reachP && m.reachP === m.sundayP;
          const evDetail = allSame
            ? `${m.planP} de ${m.weeks} semanas asistió a los 3 eventos`
            : `Plan. ${m.planP}/${m.weeks} · Alc. ${m.reachP}/${m.weeks} · Culto ${m.sundayP}/${m.weeks}`;
          const rowCls = absTotal === 0 ? "" : avgPct < 50 ? " attend-row-low" : " attend-row-mid";
          return `<tr class="attend-row${rowCls} attend-row-clickable" data-member-key="${escapeHtml(String(m.key || m.name))}" data-member-name="${escapeHtml(m.name)}" title="Ver detalle de ${escapeHtml(m.name)}">
            <td class="attend-name">${escapeHtml(m.name)}<div class="attend-ev-detail">${evDetail}</div></td>
            <td class="attend-falta-cell">${faltasCell}</td>
            <td class="attend-bar-cell">
              <div class="attend-bar-track"><div class="attend-bar-fill ${barCls}" style="width:${avgPct}%"></div></div>
              <span class="attend-pct">${avgPct}%</span>
            </td>
          </tr>`;
        }).join("");
      };

      // ── Build visitor rows ─────────────────────────────────────────────────────
      const buildVisitorRows = () => {
        if (visitorStats.size === 0) return `<tr><td colspan="3" class="attend-empty">Sin amigos registrados en este periodo.</td></tr>`;
        const sorted = [...visitorStats.values()].sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name));
        return sorted.map(v => {
          const normKey = normalizeVisitorName(v.name);
          const reachPct  = v.visits > 0 ? Math.round((v.reachCount  / v.visits) * 100) : 0;
          const sundayPct = v.visits > 0 ? Math.round((v.sundayCount / v.visits) * 100) : 0;
          const convertedBadge = v.converted ? `<span class="visitor-conv-badge">Convertido ✓</span>` : "";
          const invitadoBadge  = v.invitedBy ? `<span class="attend-ev-detail">Invitado por ${escapeHtml(v.invitedBy)}</span>` : "";
          return `<tr class="attend-row attend-row-clickable" data-visitor-key="${escapeHtml(normKey)}" data-visitor-name="${escapeHtml(v.name)}" title="Ver detalle de ${escapeHtml(v.name)}">
            <td class="attend-name">
              ${escapeHtml(v.name)} ${convertedBadge}
              ${invitadoBadge}
            </td>
            <td class="attend-falta-cell">
              <span class="attend-ev-chip attend-ev-a" title="Alcance">${v.reachCount}/${v.visits}</span>
              <span class="attend-ev-chip attend-ev-c" title="Culto dom.">${v.sundayCount}/${v.visits}</span>
            </td>
            <td class="attend-bar-cell">
              <div class="attend-bar-track" title="${reachPct}% alcance · ${sundayPct}% culto">
                <div class="attend-bar-fill ${reachPct >= 80 ? "attend-bar-good" : reachPct >= 50 ? "attend-bar-mid" : "attend-bar-low"}" style="width:${Math.round((v.reachCount + v.sundayCount) / (v.visits * 2) * 100)}%"></div>
              </div>
              <span class="attend-pct">${v.visits} vis.</span>
            </td>
          </tr>`;
        }).join("");
      };

      // ── Render tabs ───────────────────────────────────────────────────────────
      dashboardAbsenceAlerts.innerHTML = `
        <div class="attend-tabs">
          <button class="attend-tab attend-tab-active" data-tab="hermanos">Hermanos <span class="attend-tab-count">${memberStats.size}</span></button>
          <button class="attend-tab" data-tab="amigos">Amigos <span class="attend-tab-count">${visitorStats.size}</span></button>
        </div>
        <div id="attend-panel-hermanos" class="attend-panel">
          <table class="attend-table">
            <thead><tr>
              <th class="attend-th-name">Miembro</th>
              <th class="attend-th-falta">Semanas con falta</th>
              <th class="attend-th-bar">Asistencia promedio (3 eventos)</th>
            </tr></thead>
            <tbody>${buildMemberRows()}</tbody>
          </table>
        </div>
        <div id="attend-panel-amigos" class="attend-panel attend-panel-hidden">
          <table class="attend-table">
            <thead><tr>
              <th class="attend-th-name">Amigo</th>
              <th class="attend-th-falta">Alcance · Culto</th>
              <th class="attend-th-bar">Visitas</th>
            </tr></thead>
            <tbody>${buildVisitorRows()}</tbody>
          </table>
        </div>
      `;

      // Tab switching
      dashboardAbsenceAlerts.querySelectorAll(".attend-tab").forEach(btn => {
        btn.addEventListener("click", () => {
          dashboardAbsenceAlerts.querySelectorAll(".attend-tab").forEach(b => b.classList.remove("attend-tab-active"));
          btn.classList.add("attend-tab-active");
          const tab = btn.dataset.tab;
          dashboardAbsenceAlerts.querySelectorAll(".attend-panel").forEach(p => p.classList.add("attend-panel-hidden"));
          dashboardAbsenceAlerts.querySelector(`#attend-panel-${tab}`)?.classList.remove("attend-panel-hidden");
        });
      });

      // Member row click → member modal
      dashboardAbsenceAlerts.querySelectorAll("[data-member-key]").forEach(row => {
        row.addEventListener("click", () => {
          openMemberDetail(
            row.dataset.memberKey,
            row.dataset.memberName,
            scopeReports,
            `${activeDashboardTimeScope === "quarter" ? "Cuatrimestre" : "Año"} · ${periodLabel}`
          );
        });
      });

      // Visitor row click → visitor modal
      dashboardAbsenceAlerts.querySelectorAll("[data-visitor-key]").forEach(row => {
        row.addEventListener("click", () => {
          openVisitorDetail(
            row.dataset.visitorKey,
            row.dataset.visitorName,
            scopeReports,
            `${activeDashboardTimeScope === "quarter" ? "Cuatrimestre" : "Año"} · ${periodLabel}`
          );
        });
      });
    }
  }

  // Metrics: scoped to this cell, selected time scope
  renderDashboardMetrics(scopeReports, `Célula ${cellNum}`);
  renderDashboardBaptisms(allCellReports);
}

function renderDashboard(reports) {
  // Anyone with an assigned cell sees their own cell data (leaders, supervisors/coordinators who lead a cell)
  if (currentUser?.assignedCellNumber) {
    return renderDashboardForLeader(reports);
  }

  const scopedReports = getScopedReports(reports);
  const scopedCells   = getScopedCells();
  const scopeLabel    = getDashboardScopeLabel();
  renderDashboardPeriodOptions(scopedReports);
  const { year: parsedYear, quarter: parsedQuarter, week: parsedWeek } = parsePeriodKey(activeDashboardPeriod);
  const selectedWeek    = String(parsedWeek    || getQuarterWeekNumber());
  const selectedYear    = String(parsedYear    || new Date().getFullYear());
  const selectedQuarter = String(parsedQuarter || getCurrentQuarter());

  // Reports for current week (used for summary counts and pending cells)
  const weeklyReports = scopedReports.filter((report) =>
    getReportWeek(report) === selectedWeek &&
    getReportYear(report) === selectedYear &&
    String(getReportQuarter(report)) === selectedQuarter
  );

  // Reports for the active time scope (used for summary cards + metrics)
  let scopeTimeReports, scopeChipText, scopeTitleText, hintSuffix;
  if (activeDashboardTimeScope === "quarter") {
    scopeTimeReports = scopedReports.filter(r =>
      getReportYear(r) === selectedYear &&
      String(getReportQuarter(r)) === selectedQuarter
    );
    scopeChipText  = `Q${selectedQuarter} ${selectedYear}`;
    scopeTitleText = `Cuatrimestre ${selectedQuarter === "1" ? "Ene–Abr" : selectedQuarter === "2" ? "May–Ago" : "Sep–Dic"} ${selectedYear}`;
    hintSuffix     = "en el cuatrimestre";
  } else if (activeDashboardTimeScope === "year") {
    scopeTimeReports = scopedReports.filter(r => getReportYear(r) === selectedYear);
    scopeChipText  = `Año ${selectedYear}`;
    scopeTitleText = `Año ${selectedYear}`;
    hintSuffix     = "en el año";
  } else {
    scopeTimeReports = weeklyReports;
    scopeChipText  = `Semana ${selectedWeek}`;
    scopeTitleText = "Semana en curso";
    hintSuffix     = "esta semana";
  }

  const reportedCells = new Set(weeklyReports.map((report) => String(report.cellNumber || report.formData?.cellNumber || "")));
  const pendingCells  = scopedCells.filter((cell) => !reportedCells.has(String(cell.cellNumber)));

  dashboardWeekChip.textContent = scopeChipText;
  if (dashboardScopeTitle) dashboardScopeTitle.textContent = scopeTitleText;
  if (dashboardScopeChip) {
    if (scopeLabel) {
      dashboardScopeChip.textContent = scopeLabel;
      dashboardScopeChip.hidden = false;
    } else {
      dashboardScopeChip.hidden = true;
    }
  }
  if (dashboardPendingEyebrow) {
    dashboardPendingEyebrow.textContent = scopeLabel ? `Seguimiento · ${scopeLabel}` : "Seguimiento";
  }

  const agg = aggregateMetrics(scopeTimeReports);
  const reportedCellsCount = new Set(scopeTimeReports.map(r => String(r.cellNumber || r.formData?.cellNumber || ""))).size;

  if (activeDashboardTimeScope === "week") {
    dashboardSummaryGrid.innerHTML = [
      ["Reportes",    scopeTimeReports.length,                                                    hintSuffix === "esta semana" ? "Capturados esta semana" : `Capturados ${hintSuffix}`],
      ["Células",     reportedCellsCount,                                                         "Con reporte"],
      ["Pendientes",  pendingCells.length,                                                        "Sin reporte esta semana"],
      ["Planeación",  agg.planningPresent,                                                        "Hermanos en planeación"],
      ["Alcance",     agg.reachMembers + agg.reachVisitors + agg.reachKids,                       "Total en reunión de alcance"],
      ["Culto",       agg.sundayMembers + agg.sundayVisitors + agg.sundayKids,                    "Total en culto dominical"],
      ["Faltas",      agg.absent + agg.justified,                                                 "Ausentes y justificados"],
      ["Visitas",     agg.reachVisitors + agg.sundayVisitors,                                     "Amigos en alcance y culto"],
    ].map(([label, value, hint]) => `
      <article class="summary-card summary-card-dashboard">
        <span class="summary-label">${escapeHtml(label)}</span>
        <strong class="summary-value">${escapeHtml(String(value))}</strong>
        <span class="summary-hint">${escapeHtml(hint)}</span>
      </article>
    `).join("");

  } else if (activeDashboardTimeScope === "quarter") {
    const ext = aggregateMetricsExtended(scopeTimeReports);
    dashboardSummaryGrid.innerHTML = [
      { label: "Sem. reportadas",        value: reportedCellsCount ? `${scopeTimeReports.length}` : "0", hint: "Reportes en el cuatrimestre",         cls: "accent-neutral" },
      { label: "Células activas",        value: reportedCellsCount,                                       hint: "Con al menos un reporte",             cls: "accent-neutral" },
      { label: "Prom. alcance / célula", value: ext.n > 0 ? Math.round((ext.reachMembers + ext.reachVisitors) / Math.max(1, reportedCellsCount)) : 0,
                                                                                                           hint: "Promedio de personas en alcance",     cls: "" },
      { label: "Prom. culto / célula",   value: ext.n > 0 ? Math.round((ext.sundayMembers + ext.sundayVisitors) / Math.max(1, reportedCellsCount)) : 0,
                                                                                                           hint: "Promedio de personas en culto",       cls: "" },
      { label: "Conversiones",           value: ext.reachConversions,                                      hint: "Decisiones de fe en el cuatrimestre", cls: "accent-faith" },
      { label: "Bautismos",              value: ext.baptisms,                                              hint: "Bautismos en el cuatrimestre",        cls: "accent-faith" },
      { label: "Faltas totales",         value: ext.absent + ext.justified,                                hint: "Ausentes + justificados (suma)",      cls: "" },
      { label: "Pendientes esta sem.",   value: pendingCells.length,                                       hint: "Células sin reporte la semana actual", cls: "" },
    ].map(({ label, value, hint, cls }) => `
      <article class="summary-card summary-card-dashboard ${cls || ""}">
        <span class="summary-label">${escapeHtml(label)}</span>
        <strong class="summary-value">${escapeHtml(String(value))}</strong>
        <span class="summary-hint">${escapeHtml(hint)}</span>
      </article>
    `).join("");

  } else {
    // Year scope — totals + per-quarter breakdown table
    const ext = aggregateMetricsExtended(scopeTimeReports);
    const allForYear = scopedReports.filter(r => getReportYear(r) === selectedYear);
    const byQ  = [1, 2, 3].map(q => {
      const reps = allForYear.filter(r => String(getReportQuarter(r)) === String(q));
      const ag   = aggregateMetrics(reps);
      const cells = new Set(reps.map(r => String(r.cellNumber || r.formData?.cellNumber || ""))).size;
      return { q, n: reps.length, cells, conversions: ag.reachConversions, baptisms: ag.baptisms,
               avgReach: reps.length ? Math.round((ag.reachMembers + ag.reachVisitors) / Math.max(1, cells)) : 0 };
    });
    const QNAMES = ["", "Ene–Abr", "May–Ago", "Sep–Dic"];
    const qTableRows = byQ.filter(b => b.n > 0).map(b => `
      <tr>
        <td>C${b.q} <span class="scope-q-range">${QNAMES[b.q]}</span></td>
        <td class="scope-q-num">${b.n}</td>
        <td class="scope-q-num">${b.cells}</td>
        <td class="scope-q-num">${b.conversions}</td>
        <td class="scope-q-num">${b.baptisms}</td>
        <td class="scope-q-num">${b.avgReach}</td>
      </tr>
    `).join("") || `<tr><td colspan="6" class="scope-q-empty">Sin reportes</td></tr>`;

    dashboardSummaryGrid.innerHTML = `
      <article class="summary-card summary-card-dashboard accent-neutral">
        <span class="summary-label">Reportes en el año</span>
        <strong class="summary-value">${scopeTimeReports.length}</strong>
        <span class="summary-hint">Total de reportes capturados</span>
      </article>
      <article class="summary-card summary-card-dashboard accent-neutral">
        <span class="summary-label">Células activas</span>
        <strong class="summary-value">${reportedCellsCount}</strong>
        <span class="summary-hint">Con al menos un reporte en el año</span>
      </article>
      <article class="summary-card summary-card-dashboard accent-faith">
        <span class="summary-label">Conversiones</span>
        <strong class="summary-value">${ext.reachConversions}</strong>
        <span class="summary-hint">Decisiones de fe en el año</span>
      </article>
      <article class="summary-card summary-card-dashboard accent-faith">
        <span class="summary-label">Bautismos</span>
        <strong class="summary-value">${ext.baptisms}</strong>
        <span class="summary-hint">Bautismos en el año</span>
      </article>
      <article class="summary-card summary-card-dashboard scope-table-card">
        <span class="summary-label">Comparativo por cuatrimestre</span>
        <table class="scope-q-table">
          <thead><tr><th></th><th>Rep.</th><th>Céls.</th><th>Conv.</th><th>Baut.</th><th>Prom.alcance</th></tr></thead>
          <tbody>${qTableRows}</tbody>
        </table>
      </article>
    `;
  }

  const sortedReports = [...scopedReports].sort((left, right) => {
    const leftKey = `${getReportYear(left)}-${getReportWeek(left).padStart(2, "0")}`;
    const rightKey = `${getReportYear(right)}-${getReportWeek(right).padStart(2, "0")}`;
    return leftKey.localeCompare(rightKey);
  }).filter((report) => getReportPeriodKey(report) <= activeDashboardPeriod);
  const streaks = new Map();
  sortedReports.forEach((report) => {
    const reportPeriodKey = getReportPeriodKey(report);
    const entries = Array.isArray(report?.formData?.memberAttendance) ? report.formData.memberAttendance : [];
    entries.forEach((entry) => {
      const key = String(entry.personId || entry.name || "");
      const previous = streaks.get(key) || { name: entry.name || "", streak: 0, lastPeriodKey: "" };
      const isAbsent = entry.status === "absent" || entry.status === "justified";
      let nextStreak = 0;
      if (isAbsent) {
        nextStreak = previous.lastPeriodKey && isNextPeriod(previous.lastPeriodKey, reportPeriodKey)
          ? previous.streak + 1
          : 1;
      }
      streaks.set(key, {
        name: entry.name || previous.name,
        streak: nextStreak,
        lastPeriodKey: reportPeriodKey,
        status: entry.status || "pending",
      });
    });
  });
  const alerts = Array.from(streaks.values())
    .filter((entry) => entry.streak >= 2 && (entry.status === "absent" || entry.status === "justified"))
    .sort((left, right) => right.streak - left.streak)
    .slice(0, 6);
  dashboardAbsenceAlerts.innerHTML = alerts.length
    ? alerts.map((entry) => {
        const severity = getAbsenceAlertSeverity(entry);
        const severityLabel = entry.streak >= 4 ? "Crítica" : entry.streak >= 3 ? "Alta" : "Seguimiento";
        return `<article class="dashboard-list-item dashboard-alert-item dashboard-alert-${severity}"><div class="dashboard-alert-head"><strong>${escapeHtml(entry.name)}</strong><span class="dashboard-alert-badge">${escapeHtml(severityLabel)}</span></div><span>${escapeHtml(String(entry.streak))} semanas seguidas${entry.status === "justified" ? " justificadas" : " con falta"}</span></article>`;
      }).join("")
    : '<div class="quick-list-empty">Sin alertas de faltas consecutivas por ahora.</div>';

  // ── Métricas consolidadas ───────────────────────────────────────────────
  renderDashboardMetrics(scopeTimeReports, scopeLabel);
  // ── Bautismos ────────────────────────────────────────────────────────────
  renderDashboardBaptisms(scopedReports);
}

function aggregateMetrics(reportsList) {
  return reportsList.reduce((acc, report) => {
    const fd = report?.formData || {};
    const s  = fd.attendanceSummary || {};
    acc.planningPresent  += Number(s.planningMembersPresent  || 0);
    acc.planningAbsent   += Number(s.planningMembersAbsent   || 0);
    acc.reachMembers     += Number(s.reachMembersPresent     || 0);
    acc.reachPrivileged  += Number(s.reachPrivilegedMembers  || 0);
    acc.reachVisitors    += Number(s.reachFriendsPresent     || s.visitors || 0);
    acc.reachKids        += Number(s.reachKidsPresent        || 0);
    acc.reachConversions += Number(s.reachConversions        || 0);
    const sm = Number(s.sundayMembersPresent  || 0);
    const sf = Number(s.sundayFriendsPresent  || 0);
    const sk = Number(s.sundayKidsPresent     || 0);
    acc.sundayMembers    += sm;
    acc.sundayVisitors   += sf;
    acc.sundayKids       += sk;
    acc.sundayTotal      += Number(s.sundayTotal || 0) || (sm + sf + sk);
    acc.absent           += Number(s.absent    || 0);
    acc.justified        += Number(s.justified || 0);
    acc.baptisms         += Array.isArray(fd.baptisms) ? fd.baptisms.length : 0;
    return acc;
  }, { planningPresent: 0, planningAbsent: 0, reachMembers: 0, reachPrivileged: 0,
       reachVisitors: 0, reachKids: 0, reachConversions: 0,
       sundayMembers: 0, sundayVisitors: 0, sundayKids: 0, sundayTotal: 0,
       absent: 0, justified: 0, baptisms: 0 });
}

// Extended aggregation used for quarter/year views: adds averages + consistent-member count
function aggregateMetricsExtended(reportsList) {
  const n = reportsList.length;
  const base = aggregateMetrics(reportsList);
  const avg = v => n > 0 ? Math.round((v / n) * 10) / 10 : 0;

  // Consistent members: appeared in ≥ 50% of weeks and were present in at least half of those appearances
  const memberWeeks = new Map(); // personKey → { present: 0, total: 0 }
  reportsList.forEach(r => {
    const entries = Array.isArray(r.formData?.memberAttendance) ? r.formData.memberAttendance : [];
    entries.forEach(e => {
      const key = String(e.personId || e.name || "");
      if (!key) return;
      const prev = memberWeeks.get(key) || { name: e.name || "", present: 0, total: 0 };
      prev.total  += 1;
      if (e.status === "present" || e.status === "service") prev.present += 1;
      memberWeeks.set(key, prev);
    });
  });
  const minWeeks = Math.max(1, Math.ceil(n * 0.5));
  const consistentMembers = [...memberWeeks.values()].filter(m => m.total >= minWeeks && m.present >= Math.ceil(m.total * 0.5)).length;

  return {
    ...base,
    n,
    avgPlanning: avg(base.planningPresent),
    avgReachMembers: avg(base.reachMembers),
    avgReachVisitors: avg(base.reachVisitors),
    avgSundayMembers: avg(base.sundayMembers),
    avgSundayVisitors: avg(base.sundayVisitors),
    consistentMembers,
  };
}

// Quarter breakdown by quarter number: returns array [{q, n, conversions, baptisms}]
function aggregateByQuarter(reportsList, year) {
  const quarters = [1, 2, 3].map(q => {
    const reps = reportsList.filter(r => getReportYear(r) === year && String(getReportQuarter(r)) === String(q));
    const agg  = aggregateMetrics(reps);
    return { q, n: reps.length, conversions: agg.reachConversions, baptisms: agg.baptisms,
             avgReach: reps.length ? Math.round((agg.reachMembers + agg.reachVisitors) / reps.length) : 0 };
  });
  return quarters;
}

// ── Metrics: week-by-week trend (quarter scope) ───────────────────────────────
function renderMetricsTrend(reports) {
  if (!dashboardMetricsBody) return;
  if (!reports.length) {
    dashboardMetricsBody.innerHTML = `<div class="quick-list-empty">Sin datos.</div>`;
    return;
  }

  const sorted = [...reports].sort((a, b) => {
    const ak = `${getReportYear(a)}-${getReportWeek(a).padStart(2, "0")}`;
    const bk = `${getReportYear(b)}-${getReportWeek(b).padStart(2, "0")}`;
    return ak.localeCompare(bk);
  });

  const rows = sorted.map(r => {
    const s = r.formData?.attendanceSummary || {};
    const rd = r.formData?.reportDate || r.reportDate || "";
    const dateLabel = rd ? new Date(rd + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" }) : "";
    return {
      week:    getReportWeek(r),
      date:    dateLabel,
      plan:    Number(s.planningMembersPresent  || 0),
      reach:   Number(s.reachMembersPresent     || 0),
      friends: Number(s.reachFriendsPresent || s.visitors || 0),
      sunday:  Number(s.sundayMembersPresent    || 0),
    };
  });

  const maxPlan    = Math.max(1, ...rows.map(r => r.plan));
  const maxReach   = Math.max(1, ...rows.map(r => r.reach));
  const maxFriends = Math.max(1, ...rows.map(r => r.friends));
  const maxSunday  = Math.max(1, ...rows.map(r => r.sunday));
  const n = rows.length;
  const avg = arr => n > 0 ? (arr.reduce((a, v) => a + v, 0) / n).toFixed(1) : "–";

  const avgPlan    = avg(rows.map(r => r.plan));
  const avgReach   = avg(rows.map(r => r.reach));
  const avgFriends = avg(rows.map(r => r.friends));
  const avgSunday  = avg(rows.map(r => r.sunday));

  const miniBar = (val, max, cls) =>
    `<div class="trend-cell">
      <div class="trend-bar-track"><div class="trend-bar trend-bar-${cls}" style="width:${max > 0 ? Math.round((val / max) * 100) : 0}%"></div></div>
      <span class="trend-num">${val}</span>
    </div>`;

  dashboardMetricsBody.innerHTML = `
    <div class="trend-table-wrap">
      <table class="trend-table">
        <thead><tr>
          <th class="trend-th-week">Sem.</th>
          <th class="trend-th-ev">Plan. hermanos</th>
          <th class="trend-th-ev">Alc. hermanos</th>
          <th class="trend-th-ev">Amigos</th>
          <th class="trend-th-ev">Culto hermanos</th>
        </tr></thead>
        <tbody>${rows.map(r => `
          <tr class="trend-row">
            <td class="trend-week-cell"><strong>${r.week}</strong><span class="trend-date">${r.date}</span></td>
            <td>${miniBar(r.plan,    maxPlan,    "plan")}</td>
            <td>${miniBar(r.reach,   maxReach,   "reach")}</td>
            <td>${miniBar(r.friends, maxFriends, "friends")}</td>
            <td>${miniBar(r.sunday,  maxSunday,  "sunday")}</td>
          </tr>`).join("")}
        </tbody>
        <tfoot><tr class="trend-avg-row">
          <td class="trend-avg-label">Promedio</td>
          <td class="trend-avg-val">${avgPlan}</td>
          <td class="trend-avg-val">${avgReach}</td>
          <td class="trend-avg-val">${avgFriends}</td>
          <td class="trend-avg-val">${avgSunday}</td>
        </tr></tfoot>
      </table>
    </div>`;
}

// ── Metrics: quarterly comparison (year scope) ────────────────────────────────
function renderMetricsYearSummary(reports) {
  if (!dashboardMetricsBody) return;
  if (!reports.length) {
    dashboardMetricsBody.innerHTML = `<div class="quick-list-empty">Sin datos.</div>`;
    return;
  }

  const byQ = { 1: [], 2: [], 3: [] };
  reports.forEach(r => {
    const q = getReportQuarter(r);
    if (byQ[q]) byQ[q].push(r);
  });

  const qLabel = q => q === 1 ? "C1 · Ene–Abr" : q === 2 ? "C2 · May–Ago" : "C3 · Sep–Dic";

  const blocks = [1, 2, 3].map(q => {
    const reps = byQ[q];
    if (!reps.length) return `
      <div class="year-q-block year-q-empty">
        <p class="year-q-label">${qLabel(q)}</p>
        <p class="year-q-none">Sin reportes</p>
      </div>`;
    const agg = aggregateMetrics(reps);
    const n   = reps.length;
    const avg = v => (v / n).toFixed(1);
    return `
      <div class="year-q-block">
        <p class="year-q-label year-q-label-${q}">${qLabel(q)}</p>
        <p class="year-q-sems">${n} sem. reportadas</p>
        <div class="year-q-rows">
          <div class="year-q-row"><span>Plan. hermanos</span><strong>${avg(agg.planningPresent)}</strong><small>/sem</small></div>
          <div class="year-q-row"><span>Alc. hermanos</span><strong>${avg(agg.reachMembers)}</strong><small>/sem</small></div>
          <div class="year-q-row"><span>Amigos alcance</span><strong>${avg(agg.reachVisitors)}</strong><small>/sem</small></div>
          <div class="year-q-row"><span>Culto hermanos</span><strong>${avg(agg.sundayMembers)}</strong><small>/sem</small></div>
          <div class="year-q-row"><span>Amigos culto</span><strong>${avg(agg.sundayVisitors)}</strong><small>/sem</small></div>
          <div class="year-q-row year-q-conv"><span>Conversiones</span><strong>${agg.reachConversions}</strong><small>total</small></div>
        </div>
      </div>`;
  });

  dashboardMetricsBody.innerHTML = `<div class="year-q-grid">${blocks.join("")}</div>`;
}

function renderMetricsBlock(label, metrics) {
  const m = metrics;
  const events = [
    {
      title: "Planeación", cls: "planning",
      rows: [
        ["Hermanos presentes", m.planningPresent],
        ["Hermanos ausentes",  m.planningAbsent],
      ],
    },
    {
      title: "Alcance", cls: "reach",
      rows: [
        ["Hermanos presentes", m.reachMembers],
        ["Con privilegios",    m.reachPrivileged],
        ["Amigos presentes",   m.reachVisitors],
        ["Niños presentes",    m.reachKids],
        ["Conversiones",       m.reachConversions],
      ],
    },
    {
      title: "Culto dominical", cls: "sunday",
      rows: [
        ["Total asistentes", m.sundayTotal],
        ["Hermanos",         m.sundayMembers],
        ["Amigos",           m.sundayVisitors],
        ["Niños",            m.sundayKids],
      ],
    },
  ];
  const absRow = (m.absent + m.justified) > 0 ? `
    <div class="metrics-event-block">
      <div class="metrics-event-title metrics-event--absent">Ausencias</div>
      <div class="metrics-event-rows">
        <div class="metrics-event-row"><span>Ausentes</span><strong>${m.absent}</strong></div>
        <div class="metrics-event-row"><span>Justificados</span><strong>${m.justified}</strong></div>
      </div>
    </div>` : "";
  return `
    <div class="metrics-sector-block">
      ${label ? `<p class="metrics-sector-label">${escapeHtml(label)}</p>` : ""}
      <div class="metrics-events-grid">
        ${events.map(ev => `
          <div class="metrics-event-block">
            <div class="metrics-event-title metrics-event--${ev.cls}">${escapeHtml(ev.title)}</div>
            <div class="metrics-event-rows">
              ${ev.rows.map(([name, val]) => `
                <div class="metrics-event-row${val === 0 ? " is-zero" : ""}">
                  <span>${escapeHtml(name)}</span><strong>${val}</strong>
                </div>`).join("")}
            </div>
          </div>`).join("")}
        ${absRow}
      </div>
    </div>`;
}

function renderDashboardMetrics(weeklyReports, scopeLabel) {
  if (!dashboardMetricsBody) return;

  const isAdmin = !currentUser || currentUser.isAdmin;
  if (dashboardMetricsToggle) dashboardMetricsToggle.hidden = !isAdmin || activeDashboardTimeScope !== "week";
  if (dashboardMetricsEyebrow) {
    dashboardMetricsEyebrow.textContent = scopeLabel
      ? `Métricas · ${scopeLabel}`
      : "Métricas consolidadas";
  }

  if (!weeklyReports.length) {
    dashboardMetricsBody.innerHTML = '<div class="quick-list-empty">Sin reporte capturado para esta semana.</div>';
    return;
  }

  // Quarter: show week-by-week trend table
  if (activeDashboardTimeScope === "quarter") {
    renderMetricsTrend(weeklyReports);
    return;
  }

  // Year: show per-quarter comparison blocks
  if (activeDashboardTimeScope === "year") {
    renderMetricsYearSummary(weeklyReports);
    return;
  }

  // Week: existing table breakdown (optionally by sector for admin)
  if (isAdmin && activeMetricsScope === "sector") {
    const cellSectorMap = new Map(
      (catalogs.cells || []).map(c => [String(c.cellNumber), c.sector || "Sin sector"])
    );
    const bySector = new Map();
    weeklyReports.forEach(report => {
      const cellNum = String(report.cellNumber || report.formData?.cellNumber || "");
      const sector = cellSectorMap.get(cellNum) || "Sin sector";
      if (!bySector.has(sector)) bySector.set(sector, []);
      bySector.get(sector).push(report);
    });
    const sorted = Array.from(bySector.entries()).sort(([a], [b]) => a.localeCompare(b, "es"));
    dashboardMetricsBody.innerHTML = `<div class="metrics-breakdown-grid">
      ${sorted.map(([sector, reps]) => renderMetricsBlock(`Sector ${sector}`, aggregateMetrics(reps))).join("")}
    </div>`;
  } else {
    dashboardMetricsBody.innerHTML = `<div class="metrics-breakdown-grid">${renderMetricsBlock("", aggregateMetrics(weeklyReports))}</div>`;
  }
}

function renderDashboardBaptisms(scopedReports) {
  const body  = document.getElementById("dashboard-baptisms-body");
  const chip  = document.getElementById("dashboard-baptisms-total-chip");
  if (!body) return;

  // Build: year → quarter → cell → count
  // Reads both the baptisms[] array (individual records) and the numeric summary fields
  const byYearQ = {};
  scopedReports.forEach(report => {
    const fd   = report?.formData || {};
    const date = String(fd.reportDate || report.reportDate || "");
    const year = date.slice(0, 4) || "?";
    const cell = String(report.cellNumber || fd.cellNumber || "?");

    // 1. Individual records from baptisms[] array (only in closing weeks)
    const bapArray = Array.isArray(fd.baptisms) ? fd.baptisms.filter(b => b.name) : [];
    if (bapArray.length) {
      const month = Number(date.slice(5, 7));
      const q = month <= 4 ? "1" : month <= 8 ? "2" : "3";
      if (!byYearQ[year])          byYearQ[year] = {};
      if (!byYearQ[year][q])       byYearQ[year][q] = {};
      if (!byYearQ[year][q][cell]) byYearQ[year][q][cell] = 0;
      byYearQ[year][q][cell] += bapArray.length;
    }

    // 2. Numeric summary fields (from Cierre metrics section, filled manually per quarter)
    const numericMap = [
      ["baptismFirstQuarter",  year, "1"],
      ["baptismSecondQuarter", year, "2"],
      ["baptismThirdQuarter",  year, "3"],
    ];
    numericMap.forEach(([key, y, q]) => {
      const val = Number(fd[key] || 0);
      if (!val) return;
      if (!byYearQ[y])          byYearQ[y] = {};
      if (!byYearQ[y][q])       byYearQ[y][q] = {};
      if (!byYearQ[y][q][cell]) byYearQ[y][q][cell] = 0;
      // Only take the max if the same cell reported in multiple weeks (avoid double-counting)
      byYearQ[y][q][cell] = Math.max(byYearQ[y][q][cell], val);
    });
  });

  const qName = q => q === "1" ? "1er Cuatrimestre" : q === "2" ? "2do Cuatrimestre" : "3er Cuatrimestre";
  const years = Object.keys(byYearQ).sort((a, b) => b - a);

  if (!years.length) {
    if (chip) chip.textContent = "0 total";
    body.innerHTML = '<p class="empty-state" style="padding:12px 0">Todavía no hay bautismos registrados en los reportes.</p>';
    return;
  }

  let grandTotal = 0;
  body.innerHTML = years.map(year => {
    const yearTotal = Object.values(byYearQ[year])
      .flatMap(qCells => Object.values(qCells))
      .reduce((s, n) => s + n, 0);
    grandTotal += yearTotal;
    const quarters = Object.keys(byYearQ[year]).sort();
    return `
      <div class="baptism-year-block">
        <div class="baptism-year-head">
          <strong class="baptism-year-label">${escapeHtml(year)}</strong>
          <span class="baptism-year-total">${yearTotal} bautismo${yearTotal !== 1 ? "s" : ""}</span>
        </div>
        <div class="baptism-quarters-grid">
          ${quarters.map(q => {
            const cells  = byYearQ[year][q];
            const qTotal = Object.values(cells).reduce((s, n) => s + n, 0);
            const rows   = Object.entries(cells)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([cell, count]) => `
                <div class="baptism-cell-row">
                  <span class="baptism-cell-num">Célula ${escapeHtml(cell)}</span>
                  <span class="baptism-cell-count">${count}</span>
                </div>`).join("");
            return `
              <div class="baptism-q-card">
                <div class="baptism-q-head">
                  <span class="baptism-q-name">${qName(q)}</span>
                  <span class="baptism-q-total">${qTotal}</span>
                </div>
                <div class="baptism-cell-list">${rows}</div>
              </div>`;
          }).join("")}
        </div>
      </div>`;
  }).join("");

  if (chip) chip.textContent = `${grandTotal} total`;
}

function handleDashboardPeriodChange() {
  activeDashboardPeriod = dashboardPeriodSelect.value;
  renderDashboard(reportsData);
}

// Las tres reuniones de la semana (Planeación, Alcance, Culto) son
// eventos independientes; cada miembro tiene un estado por evento.
// `status` queda como campo derivado para dashboards/alertas y se
// recalcula con `deriveOverallStatus` cada vez que cambia un sub-estado.
const STAGE_STATUS_FIELDS = {
  planificacion: "planningStatus",
  alcance:       "reachStatus",
  culto:         "sundayStatus",
};
function deriveOverallStatus(entry) {
  // Prioriza la etapa más reciente con valor explícito.
  const order = ["sundayStatus", "reachStatus", "planningStatus"];
  for (const f of order) {
    const v = entry[f];
    if (v && v !== "pending") return v;
  }
  return "pending";
}

function buildDefaultMemberAttendance(cell, savedEntries = []) {
  const savedByPersonId = new Map(
    (Array.isArray(savedEntries) ? savedEntries : []).map((entry) => [String(entry.personId || entry.name || ""), entry])
  );

  return getCellMembers(cell).map((member) => {
    const savedEntry = savedByPersonId.get(String(member.id)) || savedByPersonId.get(String(member.name));
    // Cada sub-estado parte como "pending" por defecto. Solo se hereda
    // un valor explícitamente guardado para esa etapa.
    // Limpieza: si el sub-estado guardado es "present" pero el checkbox
    // de asistencia de esa etapa está en false, es contaminación del
    // bug anterior (migración legacy `status`→3 etapas). Se devuelve
    // "pending" para no mostrar "Presente" falso. Los estados manuales
    // (absent / justified / service) se respetan siempre.
    const sanitize = (status, attended) => {
      if (!status) return "pending";
      if (status === "present" && !attended) return "pending";
      return status;
    };
    const planningStatus = sanitize(savedEntry?.planningStatus, savedEntry?.planningAttended);
    const reachStatus    = sanitize(savedEntry?.reachStatus,    savedEntry?.reachAttended);
    const sundayStatus   = sanitize(savedEntry?.sundayStatus,   savedEntry?.sundayAttended);
    const entry = {
      personId: member.id,
      name: member.name,
      role: member.role,
      rcmProgress: member.rcmProgress || {},
      planningStatus,
      reachStatus,
      sundayStatus,
      status: "pending", // se sobreescribe abajo
      planningAttended: Boolean(savedEntry?.planningAttended),
      reachAttended: Boolean(savedEntry?.reachAttended),
      reachPrivileged: Boolean(savedEntry?.reachPrivileged),
      sundayAttended: Boolean(savedEntry?.sundayAttended),
      note: savedEntry?.note || "",
    };
    entry.status = deriveOverallStatus(entry);
    return entry;
  });
}

function normalizeKids(savedKids = []) {
  if (!Array.isArray(savedKids)) {
    return [];
  }
  return savedKids.map((kid) => ({
    personId: kid?.personId ?? null,
    name: kid?.name || "",
    guardianName: kid?.guardianName || "",
    source: kid?.source || (kid?.personId ? "catalog" : "visit"),
    reachAttended: Boolean(kid?.reachAttended),
    sundayAttended: Boolean(kid?.sundayAttended),
    note: kid?.note || "",
  }));
}

function buildDefaultKidsAttendance(cell, savedEntries = []) {
  const savedByKey = new Map(
    normalizeKids(savedEntries).map((entry) => [String(entry.personId || entry.name || ""), entry])
  );

  const catalogKids = getCellKids(cell).map((kid) => {
    const savedEntry = savedByKey.get(String(kid.id)) || savedByKey.get(String(kid.name));
    return {
      personId: kid.id,
      name: kid.name,
      guardianName: savedEntry?.guardianName || kid.guardianName || "",
      source: "catalog",
      reachAttended: Boolean(savedEntry?.reachAttended),
      sundayAttended: Boolean(savedEntry?.sundayAttended),
      note: savedEntry?.note || "",
    };
  });

  const manualKids = normalizeKids(savedEntries).filter((entry) => entry.source !== "catalog" && !entry.personId);
  return [...catalogKids, ...manualKids];
}

function normalizeVisitors(savedVisitors = []) {
  if (!Array.isArray(savedVisitors)) {
    return [];
  }
  return savedVisitors.map((visitor) => ({
    name: visitor?.name || "",
    invitedBy: visitor?.invitedBy || "",
    reachAttended: Boolean(visitor?.reachAttended),
    sundayAttended: Boolean(visitor?.sundayAttended),
    firstVisit: Boolean(visitor?.firstVisit),
    converted: Boolean(visitor?.converted),
    contacted: Boolean(visitor?.contacted),
    eventAttended: Boolean(visitor?.eventAttended),
    phone: visitor?.phone || "",
    note: visitor?.note || "",
  }));
}

function computeWeeklySummary() {
  const namedVisitors = currentVisitors.filter((visitor) => String(visitor.name || "").trim());
  const namedKids = currentKids.filter((kid) => String(kid.name || "").trim());
  const counts = {
    totalMembers: currentMemberAttendance.length,
    planningMembersPresent: 0,
    planningMembersAbsent: 0,
    reachMembersPresent: 0,
    reachPrivilegedMembers: 0,
    reachFriendsPresent: 0,
    reachConversions: 0,
    reachKidsPresent: 0,
    winSpiritualParents: 0,
    winFriendsContacted: 0,
    winRiseEventFriends: 0,
    sundayMembersPresent: 0,
    sundayFriendsPresent: 0,
    sundayKidsPresent: 0,
    present: 0,
    absent: 0,
    justified: 0,
    service: 0,
    pending: 0,
    visitors: namedVisitors.length,
  };

  currentMemberAttendance.forEach((entry) => {
    if (entry.planningAttended) counts.planningMembersPresent += 1;
    else counts.planningMembersAbsent += 1;
    if (entry.reachAttended) counts.reachMembersPresent += 1;
    if (entry.reachPrivileged) counts.reachPrivilegedMembers += 1;
    if (entry.sundayAttended) counts.sundayMembersPresent += 1;
    if (entry.status === "present") counts.present += 1;
    else if (entry.status === "absent") counts.absent += 1;
    else if (entry.status === "justified") counts.justified += 1;
    else if (entry.status === "service") counts.service += 1;
    else counts.pending += 1;
  });

  const spiritualParentsSet = new Set();
  namedVisitors.forEach((visitor) => {
    if (visitor.reachAttended) counts.reachFriendsPresent += 1;
    if (visitor.sundayAttended) counts.sundayFriendsPresent += 1;
    if (visitor.converted) counts.reachConversions += 1;
    if (visitor.invitedBy) spiritualParentsSet.add(visitor.invitedBy);
    if (visitor.eventAttended) counts.winRiseEventFriends += 1;
  });
  counts.winSpiritualParents = spiritualParentsSet.size;
  counts.winFriendsContacted = namedVisitors.length;

  // Auto-count RCM milestones from member rcmProgress
  // Classes: count "en_curso" (currently enrolled); Events: count any truthy value
  RCM_MILESTONES.forEach(({ key, type }) => {
    counts[`rcm_${key}`] = currentMemberAttendance.filter((e) => {
      const val = e.rcmProgress?.[key];
      if (!val) return false;
      if (type === "clase") return String(val).startsWith("en_curso:");
      return true;
    }).length;
  });

  namedKids.forEach((kid) => {
    if (kid.reachAttended) counts.reachKidsPresent += 1;
    if (kid.sundayAttended) counts.sundayKidsPresent += 1;
  });

  counts.winBaptizedFriends = getBaptismCaptureStatus().isAllowed ? normalizeBaptisms(currentBaptisms).filter((entry) => entry.name).length : 0;

  counts.planningMembersAbsent = Math.max(0, counts.totalMembers - counts.planningMembersPresent);
  counts.sundayTotal = counts.sundayMembersPresent + counts.sundayFriendsPresent + counts.sundayKidsPresent;
  counts.reachTotal = counts.reachMembersPresent + counts.reachFriendsPresent;

  return counts;
}

function syncDerivedMetricFields() {
  const summary = computeWeeklySummary();
  const baptismMetrics = computeBaptismMetrics();
  const fieldValues = {
    planningMembersPresent:    summary.planningMembersPresent,
    planningMembersAbsent:     summary.planningMembersAbsent,
    reachMembersPresent:       summary.reachMembersPresent,
    reachPrivilegedMembers:    summary.reachPrivilegedMembers,
    reachFriendsPresent:       summary.reachFriendsPresent,
    reachConversions:          summary.reachConversions,
    reachKidsPresent:          summary.reachKidsPresent,
    multiplySundayAttendance:  summary.sundayTotal,
    winSpiritualParents:       summary.winSpiritualParents,
    winFriendsContacted:       summary.winFriendsContacted,
    winRiseEventFriends:       summary.winRiseEventFriends,
    winBaptizedFriends:        summary.winBaptizedFriends,
    // Fase Consolidar — from rcmProgress
    consolidateE1:             summary.rcm_e1Maduracion     ?? 0,
    consolidateE2:             summary.rcm_e2Integracion    ?? 0,
    consolidateE3:             summary.rcm_e3Ubicacion      ?? 0,
    consolidateJoinEvent:      summary.rcm_eventoUnete      ?? 0,
    consolidateReencuentro:    summary.rcm_eventoReencuentro ?? 0,
    consolidateMinistries:     summary.rcm_eventoMinisterios ?? 0,
    // Fase Discipular — from rcmProgress
    discipleE1Vision:          summary.rcm_e1Vision         ?? 0,
    discipleE2Character:       summary.rcm_e2Caracter       ?? 0,
    discipleE3Profile:         summary.rcm_e3Perfil         ?? 0,
    discipleLaunchMultiply:    summary.rcm_lanzamiento      ?? 0,
    // Escuelas — from rcmProgress
    schoolFormative:           summary.rcm_escFormativa     ?? 0,
    schoolParents:             summary.rcm_escPadresEsp     ?? 0,
    schoolLeaders:             summary.rcm_escLideres       ?? 0,
    schoolSupervisors:         summary.rcm_escSupervisores  ?? 0,
    baptismFirstQuarter:       baptismMetrics[1],
    baptismSecondQuarter:      baptismMetrics[2],
    baptismThirdQuarter:       baptismMetrics[3],
    baptismYearTotal:          baptismMetrics.total,
  };

  Object.entries(fieldValues).forEach(([name, value]) => {
    const field = reportForm.elements.namedItem(name);
    if (field instanceof HTMLInputElement) {
      field.value = String(value);
    }
  });
}

function renderAttendanceSummary() {
  const summary = computeWeeklySummary();
  attendanceProgressChip.textContent = `${summary.totalMembers - summary.pending}/${summary.totalMembers} marcados`;
  attendanceSummaryCards.innerHTML = [
    ["Planeación", summary.planningMembersPresent, "planificacion"],
    ["Alcance",    summary.reachTotal,              "alcance"],
    ["Culto",      summary.sundayTotal,             "culto"],
    ["Amigos",     summary.visitors,               "alcance"],
    ["Niños",      currentKids.filter((kid) => String(kid.name || "").trim()).length, "alcance"],
  ].map(([label, value, stage]) => `
    <article class="summary-card summary-card-mini" data-summary-stage="${stage}">
      <span class="summary-label">${escapeHtml(label)}</span>
      <strong class="summary-value">${escapeHtml(String(value))}</strong>
    </article>
  `).join("");

  const absentMembers = currentMemberAttendance.filter((entry) => entry.status === "absent" || entry.status === "justified");
  absentMemberPills.innerHTML = absentMembers.length
    ? absentMembers.map((entry) => `<span class="pill">${escapeHtml(entry.name)} · ${entry.status === "justified" ? "Justificado" : "Faltó"}</span>`).join("")
    : '<span class="member-admin-caption">Sin faltas registradas.</span>';

  syncDerivedMetricFields();
}

function renderAttendanceTable() {
  const eventInfo = getRcmWeekInfo(weekField.value);
  const isEventWeek = eventInfo?.isEventWeek && eventInfo?.event;
  const eventName = isEventWeek ? eventInfo.event : null;
  const eventKey = isEventWeek ? eventInfo.rcmKey : null;
  const totalCols = isEventWeek ? 8 : 7;

  if (!currentMemberAttendance.length) {
    const selectedCell = findCellByNumber(cellField.value);
    const emptyMessage = selectedCell
      ? "Esta célula no tiene miembros asignados. Agrégalos en Catálogos o cambia a otra célula."
      : "Selecciona una célula para marcar asistencia.";
    attendanceTableBody.innerHTML = `<tr><td colspan="${totalCols}" class="empty-state">${escapeHtml(emptyMessage)}</td></tr>`;
    renderAttendanceSummary();
    return;
  }

  // sync header
  const memberEventColHeader = document.getElementById("member-event-col-header");
  if (memberEventColHeader) {
    memberEventColHeader.hidden = !isEventWeek;
    if (isEventWeek) memberEventColHeader.textContent = eventName;
  }

  // Etapa actual determina cuál de los tres sub-estados se muestra/edita
  // en la columna "Estado semanal". Fuera de Planeación/Alcance/Culto
  // se usa el campo derivado `status`.
  const stageStatusField = STAGE_STATUS_FIELDS[currentStage] || null;

  attendanceTableBody.innerHTML = currentMemberAttendance.map((entry, index) => {
    const stageStatus = stageStatusField ? (entry[stageStatusField] || "pending") : (entry.status || "pending");
    const attended = eventKey && entry.rcmProgress?.[eventKey];
    const eventCell = isEventWeek
      ? `<td data-label="${escapeHtml(eventName)}" class="checkbox-cell event-col">
           <input
             data-attendance-index="${index}"
             data-attendance-field="rcmEventAttended"
             data-rcm-key="${escapeHtml(eventKey)}"
             data-person-id="${escapeHtml(String(entry.personId || ''))}"
             type="checkbox"
             ${attended ? " checked" : ""}
             title="${attended ? 'Asistió el ' + escapeHtml(attended) : 'Sin registro de ' + escapeHtml(eventName)}"
           >
         </td>`
      : "";
    return `
    <tr>
      <td data-label="Miembro">
        <strong>${escapeHtml(entry.name)}</strong><br>
        <span class="member-admin-caption">${escapeHtml(formatRole(entry.role || "member"))}</span>
        ${isEventWeek ? renderRcmMiniProgress(entry.rcmProgress) : ""}
      </td>
      <td data-label="Estado">
        <select data-attendance-index="${index}" data-attendance-field="status">
          <option value="pending"${stageStatus === "pending" ? " selected" : ""}>Sin marcar</option>
          <option value="present"${stageStatus === "present" ? " selected" : ""}>Presente</option>
          <option value="absent"${stageStatus === "absent" ? " selected" : ""}>Faltó</option>
          <option value="justified"${stageStatus === "justified" ? " selected" : ""}>Justificado</option>
          <option value="service"${stageStatus === "service" ? " selected" : ""}>Sirviendo</option>
        </select>
      </td>
      <td data-label="Planeación" class="checkbox-cell"><input data-attendance-index="${index}" data-attendance-field="planningAttended" type="checkbox"${entry.planningAttended ? " checked" : ""}></td>
      <td data-label="Alcance" class="checkbox-cell"><input data-attendance-index="${index}" data-attendance-field="reachAttended" type="checkbox"${entry.reachAttended ? " checked" : ""}></td>
      <td data-label="Privilegios" class="checkbox-cell"><input data-attendance-index="${index}" data-attendance-field="reachPrivileged" type="checkbox"${entry.reachPrivileged ? " checked" : ""}${!entry.reachAttended ? " disabled" : ""}></td>
      <td data-label="Culto" class="checkbox-cell"><input data-attendance-index="${index}" data-attendance-field="sundayAttended" type="checkbox"${entry.sundayAttended ? " checked" : ""}></td>
      ${eventCell}
      <td data-label="Observación">
        <input data-attendance-index="${index}" data-attendance-field="note" type="text" value="${escapeHtml(entry.note)}" placeholder="Observación breve">
      </td>
    </tr>
  `;
  }).join("");
  renderAttendanceSummary();
}

function renderRcmMiniProgress(rcmProgress) {
  const events = [
    { key: "levantate",      label: "Lev" },
    { key: "restauracion",   label: "Res" },
    { key: "reencuentro",    label: "Ree" },
    { key: "cielosAbiertos", label: "CA"  },
  ];
  const pills = events.map(({ key, label }) => {
    const done = rcmProgress?.[key];
    return `<span class="rcm-mini-pill${done ? " done" : ""}" title="${done ? label + ' · ' + done : label + ' pendiente'}">${escapeHtml(label)}</span>`;
  }).join("");
  return `<span class="rcm-mini-progress">${pills}</span>`;
}

function renderRcmProgressBadges(rcmProgress) {
  const events = [
    { key: "levantate",      label: "Levántate",       phase: "ganar"      },
    { key: "restauracion",   label: "Restauración",    phase: "consolidar" },
    { key: "reencuentro",    label: "Reencuentro",     phase: "consolidar" },
    { key: "cielosAbiertos", label: "Cielos Abiertos", phase: "discipular" },
  ];
  const badges = events
    .filter(({ key }) => rcmProgress?.[key])
    .map(({ key, label, phase }) =>
      `<span class="rcm-progress-badge phase-badge-${phase}" title="${escapeHtml(label + ' · ' + (rcmProgress[key] || ''))}">★ ${escapeHtml(label)}</span>`
    ).join("");
  if (!badges) return "";
  return `<span class="rcm-progress-badges">${badges}</span>`;
}

// ── RCM Profile Panel ────────────────────────────────────────────────────────
function renderPeopleRcmPanel(person) {
  if (!peopleRcmPanel) return;
  if (!person?.id || person.role === "kid") {
    peopleRcmPanel.innerHTML = "<p class='empty-state'>Sin seguimiento RCM para este perfil.</p>";
    return;
  }

  const rcm = person.rcmProgress || {};
  const sections = ["ganar", "consolidar", "discipular", "escuelas"];
  const sectionLabels = { ganar: "Fase Ganar", consolidar: "Fase Consolidar", discipular: "Fase Discipular", escuelas: "Escuelas" };
  const sectionPhase = { ganar: "ganar", consolidar: "consolidar", discipular: "discipular", escuelas: "cierre" };

  // Helper: parse value into state for this milestone
  function rcmParseValue(val, type) {
    if (!val) return { state: "none" };
    const s = String(val);
    if (type === "clase") {
      if (s.startsWith("en_curso:")) return { state: "en_curso", date: s.slice(9) };
      return { state: "completado", date: s };
    }
    return { state: "hecho", date: s };
  }

  // Progress: count completado + en_curso as "active" milestones
  const activeCount = RCM_MILESTONES.filter(m => rcm[m.key]).length;
  const totalCount = RCM_MILESTONES.length;
  const pct = Math.round((activeCount / totalCount) * 100);

  const sectionHtml = sections.map(sec => {
    const milestones = RCM_MILESTONES.filter(m => m.section === sec);
    const items = milestones.map(m => {
      const { state, date } = rcmParseValue(rcm[m.key], m.type);
      let rowClass = "", checkHtml = "", pressedAttr = "", titleText = "", extraHtml = "";

      if (m.type === "clase") {
        if (state === "none") {
          checkHtml = `<span class="rcm-milestone-check"></span>`;
          pressedAttr = `aria-pressed="false"`;
          titleText = "Clic: marcar En curso";
        } else if (state === "en_curso") {
          rowClass = " is-en-curso";
          checkHtml = `<span class="rcm-milestone-check is-en-curso">↻</span>`;
          pressedAttr = `aria-pressed="mixed"`;
          titleText = `En curso — clic para marcar Completado`;
          extraHtml = `<span class="rcm-date-wrap"><span class="rcm-date-label">Inicio</span><input type="date" class="rcm-date-input" data-rcm-person-id="${person.id}" data-rcm-key="${m.key}" data-rcm-state="en_curso" value="${date}"></span>`;
        } else {
          rowClass = " is-done";
          checkHtml = `<span class="rcm-milestone-check">✓</span>`;
          pressedAttr = `aria-pressed="true"`;
          titleText = `Completado — clic para quitar`;
          extraHtml = `<span class="rcm-date-wrap"><span class="rcm-date-label">Fecha</span><input type="date" class="rcm-date-input" data-rcm-person-id="${person.id}" data-rcm-key="${m.key}" data-rcm-state="done" value="${date}"></span>`;
        }
      } else {
        if (state === "none") {
          checkHtml = `<span class="rcm-milestone-check"></span>`;
          pressedAttr = `aria-pressed="false"`;
          titleText = "Marcar como realizado";
        } else {
          rowClass = " is-done";
          checkHtml = `<span class="rcm-milestone-check">✓</span>`;
          pressedAttr = `aria-pressed="true"`;
          titleText = `Completado — clic para quitar`;
          extraHtml = `<span class="rcm-date-wrap"><span class="rcm-date-label">Fecha</span><input type="date" class="rcm-date-input" data-rcm-person-id="${person.id}" data-rcm-key="${m.key}" data-rcm-state="done" value="${date}"></span>`;
        }
      }

      return `
        <div class="rcm-milestone-row${rowClass}">
          <button type="button" class="rcm-milestone-toggle"
            data-rcm-person-id="${person.id}"
            data-rcm-key="${m.key}"
            ${pressedAttr}
            title="${titleText}">
            ${checkHtml}
            <span class="rcm-milestone-label">${escapeHtml(m.label)}</span>
          </button>
          ${extraHtml}
        </div>`;
    }).join("");
    return `
      <div class="rcm-panel-section">
        <p class="rcm-panel-section-title phase-badge-${sectionPhase[sec]}">${sectionLabels[sec]}</p>
        ${items}
      </div>`;
  }).join("");

  peopleRcmPanel.innerHTML = `
    <div class="rcm-panel-progress" style="margin-bottom:12px">
      <span class="rcm-panel-pct">${activeCount}/${totalCount}</span>
      <div class="rcm-panel-bar"><div class="rcm-panel-bar-fill" style="width:${pct}%"></div></div>
    </div>
    <div class="rcm-panel-body">${sectionHtml}</div>`;
}

function renderVisitorTable() {
  const eventInfo = getRcmWeekInfo(weekField.value);
  const isEventWeek = eventInfo?.isEventWeek && eventInfo?.event;
  const eventName = isEventWeek ? eventInfo.event : null;
  const totalCols = isEventWeek ? 11 : 10;

  if (!currentVisitors.length) {
    visitorTableBody.innerHTML = `<tr><td colspan="${totalCols}" class="empty-state">Todavía no hay visitas registradas para esta semana.</td></tr>`;
    renderAttendanceSummary();
    return;
  }

  const invitedByPeople = getInvitedByPeople();

  visitorTableBody.innerHTML = currentVisitors.map((visitor, index) => `
    <tr>
      <td data-label="Nombre"><input data-visitor-index="${index}" data-visitor-field="name" type="text" value="${escapeHtml(visitor.name)}" placeholder="Nombre"></td>
      <td data-label="Invitó"><select data-visitor-index="${index}" data-visitor-field="invitedBy">${[
        '<option value="">— Quién invitó —</option>',
        ...invitedByPeople.map(p => `<option value="${escapeHtml(p.name)}"${visitor.invitedBy === p.name ? " selected" : ""}>${escapeHtml(p.name)}</option>`)
      ].join("")}</select></td>
      <td data-label="Alcance" class="checkbox-cell"><input data-visitor-index="${index}" data-visitor-field="reachAttended" type="checkbox"${visitor.reachAttended ? " checked" : ""}></td>
      <td data-label="Culto" class="checkbox-cell"><input data-visitor-index="${index}" data-visitor-field="sundayAttended" type="checkbox"${visitor.sundayAttended ? " checked" : ""}></td>
      <td data-label="Primera vez" class="checkbox-cell"><input data-visitor-index="${index}" data-visitor-field="firstVisit" type="checkbox"${visitor.firstVisit ? " checked" : ""}></td>
      <td data-label="Conversión" class="checkbox-cell"><input data-visitor-index="${index}" data-visitor-field="converted" type="checkbox"${visitor.converted ? " checked" : ""}></td>
      ${isEventWeek ? `<td data-label="${escapeHtml(eventName)}" class="checkbox-cell event-col"><input data-visitor-index="${index}" data-visitor-field="eventAttended" type="checkbox"${visitor.eventAttended ? " checked" : ""}></td>` : ""}
      <td data-label="Contactado" class="checkbox-cell"><input data-visitor-index="${index}" data-visitor-field="contacted" type="checkbox"${visitor.contacted ? " checked" : ""}></td>
      <td data-label="Teléfono"><input data-visitor-index="${index}" data-visitor-field="phone" type="text" value="${escapeHtml(visitor.phone)}" placeholder="Teléfono"></td>
      <td data-label="Observación"><input data-visitor-index="${index}" data-visitor-field="note" type="text" value="${escapeHtml(visitor.note)}" placeholder="Observación"></td>
      <td data-label="Acciones"><button type="button" class="danger" data-action="remove-visitor" data-visitor-index="${index}">Quitar</button></td>
    </tr>
  `).join("");
  renderAttendanceSummary();
}

function renderKidsTable() {
  if (!currentKids.length) {
    kidsTableBody.innerHTML = '<tr><td colspan="7" class="empty-state">No hay niños cargados para esta célula.</td></tr>';
    renderAttendanceSummary();
    return;
  }

  kidsTableBody.innerHTML = currentKids.map((kid, index) => {
    const isCatalogKid = kid.source === "catalog";
    return `
      <tr>
        <td data-label="Niño"><input data-kid-index="${index}" data-kid-field="name" type="text" value="${escapeHtml(kid.name)}" placeholder="Nombre"${isCatalogKid ? " disabled" : ""}></td>
        <td data-label="Responsable"><input data-kid-index="${index}" data-kid-field="guardianName" type="text" value="${escapeHtml(kid.guardianName)}" placeholder="Responsable"></td>
        <td data-label="Origen">${escapeHtml(isCatalogKid ? "Célula" : "Visita")}</td>
        <td data-label="Alcance" class="checkbox-cell"><input data-kid-index="${index}" data-kid-field="reachAttended" type="checkbox"${kid.reachAttended ? " checked" : ""}></td>
        <td data-label="Culto" class="checkbox-cell"><input data-kid-index="${index}" data-kid-field="sundayAttended" type="checkbox"${kid.sundayAttended ? " checked" : ""}></td>
        <td data-label="Observación"><input data-kid-index="${index}" data-kid-field="note" type="text" value="${escapeHtml(kid.note)}" placeholder="Observación"></td>
        <td data-label="Acciones">${isCatalogKid ? '<span class="member-admin-caption">Precargado</span>' : `<button type="button" class="danger" data-action="remove-kid" data-kid-index="${index}">Quitar</button>`}</td>
      </tr>
    `;
  }).join("");
  renderAttendanceSummary();
}

function renderBaptismTable() {
  const captureStatus = getBaptismCaptureStatus();
  const baptisms = normalizeBaptisms(currentBaptisms);
  const registrationMessage = getBaptismRegistrationMessage(captureStatus);
  addBaptismButton.disabled = false;
  addBaptismButton.title = captureStatus.isAllowed ? "" : registrationMessage;

  if (!baptisms.length) {
    const emptyMessage = captureStatus.isAllowed
      ? "Todavia no hay bautismos registrados para este cierre."
      : registrationMessage;
    baptismTableBody.innerHTML = `<tr><td colspan="6" class="empty-state">${escapeHtml(emptyMessage)}</td></tr>`;
    if (baptismSummaryPills) {
      baptismSummaryPills.innerHTML = `<span class="member-admin-caption">${escapeHtml(captureStatus.isAllowed ? "Sin bautismos registrados en este cierre." : registrationMessage)}</span>`;
    }
    renderAttendanceSummary();
    return;
  }

  baptismTableBody.innerHTML = baptisms.map((entry, index) => `
    <tr>
      <td data-label="Persona"><input data-baptism-index="${index}" data-baptism-field="name" type="text" value="${escapeHtml(entry.name)}" placeholder="Nombre completo"></td>
      <td data-label="Fecha"><input data-baptism-index="${index}" data-baptism-field="baptismDate" type="date" value="${escapeHtml(entry.baptismDate)}"></td>
      <td data-label="Origen">${escapeHtml(formatBaptismSource(entry.source))}</td>
      <td data-label="Agregar como miembro al guardar" class="checkbox-cell"><input data-baptism-index="${index}" data-baptism-field="promoteToMember" type="checkbox" title="Se agregará a los miembros de la célula al guardar el reporte"${entry.promoteToMember ? " checked" : ""}></td>
      <td data-label="Observación"><input data-baptism-index="${index}" data-baptism-field="note" type="text" value="${escapeHtml(entry.note)}" placeholder="Observacion"></td>
      <td data-label="Acciones"><button type="button" class="danger" data-action="remove-baptism" data-baptism-index="${index}">Quitar</button></td>
    </tr>
  `).join("");

  if (baptismSummaryPills) {
    const items = baptisms
      .filter((entry) => entry.name)
      .map((entry) => `<span class="pill">${escapeHtml(entry.name)}${entry.baptismDate ? ` · ${escapeHtml(formatShortDate(entry.baptismDate))}` : ""}</span>`)
      .join("");
    baptismSummaryPills.innerHTML = `${items || '<span class="member-admin-caption">Sin bautismos registrados en este cierre.</span>'}<span class="member-admin-caption">${escapeHtml(registrationMessage)}</span>`;
  }
  renderAttendanceSummary();
}

function applyWeeklyCollectionsForCell(cell, savedData = null) {
  currentMemberAttendance = buildDefaultMemberAttendance(cell, savedData?.memberAttendance);
  currentVisitors = normalizeVisitors(savedData?.visitors);
  currentKids = buildDefaultKidsAttendance(cell, savedData?.kids);
  currentBaptisms = normalizeBaptisms(savedData?.baptisms);
  resetVisitorQuickForm();
  renderAttendanceTable();
  renderVisitorTable();
  renderKidsTable();
  renderBaptismTable();
  toggleHelperButtons();
}

function resetVisitorQuickForm() {
  if (!visitorQuickForm) {
    return;
  }
  if (visitorQuickHistory instanceof HTMLSelectElement) {
    visitorQuickHistory.value = "";
  }
  if (visitorQuickName instanceof HTMLInputElement) {
    visitorQuickName.value = "";
  }
  if (visitorQuickInvitedBy instanceof HTMLSelectElement) {
    visitorQuickInvitedBy.value = leaderField.value || assistantField.value || "";
  }
  if (visitorQuickReach instanceof HTMLInputElement) {
    visitorQuickReach.checked = true;
  }
  if (visitorQuickSunday instanceof HTMLInputElement) {
    visitorQuickSunday.checked = false;
  }
  if (visitorQuickFirstVisit instanceof HTMLInputElement) {
    visitorQuickFirstVisit.checked = true;
  }
  if (visitorQuickConverted instanceof HTMLInputElement) {
    visitorQuickConverted.checked = false;
  }
}

function toggleHelperButtons() {
  const memberButtons = [
    fillPlanningMembersButton,
    fillReachMembersButton,
    fillReachPrivilegesButton,
    copyPlanningToReachButton,
    copyReachToSundayButton,
    markAllPrivilegesButton,
    syncStatusFromActivitiesButton,
    clearMemberActivitiesButton,
  ];
  const visitorButtons = [
    copyVisitorReachToSundayButton,
    markVisitorFirstVisitButton,
    clearVisitorActivitiesButton,
  ];
  const kidButtons = [
    copyKidReachToSundayButton,
    clearKidActivitiesButton,
  ];

  memberButtons.forEach((button) => {
    if (button) {
      button.disabled = currentMemberAttendance.length === 0;
    }
  });

  visitorButtons.forEach((button) => {
    if (button) {
      button.disabled = currentVisitors.length === 0;
    }
  });

  kidButtons.forEach((button) => {
    if (button) {
      button.disabled = currentKids.length === 0;
    }
  });
}

function syncMemberWeeklyStatus(entry) {
  // Deriva cada sub-estado desde su checkbox correspondiente, sin pisar
  // valores manuales "fuertes" (absent/justified/service) que el líder
  // ya haya seleccionado a propósito en esa etapa.
  const pairs = [
    ["planningStatus", "planningAttended"],
    ["reachStatus",    "reachAttended"],
    ["sundayStatus",   "sundayAttended"],
  ];
  pairs.forEach(([statusField, attendedField]) => {
    const cur = entry[statusField];
    if (cur === "absent" || cur === "justified" || cur === "service") return;
    entry[statusField] = entry[attendedField] ? "present" : "pending";
  });
  entry.status = deriveOverallStatus(entry);
}

function updateMemberActivities(mutator) {
  if (!currentMemberAttendance.length) {
    return;
  }
  currentMemberAttendance.forEach((entry) => {
    mutator(entry);
    syncMemberWeeklyStatus(entry);
  });
  renderAttendanceTable();
}

function updateVisitors(mutator) {
  if (!currentVisitors.length) {
    return;
  }
  currentVisitors.forEach(mutator);
  renderVisitorTable();
}

function updateKids(mutator) {
  if (!currentKids.length) {
    return;
  }
  currentKids.forEach(mutator);
  renderKidsTable();
}

function handleFillPlanningMembers() {
  updateMemberActivities((entry) => {
    entry.planningAttended = true;
  });
}

function handleCopyPlanningToReach() {
  updateMemberActivities((entry) => {
    entry.reachAttended = Boolean(entry.planningAttended);
  });
}

function handleFillReachMembers() {
  // Marca a TODOS los miembros con asistencia a la reunión de Alcance.
  updateMemberActivities((entry) => {
    entry.reachAttended = true;
  });
}

function handleFillReachPrivileges() {
  // Marca a TODOS los miembros con asistencia + privilegios en Alcance.
  updateMemberActivities((entry) => {
    entry.reachAttended = true;
    entry.reachPrivileged = true;
  });
}

function handleCopyReachToSunday() {
  updateMemberActivities((entry) => {
    entry.sundayAttended = Boolean(entry.reachAttended);
  });
}

function handleMarkAllPrivileges() {
  // Marca Privilegios=true a todos los miembros que asistieron al Alcance.
  // Si alguien no fue al Alcance, no se le asignan privilegios (la columna
  // está deshabilitada en ese caso).
  updateMemberActivities((entry) => {
    if (entry.reachAttended) entry.reachPrivileged = true;
  });
}

function handleSyncStatusFromActivities() {
  updateMemberActivities((entry) => {
    entry.planningStatus = entry.planningAttended ? "present" : "pending";
    entry.reachStatus    = entry.reachAttended    ? "present" : "pending";
    entry.sundayStatus   = entry.sundayAttended   ? "present" : "pending";
    entry.status = deriveOverallStatus(entry);
  });
}

function handleClearMemberActivities() {
  // Limpia únicamente la etapa activa (Planeación / Alcance / Culto).
  // Si estamos fuera de esas etapas, no hacemos nada.
  const stageField = STAGE_STATUS_FIELDS[currentStage];
  if (!stageField) return;
  const attendedField = {
    planningStatus: "planningAttended",
    reachStatus:    "reachAttended",
    sundayStatus:   "sundayAttended",
  }[stageField];
  updateMemberActivities((entry) => {
    entry[attendedField] = false;
    // En Alcance, limpiar también los privilegios (dependen de reachAttended).
    if (attendedField === "reachAttended") {
      entry.reachPrivileged = false;
    }
    if (entry[stageField] === "present") entry[stageField] = "pending";
    entry.status = deriveOverallStatus(entry);
  });
}

function handleCopyVisitorReachToSunday() {
  updateVisitors((visitor) => {
    visitor.sundayAttended = Boolean(visitor.reachAttended);
  });
}

function handleMarkVisitorFirstVisit() {
  updateVisitors((visitor) => {
    visitor.firstVisit = true;
  });
}

function handleClearVisitorActivities() {
  updateVisitors((visitor) => {
    visitor.reachAttended = false;
    visitor.sundayAttended = false;
  });
}

function handleCopyKidReachToSunday() {
  updateKids((kid) => {
    kid.sundayAttended = Boolean(kid.reachAttended);
  });
}

function handleClearKidActivities() {
  updateKids((kid) => {
    kid.reachAttended = false;
    kid.sundayAttended = false;
  });
}

function renderReports(reports) {
  const cyclesList = document.querySelector("#report-cycles-list");

  // Supervisores y admins sin célula propia → redirigir a Seguimiento
  if (currentUser && (currentUser.isAdmin || currentUser.isSupervisor) && !currentUser.assignedCellNumber) {
    reportCount.textContent = "—";
    reportTableBody.innerHTML = "";
    cyclesList.innerHTML = `<p class="empty-state" style="padding:16px 0">
      El historial de tus células está en
      <button type="button" class="link-inline" id="go-seguimiento-link">Seguimiento</button>.
    </p>`;
    document.getElementById("go-seguimiento-link")?.addEventListener("click", () => showView("seguimiento"), { once: true });
    return;
  }

  // Filtrar a la célula propia del usuario
  if (currentUser?.assignedCellNumber) {
    reports = reports.filter(r =>
      String(r.cellNumber || r.formData?.cellNumber || "") === String(currentUser.assignedCellNumber)
    );
  }

  // Aplicar preferencia de cuatrimestre
  if (historyScope === "current") {
    const cycleStartStr = appSettings.cycle_start_date;
    if (cycleStartStr) {
      reports = reports.filter(r => {
        const rDate = String(r.reportDate || r.formData?.reportDate || "");
        return rDate >= cycleStartStr;
      });
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const qStart = month <= 3 ? 0 : month <= 7 ? 4 : 8;
      reports = reports.filter(r => {
        const rDate = String(r.reportDate || r.formData?.reportDate || "");
        const rYear = Number(rDate.slice(0, 4));
        const rMonth = Number(rDate.slice(5, 7)) - 1;
        return rYear === year && rMonth >= qStart && rMonth < qStart + 4;
      });
    }
  }

  reportCount.textContent = String(reports.length);

  // Keep hidden tbody in sync for edit/delete click handlers
  reportTableBody.innerHTML = reports.map(r =>
    `<tr><td><button type="button" data-action="edit-report" data-id="${r.id}"></button></td>
         <td><button type="button" class="danger" data-action="delete-report" data-id="${r.id}"></button></td></tr>`
  ).join("");

  if (!reports.length) {
    cyclesList.innerHTML = '<p class="empty-state" style="padding:16px 0">Todavía no hay reportes.</p>';
    return;
  }

  const quarterLabel = q => q === "1" ? "Ene – Abr" : q === "2" ? "May – Ago" : "Sep – Dic";
  const quarterName  = q => q === "1" ? "1er Cuatrimestre" : q === "2" ? "2do Cuatrimestre" : "3er Cuatrimestre";
  const phaseColors  = { GANAR: "ganar", CONSOLIDAR: "consolidar", DISCIPULAR: "discipular", CIERRE: "cierre" };

  const groups = {};
  reports.forEach(r => {
    const cell = String(r.cellNumber || "");
    const date = String(r.reportDate || r.formData?.reportDate || "");
    const year = date.slice(0, 4) || "?";
    const month = Number(date.slice(5, 7));
    const quarter = month <= 4 ? "1" : month <= 8 ? "2" : "3";
    if (!groups[cell]) groups[cell] = {};
    if (!groups[cell][year]) groups[cell][year] = {};
    if (!groups[cell][year][quarter]) groups[cell][year][quarter] = [];
    groups[cell][year][quarter].push(r);
  });

  const cellNumbers = Object.keys(groups).sort((a, b) => Number(a) - Number(b));

  cyclesList.innerHTML = cellNumbers.map(cell => {
    const years = Object.keys(groups[cell]).sort((a, b) => b - a);
    return years.map(year => {
      const quarters = Object.keys(groups[cell][year]).sort((a, b) => b - a);
      return quarters.map(quarter => {
        const reps = groups[cell][year][quarter];
        const byWeek = {};
        reps.forEach(r => { byWeek[String(r.week)] = r; });
        const totalDone = Object.values(byWeek).filter(r => !(r.formData?._draft === true || r.formData?._draft === "true")).length;

        const totalWeeks = getRcmTotalWeeks();
        const chips = Array.from({ length: totalWeeks }, (_, i) => {
          const w = String(i + 1);
          const info = getRcmWeekInfo(w);
          const rep = byWeek[w];
          const phaseKey = info ? phaseColors[info.phase] || "ganar" : "ganar";
          const verb = info?.verb || (Number(w) === totalWeeks ? "CIERRE" : "");
          const isEvent = info?.isEventWeek;
          if (rep) {
            const isDraft = rep.formData?._draft === true || rep.formData?._draft === "true";
            const stateClass = isDraft ? "is-draft" : "is-done";
            const stateTitle = isDraft ? "borrador en progreso" : escapeHtml(formatShortDate(rep.reportDate));
            // Siempre abrir modal preview; el botón "Editar" dentro del modal
            // decide si puede editarse (semana actual o gracia).
            return `<button type="button" class="cycle-week-chip ${stateClass} phase-chip-${phaseKey}"
              data-action="view-report" data-id="${rep.id}" title="Sem ${w} · ${verb} — ${stateTitle}">
              <span class="cycle-chip-num">${w}</span>
              <span class="cycle-chip-verb">${escapeHtml(verb)}</span>
              ${isEvent ? '<span class="cycle-chip-star">★</span>' : ''}
            </button>`;
          }
          return `<button type="button" class="cycle-week-chip is-pending" disabled
            title="Sem ${w} · ${verb} — pendiente">
            <span class="cycle-chip-num">${w}</span>
            <span class="cycle-chip-verb">${escapeHtml(verb)}</span>
            ${isEvent ? '<span class="cycle-chip-star">★</span>' : ''}
          </button>`;
        }).join("");

        const progressPct = Math.round((totalDone / totalWeeks) * 100);
        return `
          <div class="cycle-card" data-cell-number="${escapeHtml(String(cell))}">
            <div class="cycle-card-head">
              <div class="cycle-card-title">
                <span class="cycle-cell-badge">Célula ${escapeHtml(cell)}</span>
                <strong>${quarterName(quarter)}</strong>
                <span class="cycle-year-tag">${escapeHtml(year)}</span>
                <span class="cycle-range-tag">${quarterLabel(quarter)}</span>
              </div>
              <div class="cycle-card-meta">
                <span class="cycle-progress-text">${totalDone} / ${totalWeeks} semanas</span>
                <div class="cycle-progress-bar"><div class="cycle-progress-fill" style="width:${progressPct}%"></div></div>
              </div>
            </div>
            <div class="cycle-chips-grid">${chips}</div>
          </div>`;
      }).join("");
    }).join("");
  }).join("");
}

// ── Seguimiento: vista de células para supervisor / coordinador ────────────
let seguimientoScope = "current";

function renderSeguimiento(reports) {
  const cyclesList = document.querySelector("#seguimiento-cycles-list");
  const countChip  = document.querySelector("#seg-report-count");
  if (!cyclesList) return;

  // Filtrar por alcance del usuario
  if (currentUser && !currentUser.isAdmin) {
    if (currentUser.isSupervisor && currentUser.supervisedSector) {
      const sectorCells = new Set(
        (catalogs.cells || [])
          .filter(c => c.sector === currentUser.supervisedSector)
          .map(c => String(c.cellNumber))
      );
      reports = reports.filter(r => sectorCells.has(String(r.cellNumber || r.formData?.cellNumber || "")));
    }
  }

  // Filtrar por cuatrimestre
  if (seguimientoScope === "current") {
    const cycleStartStr = appSettings.cycle_start_date;
    if (cycleStartStr) {
      reports = reports.filter(r => {
        const rDate = String(r.reportDate || r.formData?.reportDate || "");
        return rDate >= cycleStartStr;
      });
    } else {
      const now = new Date();
      const year = now.getFullYear();
      const month = now.getMonth();
      const qStart = month <= 3 ? 0 : month <= 7 ? 4 : 8;
      reports = reports.filter(r => {
        const rDate = String(r.reportDate || r.formData?.reportDate || "");
        const rYear = Number(rDate.slice(0, 4));
        const rMonth = Number(rDate.slice(5, 7)) - 1;
        return rYear === year && rMonth >= qStart && rMonth < qStart + 4;
      });
    }
  }

  if (countChip) countChip.textContent = String(reports.length);

  const quarterLabel = q => q === "1" ? "Ene – Abr" : q === "2" ? "May – Ago" : "Sep – Dic";
  const quarterName  = q => q === "1" ? "1er Cuatrimestre" : q === "2" ? "2do Cuatrimestre" : "3er Cuatrimestre";
  const phaseColors  = { GANAR: "ganar", CONSOLIDAR: "consolidar", DISCIPULAR: "discipular", CIERRE: "cierre" };

  const groups = {};
  reports.forEach(r => {
    const cell = String(r.cellNumber || "");
    const date = String(r.reportDate || r.formData?.reportDate || "");
    const year = date.slice(0, 4) || "?";
    const month = Number(date.slice(5, 7));
    const quarter = month <= 4 ? "1" : month <= 8 ? "2" : "3";
    if (!groups[cell]) groups[cell] = {};
    if (!groups[cell][year]) groups[cell][year] = {};
    if (!groups[cell][year][quarter]) groups[cell][year][quarter] = [];
    groups[cell][year][quarter].push(r);
  });

  // También mostrar células sin reporte si es cuatrimestre actual
  if (seguimientoScope === "current") {
    const myCells = currentUser?.isAdmin
      ? (catalogs.cells || [])
      : (catalogs.cells || []).filter(c => c.sector === currentUser?.supervisedSector);
    const currentYear = String(new Date().getFullYear());
    const currentMonth = new Date().getMonth();
    const currentQ = currentMonth <= 3 ? "1" : currentMonth <= 7 ? "2" : "3";
    myCells.forEach(c => {
      const cn = String(c.cellNumber);
      if (!groups[cn]) {
        groups[cn] = { [currentYear]: { [currentQ]: [] } };
      } else if (!groups[cn][currentYear]) {
        groups[cn][currentYear] = { [currentQ]: [] };
      } else if (!groups[cn][currentYear][currentQ]) {
        groups[cn][currentYear][currentQ] = [];
      }
    });
  }

  const cellNumbers = Object.keys(groups).sort((a, b) => Number(a) - Number(b));

  if (!cellNumbers.length) {
    cyclesList.innerHTML = '<p class="empty-state" style="padding:16px 0">No hay células en tu alcance.</p>';
    return;
  }

  cyclesList.innerHTML = cellNumbers.map(cell => {
    const cellInfo = (catalogs.cells || []).find(c => String(c.cellNumber) === cell);
    const leaderName = cellInfo
      ? ((catalogs.people || []).find(p => String(p.id) === String(cellInfo.leaderPersonId))?.name || "—")
      : "—";

    const years = Object.keys(groups[cell]).sort((a, b) => b - a);
    return years.map(year => {
      const quarters = Object.keys(groups[cell][year]).sort((a, b) => b - a);
      return quarters.map(quarter => {
        const reps = groups[cell][year][quarter];
        const byWeek = {};
        reps.forEach(r => { byWeek[String(r.week)] = r; });
        const totalDone = Object.values(byWeek).filter(r => !(r.formData?._draft === true || r.formData?._draft === "true")).length;

        const totalWeeks = getRcmTotalWeeks();
        const chips = Array.from({ length: totalWeeks }, (_, i) => {
          const w = String(i + 1);
          const info = getRcmWeekInfo(w);
          const rep = byWeek[w];
          const phaseKey = info ? phaseColors[info.phase] || "ganar" : "ganar";
          const verb = info?.verb || (Number(w) === totalWeeks ? "CIERRE" : "");
          const isEvent = info?.isEventWeek;
          if (rep) {
            const isDraft = rep.formData?._draft === true || rep.formData?._draft === "true";
            const stateClass = isDraft ? "is-draft" : "is-done";
            const stateTitle = isDraft ? "borrador en progreso" : escapeHtml(formatShortDate(rep.reportDate));
            return `<button type="button" class="cycle-week-chip ${stateClass} phase-chip-${phaseKey}"
              data-action="view-report" data-id="${rep.id}" title="Sem ${w} · ${verb} — ${stateTitle}">
              <span class="cycle-chip-num">${w}</span>
              <span class="cycle-chip-verb">${escapeHtml(verb)}</span>
              ${isEvent ? '<span class="cycle-chip-star">★</span>' : ''}
            </button>`;
          }
          // Pending chip: only allow capture if week is still open
          const realWeek = getQuarterWeekNumber();
          const graceHours = parseInt(appSettings?.report_grace_hours ?? "0", 10) || 0;
          const inGrace = graceHours > 0 && (() => {
            const wsd = parseInt(appSettings?.week_start_day ?? "0", 10);
            const now = new Date();
            return now.getDay() === wsd && (now.getHours() + now.getMinutes() / 60) < graceHours;
          })();
          const wNum = Number(w);
          const minOpen = inGrace ? Math.max(1, realWeek - 1) : realWeek;
          const weekOpen = wNum >= minOpen && wNum <= realWeek;
          if (weekOpen) {
            return `<button type="button" class="cycle-week-chip is-pending is-capturable"
              data-action="new-report-for-cell" data-cell="${escapeHtml(cell)}" data-week="${w}"
              title="Sem ${w} · ${verb} — sin reporte, clic para capturar">
              <span class="cycle-chip-num">${w}</span>
              <span class="cycle-chip-verb">${escapeHtml(verb)}</span>
              ${isEvent ? '<span class="cycle-chip-star">★</span>' : ''}
            </button>`;
          }
          return `<button type="button" class="cycle-week-chip is-pending" disabled
            title="Sem ${w} · ${verb} — cerrada">
            <span class="cycle-chip-num">${w}</span>
            <span class="cycle-chip-verb">${escapeHtml(verb)}</span>
            ${isEvent ? '<span class="cycle-chip-star">★</span>' : ''}
          </button>`;
        }).join("");
        const baptismCount = reps.reduce((s, r) => s + (Array.isArray(r.formData?.baptisms) ? r.formData.baptisms.length : 0), 0);
        const baptismChip  = baptismCount > 0
          ? `<span class="cycle-baptism-chip" title="Bautismos en este cuatrimestre">⬡ ${baptismCount} bautismo${baptismCount !== 1 ? "s" : ""}</span>`
          : "";
        const progressPct = Math.round((totalDone / totalWeeks) * 100);
        return `
          <div class="cycle-card" data-cell-number="${escapeHtml(String(cell))}">
            <div class="cycle-card-head">
              <div class="cycle-card-title">
                <span class="cycle-cell-badge">Célula ${escapeHtml(cell)}</span>
                <strong>${quarterName(quarter)}</strong>
                <span class="cycle-year-tag">${escapeHtml(year)}</span>
                <span class="cycle-range-tag">${quarterLabel(quarter)}</span>
                <span class="cycle-leader-tag" style="opacity:.6;font-size:.8rem">${escapeHtml(leaderName)}</span>
                ${baptismChip}
              </div>
              <div class="cycle-card-meta">
                <span class="cycle-progress-text">${totalDone} / ${totalWeeks} semanas</span>
                <div class="cycle-progress-bar"><div class="cycle-progress-fill" style="width:${progressPct}%"></div></div>
              </div>
            </div>
            <div class="cycle-chips-grid">${chips}</div>
          </div>`;
      }).join("");
    }).join("");
  }).join("");

  // ── Células pendientes y actividad de la semana actual ────────────────────
  if (dashboardPendingCells || dashboardRecentActivity) {
    const curWeek    = String(getQuarterWeekNumber());
    const curYear    = String(new Date().getFullYear());
    const curQuarter = String(getCurrentQuarter());
    const allScoped  = getScopedReports(reports);
    const weeklyReps = [...allScoped]
      .filter(r =>
        getReportWeek(r)    === curWeek &&
        getReportYear(r)    === curYear &&
        String(getReportQuarter(r)) === curQuarter
      )
      .sort((a, b) =>
        String(a.cellNumber || a.formData?.cellNumber || "")
          .localeCompare(String(b.cellNumber || b.formData?.cellNumber || ""), "es", { numeric: true })
      );
    const reportedSet  = new Set(weeklyReps.map(r => String(r.cellNumber || r.formData?.cellNumber || "")));
    const pendingCells = getScopedCells().filter(c => !reportedSet.has(String(c.cellNumber)));

    if (dashboardPendingEyebrow) {
      const scopeLabel = getDashboardScopeLabel();
      dashboardPendingEyebrow.textContent = scopeLabel ? `Esta semana · ${scopeLabel}` : "Esta semana";
    }

    if (dashboardPendingCells) {
      dashboardPendingCells.innerHTML = pendingCells.length
        ? pendingCells.map(cell =>
            `<article class="dashboard-list-item"><strong>Célula ${escapeHtml(cell.cellNumber)}</strong><span>${escapeHtml(cell.networkName || "Sin red")} · Sector ${escapeHtml(cell.sector || "-")}</span></article>`
          ).join("")
        : '<div class="quick-list-empty">Todas las células tienen reporte esta semana. ✓</div>';
    }

    if (dashboardRecentActivity) {
      dashboardRecentActivity.innerHTML = weeklyReps.length
        ? weeklyReps.map((report, idx) => {
            const summary = getReportAttendanceSummary(report);
            return `<article class="activity-card activity-card-clickable" role="button" tabindex="0" data-report-idx="${idx}" title="Ver reporte completo">
              <div class="activity-card-head">
                <strong>Célula ${escapeHtml(String(report.cellNumber || report.formData?.cellNumber || "-"))}</strong>
                <span>Semana ${escapeHtml(getReportWeek(report) || "-")}</span>
              </div>
              <p>${escapeHtml(report.leaderName || report.formData?.leaderName || "Sin líder")}</p>
              <div class="activity-metrics">
                <span>${escapeHtml(String(summary.present))} asistentes</span>
                <span>${escapeHtml(String(summary.visitors))} visitas</span>
              </div>
              <span class="activity-card-hint">Toca para ver detalle →</span>
            </article>`;
          }).join("")
        : '<div class="quick-list-empty">Ninguna célula ha enviado reporte esta semana todavía.</div>';
      dashboardRecentActivity._weeklyReports = weeklyReps;
    }

    // ── Compact context strip above the report form ─────────────────────────
    if (reportContextStrip) {
      reportContextStrip.hidden = false;
      if (rcsPending) {
        rcsPending.innerHTML = pendingCells.length
          ? pendingCells.map(cell =>
              `<span class="rcs-chip rcs-chip-pending">Célula ${escapeHtml(String(cell.cellNumber))} · Sector ${escapeHtml(cell.sector || "-")}</span>`
            ).join("")
          : '<span class="rcs-empty">Todas reportaron ✓</span>';
      }
      if (rcsActivity) {
        rcsActivity.innerHTML = weeklyReps.length
          ? weeklyReps.map(r => {
              const s = getReportAttendanceSummary(r);
              const leader = r.leaderName || r.formData?.leaderName || "-";
              const cell   = r.cellNumber || r.formData?.cellNumber || "-";
              return `<span class="rcs-chip rcs-chip-done" data-goto-cell="${escapeHtml(String(cell))}" role="button" tabindex="0" title="Ver Célula ${escapeHtml(String(cell))} en el grid">Célula ${escapeHtml(String(cell))} · ${escapeHtml(leader)} · ${s.present} asis.${s.visitors ? ` · ${s.visitors} vis.` : ""}</span>`;
            }).join("")
          : '<span class="rcs-empty">Ninguna todavía</span>';

        // Click → scroll to cycle card and flash it
        rcsActivity.querySelectorAll('[data-goto-cell]').forEach(chip => {
          const handler = () => {
            const cellNum = chip.dataset.gotoCell;
            const card = document.querySelector(`#seguimiento-cycles-list [data-cell-number="${cellNum}"]`);
            if (!card) return;
            card.scrollIntoView({ behavior: "smooth", block: "center" });
            card.classList.add("cycle-card-highlight");
            setTimeout(() => card.classList.remove("cycle-card-highlight"), 1800);
          };
          chip.addEventListener("click", handler);
          chip.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") handler(); });
        });
      }
    }

    // ── Totals panel ────────────────────────────────────────────────────────
    renderSegTotalsPanel(weeklyReps);
  }
}

function renderReportCellMembers(cell) {
  const members = getCellMembers(cell);
  const kids = getCellKids(cell);
  memberCountChip.textContent = `${members.length} miembro${members.length === 1 ? "" : "s"}`;
  reportMemberPills.innerHTML = members.length
    ? members.map((member) => `<span class="pill">${escapeHtml(member.name)}</span>`).join("")
    : '<span class="member-admin-caption">Sin miembros asignados.</span>';
  if (reportKidPills) {
    reportKidPills.innerHTML = kids.length
      ? kids.map((kid) => `<span class="pill">${escapeHtml(kid.name)}${getGuardianDisplay(kid) ? ` · ${escapeHtml(getGuardianDisplay(kid))}` : ""}</span>`).join("")
      : '<span class="member-admin-caption">Sin niños precargados.</span>';
  }
}

function renderAdminCellMembers(cell) {
  if (memberList) memberList.dataset.cellId = cell?.id ? String(cell.id) : "";
  if (selectedCellName) selectedCellName.textContent = cell ? `Célula ${cell.cellNumber}` : "";

  const members  = getCellMembers(cell);
  const kids     = getCellKids(cell);
  const roster   = [...members, ...kids];

  // Sync hidden role inputs so form submission still works
  const leaderId    = cell?.leaderPersonId    ? String(cell.leaderPersonId)    : "";
  const assistantId = cell?.assistantPersonId ? String(cell.assistantPersonId) : "";
  const hostId      = cell?.hostPersonId      ? String(cell.hostPersonId)      : "";
  if (cellLeaderSelect    instanceof HTMLInputElement) cellLeaderSelect.value    = leaderId;
  if (cellAssistantSelect instanceof HTMLInputElement) cellAssistantSelect.value = assistantId;
  if (cellHostSelect      instanceof HTMLInputElement) cellHostSelect.value      = hostId;

  // Combined member + role table
  if (cellMemberRoleTable) {
    if (!roster.length) {
      cellMemberRoleTable.innerHTML = '<span class="member-admin-caption">Sin miembros asignados todavía.</span>';
    } else {
      const ROLES = [
        { key: "leader",    label: "Líder",     cls: "fn-tag--leader"    },
        { key: "assistant", label: "Asistente", cls: "fn-tag--assistant" },
        { key: "host",      label: "Anfitrión", cls: "fn-tag--host"      },
      ];
      cellMemberRoleTable.innerHTML = `
        <table class="catalog-table cell-role-table">
          <thead><tr><th>Nombre</th><th>Rol en la célula</th><th></th></tr></thead>
          <tbody>
            ${roster.map(member => {
              const mid = String(member.id);
              let currentRole = "";
              if (mid === leaderId)    currentRole = "leader";
              else if (mid === assistantId) currentRole = "assistant";
              else if (mid === hostId)      currentRole = "host";
              const roleChips = member.role === "kid" ? '<span class="fn-tag fn-tag--kid">Niño</span>' :
                ROLES.map(r => {
                  const active = currentRole === r.key;
                  return `<button type="button" class="fn-tag ${active ? r.cls : "fn-tag--off"}" data-action="set-cell-role" data-person-id="${mid}" data-role="${r.key}">${r.label}</button>`;
                }).join("");
              return `<tr>
                <td><strong>${escapeHtml(member.name)}</strong></td>
                <td>${roleChips}</td>
                <td><button type="button" class="btn-remove-member" data-action="remove-member" data-person-id="${mid}" title="Quitar de la célula">✕</button></td>
              </tr>`;
            }).join("")}
          </tbody>
        </table>`;
    }
  }

  // Populate "add member" select — only unassigned adults
  const selectedIds = new Set(roster.map(m => String(m.id)));
  const available   = catalogs.people.filter(p => p.role !== "kid" && !selectedIds.has(String(p.id)) && !p.assignedCellId);
  renderSelect(memberPersonSelect, available.map(p => ({ value: String(p.id), label: p.name })),
    available.length ? "Agregar miembro…" : "Sin miembros disponibles");
}

function setCellLinkedFieldsLocked(locked) {
  [leaderField, assistantField, hostField, reportAddress].forEach((field) => {
    if (!field) return;
    field.disabled = locked;
    field.closest("label")?.classList.toggle("is-catalog-locked", locked);
  });
}

function syncReportWithCell(force = false, savedData = null) {
  const cell = findCellByNumber(cellField.value);
  if (!cell) {
    setCellLinkedFieldsLocked(false);
    renderReportCellMembers(null);
    applyWeeklyCollectionsForCell(null, null);
    populateVisitorInvitedBySelect();
    return;
  }

  const mappings = [
    ["networkName", cell.networkName || ""],
    ["sector", cell.sector || ""],
    ["zoneName", cell.zoneName || ""],
    ["districtName", cell.districtName || ""],
    ["address", cell.address || ""],
  ];

  mappings.forEach(([name, value]) => {
    const field = reportForm.elements.namedItem(name);
    if (!(field instanceof HTMLInputElement) && !(field instanceof HTMLSelectElement)) {
      return;
    }
    if (force || !String(field.value || "").trim()) {
      field.value = value;
    }
  });

  if (force || !leaderField.value) {
    leaderField.value = cell.leaderName || "";
  }
  if (force || !assistantField.value) {
    assistantField.value = cell.assistantName || "";
  }
  if (force || !hostField.value) {
    hostField.value = cell.hostName || "";
  }

  renderReportCellMembers(cell);
  applyWeeklyCollectionsForCell(cell, savedData);
  populateVisitorInvitedBySelect();
  setCellLinkedFieldsLocked(true);
}

function populatePeopleForm(person = null) {
  peopleForm.reset();
  peopleEditId.value = person ? String(person.id) : "";
  renderGuardianSelect(person?.id ? String(person.id) : "");
  peopleForm.name.value = person?.name || "";
  const isKidCheckbox = /** @type {HTMLInputElement|null} */ (document.getElementById("people-is-kid"));
  if (isKidCheckbox) isKidCheckbox.checked = person?.role === "kid";
  peopleForm.phone.value = person?.phone || "";
  peopleForm.email.value = person?.email || "";
  if (peopleGuardianPerson instanceof HTMLSelectElement) {
    peopleGuardianPerson.value = person?.guardianPersonId ? String(person.guardianPersonId) : "";
  }
  if (peopleGuardianName instanceof HTMLInputElement) {
    peopleGuardianName.value = person?.guardianName || "";
  }
  // Populate supervisor sector select (outside <form>, use document.querySelector)
  const supervisorSelect = document.querySelector("select[name='supervisorSector']");
  if (supervisorSelect) {
    const sectors = [...new Set((catalogs.cells || []).map(c => c.sector).filter(Boolean))].sort();
    supervisorSelect.innerHTML = `<option value="">— No es supervisor —</option>` +
      sectors.map(s => `<option value="${s}">Sector ${s}</option>`).join("");
    supervisorSelect.value = person?.supervisorSector || "";
  }
  const coordCheck = /** @type {HTMLInputElement|null} */ (document.querySelector("#people-is-coordinator"));
  if (coordCheck) coordCheck.checked = !!(person?.isCoordinator);
  syncPeopleGuardianFields();
  renderPeopleRcmPanel(person);
}

function populateCellsForm(cell = null) {
  cellsForm.reset();
  cellsEditId.value = cell ? String(cell.id) : "";
  if (cellAdminSelect instanceof HTMLInputElement) cellAdminSelect.value = cell ? String(cell.id) : "";
  cellsForm.cellNumber.value = cell?.cellNumber || "";
  cellsForm.networkName.value = cell?.networkName || "";
  // Populate sector select dynamically from existing sectors + current value
  const cellSectorSelect = document.getElementById("cell-sector-select");
  if (cellSectorSelect) {
    const existingSectors = [...new Set((catalogs.cells || []).map(c => c.sector).filter(Boolean))].sort();
    const currentSector = cell?.sector || "";
    if (currentSector && !existingSectors.includes(currentSector)) existingSectors.push(currentSector);
    existingSectors.sort();
    cellSectorSelect.innerHTML =
      `<option value="">— Sector —</option>` +
      existingSectors.map(s => `<option value="${s}"${s === currentSector ? " selected" : ""}>${s}</option>`).join("") +
      `<option value="__new__">+ Nuevo sector…</option>`;
    cellSectorSelect.onchange = () => {
      if (cellSectorSelect.value === "__new__") {
        const val = prompt("Nombre del nuevo sector:")?.trim().toUpperCase();
        if (val) {
          const opt = document.createElement("option");
          opt.value = val; opt.textContent = val;
          cellSectorSelect.insertBefore(opt, cellSectorSelect.lastElementChild);
          cellSectorSelect.value = val;
        } else {
          cellSectorSelect.value = currentSector || "";
        }
      }
    };
  }
  cellsForm.zoneName.value = cell?.zoneName || "";
  cellsForm.districtName.value = cell?.districtName || "";
  cellsForm.address.value = cell?.address || "";
  cellLeaderSelect.value = cell?.leaderPersonId ? String(cell.leaderPersonId) : "";
  cellAssistantSelect.value = cell?.assistantPersonId ? String(cell.assistantPersonId) : "";
  cellHostSelect.value = cell?.hostPersonId ? String(cell.hostPersonId) : "";
  renderAdminCellMembers(cell);
}

// ── Read-only view mode for closed-week reports ──────────────────────────────
function enterReadOnlyMode(report) {
  reportReadOnlyMode = true;
  editingReportId = null;

  // Load form data
  const formData = report.formData || report;
  suppressWeekChangeHandler = true;
  reportForm.reset();
  suppressWeekChangeHandler = false;
  Object.entries(formData).forEach(([name, value]) => {
    const field = reportForm.elements.namedItem(name);
    if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
      field.value = value == null ? "" : String(value);
    }
  });
  // Explicitly restore week (select reset may have cleared it)
  const reportWeek = String(formData.week || report.week || "");
  if (reportWeek) weekField.value = reportWeek;

  renderReportPersonSelects();
  renderCellOptions();
  if (formData.cellNumber) cellField.value = String(formData.cellNumber);
  leaderField.value    = formData.leaderName    || "";
  assistantField.value = formData.assistantName || "";
  hostField.value      = formData.hostName      || "";
  syncReportWithCell(false, formData);
  syncPhaseIndicator();

  // Disable all editable form controls
  reportForm.querySelectorAll("input, select, textarea, button[type='button']").forEach(el => {
    if (!el.closest(".stage-nav") && !el.closest(".stage-tab") && !el.id?.startsWith("reset")) {
      el.disabled = true;
    }
  });

  // Show closed banner (fixed element in HTML)
  const banner = document.getElementById("form-readonly-banner");
  if (banner) {
    const week = formData.week || report.week || "?";
    banner.innerHTML = `🔒 <strong>Semana ${week} — cerrada.</strong> Solo lectura. <button type="button" id="form-readonly-exit-btn" style="margin-left:10px;font-size:0.8rem;padding:3px 10px">Nuevo reporte</button>`;
    banner.hidden = false;
    document.getElementById("form-readonly-exit-btn")?.addEventListener("click", () => {
      resetReportForm();
    });
  }
}

function exitReadOnlyMode() {
  if (!reportReadOnlyMode) return;
  reportReadOnlyMode = false;
  // Re-enable all form controls
  reportForm.querySelectorAll("input, select, textarea, button[type='button']").forEach(el => {
    el.disabled = false;
  });
  const banner = document.getElementById("form-readonly-banner");
  if (banner) banner.hidden = true;
}

function resetReportForm() {
  exitReadOnlyMode();
  editingReportId = null;
  suppressWeekChangeHandler = true;
  reportForm.reset();
  suppressWeekChangeHandler = false;
  currentVisitors = [];
  currentMemberAttendance = [];
  currentKids = [];
  currentBaptisms = [];
  // Clear all stage badges and draft indicators
  document.querySelectorAll(".stage-tab-badge").forEach(b => b.hidden = true);
  document.querySelectorAll(".stage-tab").forEach(t => t.classList.remove("has-draft"));
  // Repopulate week options AFTER reset() (reset() clears the select value)
  populateWeekOptions();
  renderReportPersonSelects();
  renderCellOptions();
  if (catalogs.cells.length) {
    const defaultCell = findFirstCellWithMembers() || catalogs.cells[0];
    cellField.value = defaultCell.cellNumber;
    syncReportWithCell(true);
  } else {
    toggleHelperButtons();
  }
  const dateField = reportForm.elements.namedItem("reportDate");
  if (dateField instanceof HTMLInputElement) {
    dateField.value = new Date().toISOString().slice(0, 10);
  }
  syncPhaseIndicator();
  renderBaptismTable();
}

function getInvitedByPeople() {
  const cell = findCellByNumber(cellField.value);
  const members = cell ? getCellMembers(cell) : [];
  const source = members.length
    ? members
    : (catalogs?.people ?? []).filter(p => p.role !== "kid");
  return source.slice().sort((a, b) => a.name.localeCompare(b.name, "es"));
}

function populateVisitorInvitedBySelect() {
  if (!(visitorQuickInvitedBy instanceof HTMLSelectElement)) return;
  const current = visitorQuickInvitedBy.value;
  const options = getInvitedByPeople()
    .map(p => `<option value="${escapeHtml(p.name)}">${escapeHtml(p.name)}</option>`)
    .join("");
  visitorQuickInvitedBy.innerHTML = `<option value="">— Quién invitó —</option>${options}`;
  if (current) visitorQuickInvitedBy.value = current;
}

async function loadCatalogs() {
  const payload = await request("/api/catalogs");
  catalogs = {
    people: Array.isArray(payload.people) ? payload.people : [],
    cells: Array.isArray(payload.cells) ? payload.cells : [],
  };
  renderGuardianSelect(peopleEditId.value);
  renderAdminSummary();
  renderReportPersonSelects();
  renderCellRoleSelects();
  renderCellOptions();
  renderCellsTable();
  renderPeopleRows();
  populateVisitorInvitedBySelect();
  syncReportWithCell(false);
}

async function loadSettings() {
  try {
    appSettings = await request("/api/settings");
  } catch {
    appSettings = {};
  }
  renderSettingsForm();
}

function renderSettingsForm() {
  const input = document.getElementById("setting-cycle-start");
  if (input && appSettings.cycle_start_date) {
    input.value = appSettings.cycle_start_date;
  }
  const daySelect = document.getElementById("setting-week-start-day");
  if (daySelect && appSettings.week_start_day !== undefined && appSettings.week_start_day !== "") {
    daySelect.value = appSettings.week_start_day;
  }
  const graceInput = document.getElementById("setting-grace-hours");
  if (graceInput && appSettings.report_grace_hours !== undefined && appSettings.report_grace_hours !== "") {
    graceInput.value = appSettings.report_grace_hours;
  }
  // Sync history scope radio
  const radio = document.querySelector(`input[name='history_scope'][value='${historyScope}']`);
  if (radio) radio.checked = true;
  // Sync language radio
  const langRadio = document.querySelector(`input[name='settings_lang'][value='${currentLang}']`);
  if (langRadio) langRadio.checked = true;
  updateSettingsWeekPreview();
}

function updateSettingsWeekPreview() {
  const preview     = document.getElementById("settings-week-preview");
  const quarterBody = document.getElementById("settings-quarter-body");

  // Quarter context — always rendered
  const now   = new Date();
  const month = now.getMonth();
  const year  = now.getFullYear();
  const quarters = [
    { q: 1, label: "1er Cuatrimestre", months: "Enero – Abril",          start: 0, end: 3  },
    { q: 2, label: "2do Cuatrimestre", months: "Mayo – Agosto",          start: 4, end: 7  },
    { q: 3, label: "3er Cuatrimestre", months: "Septiembre – Diciembre", start: 8, end: 11 },
  ];
  const currentQ = quarters.find(q => month >= q.start && month <= q.end);
  if (quarterBody && currentQ) {
    const qStart = new Date(year, currentQ.start, 1);
    const qEnd   = new Date(year, currentQ.end + 1, 0);
    const fmt = d => d.toLocaleDateString("es-MX", { day: "numeric", month: "long" });
    quarterBody.innerHTML = `
      <div class="sq-row"><span class="sq-badge">Q${currentQ.q}</span><strong>${currentQ.label} ${year}</strong></div>
      <div class="sq-row sq-muted">${currentQ.months} · ${fmt(qStart)} al ${fmt(qEnd)}</div>
      <div class="sq-divider"></div>
      <div class="sq-row sq-muted">Q1 · Ene–Abr &nbsp;·&nbsp; Q2 · May–Ago &nbsp;·&nbsp; Q3 · Sep–Dic</div>
    `;
  }

  if (!preview) return;
  const input = document.getElementById("setting-cycle-start");
  const val = input?.value;
  if (!val) {
    preview.innerHTML = `<span style="color:var(--muted);font-size:0.8rem">Ingresa una fecha para ver la semana actual y la fecha de cierre del ciclo.</span>`;
    return;
  }
  const cycleStart = new Date(`${val}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  cycleStart.setHours(0, 0, 0, 0);
  const diff = Math.floor((today - cycleStart) / 86400000);
  if (diff < 0) {
    const daysLeft = Math.abs(diff);
    preview.innerHTML = `<span style="color:var(--warning)">⚠ El ciclo inicia en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}.</span>`;
    return;
  }
  const totalWeeks = getRcmTotalWeeks();
  const week = Math.max(1, Math.min(totalWeeks, Math.floor(diff / 7) + 1));
  const endDate = new Date(cycleStart);
  endDate.setDate(endDate.getDate() + (totalWeeks - 1) * 7 - 1);
  const daysToEnd = Math.floor((endDate - today) / 86400000);
  const fmtFull = d => d.toLocaleDateString("es-MX", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const fmtShort = d => d.toLocaleDateString("es-MX", { day: "numeric", month: "short" });
  const info = getRcmWeekInfo(week);
  const phaseLabel = info ? ` · ${info.phaseLabel} — ${info.verb}` : "";
  const endMsg = daysToEnd >= 0
    ? `Termina el <strong>${fmtFull(endDate)}</strong> (${daysToEnd} días restantes)`
    : `<span style="color:var(--muted)">Ciclo finalizado hace ${Math.abs(daysToEnd)} días</span>`;
  preview.innerHTML = `
    <div class="sq-row" style="margin-bottom:4px"><span class="sq-badge" style="font-size:0.7rem">Sem ${week}</span><strong>Semana ${week}${phaseLabel}</strong></div>
    <div style="font-size:0.78rem;color:var(--muted);line-height:1.5">
      Inicio: ${fmtShort(cycleStart)} &nbsp;·&nbsp; Fin estimado (sem ${totalWeeks - 1}): ${fmtShort(endDate)}<br>${endMsg}
    </div>
  `;
}

document.getElementById("setting-cycle-start")?.addEventListener("input", updateSettingsWeekPreview);
document.getElementById("setting-week-start-day")?.addEventListener("change", updateSettingsWeekPreview);

document.getElementById("settings-save-btn")?.addEventListener("click", async () => {
  const input = document.getElementById("setting-cycle-start");
  const daySelect = document.getElementById("setting-week-start-day");
  const status = document.getElementById("settings-save-status");
  const val = input?.value?.trim();
  if (!val) { if (status) { status.textContent = "Ingresa una fecha."; status.className = "settings-save-status is-error"; } return; }
  try {
    const weekDay = daySelect?.value ?? "0";
    const graceInput = document.getElementById("setting-grace-hours");
    const graceHours = parseInt(graceInput?.value ?? "0", 10) || 0;
    await request("/api/settings", { method: "POST", body: JSON.stringify({ cycle_start_date: val, week_start_day: weekDay, report_grace_hours: String(graceHours) }) });
    appSettings.cycle_start_date = val;
    appSettings.week_start_day = weekDay;
    appSettings.report_grace_hours = String(graceHours);
    if (status) { status.textContent = "✓ Guardado"; status.className = "settings-save-status is-ok"; }
    setTimeout(() => { if (status) status.textContent = ""; }, 3000);
    syncWeekFieldWithReportDate(true);
  } catch {
    if (status) { status.textContent = "Error al guardar."; status.className = "settings-save-status is-error"; }
  }
});

// ── Verbos RCM configurables ──────────────────────────────────────────
const RCM_WEEKS_DEFAULT = RCM_WEEKS.map(w => ({ ...w })); // snapshot de defaults
const RCM_PHASES = [
  { value: "GANAR",      label: "Ganar"      },
  { value: "CONSOLIDAR", label: "Consolidar" },
  { value: "DISCIPULAR", label: "Discipular" },
];

function renderRcmVerbsTable() {
  const tbody = document.getElementById("rcm-verbs-tbody");
  if (!tbody) return;
  const phaseClass = { GANAR: "ganar", CONSOLIDAR: "consolidar", DISCIPULAR: "discipular" };
  tbody.innerHTML = RCM_WEEKS.map(w => {
    const phaseOptions = RCM_PHASES.map(p =>
      `<option value="${p.value}" ${p.value === w.phase ? "selected" : ""}>${p.label}</option>`
    ).join("");
    const eventVal = (w.event || "").replace(/"/g, "&quot;");
    return `
    <tr data-week="${w.week}" class="rvt-row-${phaseClass[w.phase] || ""}">
      <td><span class="rcm-verbs-week-badge">${w.week}</span></td>
      <td>
        <select class="rvt-phase" data-week="${w.week}" style="width:100%;font-size:0.78rem;padding:4px">
          ${phaseOptions}
        </select>
      </td>
      <td><input type="text" class="rvt-verb" data-week="${w.week}" value="${(w.verb || "").replace(/"/g, "&quot;")}" maxlength="20" style="text-transform:uppercase" /></td>
      <td><input type="text" class="rvt-desc" data-week="${w.week}" value="${(w.verbDesc || "").replace(/"/g, "&quot;")}" maxlength="120" /></td>
      <td><input type="text" class="rvt-event" data-week="${w.week}" value="${eventVal}" maxlength="40" placeholder="—" /></td>
      <td>
        <button type="button" class="rvt-remove" data-week="${w.week}" title="Quitar semana" aria-label="Quitar semana ${w.week}">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a2 2 0 012-2h2a2 2 0 012 2v2"/></svg>
        </button>
      </td>
    </tr>`;
  }).join("");
}

// Lee el estado actual de la tabla y devuelve un array completo de semanas
// (formato nuevo de rcm_weeks_config: cada entry trae phase + verb + week)
function collectRcmWeeksFromTable() {
  const rows = Array.from(document.querySelectorAll("#rcm-verbs-tbody tr[data-week]"));
  return rows.map((row, idx) => {
    const oldWeek = parseInt(row.dataset.week, 10);
    const oldEntry = RCM_WEEKS.find(w => w.week === oldWeek) || {};
    const phase = row.querySelector(".rvt-phase")?.value || oldEntry.phase || "GANAR";
    const phaseLabel = RCM_PHASES.find(p => p.value === phase)?.label || titleCase(phase);
    return {
      week:       idx + 1, // re-numerar continuo
      phase,
      phaseLabel,
      verb:       (row.querySelector(".rvt-verb")?.value || "").trim().toUpperCase(),
      verbDesc:   (row.querySelector(".rvt-desc")?.value || "").trim(),
      event:      (row.querySelector(".rvt-event")?.value || "").trim() || null,
      eventType:  oldEntry.eventType || null,
      purpose:    oldEntry.purpose || null,
      rcmKey:     oldEntry.rcmKey || null,
    };
  });
}

document.getElementById("rcm-verbs-add-btn")?.addEventListener("click", () => {
  // Agrega una semana al final, copiando la fase de la última fila.
  const current = collectRcmWeeksFromTable();
  const last = current[current.length - 1];
  current.push({
    week:       current.length + 1,
    phase:      last?.phase || "DISCIPULAR",
    phaseLabel: last?.phaseLabel || "Discipular",
    verb:       "",
    verbDesc:   "",
    event:      null,
    eventType:  null,
    purpose:    null,
    rcmKey:     null,
  });
  // Aplicar al RCM_WEEKS en memoria para que renderRcmVerbsTable lo refleje
  RCM_WEEKS.length = 0;
  current.forEach(e => RCM_WEEKS.push(e));
  renderRcmVerbsTable();
});

document.getElementById("rcm-verbs-tbody")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".rvt-remove");
  if (!btn) return;
  if (RCM_WEEKS.length <= 1) {
    alert("Debe quedar al menos una semana en el ciclo.");
    return;
  }
  const week = parseInt(btn.dataset.week, 10);
  if (!confirm(`¿Quitar la semana ${week} del ciclo? Esto NO elimina reportes ya guardados.`)) return;
  const current = collectRcmWeeksFromTable().filter(e => e.week !== week);
  RCM_WEEKS.length = 0;
  current.forEach((e, idx) => RCM_WEEKS.push({ ...e, week: idx + 1 }));
  renderRcmVerbsTable();
});

// Refresca el color de fila cuando cambia el selector de fase (sin re-render completo)
document.getElementById("rcm-verbs-tbody")?.addEventListener("change", (e) => {
  if (!e.target.classList.contains("rvt-phase")) return;
  const row = e.target.closest("tr[data-week]");
  if (!row) return;
  const phaseClass = { GANAR: "ganar", CONSOLIDAR: "consolidar", DISCIPULAR: "discipular" };
  row.className = `rvt-row-${phaseClass[e.target.value] || ""}`;
});

document.getElementById("settings-rcm-verbs-save-btn")?.addEventListener("click", async () => {
  const status = document.getElementById("settings-rcm-verbs-status");
  try {
    // Guarda el array COMPLETO (formato nuevo) — permite agregar/quitar semanas
    const full = collectRcmWeeksFromTable();
    if (full.length === 0) {
      if (status) { status.textContent = "Debe haber al menos una semana."; status.className = "settings-save-status is-error"; }
      return;
    }
    const cfg = JSON.stringify(full);
    await request("/api/settings", { method: "POST", body: JSON.stringify({ rcm_weeks_config: cfg }) });
    appSettings.rcm_weeks_config = cfg;
    // Aplicar inmediatamente
    applyRcmWeeksConfig();
    populateWeekOptions();
    renderRcmVerbsTable();
    if (status) { status.textContent = "✓ Guardado"; status.className = "settings-save-status is-ok"; }
    setTimeout(() => { if (status) status.textContent = ""; }, 3000);
  } catch {
    if (status) { status.textContent = "Error al guardar."; status.className = "settings-save-status is-error"; }
  }
});

document.getElementById("settings-rcm-verbs-reset-btn")?.addEventListener("click", async () => {
  const status = document.getElementById("settings-rcm-verbs-status");
  if (!confirm("¿Restablecer ciclo a las 16 semanas predeterminadas de la IAFCJ?")) return;
  try {
    // Restaurar defaults completos en memoria
    RCM_WEEKS.length = 0;
    RCM_WEEKS_DEFAULT.forEach(def => RCM_WEEKS.push({ ...def }));
    await request("/api/settings", { method: "POST", body: JSON.stringify({ rcm_weeks_config: "[]" }) });
    appSettings.rcm_weeks_config = "[]";
    renderRcmVerbsTable();
    populateWeekOptions();
    if (status) { status.textContent = "✓ Restablecido"; status.className = "settings-save-status is-ok"; }
    setTimeout(() => { if (status) status.textContent = ""; }, 3000);
  } catch {
    if (status) { status.textContent = "Error al restablecer."; status.className = "settings-save-status is-error"; }
  }
});

async function loadHealth() {
  try {
    const payload = await request("/api/health");
    healthStatus.textContent = payload.ok ? t("nav.available") : "Sin respuesta";
    if (healthStatusDot) healthStatusDot.dataset.ok = payload.ok ? "true" : "false";
    if (tmcStatusDot) tmcStatusDot.dataset.ok = payload.ok ? "true" : "false";
    if (tmcStatusText) tmcStatusText.textContent = payload.ok ? t("nav.available") : "Sin respuesta";
    heroCaption.textContent = payload.database || "Base de datos conectada.";
  } catch {
    healthStatus.textContent = "Error";
    if (healthStatusDot) healthStatusDot.dataset.ok = "false";
    if (tmcStatusDot) tmcStatusDot.dataset.ok = "false";
    if (tmcStatusText) tmcStatusText.textContent = t("nav.offline");
    heroCaption.textContent = "No se pudo consultar el backend.";
  }
}

async function loadReports() {
  try {
    const payload = await request("/api/reports");
    const allReports = payload.reports || [];
    // Regular leaders get their cell pre-filtered so no other cell's raw data
    // is ever held in memory (supervisors and admins keep full list for scoping).
    reportsData = (currentUser && !currentUser.isAdmin && !currentUser.isSupervisor && currentUser.assignedCellNumber)
      ? allReports.filter(r => String(r.cellNumber || r.formData?.cellNumber || "") === String(currentUser.assignedCellNumber))
      : allReports;
    renderVisitorHistoryOptions();
    renderReports(reportsData);
    renderSeguimiento(reportsData);
    renderDashboard(reportsData);
    // Refresh week-options to reflect newly submitted reports
    if (weekField && !editingReportId) {
      const prev = weekField.value;
      populateWeekOptions();
      if (prev) weekField.value = prev;
    }
  } catch (error) {
    setFeedback(error.message, true);
  }
}

async function handleReportSubmit(event) {
  event.preventDefault();
  clearFeedback();

  // Validate week is not in the future
  const selectedWeek = parseInt(weekField.value, 10);
  // Use the real current quarter week (ignoring grace) so finalizar
  // funciona en el día de rollover dentro del periodo de gracia: la semana
  // real (ej. 2) sigue siendo válida aunque getCurrentWeekNumber devuelva la
  // semana anterior por estar dentro de las horas de gracia.
  const maxWeek = getQuarterWeekNumber();
  if (selectedWeek > maxWeek) {
    setFeedback(`No puedes reportar la semana ${selectedWeek} — actualmente estamos en la semana ${maxWeek}.`, true);
    weekField.focus();
    return;
  }
  const payload = Object.fromEntries(new FormData(reportForm).entries());
  // Campos bloqueados (disabled) no llegan por FormData; se leen directo del DOM.
  payload.week = weekField.value || payload.week || "";
  payload.cellNumber = cellField.value || payload.cellNumber || "";
  payload.leaderName = leaderField.value || payload.leaderName || "";
  payload.assistantName = assistantField.value || payload.assistantName || "";
  payload.hostName = hostField.value || payload.hostName || "";
  payload.address = reportAddress.value || payload.address || "";
  payload.memberAttendance = currentMemberAttendance;
  payload.visitors = currentVisitors.filter((visitor) => String(visitor.name || "").trim());
  payload.kids = currentKids.filter((kid) => String(kid.name || "").trim());
  payload.baptisms = normalizeBaptisms(currentBaptisms).filter((entry) => entry.name);
  payload.attendanceSummary = computeWeeklySummary();
  payload.cycleReportId = computeCycleReportId(payload.cellNumber, getReportYearValue());
  const promotedCount = countBaptismsToPromote(payload.baptisms);
  const createdMessage = promotedCount ? `${t('err.saved')} ${promotedCount} bautizado(s) agregado(s) como miembro(s).` : t('err.saved');
  const updatedMessage = promotedCount ? `Reporte actualizado. ${promotedCount} bautizado(s) agregado(s) como miembro(s).` : "Reporte actualizado.";
  const successMessage = editingReportId ? updatedMessage : createdMessage;

  try {
    if (editingReportId) {
      await request(`/api/reports/${editingReportId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      await request("/api/reports", {
        method: "POST",
        body: JSON.stringify(payload),
      });
    }
    resetReportForm();
    await loadCatalogs();
    if (payload.cellNumber) {
      cellField.value = String(payload.cellNumber);
      syncReportWithCell(true);
    }
    await loadReports();
    setFeedback(successMessage);
  } catch (error) {
    setFeedback(error.message, true);
  }
}

async function handlePeopleSubmit(event) {
  event.preventDefault();
  clearFeedback();
  const payload = Object.fromEntries(new FormData(peopleForm).entries());
  // Map isKid checkbox to role field (all adults are just "member")
  payload.role = payload.isKid === "on" ? "kid" : "member";
  delete payload.isKid;
  const editId = peopleEditId.value;

  // Read desired cell and role from outside-form controls
  const newCellId   = peopleDialogCellSelect?.value || "";
  const newCellRole = peopleDialogCellRoleSelect?.value || ""; // "leader"|"assistant"|"host"|""
  const person      = catalogs.people.find(p => String(p.id) === editId);
  const oldCellId   = String(person?.assignedCellId || "");
  const cellChanged = newCellId !== oldCellId;

  // Validate: if assigning as leader, check cell doesn't already have one
  if (newCellRole === "leader" && newCellId) {
    const targetCell = catalogs.cells.find(c => String(c.id) === newCellId);
    if (targetCell?.leaderPersonId && String(targetCell.leaderPersonId) !== editId) {
      const leaderName = catalogs.people.find(p => String(p.id) === String(targetCell.leaderPersonId))?.name || "otra persona";
      const ok = await appConfirm(`La célula ${targetCell.cellNumber} ya tiene a "${leaderName}" como líder.\n¿Reemplazar a "${leaderName}" y asignar a "${payload.name || "esta persona"}" como nuevo líder?`, "Cambio de líder");
      if (!ok) return;
    }
  }

  // Validate: supervisor sector conflict
  if (payload.supervisorSector) {
    const conflict = catalogs.people.find(p =>
      String(p.id) !== editId &&
      p.supervisorSector === payload.supervisorSector
    );
    if (conflict) {
      const ok = await appConfirm(`"${conflict.name}" ya supervisa el sector ${payload.supervisorSector}.\n¿Confirmar de todas formas?`, "Conflicto de supervisor");
      if (!ok) return;
    }
  }

  // Confirm only when cell or role will change
  if (cellChanged || newCellId) {
    const confirmMsg = buildConfirmMessage(person, payload, newCellId, newCellRole, cellChanged);
    if (confirmMsg) {
      const ok = await appConfirm(confirmMsg, "Confirmar cambios");
      if (!ok) return;
    }
  }

  try {
    let savedPersonId = editId;
    if (editId) {
      await request(`/api/catalogs/people/${editId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setFeedback("Persona actualizada.");
    } else {
      const created = await request("/api/catalogs/people", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      savedPersonId = String(created.id);
      setFeedback("Persona agregada.");
    }

    // Handle cell membership change
    if (savedPersonId) {
      if (cellChanged) {
        if (oldCellId) {
          await request(`/api/catalogs/cells/${oldCellId}/members/${savedPersonId}`, { method: "DELETE" });
        }
        if (newCellId) {
          await request(`/api/catalogs/cells/${newCellId}/members`, {
            method: "POST",
            body: JSON.stringify({ personId: Number(savedPersonId) }),
          });
        }
      }

      // Apply cell role (leader/assistant/host) by updating the cell
      if (newCellId && newCellRole) {
        const targetCell = catalogs.cells.find(c => String(c.id) === newCellId);
        if (targetCell) {
          const cellPayload = {
            cellNumber: targetCell.cellNumber,
            networkName: targetCell.networkName || "",
            sector: targetCell.sector || "",
            zoneName: targetCell.zoneName || "",
            districtName: targetCell.districtName || "",
            address: targetCell.address || "",
            leaderPersonId: newCellRole === "leader" ? Number(savedPersonId) : (targetCell.leaderPersonId || ""),
            assistantPersonId: newCellRole === "assistant" ? Number(savedPersonId) : (targetCell.assistantPersonId || ""),
            hostPersonId: newCellRole === "host" ? Number(savedPersonId) : (targetCell.hostPersonId || ""),
          };
          await request(`/api/catalogs/cells/${newCellId}`, {
            method: "PUT",
            body: JSON.stringify(cellPayload),
          });
        }
      } else if (newCellId && !newCellRole && editId) {
        // If role was cleared for an existing assignment, remove person from cell role fields
        const targetCell = catalogs.cells.find(c => String(c.id) === newCellId);
        if (targetCell) {
          const wasLeader    = String(targetCell.leaderPersonId) === editId;
          const wasAssistant = String(targetCell.assistantPersonId) === editId;
          const wasHost      = String(targetCell.hostPersonId) === editId;
          if (wasLeader || wasAssistant || wasHost) {
            const cellPayload = {
              cellNumber: targetCell.cellNumber,
              networkName: targetCell.networkName || "",
              sector: targetCell.sector || "",
              zoneName: targetCell.zoneName || "",
              districtName: targetCell.districtName || "",
              address: targetCell.address || "",
              leaderPersonId: wasLeader ? "" : (targetCell.leaderPersonId || ""),
              assistantPersonId: wasAssistant ? "" : (targetCell.assistantPersonId || ""),
              hostPersonId: wasHost ? "" : (targetCell.hostPersonId || ""),
            };
            await request(`/api/catalogs/cells/${newCellId}`, {
              method: "PUT",
              body: JSON.stringify(cellPayload),
            });
          }
        }
      }
    }

    if (peopleEditDialog?.open) peopleEditDialog.close();
    populatePeopleForm();
    await loadCatalogs();
    // If cell dialog is open, refresh it with latest data
    if (cellEditDialog?.open && cellsEditId?.value) {
      populateCellsForm(findCellById(cellsEditId.value));
    }
  } catch (error) {
    setFeedback(error.message, true);
  }
}

function buildConfirmMessage(person, payload, newCellId, newCellRole, cellChanged) {
  const editId = String(person?.id || "");
  const lines = [];
  const newCell = newCellId ? catalogs.cells.find(c => String(c.id) === newCellId) : null;

  if (cellChanged) {
    if (newCellId && person?.assignedCellNumber) {
      lines.push(`• Mover de Célula ${person.assignedCellNumber} → Célula ${newCell?.cellNumber}`);
    } else if (newCellId) {
      lines.push(`• Asignar a Célula ${newCell?.cellNumber}`);
    } else if (person?.assignedCellNumber) {
      lines.push(`• Retirar de Célula ${person.assignedCellNumber}`);
    }
  }

  // Detect role change
  const oldCell = person?.assignedCellId ? catalogs.cells.find(c => String(c.id) === String(person.assignedCellId)) : null;
  let oldRole = "";
  if (oldCell && editId) {
    if (String(oldCell.leaderPersonId)    === editId) oldRole = "leader";
    else if (String(oldCell.assistantPersonId) === editId) oldRole = "assistant";
    else if (String(oldCell.hostPersonId)      === editId) oldRole = "host";
  }
  const roleChanged = newCellRole !== oldRole;

  if (newCellRole && (cellChanged || roleChanged)) {
    lines.push(`• Función: ${formatRole(newCellRole)} en Célula ${newCell?.cellNumber}`);
    // Only show replacement note when the cell already has a DIFFERENT leader
    if (newCellRole === "leader" && newCell?.leaderPersonId && String(newCell.leaderPersonId) !== editId) {
      const currentLeader = catalogs.people.find(p => String(p.id) === String(newCell.leaderPersonId));
      if (currentLeader) lines.push(`  ↳ Reemplaza a "${currentLeader.name}" como líder`);
    }
  } else if (!newCellRole && roleChanged && oldRole) {
    lines.push(`• Quitar función de ${formatRole(oldRole)} en Célula ${oldCell?.cellNumber}`);
  }

  const name = payload.name || person?.name || "";
  if (!lines.length) return null;
  return `¿Confirmar cambios de ${name}?\n\n${lines.join("\n")}`;
}

async function handleCellsSubmit(event) {
  event.preventDefault();
  clearFeedback();
  const payload = Object.fromEntries(new FormData(cellsForm).entries());
  const editId = cellsEditId.value;

  try {
    if (editId) {
      await request(`/api/catalogs/cells/${editId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setFeedback("Célula actualizada.");
    } else {
      const created = await request("/api/catalogs/cells", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      cellsEditId.value = String(created.id);
      setFeedback("Célula agregada.");
    }
    await loadCatalogs();
    const selected = editId ? findCellById(editId) : catalogs.cells.find((cell) => cell.cellNumber === payload.cellNumber);
    populateCellsForm(selected || null);
    if (!editingReportId && cellField.value === payload.cellNumber) {
      syncReportWithCell(true);
    }
    if (cellEditDialog?.open) cellEditDialog.close();
  } catch (error) {
    setFeedback(error.message, true);
  }
}

function setCellDialogMsg(message, isError = false) {
  const el = document.getElementById("cell-dialog-msg");
  if (!el) return;
  if (!message) { el.hidden = true; el.textContent = ""; return; }
  el.hidden = false;
  el.textContent = message;
  el.className = "cell-dialog-msg" + (isError ? " cell-dialog-msg--error" : " cell-dialog-msg--ok");
}

async function handleMemberSubmit(event) {
  event.preventDefault();
  setCellDialogMsg("");
  let cellId = cellsEditId.value || memberList?.dataset.cellId || "";
  const pendingPersonId = memberPersonSelect.value;

  if (!pendingPersonId) {
    setCellDialogMsg("Selecciona una persona para agregarla como miembro.", true);
    return;
  }

  // Si la célula aún no se ha guardado, guardarla primero
  if (!cellId) {
    if (!cellsForm.reportValidity()) return;
    const payload = Object.fromEntries(new FormData(cellsForm).entries());
    try {
      const created = await request("/api/catalogs/cells", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      cellId = String(created.id);
      cellsEditId.value = cellId;
      await loadCatalogs();
      const saved = findCellById(cellId);
      populateCellsForm(saved || null);
      document.querySelector("#cell-dialog-title").textContent = `Editar: Célula ${saved?.cellNumber || ""}`;
    } catch (err) {
      setCellDialogMsg(err.message, true);
      return;
    }
  }

  try {
    await request(`/api/catalogs/cells/${cellId}/members`, {
      method: "POST",
      body: JSON.stringify({ personId: pendingPersonId }),
    });
    await loadCatalogs();
    const activeCell = findCellById(cellId);
    populateCellsForm(activeCell);
    if (cellField.value === activeCell?.cellNumber) {
      syncReportWithCell(false, formData);
    }
    setCellDialogMsg("Miembro agregado.");
  } catch (error) {
    setCellDialogMsg(error.message, true);
  }
}

// Returns true if the report can still be edited.
// Rules:
//   - The report's week must equal the real current week, OR
//   - Grace is active AND the report's week equals realCurrentWeek - 1 (previous week is still open)
//   - Coordinators (isAdmin) can always edit any report
function isReportEditable(report) {
  const reportWeek = Number(getReportWeek(report));
  if (!reportWeek) return false;
  const realWeek = getQuarterWeekNumber();
  if (reportWeek === realWeek) return true;
  // Grace check: allow previous week during grace period
  const graceHours = parseInt(appSettings?.report_grace_hours ?? "0", 10) || 0;
  if (graceHours > 0 && reportWeek === realWeek - 1) {
    const weekStartDay = parseInt(appSettings?.week_start_day ?? "0", 10);
    const now = new Date();
    if (now.getDay() === weekStartDay) {
      const hoursElapsed = now.getHours() + now.getMinutes() / 60;
      if (hoursElapsed < graceHours) return true;
    }
  }
  return false;
}

function getReportByRowId(reportId) {
  const row = Array.from(reportTableBody.querySelectorAll("button[data-action='edit-report']")).find((button) => button.dataset.id === String(reportId));
  return row ? true : false;
}

async function handleReportTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }
  const reportId = button.dataset.id;

  try {
    if (button.dataset.action === "edit-report") {
      const payload = await request(`/api/reports/${reportId}`);
      const report  = payload.report;
      if (!isReportEditable(report)) {
        setFeedback("Este reporte ya no puede editarse — la semana ha cerrado.", true);
        return;
      }
      loadReportIntoForm(report, Number(reportId));
      const formData = report.formData || report;
      // Navegar al formulario de reporte y colocar al usuario en la primera etapa pendiente
      showView("report");
      const resumeStage = pickResumeStage(formData);
      showStage(resumeStage, { skipWeekCheck: true });
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (button.dataset.action === "delete-report") {
      const ok = await appConfirm("¿Eliminar este reporte?\nEsta acción no se puede deshacer.", "Eliminar reporte");
      if (!ok) return;
      await request(`/api/reports/${reportId}`, { method: "DELETE" });
      if (editingReportId === Number(reportId)) {
        resetReportForm();
      }
      await loadReports();
      setFeedback("Reporte eliminado.");
    }
  } catch (error) {
    setFeedback(error.message, true);
  }
}

async function handleRcmDateChange(event) {
  const input = event.target.closest("input.rcm-date-input");
  if (!input) return;
  const personId = parseInt(input.dataset.rcmPersonId, 10);
  const rcmKey   = input.dataset.rcmKey;
  const rcmState = input.dataset.rcmState;
  const newDate  = input.value; // YYYY-MM-DD or empty
  if (!personId || !rcmKey || !newDate) return;

  const person = catalogs.people.find((p) => p.id === personId);
  if (!person) return;

  const newValue = rcmState === "en_curso" ? `en_curso:${newDate}` : newDate;
  try {
    const result = await request(`/api/catalogs/people/${personId}/rcm`, {
      method: "PATCH",
      body: JSON.stringify({ [rcmKey]: newValue }),
    });
    if (!person.rcmProgress) person.rcmProgress = {};
    person.rcmProgress[rcmKey] = result.rcmProgress?.[rcmKey] ?? newValue;
    renderPeopleRows();
    // Don't re-render the whole panel — just keep focus
  } catch (err) {
    setFeedback(err.message, true);
  }
}

async function handleRcmMilestoneClick(event) {
  const btn = event.target.closest("button.rcm-milestone-toggle");
  if (!btn) return;
  const personId = parseInt(btn.dataset.rcmPersonId, 10);
  const rcmKey   = btn.dataset.rcmKey;
  if (!personId || !rcmKey) return;

  const person = catalogs.people.find((p) => p.id === personId);
  if (!person) return;

  const milestone = RCM_MILESTONES.find(m => m.key === rcmKey);
  const today = new Date().toISOString().slice(0, 10);
  const currentVal = person.rcmProgress?.[rcmKey] ?? null;

  let newValue;
  if (milestone?.type === "clase") {
    if (!currentVal) {
      newValue = `en_curso:${today}`;                              // none → en curso
    } else if (String(currentVal).startsWith("en_curso:")) {
      newValue = today;                                            // en curso → completado
    } else {
      newValue = null;                                             // completado → quitar
    }
  } else {
    newValue = currentVal ? null : today;                          // evento: toggle
  }

  try {
    const result = await request(`/api/catalogs/people/${personId}/rcm`, {
      method: "PATCH",
      body: JSON.stringify({ [rcmKey]: newValue }),
    });
    if (!person.rcmProgress) person.rcmProgress = {};
    person.rcmProgress[rcmKey] = result.rcmProgress?.[rcmKey] ?? newValue;
    renderPeopleRcmPanel(person);
    renderPeopleRows();
  } catch (err) {
    setFeedback(err.message, true);
  }
}

function openPeopleEditDialog(person = null) {
  populatePeopleForm(person);
  if (peopleDialogTitle) peopleDialogTitle.textContent = person ? `Editar: ${person.name}` : "Nueva persona";

  // Info row: all current functions + current cell
  if (person && peopleDialogInfoRow) {
    peopleDialogInfoRow.hidden = false;
    if (peopleDialogFnBadges) {
      const chips = [];
      if (person.isCoordinator)    chips.push("coordinator");
      if (person.supervisorSector) chips.push("supervisor");
      // Check cell FKs directly so coordinator/supervisor + leader can coexist
      const pid = String(person.id);
      let cellRole = "";
      for (const cell of catalogs.cells) {
        if (String(cell.leaderPersonId)    === pid) { cellRole = "leader";    break; }
        if (String(cell.assistantPersonId) === pid) { cellRole = "assistant"; break; }
        if (String(cell.hostPersonId)      === pid) { cellRole = "host";      break; }
      }
      if (cellRole) chips.push(cellRole);
      if (!chips.length) chips.push(person.role === "kid" ? "kid" : "member");
      peopleDialogFnBadges.innerHTML = chips.map(fn =>
        `<span class="function-chip function-chip--${fn}">${formatRole(fn)}${fn === "supervisor" && person.supervisorSector ? " · " + person.supervisorSector : ""}</span>`
      ).join("");
    }
    if (peopleDialogCellBadge) {
      peopleDialogCellBadge.textContent = person.assignedCellNumber ? `Célula ${person.assignedCellNumber}` : "Sin célula";
      peopleDialogCellBadge.className = `catalog-assignment-chip${person.assignedCellNumber ? "" : " is-unassigned"}`;
    }
  } else if (peopleDialogInfoRow) {
    peopleDialogInfoRow.hidden = true;
  }

  // Cell select: populate with all cells, pre-select current
  if (peopleDialogCellSelect) {
    peopleDialogCellSelect.innerHTML =
      `<option value="">— Sin célula —</option>` +
      catalogs.cells.map(c =>
        `<option value="${c.id}"${String(c.id) === String(person?.assignedCellId || "") ? " selected" : ""}>${escapeHtml("Célula " + c.cellNumber + (c.networkName ? " · " + c.networkName : ""))}</option>`
      ).join("");
    // Trigger warn check on change
    peopleDialogCellSelect.onchange = () => syncPeopleDialogCellRole(person);
  }

  // Cell-role select: derive current role for this person in their cell
  if (peopleDialogCellRoleSelect) {
    const id = String(person?.id || "");
    let currentCellRole = "";
    if (id && person?.assignedCellId) {
      const cell = catalogs.cells.find(c => String(c.id) === String(person.assignedCellId));
      if (cell) {
        if (String(cell.leaderPersonId) === id) currentCellRole = "leader";
        else if (String(cell.assistantPersonId) === id) currentCellRole = "assistant";
        else if (String(cell.hostPersonId) === id) currentCellRole = "host";
      }
    }
    peopleDialogCellRoleSelect.value = currentCellRole;
  }

  syncPeopleDialogCellRole(person);
  if (peopleEditDialog) peopleEditDialog.showModal();
}

function syncPeopleDialogCellRole(person = null) {
  if (!peopleDialogCellSelect || !peopleDialogLeaderWarn) return;
  const selectedCellId = peopleDialogCellSelect.value;
  const selectedCell = catalogs.cells.find(c => String(c.id) === selectedCellId);
  const personId = String(person?.id || "");
  // Show leader warning if chosen cell already has a different leader
  const cellHasLeader = selectedCell?.leaderPersonId &&
    String(selectedCell.leaderPersonId) !== personId;
  const chosenRole = peopleDialogCellRoleSelect?.value || "";
  const showWarn = !!(cellHasLeader && chosenRole === "leader");
  if (showWarn) {
    const leaderName = catalogs.people.find(p => String(p.id) === String(selectedCell.leaderPersonId))?.name || "otra persona";
    peopleDialogLeaderWarn.innerHTML = `⚠️ Esta célula ya tiene líder: <strong>${escapeHtml(leaderName)}</strong>. Al guardar, será reemplazado.`;
  }
  peopleDialogLeaderWarn.hidden = !showWarn;
}

function openRcmDialog(person) {
  if (!person || !peopleRcmDialog) return;
  if (rcmDialogTitle) rcmDialogTitle.textContent = person.name;
  renderPeopleRcmPanel(person);
  peopleRcmDialog.showModal();
}

async function handlePeopleTableClick(event) {
  const button = event.target.closest("button[data-action]");
  if (!button) {
    return;
  }
  const person = catalogs.people.find((item) => String(item.id) === button.dataset.id);
  if (!person) {
    return;
  }

  try {
    if (button.dataset.action === "edit-person") {
      openPeopleEditDialog(person);
      return;
    }
    if (button.dataset.action === "open-rcm") {
      openRcmDialog(person);
      return;
    }
    if (button.dataset.action === "delete-person") {
      const ok = await appConfirm(`¿Eliminar a "${person.name}"?\nEsta acción no se puede deshacer.`, "Eliminar persona");
      if (!ok) return;
      await request(`/api/catalogs/people/${person.id}`, { method: "DELETE" });
      if (peopleEditDialog?.open) peopleEditDialog.close();
      populatePeopleForm();
      await loadCatalogs();
      setFeedback("Persona eliminada.");
    }
  } catch (error) {
    setFeedback(error.message, true);
  }
}

function handlePeopleFilterClick(event) {
  const button = event.target.closest("button[data-role-filter]");
  if (!button) {
    return;
  }

  activePeopleFilter = button.dataset.roleFilter || "all";
  renderPeopleFilterTabs();
  renderPeopleRows();
}

function handlePeopleSearchInput() {
  activePeopleSearch = peopleSearch.value.trim().toLowerCase();
  renderPeopleRows();
}

function handleCellSearchInput() {
  activeCellSearch = cellSearch.value.trim().toLowerCase();
  renderCellQuickList();
}

function handleCellQuickListClick(event) {
  const button = event.target.closest("button[data-cell-id]");
  if (!button) {
    return;
  }
  populateCellsForm(findCellById(button.dataset.cellId));
}

function handleAttendanceTableInput(event) {
  const target = event.target.closest("[data-attendance-index]");
  if (!target) {
    return;
  }

  const entry = currentMemberAttendance[Number(target.dataset.attendanceIndex)];
  if (!entry) {
    return;
  }

  if (target.dataset.attendanceField === "status" && target instanceof HTMLSelectElement) {
    const stageField = STAGE_STATUS_FIELDS[currentStage];
    if (stageField) {
      entry[stageField] = target.value;
    } else {
      // Fallback raro (etapa sin sub-estado): editar el campo derivado.
      entry.status = target.value;
    }
    entry.status = deriveOverallStatus(entry);
  }
  if (["planningAttended", "reachAttended", "reachPrivileged", "sundayAttended"].includes(target.dataset.attendanceField) && target instanceof HTMLInputElement) {
    entry[target.dataset.attendanceField] = target.checked;
    if (target.dataset.attendanceField === "reachAttended" && !target.checked) {
      entry.reachPrivileged = false;
      const privChk = attendanceTableBody.querySelector(`[data-attendance-index="${target.dataset.attendanceIndex}"][data-attendance-field="reachPrivileged"]`);
      if (privChk) { privChk.checked = false; privChk.disabled = true; }
    } else if (target.dataset.attendanceField === "reachAttended" && target.checked) {
      const privChk = attendanceTableBody.querySelector(`[data-attendance-index="${target.dataset.attendanceIndex}"][data-attendance-field="reachPrivileged"]`);
      if (privChk) { privChk.disabled = false; }
    }
    // No auto-promovemos `status` aquí. La columna "Estado semanal" es
    // compartida entre Planeación/Alcance/Culto y auto-marcar "Presente"
    // al togglear un check de Planeación hacía que al entrar a Alcance
    // todos aparecieran como "Presente" sin que el líder lo hubiera
    // decidido. Si el usuario quiere derivar estado desde actividades,
    // existe el botón "Estado según actividades" (#sync-status-from-activities).
  }
  if (target.dataset.attendanceField === "rcmEventAttended" && target instanceof HTMLInputElement) {
    const rcmKey = target.dataset.rcmKey;
    const personId = target.dataset.personId;
    const dateValue = target.checked ? new Date().toISOString().slice(0, 10) : null;
    if (!entry.rcmProgress) entry.rcmProgress = {};
    entry.rcmProgress[rcmKey] = dateValue;
    // persist immediately
    if (personId) {
      request(`/api/catalogs/people/${personId}/rcm`, {
        method: "PATCH",
        body: JSON.stringify({ [rcmKey]: dateValue }),
      }).then(() => {
        // update the catalog in memory too
        const person = catalogs.people.find((p) => String(p.id) === String(personId));
        if (person) {
          if (!person.rcmProgress) person.rcmProgress = {};
          person.rcmProgress[rcmKey] = dateValue;
        }
        renderAttendanceTable();
      }).catch((err) => setFeedback(err.message, true));
    }
    return;
  }
  if (target.dataset.attendanceField === "note" && target instanceof HTMLInputElement) {
    entry.note = target.value;
  }
  renderAttendanceSummary();
}

function handleKidsTableInput(event) {
  const target = event.target.closest("[data-kid-index]");
  if (!target) {
    return;
  }

  const kid = currentKids[Number(target.dataset.kidIndex)];
  if (!kid) {
    return;
  }

  const fieldName = target.dataset.kidField;
  if (["reachAttended", "sundayAttended"].includes(fieldName) && target instanceof HTMLInputElement) {
    kid[fieldName] = target.checked;
    renderKidsTable();
  } else if (target instanceof HTMLInputElement) {
    kid[fieldName] = target.value;
    renderAttendanceSummary();
  }
}

function handleVisitorTableInput(event) {
  const target = event.target.closest("[data-visitor-index]");
  if (!target) {
    return;
  }
  const visitor = currentVisitors[Number(target.dataset.visitorIndex)];
  if (!visitor) {
    return;
  }

  const fieldName = target.dataset.visitorField;
  if (fieldName === "firstVisit" && target instanceof HTMLInputElement) {
    visitor.firstVisit = target.checked;
    renderAttendanceSummary();
    renderVisitorTable();
  } else if (["reachAttended", "sundayAttended", "converted"].includes(fieldName) && target instanceof HTMLInputElement) {
    visitor[fieldName] = target.checked;
    renderAttendanceSummary();
    renderVisitorTable();
  } else if (fieldName === "invitedBy" && target instanceof HTMLSelectElement) {
    visitor.invitedBy = target.value;
    renderAttendanceSummary();
  } else if (target instanceof HTMLInputElement) {
    visitor[fieldName] = target.value;
    if (fieldName === "name") {
      applyVisitorHistoryToRow(visitor);
    }
    renderAttendanceSummary();
  }
}

function handleVisitorTableClick(event) {
  const button = event.target.closest("button[data-action='remove-visitor']");
  if (!button) {
    return;
  }
  currentVisitors.splice(Number(button.dataset.visitorIndex), 1);
  renderVisitorTable();
}

function handleKidsTableClick(event) {
  const button = event.target.closest("button[data-action='remove-kid']");
  if (!button) {
    return;
  }
  currentKids.splice(Number(button.dataset.kidIndex), 1);
  renderKidsTable();
}

function handleBaptismTableInput(event) {
  const target = event.target.closest("[data-baptism-index]");
  if (!target) {
    return;
  }
  const entry = currentBaptisms[Number(target.dataset.baptismIndex)];
  if (!entry || !(target instanceof HTMLInputElement)) {
    return;
  }
  entry[target.dataset.baptismField] = target.type === "checkbox" ? target.checked : target.value;
  if (target.dataset.baptismField === "promoteToMember") {
    setFeedback(target.checked ? "Este bautizado se agregará a los miembros de la célula al guardar el reporte." : "Este bautizado no se agregará como miembro al guardar el reporte.");
  }
  syncDerivedMetricFields();
  if (event.type === "change") {
    renderBaptismTable();
  }
}

function handleBaptismTableClick(event) {
  const button = event.target.closest("button[data-action='remove-baptism']");
  if (!button) {
    return;
  }
  currentBaptisms.splice(Number(button.dataset.baptismIndex), 1);
  renderBaptismTable();
}

function handleAddVisitorClick() {
  currentVisitors.push({ name: "", invitedBy: "", reachAttended: true, sundayAttended: false, firstVisit: true, converted: false, contacted: false, eventAttended: false, phone: "", note: "" });
  renderVisitorTable();
}

function handleAddKidClick() {
  currentKids.push({ personId: null, name: "", guardianName: "", source: "visit", reachAttended: false, sundayAttended: false, note: "" });
  renderKidsTable();
}

function handleAddBaptismClick() {
  const captureStatus = getBaptismCaptureStatus();
  currentBaptisms.push({
    name: "",
    baptismDate: getReportDateValue(),
    source: captureStatus.isAllowed ? "report" : "fuera-cierre",
    note: "",
    promoteToMember: true,
  });
  if (!captureStatus.isAllowed) {
    setFeedback("Bautismo agregado. Se guardará para promoverlo como miembro, pero no contará en el cierre cuatrimestral.");
  } else {
    clearFeedback();
  }
  renderBaptismTable();
}

function handleVisitorQuickSubmit() {
  const name = String(visitorQuickName?.value || "").trim();
  if (!name) {
    setFeedback("Escribe el nombre de la visita para agregarla.", true);
    visitorQuickName?.focus();
    return;
  }

  clearFeedback();
  applyQuickVisitorHistory(name);
  currentVisitors.push({
    name,
    invitedBy: String(visitorQuickInvitedBy?.value || "").trim(),
    reachAttended: Boolean(visitorQuickReach?.checked),
    sundayAttended: Boolean(visitorQuickSunday?.checked),
    firstVisit: Boolean(visitorQuickFirstVisit?.checked),
    converted: Boolean(visitorQuickConverted?.checked),
    contacted: false,
    eventAttended: Boolean(visitorQuickEvent?.checked),
    phone: "",
    note: "",
  });
  renderVisitorTable();
  resetVisitorQuickForm();
  if (visitorQuickName instanceof HTMLInputElement) {
    visitorQuickName.focus();
  }
}

function handleVisitorQuickReset() {
  resetVisitorQuickForm();
  clearFeedback();
}

async function handleMemberListClick(event) {
  const button = event.target.closest("button[data-action='remove-member']");
  const activeCellId = cellsEditId.value || memberList?.dataset.cellId || "";
  if (!button || !activeCellId) return;

  const memberName = catalogs.people.find(p => String(p.id) === button.dataset.personId)?.name || "esta persona";
  const ok = await appConfirm(`¿Quitar a "${memberName}" de la célula?`, "Quitar miembro");
  if (!ok) return;

  try {
    await request(`/api/catalogs/cells/${activeCellId}/members/${button.dataset.personId}`, { method: "DELETE" });
    await loadCatalogs();
    const activeCell = findCellById(activeCellId);
    const reportCell = findCellByNumber(cellField.value);
    if (reportCell && String(reportCell.id) === String(activeCellId)) {
      syncReportWithCell(false);
    }
    populateCellsForm(activeCell);
    setFeedback("Miembro removido de la célula.");
  } catch (error) {
    setFeedback(error.message, true);
  }
}

reportForm.addEventListener("submit", handleReportSubmit);
peopleForm.addEventListener("submit", handlePeopleSubmit);
cellsForm.addEventListener("submit", handleCellsSubmit);
memberForm.addEventListener("submit", handleMemberSubmit);

// Role-picker inside cell dialog
cellMemberRoleTable?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const cellId = memberList?.dataset.cellId || cellsEditId?.value || "";
  if (!cellId) return;
  const personId = btn.dataset.personId;
  const cell = findCellById(cellId);
  if (!cell) return;

  if (btn.dataset.action === "remove-member") {
    const memberName = catalogs.people.find(p => String(p.id) === personId)?.name || "esta persona";
    const ok = await appConfirm(`¿Quitar a "${memberName}" de la célula?`, "Quitar miembro");
    if (!ok) return;
    try {
      await request(`/api/catalogs/cells/${cellId}/members/${personId}`, { method: "DELETE" });
      await loadCatalogs();
      const fresh = findCellById(cellId);
      populateCellsForm(fresh);
    } catch (err) { setFeedback(err.message, true); }
    return;
  }

  if (btn.dataset.action === "set-cell-role") {
    const role = btn.dataset.role; // leader | assistant | host
    const isActive = btn.classList.contains(`fn-tag--${role}`);
    // Toggle: if already active → clear, else assign
    const newLeader    = role === "leader"    ? (isActive ? "" : personId) : (cell.leaderPersonId    ? String(cell.leaderPersonId)    : "");
    const newAssistant = role === "assistant" ? (isActive ? "" : personId) : (cell.assistantPersonId ? String(cell.assistantPersonId) : "");
    const newHost      = role === "host"      ? (isActive ? "" : personId) : (cell.hostPersonId      ? String(cell.hostPersonId)      : "");
    const payload = {
      cellNumber:     cell.cellNumber,
      networkName:    cell.networkName    || "",
      sector:         cell.sector        || "",
      zoneName:       cell.zoneName      || "",
      districtName:   cell.districtName  || "",
      address:        cell.address       || "",
      leaderPersonId:    newLeader,
      assistantPersonId: newAssistant,
      hostPersonId:      newHost,
    };
    try {
      await request(`/api/catalogs/cells/${cellId}`, { method: "PUT", body: JSON.stringify(payload) });
      await loadCatalogs();
      const fresh = findCellById(cellId);
      populateCellsForm(fresh);
    } catch (err) { setFeedback(err.message, true); }
  }
});
weekField.addEventListener("change", syncPhaseIndicator);
// Past weeks that are still selectable (grace period) — no special load needed.
// Past weeks with existing reports are now `disabled` in the dropdown.
showReportViewButton.addEventListener("click", () => showView("report"));
showDashboardViewButton?.addEventListener("click", () => showView("dashboard"));
showAdminViewButton.addEventListener("click", () => showView("admin"));
showSettingsViewButton?.addEventListener("click", () => showView("settings"));
showSeguimientoViewButton?.addEventListener("click", () => showView("seguimiento"));

// Sub-tab switching inside seguimiento view
document.getElementById("seg-view-tab-bar")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".seg-view-tab[data-segtab]");
  if (!btn) return;
  activateSegTab(btn.dataset.segtab);
});

// ── Stage nav ────────────────────────────────────────────────────────────────
let currentStage = "encabezado";
const STAGES = ["encabezado", "planificacion", "alcance", "culto", "cierre"];

function showStage(stage, { skipWeekCheck = false } = {}) {
  // Bloquear avance si la semana seleccionada es mayor a la semana actual
  if (stage !== "encabezado" && !skipWeekCheck) {
    const maxWeek = getQuarterWeekNumber();
    const selectedWeek = parseInt(weekField?.value || "1", 10);
    if (selectedWeek > maxWeek) {
      setFeedback(`No puedes avanzar — la semana ${selectedWeek} aún no ha iniciado. Actualmente estamos en la semana ${maxWeek}.`, true);
      return;
    }
  }
  currentStage = stage;
  document.querySelectorAll(".stage-tab").forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.stage === stage);
  });

  // Show/hide: visible if data-stage contains the current stage (space-separated list supported)
  document.querySelectorAll("[data-stage]").forEach(el => {
    if (el.classList.contains("stage-nav") || el.classList.contains("stage-tab") || el.closest(".stage-nav")) return;
    const elStages = (el.dataset.stage || "").split(" ");
    const isVisible = el.classList.contains("stage-save-bar")
      ? elStages.includes(stage)
      : elStages.includes(stage);
    el.classList.toggle("stage-visible", isVisible);
  });

  const stageLabels = { encabezado: "Reporte · Inicio", planificacion: "Reporte · Planeación", alcance: "Reporte · Alcance", culto: "Reporte · Culto", cierre: "Reporte · Cierre" };
  if (topbarRouteLabel) topbarRouteLabel.textContent = stageLabels[stage] ?? "Reporte";
  document.body.dataset.activeStage = stage;
  // La columna "Estado semanal" muestra el sub-estado de la etapa activa;
  // hay que re-pintar la tabla para que el <select> refleje el valor correcto.
  if (typeof renderAttendanceTable === "function" && attendanceTableBody && currentMemberAttendance.length) {
    renderAttendanceTable();
  }
}

// Wire stage tab clicks
document.querySelectorAll(".stage-tab").forEach(btn => {
  btn.addEventListener("click", async () => {
    // Antes de cambiar de etapa, si el formulario está visualmente vacío (sin
    // marcas en miembros/visitas/niños/bautizos y sin reporte en edición),
    // intentar recuperar un borrador previo del backend. Esto cubre el caso
    // en que un fetch inicial falló silenciosamente y reportsData quedó vacío
    // o el draft no se cargó por una race condition en cold-start de Render.
    try {
      const hasMemberActivity = (currentMemberAttendance || []).some(
        m => m && (m.planningAttended || m.reachAttended || m.sundayAttended || (m.status && m.status !== "pending"))
      );
      const hasVisitorActivity = (currentVisitors || []).some(v => v && String(v.name || "").trim());
      const hasKidActivity = (currentKids || []).some(k => k && (k.reachAttended || k.sundayAttended));
      const hasBaptismActivity = (currentBaptisms || []).some(b => b && String(b.name || "").trim());
      const formIsEmpty = !hasMemberActivity && !hasVisitorActivity && !hasKidActivity && !hasBaptismActivity;
      const cellVal = String(cellField?.value || "").trim();
      const weekVal = String(weekField?.value || "").trim();
      if (formIsEmpty && !editingReportId && cellVal && weekVal) {
        await autoLoadExistingReportIfAny(cellVal, Number(weekVal));
      }
    } catch (e) {
      console.warn("[stage-click] no se pudo recuperar borrador", e);
    }
    showStage(btn.dataset.stage);
  });
});

// Mark stage as saved (green badge)
function markStageSaved(stage) {
  const badge = document.querySelector(`#stage-badge-${stage}`);
  if (badge) badge.hidden = false;
  const tab = document.querySelector(`.stage-tab[data-stage="${stage}"]`);
  if (tab) tab.classList.add("has-draft");
}

// Compute internal cycle report ID — e.g. "1cuart2026" (Q1), "2cuart2026" (Q2), "3cuart2026" (Q3)
// El número refleja el CUATRIMESTRE del reporte (1, 2 ó 3) según la fecha, no el conteo.
function computeCycleReportId(cellNumber, currentYear) {
  const year = String(currentYear || new Date().getFullYear());
  // Derivar cuatrimestre desde la fecha capturada (misma regla que getReportQuarter)
  const dateVal = getReportDateValue();
  let q;
  const month = parseInt(String(dateVal).slice(5, 7), 10) - 1; // 0-indexed
  if (!isNaN(month) && month >= 0) {
    q = month <= 3 ? 1 : month <= 7 ? 2 : 3;
  } else {
    q = getCurrentQuarter();
  }
  return `${q}cuart${year}`;
}

// Auto-advance the week selector to the next unreported week for this cell in the current cycle.
// A "cycle" is a cuatrimestre (weeks 1..N, donde N = getRcmTotalWeeks()). Only advances if not editing an existing report.
async function autoAdvanceWeekForCell(cellNumber) {
  if (editingReportId) return;  // don't override when editing
  const cell = String(cellNumber || "").trim();
  if (!cell) return;

  // Ensure cellField reflects the cell we're computing for (so populateWeekOptions
  // sees the right cell when computing "reported past weeks").
  if (cellField.value !== cell) cellField.value = cell;
  // Repopulate the week dropdown so "✓ entregado" / "🔒 cerrada" / "· gracia"
  // reflect the actual reports for THIS cell.
  populateWeekOptions();

  // maxWeek = real current week (ignoring grace); grace only widens minWeek backward
  const realCurrentWeek = getQuarterWeekNumber();
  const maxWeek = realCurrentWeek;
  const cycleStartStr = appSettings.cycle_start_date;

  const currentYear = String(new Date().getFullYear());
  // Determine current quarter: Jan-Apr=1, May-Aug=2, Sep-Dec=3
  const month = new Date().getMonth(); // 0-based
  const currentQuarter = month <= 3 ? 1 : month <= 7 ? 2 : 3;

  // Find weeks already reported for this cell in the current cycle
  const reportedWeeks = new Set(
    reportsData
      .filter(r => {
        const rCell = String(r.cellNumber || r.formData?.cellNumber || "").trim();
        const rYear = getReportYear(r);
        const rWeek = Number(getReportWeek(r));
        if (rCell !== cell || rYear !== currentYear || !rWeek) return false;
        // Borradores no cuentan como reportados, para que el flujo siga reanudable
        const rDraft = r.formData?._draft === true || r.formData?._draft === "true";
        if (rDraft) return false;
        // If cycle_start_date configured, filter by cycle; otherwise by quarter
        const rDate = String(r.reportDate || r.formData?.reportDate || "");
        if (cycleStartStr) {
          return rDate >= cycleStartStr;
        }
        if (rDate) {
          const rMonth = Number(rDate.slice(5, 7)) - 1;
          const rQuarter = rMonth <= 3 ? 1 : rMonth <= 7 ? 2 : 3;
          return rQuarter === currentQuarter;
        }
        return true;
      })
      .map(r => Number(getReportWeek(r)))
  );

  // Find the first unreported week up to maxWeek
  // minWeek: without grace, cannot go before current week (past weeks are locked)
  const graceHours = parseInt(appSettings?.report_grace_hours ?? "0", 10) || 0;
  const inGrace = graceHours > 0 && (() => {
    const weekStartDay = parseInt(appSettings?.week_start_day ?? "0", 10);
    const now = new Date();
    if (now.getDay() !== weekStartDay) return false;
    return (now.getHours() + now.getMinutes() / 60) < graceHours;
  })();
  const minWeek = inGrace ? Math.max(1, maxWeek - 1) : maxWeek;

  let nextWeek = maxWeek; // default: current week
  for (let w = minWeek; w <= maxWeek; w++) {
    if (!reportedWeeks.has(w)) { nextWeek = w; break; }
  }
  // If all weeks up to maxWeek are already reported, stay on maxWeek (to edit it)
  if (nextWeek > maxWeek) nextWeek = maxWeek;

  weekField.value = String(nextWeek);
  syncPhaseIndicator();

  // Si ya existe un reporte para esta semana en el ciclo actual, cargarlo en modo edición.
  // Esperamos para que el formulario tenga los datos antes de que el usuario interactúe
  // (importante en Render cold-start: la primera request puede tardar varios segundos).
  await autoLoadExistingReportIfAny(cell, nextWeek);
}

// Determina la primera etapa pendiente de llenar a partir de los datos del reporte.
// Útil al reabrir un borrador o reporte para colocar al usuario donde dejó.
function inferNextIncompleteStage(formData) {
  const fd = formData || {};
  const members  = Array.isArray(fd.memberAttendance) ? fd.memberAttendance : [];
  const visitors = Array.isArray(fd.visitors) ? fd.visitors : [];
  const kids     = Array.isArray(fd.kids) ? fd.kids : [];
  const baptisms = Array.isArray(fd.baptisms) ? fd.baptisms : [];

  const hasPlanificacion = members.some(m => m && m.planningAttended);
  const hasAlcance =
    members.some(m => m && m.reachAttended) ||
    visitors.some(v => v && v.reachAttended) ||
    kids.some(k => k && k.reachAttended);
  const hasCulto =
    members.some(m => m && m.sundayAttended) ||
    visitors.some(v => v && v.sundayAttended) ||
    kids.some(k => k && k.sundayAttended);
  const hasCierre =
    baptisms.some(b => b && b.name) ||
    String(fd.notes || "").trim().length > 0;

  if (!hasPlanificacion) return "planificacion";
  if (!hasAlcance)       return "alcance";
  if (!hasCulto)         return "culto";
  if (!hasCierre)        return "cierre";
  return "cierre"; // todo lleno → quedarse en el cierre para finalizar
}

// Decide la etapa al reabrir un borrador / reporte.
// `lastStage` es la última etapa que el usuario GUARDÓ explícitamente
// (clic en "Guardar y continuar"). Como ya está guardada, lo lógico es
// llevarlo a la siguiente etapa pendiente. Si la última guardada es la
// final (`cierre`), nos quedamos ahí. Si no hay `lastStage`, inferimos
// la primera etapa con datos como fallback.
function pickResumeStage(formData) {
  const fd = formData || {};
  if (fd.lastStage && STAGES.includes(fd.lastStage)) {
    const idx = STAGES.indexOf(fd.lastStage);
    // Avanza a la siguiente etapa; si ya estaba en la última, quédate ahí.
    return idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1] : fd.lastStage;
  }
  // Si no hay lastStage, ir a la primera etapa con datos (review-first)
  const members  = Array.isArray(fd.memberAttendance) ? fd.memberAttendance : [];
  const visitors = Array.isArray(fd.visitors) ? fd.visitors : [];
  const kids     = Array.isArray(fd.kids) ? fd.kids : [];
  const baptisms = Array.isArray(fd.baptisms) ? fd.baptisms : [];
  if (members.some(m => m && m.planningAttended)) return "planificacion";
  if (members.some(m => m && m.reachAttended) || visitors.some(v => v && v.reachAttended) || kids.some(k => k && k.reachAttended)) return "alcance";
  if (members.some(m => m && m.sundayAttended) || visitors.some(v => v && v.sundayAttended) || kids.some(k => k && k.sundayAttended)) return "culto";
  if (baptisms.some(b => b && b.name) || String(fd.notes || "").trim()) return "cierre";
  return "encabezado";
}

async function autoLoadExistingReportIfAny(cell, week) {
  if (editingReportId) return;
  const cycleStartStr = appSettings.cycle_start_date;
  if (!cycleStartStr) {
    console.warn("[autoLoad] sin cycle_start_date en settings");
    return;
  }

  // Si reportsData está vacío, intentar recargar (puede haber fallado durante init)
  if (!Array.isArray(reportsData) || reportsData.length === 0) {
    console.warn("[autoLoad] reportsData vacío, recargando…");
    try {
      await loadReports();
    } catch (e) {
      console.error("[autoLoad] no se pudo recargar reportsData", e);
    }
  }

  const existing = reportsData.find(r => {
    const rCell = String(r.cellNumber || r.formData?.cellNumber || "").trim();
    const rWeek = Number(getReportWeek(r));
    const rDate = String(r.reportDate || r.formData?.reportDate || "");
    return rCell === String(cell) && rWeek === Number(week) && rDate >= cycleStartStr;
  });
  if (!existing) {
    console.info(`[autoLoad] sin reporte previo para cell=${cell} week=${week} (reportsData.length=${reportsData.length})`);
    return;
  }
  // If the report is no longer editable (closed week), show in read-only mode
  if (!isReportEditable(existing)) {
    try {
      const payload = await request(`/api/reports/${existing.id}`);
      enterReadOnlyMode(payload.report);
    } catch (e) {
      console.error("[autoLoad] error cargando reporte readonly", e);
    }
    return;
  }

  try {
    const payload = await request(`/api/reports/${existing.id}`);
    loadReportIntoForm(payload.report, Number(existing.id));
    const formData = payload.report.formData || payload.report;
    // Coloca al usuario en la primera etapa pendiente (usa lastStage si existe, si no infiere por datos)
    const resumeStage = pickResumeStage(formData);
    showStage(resumeStage, { skipWeekCheck: true });
    if (formData.lastStage) {
      setFeedback(`Continuando borrador en “${resumeStage}”.`);
    } else {
      setFeedback(`Semana ${week} ya tiene reporte — continuando en “${resumeStage}”.`);
    }
  } catch (e) {
    console.error("[autoLoad] error cargando reporte editable", e);
  }
}

// Carga un reporte en el formulario en el orden correcto, asegurando que
// currentMemberAttendance/visitors/kids/baptisms queden sincronizados con
// la data guardada. Centraliza la lógica que antes estaba duplicada en
// autoLoadExistingReportIfAny / handleReportTableClick / edit-from-preview.
function loadReportIntoForm(report, reportId) {
  if (!report) return;
  const formData = report.formData || report;

  editingReportId = Number(reportId || report.id);

  // 1. Reset y reconstruir selects ANTES de asignar valores (para que las
  //    opciones existan cuando hagamos .value = ...).
  reportForm.reset();
  renderReportPersonSelects();
  renderCellOptions();

  // 2. Llenar los campos simples del formulario.
  Object.entries(formData).forEach(([name, value]) => {
    const field = reportForm.elements.namedItem(name);
    if (field instanceof HTMLInputElement || field instanceof HTMLSelectElement || field instanceof HTMLTextAreaElement) {
      field.value = value == null ? "" : String(value);
    }
  });

  // 3. Reasignar selects de líder/asistente/anfitrión/célula (los renderSelect
  //    de arriba podrían haber borrado el value seteado por Object.entries).
  if (formData.cellNumber) cellField.value = String(formData.cellNumber);
  leaderField.value    = formData.leaderName    || "";
  assistantField.value = formData.assistantName || "";
  hostField.value      = formData.hostName      || "";
  if (formData.week)   weekField.value = String(formData.week);

  // 4. Sincronizar listas (members/visitors/kids/baptisms) CON la data guardada.
  syncReportWithCell(false, formData);

  // 5. Red de seguridad: si por cualquier motivo currentMemberAttendance
  //    quedó vacío pero la celda existe y la data trae miembros, forzar
  //    una reaplicación + re-render. Evita el bug donde se mostraba la
  //    tabla con checkboxes en blanco aunque el draft sí tuviera datos.
  const cellObj = findCellByNumber(cellField.value);
  const savedMembers = Array.isArray(formData.memberAttendance) ? formData.memberAttendance : [];
  if (cellObj && savedMembers.length && currentMemberAttendance.every(m => !m.planningAttended && !m.reachAttended && !m.sundayAttended && m.status === "pending")) {
    applyWeeklyCollectionsForCell(cellObj, formData);
  }

  syncPhaseIndicator();
}

// Guardar borrador — saves current form state without browser validation
async function saveDraft(stage) {
  clearFeedback();
  const fd = new FormData(reportForm);
  const payload = Object.fromEntries(fd.entries());
  payload.week          = weekField.value      || payload.week          || "";
  payload.cellNumber    = cellField.value        || payload.cellNumber    || "";
  payload.leaderName    = leaderField.value    || payload.leaderName    || "";
  payload.assistantName = assistantField.value || payload.assistantName || "";
  payload.hostName      = hostField.value      || payload.hostName      || "";
  payload.address       = reportAddress.value  || payload.address       || "";
  payload.memberAttendance  = currentMemberAttendance;
  payload.visitors          = currentVisitors.filter(v => String(v.name || "").trim());
  payload.kids              = currentKids.filter(k => String(k.name || "").trim());
  payload.baptisms          = normalizeBaptisms(currentBaptisms).filter(e => e.name);
  payload.attendanceSummary = computeWeeklySummary();
  // Si estamos editando un reporte ya finalizado, no degradarlo a borrador.
  const editingExisting = editingReportId
    ? (reportsData || []).find(r => Number(r.id) === Number(editingReportId))
    : null;
  const wasFinalized = editingExisting
    && !(editingExisting.formData?._draft === true || editingExisting.formData?._draft === "true");
  if (!wasFinalized) {
    payload._draft = true;
    payload.lastStage = stage;
  } else {
    delete payload._draft;
    delete payload.lastStage;
  }
  payload.cycleReportId = computeCycleReportId(payload.cellNumber, getReportYearValue());

  if (!payload.week || !payload.cellNumber) {
    setFeedback(t("err.selectWeekCell"), true);
    return;
  }
  try {
    if (editingReportId) {
      await request(`/api/reports/${editingReportId}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      const result = await request("/api/reports", { method: "POST", body: JSON.stringify(payload) });
      if (result?.id) editingReportId = result.id;
    }
    markStageSaved(stage);
    await loadReports();
    setFeedback(t("err.draftSaved", { stage }));
  } catch (err) {
    setFeedback(err.message, true);
  }
}

document.querySelector("#save-next-culto")?.addEventListener("click",           () => saveDraftAndAdvance("culto"));
document.querySelector("#finalizar-reporte")?.addEventListener("click",         () => finalizarReporte());

// Guardar y continuar — saves then advances to next stage
async function saveDraftAndAdvance(stage) {
  await saveDraft(stage);
  const idx = STAGES.indexOf(stage);
  if (idx >= 0 && idx < STAGES.length - 1) showStage(STAGES[idx + 1]);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// Finalizar reporte — submits the full report form (final save, not a draft)
async function finalizarReporte() {
  clearFeedback();
  const fd = new FormData(reportForm);
  const payload = Object.fromEntries(fd.entries());
  payload.week          = weekField.value      || payload.week          || "";
  payload.cellNumber    = cellField.value        || payload.cellNumber    || "";
  payload.leaderName    = leaderField.value    || payload.leaderName    || "";
  payload.assistantName = assistantField.value || payload.assistantName || "";
  payload.hostName      = hostField.value      || payload.hostName      || "";
  payload.address       = reportAddress.value  || payload.address       || "";
  payload.memberAttendance  = currentMemberAttendance;
  payload.visitors          = currentVisitors.filter(v => String(v.name || "").trim());
  payload.kids              = currentKids.filter(k => String(k.name || "").trim());
  payload.baptisms          = normalizeBaptisms(currentBaptisms).filter(e => e.name);
  payload.attendanceSummary = computeWeeklySummary();
  payload.cycleReportId     = computeCycleReportId(payload.cellNumber, getReportYearValue());
  delete payload._draft;
  delete payload.lastStage;

  if (!payload.week || !payload.cellNumber) {
    setFeedback(t("err.selectWeekCellFin"), true);
    return;
  }

  const promotedCount = countBaptismsToPromote(payload.baptisms);
  const msg = promotedCount
    ? `Reporte finalizado. ${promotedCount} bautizado(s) agregado(s) como miembro(s).`
    : "Reporte finalizado y guardado.";

  try {
    if (editingReportId) {
      await request(`/api/reports/${editingReportId}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      const result = await request("/api/reports", { method: "POST", body: JSON.stringify(payload) });
      if (result?.id) editingReportId = result.id;
    }
    markStageSaved("cierre");
    const savedCell = payload.cellNumber;
    await loadCatalogs();
    await loadReports();
    resetReportForm();
    // After reset, keep the same cell and auto-advance to next unreported week
    if (savedCell) {
      cellField.value = String(savedCell);
      syncReportWithCell(true);
      autoAdvanceWeekForCell(savedCell);
    }
    showStage("encabezado");
    window.scrollTo({ top: 0, behavior: "smooth" });
    setFeedback(msg);
  } catch (err) {
    setFeedback(err.message, true);
  }
}
document.querySelector("#save-next-encabezado")?.addEventListener("click",    () => saveDraftAndAdvance("encabezado"));
document.querySelector("#save-next-planificacion")?.addEventListener("click", () => saveDraftAndAdvance("planificacion"));
document.querySelector("#save-next-alcance")?.addEventListener("click",       () => saveDraftAndAdvance("alcance"));

// Init stage on load
showStage("encabezado");


adminSectionNav?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-admin-target]");
  if (!button) {
    return;
  }
  goToAdminSection(button.dataset.adminTarget);
});
resetButton.addEventListener("click", () => {
  clearFeedback();
  resetReportForm();
});
peopleResetButton.addEventListener("click", () => {
  if (peopleEditDialog?.open) peopleEditDialog.close();
  populatePeopleForm();
});
document.querySelector("#people-new-btn")?.addEventListener("click", () => openPeopleEditDialog(null));
// Dialog close buttons & backdrop
if (peopleEditDialog) {
  document.querySelector("#people-dialog-close-btn")?.addEventListener("click", () => peopleEditDialog.close());
  peopleEditDialog.addEventListener("click", (e) => { if (e.target === peopleEditDialog) peopleEditDialog.close(); });
}
// Wire leader-warn on role select change (person ref captured at dialog open time via onchange on cell select)
peopleDialogCellRoleSelect?.addEventListener("change", () => syncPeopleDialogCellRole());
if (peopleRcmDialog) {
  document.querySelector("#rcm-dialog-close-btn")?.addEventListener("click",  () => peopleRcmDialog.close());
  document.querySelector("#rcm-dialog-done-btn")?.addEventListener("click",   () => peopleRcmDialog.close());
  peopleRcmDialog.addEventListener("click", (e) => { if (e.target === peopleRcmDialog) peopleRcmDialog.close(); });
}
if (peopleRcmPanel) {
  peopleRcmPanel.addEventListener("click", handleRcmMilestoneClick);
  peopleRcmPanel.addEventListener("change", handleRcmDateChange);
}
cellsResetButton.addEventListener("click", () => {
  if (cellEditDialog?.open) cellEditDialog.close();
  populateCellsForm();
});
// Cell edit dialog
document.querySelector("#cell-new-btn")?.addEventListener("click", () => openCellEditDialog(null));

document.querySelector("#cell-renumber-btn")?.addEventListener("click", async () => {
  const cells = [...catalogs.cells].sort((a, b) => {
    const na = parseInt(a.cellNumber, 10) || 0;
    const nb = parseInt(b.cellNumber, 10) || 0;
    return na - nb || a.cellNumber.localeCompare(b.cellNumber);
  });
  const preview = cells.map((c, i) => `  Célula ${c.cellNumber} → ${i + 1}`).join("\n");
  const ok = await appConfirm(
    `Esto renumerará ${cells.length} células en orden:\n\n${preview}\n\n¿Continuar?`,
    "Renumerar células"
  );
  if (!ok) return;
  try {
    await request("/api/catalogs/cells/renumber", { method: "POST" });
    await loadCatalogs();
    setFeedback("Células renumeradas correctamente.");
  } catch (err) {
    setFeedback(err.message, true);
  }
});
document.querySelector("#cell-dialog-close-btn")?.addEventListener("click", () => cellEditDialog?.close());
cellEditDialog?.addEventListener("click", (e) => { if (e.target === cellEditDialog) cellEditDialog.close(); });

// "Nueva persona" button inside cell dialog — opens people edit dialog with cell pre-selected
document.querySelector("#cell-dialog-new-person-btn")?.addEventListener("click", () => {
  const cellId = cellsEditId?.value || "";
  // Open people dialog for a new person
  openPeopleEditDialog(null);
  // Pre-select the current cell in the people dialog cell select
  if (cellId && peopleDialogCellSelect) {
    peopleDialogCellSelect.value = cellId;
    syncPeopleDialogCellRole(null);
  }
});
// Cells table click (edit / delete)
cellsTableBody?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const cellId = btn.dataset.id;
  if (btn.dataset.action === "edit-cell") {
    openCellEditDialog(findCellById(cellId));
  } else if (btn.dataset.action === "delete-cell") {
    const cell = findCellById(cellId);
    const ok = await appConfirm(`¿Eliminar Célula ${cell?.cellNumber}?\nLos miembros no se borran, solo quedan sin célula asignada.`, "Eliminar célula");
    if (!ok) return;
    try {
      await request(`/api/catalogs/cells/${cellId}`, { method: "DELETE" });
      await loadCatalogs();
      setFeedback("Célula eliminada.");
    } catch (err) { setFeedback(err.message, true); }
  }
});
cellField.addEventListener("change", () => {
  syncReportWithCell(true);
  populateWeekOptions(); // re-evaluate disabled past weeks for the new cell
  autoAdvanceWeekForCell(cellField.value);
});
reportForm.elements.namedItem("reportDate")?.addEventListener?.("change", () => {
  syncWeekFieldWithReportDate(true);
  renderBaptismTable();
});
// people-is-kid lives inside the modal, attach after DOM is ready
document.getElementById("people-is-kid")?.addEventListener("change", syncPeopleGuardianFields);
reportTableBody.addEventListener("click", handleReportTableClick);
document.getElementById("report-cycles-list")?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  if (btn.dataset.action === "new-report-for-cell") {
    const cell = btn.dataset.cell;
    const week = btn.dataset.week;
    const realWeek = getQuarterWeekNumber();
    if (Number(week) < realWeek) {
      setFeedback(`La semana ${week} ya cerró y no puede capturarse.`, true);
      return;
    }
    resetReportForm();
    if (cell) { cellField.value = cell; syncReportWithCell(true); }
    if (week) { weekField.value = week; syncPhaseIndicator(); }
    showView("report");
    showStage("encabezado", { skipWeekCheck: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (btn.dataset.action === "view-report") {
    // Open preview modal (read-only) instead of loading in form
    const reportId = btn.dataset.id;
    try {
      const payload = await request(`/api/reports/${reportId}`);
      const report  = payload.report;
      if (!reportPreviewDialog) return;
      const cell = String(report.cellNumber || report.formData?.cellNumber || "—");
      const week = String(report.formData?.week || report.week || "—");
      if (previewDialogTitle) previewDialogTitle.textContent = `Célula ${cell} · Semana ${week}`;
      if (previewDialogBody)  previewDialogBody.innerHTML = buildReportPreviewHtmlFromData(report);
      if (previewDialogFooter) previewDialogFooter.hidden = false;
      const cancelBtn  = document.getElementById("preview-cancel-btn");
      const confirmBtn = document.getElementById("preview-confirm-btn");
      const editFromSegBtn = document.getElementById("preview-edit-from-seg-btn");
      if (cancelBtn)  cancelBtn.hidden  = true;
      if (confirmBtn) confirmBtn.hidden = true;
      if (editFromSegBtn) {
        editFromSegBtn.hidden = !isReportEditable(report);
        editFromSegBtn.onclick = async () => {
          reportPreviewDialog.close();
          const fullPayload = await request(`/api/reports/${reportId}`);
          loadReportIntoForm(fullPayload.report, Number(reportId));
          showView("report");
          showStage("encabezado", { skipWeekCheck: true });
          window.scrollTo({ top: 0, behavior: "smooth" });
        };
      }
      reportPreviewDialog.showModal();
    } catch (err) { setFeedback(err.message, true); }
  } else {
    handleReportTableClick(e);
  }
});

// Seguimiento: click en chips (ver detalle o capturar reporte)
document.getElementById("seguimiento-cycles-list")?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  if (btn.dataset.action === "new-report-for-cell") {
    const cell = btn.dataset.cell;
    const week = btn.dataset.week;
    const realWeek = getQuarterWeekNumber();
    // Block past weeks — should not be reachable (chip is disabled), but defensive
    if (Number(week) < realWeek) {
      setFeedback(`La semana ${week} ya cerró y no puede capturarse.`, true);
      return;
    }
    resetReportForm();
    if (cell) { cellField.value = cell; syncReportWithCell(true); }
    if (week) { weekField.value = week; syncPhaseIndicator(); }
    showView("report");
    showStage("encabezado", { skipWeekCheck: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else if (btn.dataset.action === "view-report") {
    const reportId = btn.dataset.id;
    try {
      const payload = await request(`/api/reports/${reportId}`);
      const report  = payload.report;
      if (!reportPreviewDialog) return;
      const cell = String(report.cellNumber || report.formData?.cellNumber || "—");
      const week = String(report.formData?.week || report.week || "—");
      if (previewDialogTitle) previewDialogTitle.textContent = `Célula ${cell} · Semana ${week}`;
      if (previewDialogBody)  previewDialogBody.innerHTML = buildReportPreviewHtmlFromData(report);
      // Show read-only footer with "Editar" button
      if (previewDialogFooter) previewDialogFooter.hidden = false;
      const cancelBtn  = document.getElementById("preview-cancel-btn");
      const confirmBtn = document.getElementById("preview-confirm-btn");
      const editFromSegBtn = document.getElementById("preview-edit-from-seg-btn");
      if (cancelBtn)  cancelBtn.hidden  = true;
      if (confirmBtn) confirmBtn.hidden = true;
      if (editFromSegBtn) {
        // Only show edit button if the report is still editable
        editFromSegBtn.hidden = !isReportEditable(report);
        // Wire once so no stale listeners
        const handler = async () => {
          reportPreviewDialog.close();
          const fullPayload = await request(`/api/reports/${reportId}`);
          loadReportIntoForm(fullPayload.report, Number(reportId));
          showView("report");
          showStage("encabezado", { skipWeekCheck: true });
          window.scrollTo({ top: 0, behavior: "smooth" });
        };
        editFromSegBtn.onclick = handler;
      }
      reportPreviewDialog.showModal();
    } catch (err) {
      setFeedback(err.message, true);
    }
  }
});

// Seguimiento: tabs de cuatrimestre
document.getElementById("seguimiento-scope-tabs")?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-sgscope]");
  if (!btn) return;
  seguimientoScope = btn.dataset.sgscope;
  document.querySelectorAll("#seguimiento-scope-tabs .filter-tab").forEach(b =>
    b.classList.toggle("is-active", b === btn)
  );
  renderSeguimiento(reportsData);
});

// Preferences save
document.getElementById("settings-prefs-save-btn")?.addEventListener("click", () => {
  const selected = document.querySelector("input[name='history_scope']:checked")?.value || "current";
  historyScope = selected;
  renderReports(reportsData);
  const status = document.getElementById("settings-prefs-save-status");
  if (status) {
    status.textContent = "✓ Guardado";
    status.className = "settings-save-status is-ok";
    setTimeout(() => { status.textContent = ""; }, 2500);
  }
});

// Language setting radios (settings card)
document.querySelectorAll("input[name='settings_lang']").forEach(radio => {
  radio.addEventListener("change", (e) => {
    const lang = e.target.value;
    setLang(lang);
    // Update topbar lang-switcher button state too
    document.querySelectorAll("#lang-switcher .lang-btn").forEach(btn =>
      btn.classList.toggle("is-active", btn.dataset.lang === lang)
    );
    // Sync the other radio in the same group
    const langRadio = document.querySelector(`input[name='settings_lang'][value='${lang}']`);
    if (langRadio) langRadio.checked = true;
  });
});
peopleTableBody.addEventListener("click", handlePeopleTableClick);
document.getElementById("people-card-grid")?.addEventListener("click", handlePeopleTableClick);
document.getElementById("cells-card-grid")?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const cellId = btn.dataset.id;
  if (btn.dataset.action === "edit-cell") {
    openCellEditDialog(findCellById(cellId));
  } else if (btn.dataset.action === "delete-cell") {
    const cell = findCellById(cellId);
    const ok = await appConfirm(`¿Eliminar Célula ${cell?.cellNumber}?\nLos miembros no se borran, solo quedan sin célula asignada.`, "Eliminar célula");
    if (!ok) return;
    try {
      await request(`/api/catalogs/cells/${cellId}`, { method: "DELETE" });
      await loadCatalogs();
      setFeedback("Célula eliminada.");
    } catch (err) { setFeedback(err.message, true); }
  }
});
peopleFilterTabs.addEventListener("click", handlePeopleFilterClick);
document.getElementById("people-filter-select")?.addEventListener("change", (e) => {
  activePeopleFilter = e.target.value || "all";
  renderPeopleFilterTabs();
  renderPeopleRows();
});
peopleSearch.addEventListener("input", handlePeopleSearchInput);
cellSearch.addEventListener("input", handleCellSearchInput);
dashboardPeriodSelect.addEventListener("change", handleDashboardPeriodChange);
document.getElementById("dashboard-time-tabs")?.addEventListener("click", (e) => {
  const btn = e.target.closest(".dashboard-time-tab[data-timescope]");
  if (!btn) return;
  activeDashboardTimeScope = btn.dataset.timescope;
  document.querySelectorAll(".dashboard-time-tab").forEach(b =>
    b.classList.toggle("is-active", b === btn)
  );
  renderDashboard(reportsData);
});
dashboardMetricsToggle?.addEventListener("click", (e) => {
  const btn = e.target.closest(".metrics-toggle-btn");
  if (!btn) return;
  activeMetricsScope = btn.dataset.metricsScope;
  dashboardMetricsToggle.querySelectorAll(".metrics-toggle-btn").forEach(b => b.classList.toggle("is-active", b === btn));
  renderDashboard(reportsData);
});
dashboardRecentActivity?.addEventListener("click", (e) => {
  const card = e.target.closest(".activity-card-clickable");
  if (!card) return;
  const idx = Number(card.dataset.reportIdx);
  const report = dashboardRecentActivity._weeklyReports?.[idx];
  if (report) openReportPreviewFromDashboard(report);
});
dashboardRecentActivity?.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const card = e.target.closest(".activity-card-clickable");
  if (!card) return;
  e.preventDefault();
  const idx = Number(card.dataset.reportIdx);
  const report = dashboardRecentActivity._weeklyReports?.[idx];
  if (report) openReportPreviewFromDashboard(report);
});
attendanceTableBody.addEventListener("input", handleAttendanceTableInput);
attendanceTableBody.addEventListener("change", handleAttendanceTableInput);
visitorTableBody.addEventListener("input", handleVisitorTableInput);
visitorTableBody.addEventListener("change", handleVisitorTableInput);
visitorTableBody.addEventListener("click", handleVisitorTableClick);
kidsTableBody.addEventListener("input", handleKidsTableInput);
kidsTableBody.addEventListener("change", handleKidsTableInput);
kidsTableBody.addEventListener("click", handleKidsTableClick);
baptismTableBody.addEventListener("input", handleBaptismTableInput);
baptismTableBody.addEventListener("change", handleBaptismTableInput);
baptismTableBody.addEventListener("click", handleBaptismTableClick);
addVisitorButton.addEventListener("click", handleAddVisitorClick);
addKidButton?.addEventListener("click", handleAddKidClick);
addBaptismButton?.addEventListener("click", handleAddBaptismClick);
if (visitorQuickForm) {
  visitorQuickForm.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      handleVisitorQuickSubmit();
    }
  });
}
if (addVisitorQuickButton) {
  addVisitorQuickButton.addEventListener("click", handleVisitorQuickSubmit);
}
if (resetVisitorQuickButton) {
  resetVisitorQuickButton.addEventListener("click", handleVisitorQuickReset);
}
if (visitorQuickHistory instanceof HTMLSelectElement) {
  visitorQuickHistory.addEventListener("change", () => {
    const selectedName = String(visitorQuickHistory.value || "").trim();
    if (visitorQuickName instanceof HTMLInputElement) {
      visitorQuickName.value = selectedName;
    }
    if (selectedName) {
      applyQuickVisitorHistory(selectedName);
    }
  });
}
fillPlanningMembersButton.addEventListener("click", handleFillPlanningMembers);
fillReachMembersButton?.addEventListener("click", handleFillReachMembers);
fillReachPrivilegesButton?.addEventListener("click", handleFillReachPrivileges);
copyPlanningToReachButton?.addEventListener("click", handleCopyPlanningToReach);
copyReachToSundayButton.addEventListener("click", handleCopyReachToSunday);
markAllPrivilegesButton?.addEventListener("click", handleMarkAllPrivileges);
syncStatusFromActivitiesButton.addEventListener("click", handleSyncStatusFromActivities);
clearMemberActivitiesButton.addEventListener("click", handleClearMemberActivities);
copyVisitorReachToSundayButton.addEventListener("click", handleCopyVisitorReachToSunday);
markVisitorFirstVisitButton.addEventListener("click", handleMarkVisitorFirstVisit);
clearVisitorActivitiesButton.addEventListener("click", handleClearVisitorActivities);
copyKidReachToSundayButton?.addEventListener("click", handleCopyKidReachToSunday);
clearKidActivitiesButton?.addEventListener("click", handleClearKidActivities);
memberList.addEventListener("click", handleMemberListClick);

// ── Report preview dialog ────────────────────────────────────────────────────
const reportPreviewDialog = /** @type {HTMLDialogElement|null} */ (document.querySelector("#report-preview-dialog"));
const reportPreviewOpenBtn  = document.querySelector("#report-preview-open-btn");
const previewCloseBtn       = document.querySelector("#preview-close-btn");
const previewCancelBtn      = document.querySelector("#preview-cancel-btn");
const previewConfirmBtn     = document.querySelector("#preview-confirm-btn");
const previewDialogTitle    = document.querySelector("#preview-dialog-title");
const previewDialogBody     = document.querySelector("#preview-dialog-body");
const previewDialogFooter   = document.querySelector("#preview-dialog-footer");

function buildReportPreviewHtml() {
  const data = Object.fromEntries(new FormData(reportForm).entries());
  // Disabled fields aren't in FormData — read directly
  data.leaderName   = leaderField.value   || data.leaderName   || "—";
  data.assistantName = assistantField.value || data.assistantName || "—";
  data.hostName     = hostField.value     || data.hostName     || "—";

  const summary = computeWeeklySummary();
  const weekInfo = getRcmWeekInfo(weekField.value);
  const phaseLabel = weekInfo ? `${weekInfo.phaseLabel}` : "";

  // Header card
  const headerHtml = `
    <div class="preview-header-card">
      <div class="preview-header-grid">
        <div><span class="preview-label">Semana</span><strong>${escapeHtml(data.week || "—")}${phaseLabel ? " · " + escapeHtml(phaseLabel) : ""}</strong></div>
        <div><span class="preview-label">Célula</span><strong>${escapeHtml(data.cellNumber || "—")}</strong></div>
        <div><span class="preview-label">Fecha</span><strong>${escapeHtml(data.reportDate || "—")}</strong></div>
        <div><span class="preview-label">Líder</span><strong>${escapeHtml(data.leaderName)}</strong></div>
        <div><span class="preview-label">Asistente</span><strong>${escapeHtml(data.assistantName)}</strong></div>
        <div><span class="preview-label">Anfitrión</span><strong>${escapeHtml(data.hostName)}</strong></div>
        ${data.sector ? `<div><span class="preview-label">Sector</span><strong>${escapeHtml(data.sector)}</strong></div>` : ""}
        ${data.networkName ? `<div><span class="preview-label">Red</span><strong>${escapeHtml(data.networkName)}</strong></div>` : ""}
      </div>
    </div>`;

  // Attendance quick summary
  const attendanceHtml = `
    <div class="preview-section-title">Asistencia</div>
    <div class="preview-cards-row">
      ${[
        ["Miembros", summary.planningMembersPresent],
        ["Amigos", summary.visitors],
        ["Niños", currentKids.filter(k => String(k.name || "").trim()).length],
        ["Culto insp.", summary.sundayTotal],
        ["Conversiones", summary.reachConversions],
      ].map(([lbl, val]) => `
        <div class="preview-stat-card">
          <span class="preview-stat-val">${escapeHtml(String(val))}</span>
          <span class="preview-stat-lbl">${escapeHtml(lbl)}</span>
        </div>`).join("")}
    </div>`;

  // Preview section definitions — match original PDF exactly
  // (reads from all form inputs including standalone Ofrendas and Supervisión panels)
  const PREVIEW_SECTIONS = [
    { title: "Planeación",      fields: [["planningMembersPresent", "Miembros asistentes"], ["planningMembersAbsent", "Miembros ausentes"]] },
    { title: "Alcance",         fields: [["reachMembersPresent", "Miembros asistentes"], ["reachPrivilegedMembers", "Miembros con privilegios"], ["reachFriendsPresent", "Amigos presentes"], ["reachConversions", "Conversiones"], ["reachKidsPresent", "Niños presentes"], ["reachOffering", "Ofrenda ($)"]] },
    { title: "Multiplicación",  fields: [["multiplyBrothersNewCell", "Hnos. en nueva célula"], ["multiplyPEinNewCell", "P.E. en nueva célula"], ["multiplyKidsNewCell", "Niños en nueva célula"], ["multiplyTotalOfferings", "Total de ofrendas ($)"], ["multiplySundayAttendance", "Asistieron al culto insp."]] },
    { title: "Fase Ganar",      fields: [["winSpiritualParents", "Padres espirituales"], ["winFriendsContacted", "Amigos contactados"], ["winRiseEventFriends", "Amigos en E. Levántate"], ["winEDRFriends", "Amigos en E.D.R."], ["winBaptizedFriends", "Amigos bautizados"]] },
    { title: "Fase Consolidar", fields: [["consolidateE1", "E1 - Maduración"], ["consolidateE2", "E2 - Integración"], ["consolidateE3", "E3 - Ubicación"], ["consolidateJoinEvent", "Evento Únete"], ["consolidateReencuentro", "Evento Re-encuentro"], ["consolidateMinistries", "Evento Ministerios"]] },
    { title: "Fase Discipular", fields: [["discipleE1Vision", "E1 - Visión"], ["discipleE2Character", "E2 - Carácter"], ["discipleE3Profile", "E3 - Perfil"], ["discipleLaunchMultiply", "Lanzamiento/Multip."]] },
    { title: "Supervisión",     fields: [["supervisionNetwork", "Sup. Red"], ["supervisionSector", "Sup. Sector"], ["supervisionZone", "Sup. Zona"], ["supervisionRegion", "Sup. Región"], ["supervisionArea", "Sup. Área"]] },
    { title: "Escuelas",        fields: [["schoolFormative", "Esc. Formativa"], ["schoolParents", "Esc. Padres Esp."], ["schoolLeaders", "Esc. Líderes"], ["schoolSupervisors", "Esc. Supervisores"]] },
    { title: "Bautismos",       fields: [["baptismFirstQuarter", "1er. Cuatr."], ["baptismSecondQuarter", "2do. Cuatr."], ["baptismThirdQuarter", "3er. Cuatr."], ["baptismYearTotal", "Total Año"]] },
  ];

  // Metric sections
  const metricsHtml = PREVIEW_SECTIONS.map(section => {
    const rows = section.fields.map(([name, label]) => {
      const el = reportForm.elements.namedItem(name);
      const val = (el instanceof HTMLInputElement ? el.value : data[name]) || "0";
      const num = parseFloat(val) || 0;
      return { label, val: num === 0 ? "—" : String(num), isEmpty: num === 0 };
    });
    const hasData = rows.some(r => !r.isEmpty);
    return `
      <div class="preview-metric-card${hasData ? "" : " preview-metric-empty"}">
        <div class="preview-metric-title">${escapeHtml(section.title)}</div>
        <div class="preview-metric-rows">
          ${rows.map(r => `
            <div class="preview-metric-row${r.isEmpty ? " is-zero" : ""}">
              <span class="preview-metric-label">${escapeHtml(r.label)}</span>
              <span class="preview-metric-value">${escapeHtml(r.val)}</span>
            </div>`).join("")}
        </div>
      </div>`;
  }).join("");

  // Members list
  const presentMembers = currentMemberAttendance.filter(e => e.status === "present" || e.status === "service");
  const absentMembers  = currentMemberAttendance.filter(e => e.status === "absent" || e.status === "justified");
  const membersHtml = `
    <div class="preview-section-title">Miembros presentes (${presentMembers.length})</div>
    <div class="preview-pills">
      ${presentMembers.length
        ? presentMembers.map(e => `<span class="preview-pill is-present">${escapeHtml(e.name)}</span>`).join("")
        : '<span class="preview-empty-note">Ninguno marcado presente</span>'}
    </div>
    ${absentMembers.length ? `
      <div class="preview-section-title" style="margin-top:10px">Ausencias (${absentMembers.length})</div>
      <div class="preview-pills">
        ${absentMembers.map(e => `<span class="preview-pill is-absent">${escapeHtml(e.name)} ${e.status === "justified" ? "·J" : ""}</span>`).join("")}
      </div>` : ""}`;

  // Notes
  const notesHtml = data.notes ? `
    <div class="preview-section-title">Observaciones</div>
    <p class="preview-notes">${escapeHtml(data.notes)}</p>` : "";

  // WhatsApp message builder
  function buildWhatsAppText() {
    const lines = [
      `📋 *Reporte Célula ${escapeHtml(data.cellNumber || "—")} · Semana ${escapeHtml(data.week || "—")}*`,
      `📅 Fecha: ${escapeHtml(data.reportDate || "—")}`,
      `👤 Líder: ${escapeHtml(data.leaderName || "—")}`,
      `🏠 Red: ${escapeHtml(data.networkName || "—")} · Sector: ${escapeHtml(data.sector || "—")}`,
      ``,
      `*Asistencia*`,
      `• Miembros: ${summary.planningMembersPresent}`,
      `• Amigos: ${summary.visitors}`,
      `• Culto insp.: ${summary.sundayTotal}`,
      `• Conversiones: ${summary.reachConversions}`,
    ];
    PREVIEW_SECTIONS.forEach(sec => {
      const nonZero = sec.fields.filter(([name]) => {
        const el = reportForm.elements.namedItem(name);
        return parseFloat(el instanceof HTMLInputElement ? el.value : "0") > 0;
      });
      if (nonZero.length) {
        lines.push(``);
        lines.push(`*${sec.title}*`);
        nonZero.forEach(([name, label]) => {
          const el = reportForm.elements.namedItem(name);
          lines.push(`• ${label}: ${el instanceof HTMLInputElement ? el.value : "0"}`);
        });
      }
    });
    if (presentMembers.length) {
      lines.push(``);
      lines.push(`*Presentes (${presentMembers.length})*`);
      lines.push(presentMembers.map(e => e.name).join(", "));
    }
    if (data.notes) {
      lines.push(``);
      lines.push(`*Notas*`);
      lines.push(data.notes);
    }
    return lines.join("\n");
  }
  const waUrl = `https://wa.me/?text=${encodeURIComponent(buildWhatsAppText())}`;

  return headerHtml + attendanceHtml +
    `<div class="preview-section-title">Métricas del reporte</div><div class="preview-metrics-grid">${metricsHtml}</div>` +
    membersHtml + notesHtml +
    `<div class="preview-wa-row"><a href="${waUrl}" target="_blank" rel="noopener" class="btn-wa">📱 Enviar por WhatsApp</a></div>`;
}

function openReportPreviewDialog() {
  if (!reportPreviewDialog) return;
  // Ensure all auto-computed fields are fresh before reading form values
  syncDerivedMetricFields();
  const weekVal = weekField.value || "—";
  const cellVal = cellField.value || "—";
  if (previewDialogTitle) previewDialogTitle.textContent = `Semana ${weekVal} · Célula ${cellVal}`;
  if (previewDialogBody)  previewDialogBody.innerHTML = buildReportPreviewHtml();
  // Restore normal footer buttons
  if (previewDialogFooter) previewDialogFooter.hidden = false;
  const cancelBtn  = document.getElementById("preview-cancel-btn");
  const confirmBtn = document.getElementById("preview-confirm-btn");
  const editFromSegBtn = document.getElementById("preview-edit-from-seg-btn");
  if (cancelBtn)  cancelBtn.hidden  = false;
  if (confirmBtn) confirmBtn.hidden = false;
  if (editFromSegBtn) editFromSegBtn.hidden = true;
  reportPreviewDialog.showModal();
}

if (reportPreviewOpenBtn)  reportPreviewOpenBtn.addEventListener("click",  openReportPreviewDialog);
if (previewCloseBtn  && reportPreviewDialog) previewCloseBtn.addEventListener("click",  () => reportPreviewDialog.close());
if (previewCancelBtn && reportPreviewDialog) previewCancelBtn.addEventListener("click", () => reportPreviewDialog.close());
if (reportPreviewDialog) reportPreviewDialog.addEventListener("click", (e) => { if (e.target === reportPreviewDialog) reportPreviewDialog.close(); });
if (previewConfirmBtn) previewConfirmBtn.addEventListener("click", () => {
  if (reportPreviewDialog) reportPreviewDialog.close();
  reportForm.requestSubmit();
});

// ── Preview read-only desde dashboard ───────────────────────────────────────
const PREVIEW_SECTIONS_DEF = [
  { title: "Planeación",      fields: [["planningMembersPresent", "Miembros asistentes"], ["planningMembersAbsent", "Miembros ausentes"]] },
  { title: "Alcance",         fields: [["reachMembersPresent", "Miembros asistentes"], ["reachPrivilegedMembers", "Miembros con privilegios"], ["reachFriendsPresent", "Amigos presentes"], ["reachConversions", "Conversiones"], ["reachKidsPresent", "Niños presentes"], ["reachOffering", "Ofrenda ($)"]] },
  { title: "Multiplicación",  fields: [["multiplyBrothersNewCell", "Hnos. en nueva célula"], ["multiplyPEinNewCell", "P.E. en nueva célula"], ["multiplyKidsNewCell", "Niños en nueva célula"], ["multiplyTotalOfferings", "Total de ofrendas ($)"], ["multiplySundayAttendance", "Asistieron al culto insp."]] },
  { title: "Fase Ganar",      fields: [["winSpiritualParents", "Padres espirituales"], ["winFriendsContacted", "Amigos contactados"], ["winRiseEventFriends", "Amigos en E. Levántate"], ["winEDRFriends", "Amigos en E.D.R."], ["winBaptizedFriends", "Amigos bautizados"]] },
  { title: "Fase Consolidar", fields: [["consolidateE1", "E1 - Maduración"], ["consolidateE2", "E2 - Integración"], ["consolidateE3", "E3 - Ubicación"], ["consolidateJoinEvent", "Evento Únete"], ["consolidateReencuentro", "Evento Re-encuentro"], ["consolidateMinistries", "Evento Ministerios"]] },
  { title: "Fase Discipular", fields: [["discipleE1Vision", "E1 - Visión"], ["discipleE2Character", "E2 - Carácter"], ["discipleE3Profile", "E3 - Perfil"], ["discipleLaunchMultiply", "Lanzamiento/Multip."]] },
  { title: "Supervisión",     fields: [["supervisionNetwork", "Sup. Red"], ["supervisionSector", "Sup. Sector"], ["supervisionZone", "Sup. Zona"], ["supervisionRegion", "Sup. Región"], ["supervisionArea", "Sup. Área"]] },
  { title: "Escuelas",        fields: [["schoolFormative", "Esc. Formativa"], ["schoolParents", "Esc. Padres Esp."], ["schoolLeaders", "Esc. Líderes"], ["schoolSupervisors", "Esc. Supervisores"]] },
  { title: "Bautismos",       fields: [["baptismFirstQuarter", "1er. Cuatr."], ["baptismSecondQuarter", "2do. Cuatr."], ["baptismThirdQuarter", "3er. Cuatr."], ["baptismYearTotal", "Total Año"]] },
];

function buildReportPreviewHtmlFromData(report) {
  const fd = report?.formData || {};
  const s  = fd.attendanceSummary || {};
  const weekInfo = getRcmWeekInfo(fd.week);
  const phaseLabel = weekInfo ? weekInfo.phaseLabel : "";

  const headerHtml = `
    <div class="preview-header-card">
      <div class="preview-header-grid">
        <div><span class="preview-label">Semana</span><strong>${escapeHtml(String(fd.week || "—"))}${phaseLabel ? " · " + escapeHtml(phaseLabel) : ""}</strong></div>
        <div><span class="preview-label">Célula</span><strong>${escapeHtml(String(fd.cellNumber || report.cellNumber || "—"))}</strong></div>
        <div><span class="preview-label">Fecha</span><strong>${escapeHtml(fd.reportDate || "—")}</strong></div>
        <div><span class="preview-label">Líder</span><strong>${escapeHtml(fd.leaderName || report.leaderName || "—")}</strong></div>
        ${fd.assistantName ? `<div><span class="preview-label">Asistente</span><strong>${escapeHtml(fd.assistantName)}</strong></div>` : ""}
        ${fd.hostName      ? `<div><span class="preview-label">Anfitrión</span><strong>${escapeHtml(fd.hostName)}</strong></div>` : ""}
        ${fd.sector        ? `<div><span class="preview-label">Sector</span><strong>${escapeHtml(fd.sector)}</strong></div>` : ""}
        ${fd.networkName   ? `<div><span class="preview-label">Red</span><strong>${escapeHtml(fd.networkName)}</strong></div>` : ""}
      </div>
    </div>`;

  const memberAttendance = Array.isArray(fd.memberAttendance) ? fd.memberAttendance : [];
  const namedVisitors = (Array.isArray(fd.visitors) ? fd.visitors : []).filter(v => String(v.name || "").trim());
  const namedKids     = (Array.isArray(fd.kids)     ? fd.kids     : []).filter(k => String(k.name || "").trim());

  // ── Resumen global (badges) ─────────────────────────────────────────────────
  const conversions  = Number(s.reachConversions || 0);
  const baptisms     = Array.isArray(fd.baptisms) ? fd.baptisms.length : 0;
  const spirParents  = Number(s.winSpiritualParents || fd.winSpiritualParents || 0);
  const totalOffering = Number(fd.multiplyTotalOfferings || 0);
  const summaryItems = [
    conversions   ? ["Conversiones", conversions,                "is-highlight"] : null,
    baptisms      ? ["Bautismos",    baptisms,                   "is-highlight"] : null,
    spirParents   ? ["Padres esp.",  spirParents,                ""] : null,
    totalOffering ? ["Ofrenda total", `$${totalOffering.toFixed(0)}`, ""] : null,
  ].filter(Boolean);
  const summaryHtml = summaryItems.length ? `
    <div class="preview-cards-row" style="margin-bottom:4px">
      ${summaryItems.map(([lbl, val, cls]) => `
        <div class="preview-stat-card ${cls}">
          <span class="preview-stat-val">${escapeHtml(String(val))}</span>
          <span class="preview-stat-lbl">${escapeHtml(lbl)}</span>
        </div>`).join("")}
    </div>` : "";

  // helper: chip for a member showing status icon
  function memberChip(member, attended, extra) {
    const cls = extra === "privileged" ? "privileged" : attended ? "attended" : "missed";
    const icon = extra === "privileged" ? "★" : attended ? "✓" : "✗";
    return `<div class="ev-chip ev-chip--${cls}"><span class="ev-chip-icon">${icon}</span><span>${escapeHtml(member.name || "")}</span></div>`;
  }

  // ── PLANEACIÓN ──────────────────────────────────────────────────────────────
  const planCount  = memberAttendance.filter(m => m.planningAttended).length;
  const planTotal  = memberAttendance.length;
  const planSection = `
    <div class="ev-section">
      <div class="ev-head ev-head--planning">
        <span class="ev-title">📋 Planeación</span>
        <span class="ev-count">${planCount} / ${planTotal} hermanos</span>
      </div>
      <div class="ev-body">
        ${planTotal ? `<div class="ev-chip-grid">${memberAttendance.map(m => memberChip(m, m.planningAttended, null)).join("")}</div>` : "<p class='preview-empty-note'>Sin registro de asistencia</p>"}
        ${fd.planningNotes ? `<p class="ev-notes">${escapeHtml(fd.planningNotes)}</p>` : ""}
      </div>
    </div>`;

  // ── ALCANCE ─────────────────────────────────────────────────────────────────
  const reachPresent    = memberAttendance.filter(m => m.reachAttended).length;
  const reachPriv       = memberAttendance.filter(m => m.reachPrivileged).length;
  const reachOfrenda    = Number(s.reachOffering || fd.reachOffering || 0);
  const visitorsHtml = namedVisitors.length ? `
    <div class="ev-subsection">
      <p class="ev-subsection-title">Amigos (${namedVisitors.length})</p>
      <div class="ev-visitor-list">
        ${namedVisitors.map(v => `
          <div class="ev-visitor-row">
            <span class="ev-visitor-name">${escapeHtml(v.name || "")}</span>
            ${v.invitedBy ? `<span class="ev-visitor-meta">invitado por ${escapeHtml(v.invitedBy)}</span>` : ""}
            <span class="ev-visitor-badges">
              ${v.converted      ? '<span class="ev-badge ev-badge--conversion">Conversión</span>'  : ""}
              ${v.sundayAttended ? '<span class="ev-badge ev-badge--sunday">↪ Culto</span>'         : ""}
            </span>
          </div>`).join("")}
      </div>
    </div>` : "";
  const kidsHtml = namedKids.length ? `
    <div class="ev-subsection">
      <p class="ev-subsection-title">Niños (${namedKids.length})</p>
      <div class="ev-visitor-list">
        ${namedKids.map(k => `
          <div class="ev-visitor-row">
            <span class="ev-visitor-name">${escapeHtml(k.name || "")}</span>
            ${k.guardianName ? `<span class="ev-visitor-meta">guardián: ${escapeHtml(k.guardianName)}</span>` : ""}
            ${k.sundayAttended ? '<span class="ev-badge ev-badge--sunday">↪ Culto</span>' : ""}
          </div>`).join("")}
      </div>
    </div>` : "";
  const reachSection = `
    <div class="ev-section">
      <div class="ev-head ev-head--reach">
        <span class="ev-title">🌱 Alcance</span>
        <span class="ev-count">${reachPresent} hmnos${reachPriv ? ` · ${reachPriv} privilegiados` : ""} · ${namedVisitors.length} amigos · ${namedKids.length} niños</span>
      </div>
      <div class="ev-body">
        ${planTotal ? `<div class="ev-chip-grid">${memberAttendance.map(m => memberChip(m, m.reachAttended, m.reachPrivileged ? "privileged" : null)).join("")}</div>` : ""}
        ${visitorsHtml}
        ${kidsHtml}
        ${reachOfrenda ? `<p class="ev-offering">Ofrenda alcance: $${reachOfrenda.toFixed(0)}</p>` : ""}
        ${fd.reachNotes ? `<p class="ev-notes">${escapeHtml(fd.reachNotes)}</p>` : ""}
      </div>
    </div>`;

  // ── CULTO DOMINICAL ─────────────────────────────────────────────────────────
  const sundayMembersCount  = memberAttendance.filter(m => m.sundayAttended).length;
  const sundayVisitorsCount = namedVisitors.filter(v => v.sundayAttended).length;
  const sundayKidsCount     = namedKids.filter(k => k.sundayAttended).length;
  const sundayTotal         = sundayMembersCount + sundayVisitorsCount + sundayKidsCount;
  const cultoSection = `
    <div class="ev-section">
      <div class="ev-head ev-head--sunday">
        <span class="ev-title">⛪ Culto Dominical</span>
        <span class="ev-count">${sundayTotal} total · ${sundayMembersCount} hmnos · ${sundayVisitorsCount} amigos · ${sundayKidsCount} niños</span>
      </div>
      <div class="ev-body">
        ${planTotal ? `<div class="ev-chip-grid">${memberAttendance.map(m => memberChip(m, m.sundayAttended, null)).join("")}</div>` : "<p class='preview-empty-note'>Sin registro de asistencia</p>"}
        ${fd.cultoNotes ? `<p class="ev-notes">${escapeHtml(fd.cultoNotes)}</p>` : ""}
      </div>
    </div>`;

  // ── AUSENCIAS (resumen) ─────────────────────────────────────────────────────
  const absentMembers   = memberAttendance.filter(e => e.status === "absent");
  const justifiedMembers = memberAttendance.filter(e => e.status === "justified");
  const absencesHtml = (absentMembers.length || justifiedMembers.length) ? `
    <div class="ev-section">
      <div class="ev-head ev-head--absent">
        <span class="ev-title">Ausencias</span>
        <span class="ev-count">${absentMembers.length} ausente${absentMembers.length !== 1 ? "s" : ""} · ${justifiedMembers.length} justificado${justifiedMembers.length !== 1 ? "s" : ""}</span>
      </div>
      <div class="ev-body">
        <div class="ev-chip-grid">
          ${absentMembers.map(m   => `<div class="ev-chip ev-chip--missed"><span class="ev-chip-icon">✗</span><span>${escapeHtml(m.name || "")}</span></div>`).join("")}
          ${justifiedMembers.map(m => `<div class="ev-chip ev-chip--justified"><span class="ev-chip-icon">J</span><span>${escapeHtml(m.name || "")}</span></div>`).join("")}
        </div>
      </div>
    </div>` : "";

  const notesHtml = fd.notes ? `
    <div class="preview-section-title" style="margin-top:14px">Observaciones generales</div>
    <p class="preview-notes">${escapeHtml(fd.notes)}</p>` : "";

  const legendHtml = `
    <div class="ev-legend">
      <span class="ev-legend-title">Referencia:</span>
      <span class="ev-chip ev-chip--attended" style="font-size:0.7rem;padding:2px 7px 2px 4px"><span class="ev-chip-icon">✓</span>Asistió</span>
      <span class="ev-chip ev-chip--privileged" style="font-size:0.7rem;padding:2px 7px 2px 4px"><span class="ev-chip-icon">★</span>Con privilegio</span>
      <span class="ev-chip ev-chip--missed" style="font-size:0.7rem;padding:2px 7px 2px 4px"><span class="ev-chip-icon">✗</span>Faltó</span>
      <span class="ev-chip ev-chip--justified" style="font-size:0.7rem;padding:2px 7px 2px 4px"><span class="ev-chip-icon">J</span>Justificado</span>
      <span class="ev-badge ev-badge--sunday" style="font-size:0.7rem">↪ Culto</span>
      <span class="ev-badge ev-badge--conversion" style="font-size:0.7rem">Conversión</span>
    </div>`;

  return headerHtml + summaryHtml + legendHtml + planSection + reachSection + cultoSection + absencesHtml + notesHtml;
}

function openReportPreviewFromDashboard(report) {
  if (!reportPreviewDialog) return;
  const cell = String(report.cellNumber || report.formData?.cellNumber || "—");
  const week = String(report.formData?.week || report.week || "—");
  if (previewDialogTitle) previewDialogTitle.textContent = `Semana ${week} · Célula ${cell}`;
  if (previewDialogBody)  previewDialogBody.innerHTML = buildReportPreviewHtmlFromData(report);
  // Read-only mode: hide save actions, restore cancel, hide seguimiento edit btn
  if (previewDialogFooter) previewDialogFooter.hidden = true;
  const cancelBtn  = document.getElementById("preview-cancel-btn");
  const confirmBtn = document.getElementById("preview-confirm-btn");
  const editFromSegBtn = document.getElementById("preview-edit-from-seg-btn");
  if (cancelBtn)  cancelBtn.hidden  = false;
  if (confirmBtn) confirmBtn.hidden = false;
  if (editFromSegBtn) editFromSegBtn.hidden = true;
  reportPreviewDialog.showModal();
}

// Restore footer when opened from report form
const convocarDialog = /** @type {HTMLDialogElement|null} */ (document.querySelector("#convocar-dialog"));
const convocarOpenBtn   = document.querySelector("#convocar-open-btn");
const convocarCloseBtn  = document.querySelector("#convocar-close-btn");
const convocarCancelBtn = document.querySelector("#convocar-cancel-btn");
const convocarConfirmBtn = document.querySelector("#convocar-confirm-btn");
const convocarClaseSelect = /** @type {HTMLSelectElement|null} */ (document.querySelector("#convocar-clase-select"));
const convocarMemberList  = document.querySelector("#convocar-member-list");

const CLASS_MILESTONES = RCM_MILESTONES.filter(m => m.type === "clase");

function populateConvocarDialog() {
  if (!convocarClaseSelect) return;
  const selectedKey = convocarClaseSelect.value || CLASS_MILESTONES[0]?.key;
  convocarClaseSelect.innerHTML = CLASS_MILESTONES.map(m =>
    `<option value="${m.key}"${m.key === selectedKey ? " selected" : ""}>${escapeHtml(m.sectionLabel + " · " + m.label)}</option>`
  ).join("");
  populateConvocarMembers();
}

function populateConvocarMembers() {
  if (!convocarMemberList || !convocarClaseSelect) return;
  const key = convocarClaseSelect.value;
  const trackableRoles = ["member", "leader", "assistant", "host"];
  const eligible = catalogs.people.filter(p => {
    if (!trackableRoles.includes(p.role)) return false;
    const val = p.rcmProgress?.[key];
    return !val; // only those not yet started
  });

  if (!eligible.length) {
    convocarMemberList.innerHTML = `<p class="empty-state">Todos los miembros ya tienen esta clase en curso o completada.</p>`;
    return;
  }
  convocarMemberList.innerHTML = eligible.map(p =>
    `<label class="convocar-member-row">
      <input type="checkbox" data-person-id="${p.id}" value="${p.id}">
      <span>${escapeHtml(p.name)}</span>
      <span class="member-admin-caption">${escapeHtml(formatRole(p.role))}</span>
    </label>`
  ).join("");
}

async function handleConvocarConfirm() {
  if (!convocarMemberList || !convocarClaseSelect || !convocarDialog) return;
  const key = convocarClaseSelect.value;
  const today = new Date().toISOString().slice(0, 10);
  const checked = /** @type {NodeListOf<HTMLInputElement>} */ (convocarMemberList.querySelectorAll("input[type=checkbox]:checked"));
  if (!checked.length) {
    setFeedback("Selecciona al menos un miembro.", true);
    return;
  }

  const personIds = Array.from(checked).map(cb => parseInt(cb.value, 10));
  try {
    await Promise.all(personIds.map(async (personId) => {
      const result = await request(`/api/catalogs/people/${personId}/rcm`, {
        method: "PATCH",
        body: JSON.stringify({ [key]: `en_curso:${today}` }),
      });
      const person = catalogs.people.find(p => p.id === personId);
      if (person) {
        if (!person.rcmProgress) person.rcmProgress = {};
        person.rcmProgress[key] = result.rcmProgress?.[key] ?? `en_curso:${today}`;
      }
    }));
    const milestone = CLASS_MILESTONES.find(m => m.key === key);
    setFeedback(`${personIds.length} miembro(s) registrados en ${milestone?.label ?? key}.`);
    convocarDialog.close();
    renderPeopleRows();
  } catch (err) {
    setFeedback(err.message, true);
  }
}

if (convocarOpenBtn && convocarDialog) {
  convocarOpenBtn.addEventListener("click", () => {
    populateConvocarDialog();
    convocarDialog.showModal();
  });
}
if (convocarClaseSelect) {
  convocarClaseSelect.addEventListener("change", populateConvocarMembers);
}
if (convocarCloseBtn && convocarDialog)  convocarCloseBtn.addEventListener("click",  () => convocarDialog.close());
if (convocarCancelBtn && convocarDialog) convocarCancelBtn.addEventListener("click", () => convocarDialog.close());
if (convocarDialog) convocarDialog.addEventListener("click", (e) => { if (e.target === convocarDialog) convocarDialog.close(); });
if (convocarConfirmBtn) convocarConfirmBtn.addEventListener("click", handleConvocarConfirm);


syncPhaseIndicator();
renderMetricSections();
populatePeopleForm();
applyPreviewFlags();
showView("report");
renderPeopleFilterTabs();

// ── Splash inicial: cubre la app durante cold-start del backend ──
const _appSplash = document.getElementById("app-splash");
const _appSplashSub = document.getElementById("app-splash-sub");
function hideAppSplash() { _appSplash?.classList.add("is-hidden"); }
// Watchdog: si el backend tarda >8s, avisar
const _splashWatchdog = setTimeout(() => {
  if (_appSplashSub && _appSplash && !_appSplash.classList.contains("is-hidden")) {
    _appSplashSub.textContent = "El servidor está despertando, esto puede tomar hasta 30 segundos…";
  }
}, 8000);

// Check for existing session before loading (overlay stays visible until resolved)
const _savedSession = sessionStorage.getItem(RC_SESSION_KEY);
if (_savedSession) {
  try {
    currentUser = JSON.parse(_savedSession);
    // Migración: derivar campos calculados si la sesión fue guardada antes de añadirlos
    if (currentUser.isSupervisor === undefined) {
      currentUser.isSupervisor = !!(currentUser.supervisedSector);
    }
    if (currentUser.isAdmin === undefined) {
      currentUser.isAdmin = !!(currentUser.isCoordinator);
    }
    loginOverlay?.classList.add("is-hidden");
  } catch {
    sessionStorage.removeItem(RC_SESSION_KEY);
  }
}

try {
  await loadCatalogs();
  await loadSettings();
  applyRcmWeeksConfig();
  populateWeekOptions();
  resetReportForm();
  await loadHealth();
  await loadReports();
  initGraceBanner();

  if (currentUser) {
    // Restore session UI
    applyUserSession(currentUser);
    restrictCellFieldToUser(currentUser);
    // For admins: ensure cellField is enabled and pre-select their cell if they lead one
    if (currentUser.isAdmin) {
      cellField.disabled = false;
      if (currentUser.assignedCellNumber) {
        cellField.value = String(currentUser.assignedCellNumber);
        syncReportWithCell(true);
      }
    }
    await autoAdvanceWeekForCell(currentUser.assignedCellNumber || cellField.value);
  } else {
    // No session — populate login dropdown and keep overlay visible
    populateLoginSelect();
    await autoAdvanceWeekForCell(cellField.value);
  }
} catch (err) {
  console.error("[init] error durante carga inicial", err);
  if (_appSplashSub) {
    _appSplashSub.textContent = "No se pudo cargar. Refresca la página.";
  }
} finally {
  clearTimeout(_splashWatchdog);
  hideAppSplash();
}

// ── Global tooltip (position:fixed so it never gets clipped) ──
(function initTooltip() {
  const tip = document.getElementById("app-tooltip");
  if (!tip) return;
  let hideTimer;

  document.addEventListener("mouseover", (e) => {
    const el = e.target.closest("[data-tooltip]");
    if (!el) return;
    clearTimeout(hideTimer);
    tip.textContent = el.dataset.tooltip;

    // Move tip inside the active dialog so it renders above the top-layer backdrop
    const dlg = el.closest("dialog[open]");
    const parent = dlg || document.body;
    if (tip.parentNode !== parent) parent.appendChild(tip);

    tip.hidden = false;
    positionTip(el);
    requestAnimationFrame(() => tip.classList.add("is-visible"));
  });

  document.addEventListener("mousemove", (e) => {
    if (!tip.classList.contains("is-visible")) return;
    const el = e.target.closest("[data-tooltip]");
    if (el) positionTip(el);
  });

  document.addEventListener("mouseout", (e) => {
    const el = e.target.closest("[data-tooltip]");
    if (!el) return;
    tip.classList.remove("is-visible");
    hideTimer = setTimeout(() => { tip.hidden = true; }, 160);
  });

  function positionTip(el) {
    const rect = el.getBoundingClientRect();
    const tw = tip.offsetWidth || 120;
    const th = tip.offsetHeight || 32;
    let left = rect.left + rect.width / 2 - tw / 2;
    let top  = rect.top - th - 10;
    if (top < 6) top = rect.bottom + 8;
    left = Math.max(8, Math.min(left, window.innerWidth - tw - 8));
    tip.style.left = left + "px";
    tip.style.top  = top + "px";
  }
})();

// ── Language switcher ────────────────────────────────────────────────────────
(function initLangSwitcher() {
  const switcher = document.getElementById("lang-switcher");
  if (!switcher) return;

  // Sync button state to persisted language on load
  function updateBtnState(lang) {
    switcher.querySelectorAll(".lang-btn").forEach(btn => {
      btn.classList.toggle("is-active", btn.dataset.lang === lang);
    });
  }
  updateBtnState(currentLang);
  applyStaticTranslations();

  switcher.addEventListener("click", (e) => {
    const btn = e.target.closest(".lang-btn[data-lang]");
    if (!btn) return;
    const lang = btn.dataset.lang;
    if (lang === currentLang) return;
    setLang(lang);
    updateBtnState(lang);
    // Keep settings radio in sync
    const langRadio = document.querySelector(`input[name='settings_lang'][value='${lang}']`);
    if (langRadio) langRadio.checked = true;
  });

  // Re-render dynamic content when language changes
  window.addEventListener("langchange", () => {
    // Update topbar route label from the now-translated span
    if (topbarRouteLabel) {
      const activeBtn = [showReportViewButton, showAdminViewButton, showSettingsViewButton, showSeguimientoViewButton]
        .find(b => b?.classList.contains("is-active"));
      topbarRouteLabel.textContent = activeBtn?.querySelector("span[data-i18n]")?.textContent
        ?? activeBtn?.dataset.label
        ?? "";
    }
    if (reportsData.length) {
      renderReports(reportsData);
      renderSeguimiento(reportsData);
      renderDashboard(reportsData);
    }
  });
})();
