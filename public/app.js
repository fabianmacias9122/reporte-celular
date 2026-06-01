import { t, setLang, currentLang, applyStaticTranslations } from './i18n.js?v=20260518-team-compact';

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
  { week: 11, phase: "CONSOLIDAR", phaseLabel: "Consolidar", verb: "SANTIFICAR", verbDesc: "Consagración para el Evento de Restauración (Encuentro).",                 event: t('dash.restoration'),    eventType: "Sanidad interior y liberación espiritual", purpose: "Sanar áreas internas y fortalecer la fe.", rcmKey: "restauracion" },
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
const visitorQuickHistoryHideButton = document.querySelector("#visitor-quick-history-hide-button");
const visitorQuickHistoryRestoreButton = document.querySelector("#visitor-quick-history-restore-button");
const visitorQuickName = document.querySelector("#visitor-quick-name");
const visitorQuickInvitedBy = document.querySelector("#visitor-quick-invited-by");
const visitorQuickReach = document.querySelector("#visitor-quick-reach");
const visitorQuickLate = document.querySelector("#visitor-quick-late");
const visitorQuickLateField = document.querySelector("#visitor-quick-late-field");
const visitorQuickSunday = document.querySelector("#visitor-quick-sunday");
const visitorQuickFirstVisit = document.querySelector("#visitor-quick-first-visit");
const visitorQuickProcessField = document.querySelector("#visitor-quick-process-field");
const visitorQuickProcessEntry = document.querySelector("#visitor-quick-process-entry");
const visitorQuickProcessSummary = document.querySelector("#visitor-quick-process-summary");
const visitorQuickConverted = document.querySelector("#visitor-quick-converted");
const visitorQuickConvertedField = document.querySelector("#visitor-quick-converted-field");
const visitorQuickKind = document.querySelector("#visitor-quick-kind");
const addVisitorQuickButton = document.querySelector("#add-visitor-quick-button");
const resetVisitorQuickButton = document.querySelector("#reset-visitor-quick-button");
const visitorQuickEvent = document.querySelector("#visitor-quick-event");
const visitorEventToggleField = document.querySelector("#visitor-event-toggle-field");
const visitorEventToggleLabel = document.querySelector("#visitor-event-toggle-label");
const kidQuickForm = document.querySelector("#kid-quick-form");
const kidQuickName = document.querySelector("#kid-quick-name");
const kidQuickGuardian = document.querySelector("#kid-quick-guardian");
const kidQuickReach = document.querySelector("#kid-quick-reach");
const kidQuickSunday = document.querySelector("#kid-quick-sunday");
const addKidQuickButton = document.querySelector("#add-kid-quick-button");
const resetKidQuickButton = document.querySelector("#reset-kid-quick-button");
const visitorEventColHeader = document.querySelector("#visitor-event-col-header");
const fillPlanningMembersButton = document.querySelector("#fill-planning-members");
const fillReachMembersButton = document.querySelector("#fill-reach-members");
const fillReachPrivilegesButton = document.querySelector("#fill-reach-privileges");
const copyPlanningToReachButton = document.querySelector("#copy-planning-to-reach");
const copyReachToSundayButton = document.querySelector("#copy-reach-to-sunday");
const fillSundayMembersButton = document.querySelector("#fill-sunday-members");
const markAllVisitorsToSundayButton = document.querySelector("#mark-all-visitors-to-sunday");
const copyVisitorReachToSundayButton = document.querySelector("#copy-visitor-reach-to-sunday");
const markAllPrivilegesButton = document.querySelector("#mark-all-privileges");
const clearMemberActivitiesButton = document.querySelector("#clear-member-activities");
const copyKidReachToSundayButton = document.querySelector("#copy-kid-reach-to-sunday");
const fillSundayKidsButton = document.querySelector("#fill-sunday-kids");
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
const friendTrackingPanel = document.querySelector("#friend-tracking-panel");
const friendTrackingScopeChip = document.querySelector("#friend-tracking-scope-chip");
const friendTrackingCellFilter = document.querySelector("#friend-tracking-cell-filter");
const friendTrackingFilterPicker = document.querySelector("#friend-tracking-filter-picker");
const friendTrackingFilterButton = document.querySelector("#friend-tracking-filter-button");
const friendTrackingFilterButtonText = document.querySelector("#friend-tracking-filter-button-text");
const friendTrackingFilterMenu = document.querySelector("#friend-tracking-filter-menu");
const friendTrackingSummaryGrid = document.querySelector("#friend-tracking-summary-grid");
const friendTrackingQuickChips = document.querySelector("#friend-tracking-quick-chips");
const friendTrackingFriendsList = document.querySelector("#friend-tracking-friends-list");
const friendTrackingRestorationChips = document.querySelector("#friend-tracking-restoration-chips");
const friendTrackingRestorationList = document.querySelector("#friend-tracking-restoration-list");
const friendTrackingControlChips = document.querySelector("#friend-tracking-control-chips");
const friendTrackingControlList = document.querySelector("#friend-tracking-control-list");
const friendTrackingGoals = document.querySelector("#friend-tracking-goals");
const friendTrackingSignals = document.querySelector("#friend-tracking-signals");
const friendTrackingGoalsTabButton = document.querySelector("#seg-tab-goals-button");
const friendTrackingGoalsTitle = document.querySelector("#friend-tracking-goals-title");
const reachSupervisionSectorCountField = document.querySelector("#reach-supervision-sector-count");
const reachSupervisorVisitsJsonField = document.querySelector("#reach-supervisor-visits-json");
const reachSupervisorVisitSummary = document.querySelector("#reach-supervisor-visit-summary");
const reachSupervisorVisitList = document.querySelector("#reach-supervisor-visit-list");
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

function isEditableReportNumberInput(target) {
  return target instanceof HTMLInputElement
    && target.type === "number"
    && target.closest("#report-form") === reportForm
    && !target.disabled
    && !target.readOnly;
}

function isZeroLikeNumericValue(value) {
  return /^0(?:\.0+)?$/.test(String(value || "").trim());
}

function handleReportNumberInputFocusIn(event) {
  const input = event.target;
  if (!isEditableReportNumberInput(input) || !isZeroLikeNumericValue(input.value)) return;
  input.dataset.zeroAutoclear = "1";
  input.value = "";
}

function handleReportNumberInputFocusOut(event) {
  const input = event.target;
  if (!isEditableReportNumberInput(input)) return;
  if (String(input.value || "").trim() !== "") {
    delete input.dataset.zeroAutoclear;
    return;
  }
  input.value = "0";
  delete input.dataset.zeroAutoclear;
}

if (memberModalClose) memberModalClose.addEventListener("click", () => memberDetailModal?.close());
if (memberDetailModal) memberDetailModal.addEventListener("click", e => { if (e.target === memberDetailModal) memberDetailModal.close(); });
const dashboardRecentActivity = document.querySelector("#dashboard-recent-activity");
const dashboardMetricsSection = document.querySelector("#dashboard-metrics-section");
const dashboardMetricsToggle = document.querySelector("#dashboard-metrics-toggle");
const dashboardMetricsEyebrow = document.querySelector("#dashboard-metrics-eyebrow");
const dashboardMetricsBody = document.querySelector("#dashboard-metrics-body");
let activeMetricsScope = "total"; // "total" | "sector"
let activeDashboardTimeScope = "week"; // "week" | "quarter" | "year"
// Sub-pestañas del Dashboard que reducen el ámbito (mi célula / mi sector / todas)
// null = aún no inicializado; se ajusta a la primera pestaña disponible para el usuario.
let activeDashboardScope = null; // null | "cell" | "sector" | "all"

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
const memberAttendanceModeSelect = document.querySelector("#member-attendance-mode-select");
const memberAttendanceDefaultsFields = document.querySelector("#member-attendance-defaults-fields");
const memberDefaultPlanning = document.querySelector("#member-default-planning");
const memberDefaultReach = document.querySelector("#member-default-reach");
const memberDefaultSunday = document.querySelector("#member-default-sunday");
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
  { key: "e1Maduracion",      label: t('met.e1Mat'),     section: "consolidar", sectionLabel: "Fase Consolidar",  type: "clase"  },
  { key: "e2Integracion",     label: t('met.e2Int'),    section: "consolidar", sectionLabel: "Fase Consolidar",  type: "clase"  },
  { key: "e3Ubicacion",       label: t('met.e3Ubi'),      section: "consolidar", sectionLabel: "Fase Consolidar",  type: "clase"  },
  { key: "eventoUnete",       label: t('met.evtUnete'),        section: "consolidar", sectionLabel: "Fase Consolidar",  type: "evento" },
  { key: "restauracion",      label: t('dash.restoration'),        section: "consolidar", sectionLabel: "Fase Consolidar",  type: "evento" },
  { key: "eventoReencuentro", label: "Evento Re-encuentro", section: "consolidar", sectionLabel: "Fase Consolidar",  type: "evento" },
  { key: "eventoMinisterios", label: "Evento Ministerios",  section: "consolidar", sectionLabel: "Fase Consolidar",  type: "evento" },
  { key: "reencuentro",       label: "Reencuentro",         section: "consolidar", sectionLabel: "Fase Consolidar",  type: "evento" },
  // ── Fase Discipular ─────────────────────────────────────────
  { key: "e1Vision",          label: t('met.e1Vis'),         section: "discipular", sectionLabel: "Fase Discipular",  type: "clase"  },
  { key: "e2Caracter",        label: t('met.e2Car'),       section: "discipular", sectionLabel: "Fase Discipular",  type: "clase"  },
  { key: "e3Perfil",          label: "E3 - Perfil",         section: "discipular", sectionLabel: "Fase Discipular",  type: "clase"  },
  { key: "lanzamiento",       label: "Lanzamiento/Multip.", section: "discipular", sectionLabel: "Fase Discipular",  type: "evento" },
  { key: "cielosAbiertos",    label: "Cielos Abiertos",     section: "discipular", sectionLabel: "Fase Discipular",  type: "evento" },
  // ── Escuelas ─────────────────────────────────────────────────
  { key: "escFormativa",      label: "Esc. Formativa",      section: "escuelas",   sectionLabel: "Escuelas",         type: "clase"  },
  { key: "escPadresEsp",      label: "Esc. Padres Esp.",    section: "escuelas",   sectionLabel: "Escuelas",         type: "clase"  },
  { key: "escLideres",        label: t('met.eduLeaders'),        section: "escuelas",   sectionLabel: "Escuelas",         type: "clase"  },
  { key: "escSupervisores",   label: "Esc. Supervisores",   section: "escuelas",   sectionLabel: "Escuelas",         type: "clase"  },
];

// All report sections matching the original PDF exactly.
// IMPORTANT: keep as a function so labels re-evaluate when the user toggles language.
function getMetricSectionDefinitions() {
  return [
    { title: t('dash.planning'),      fields: [["planningMembersPresent", t('met.membersAttending')], ["planningMembersAbsent", t('met.membersAbsent')]] },
    { title: t('dash.reach'),         fields: [["reachMembersPresent", t('met.membersAttending')], ["reachPrivilegedMembers", t('met.membersPrivileged')], ["reachFriendsPresent", t('met.friendsPresentLong')], ["reachConversions", t('met.conversions')], ["reachKidsPresent", t('rcm.kidsPresent')]] },
    { title: t('met.sectMultiplication'),  fields: [["multiplyBrothersNewCell", t('met.multBros')], ["multiplyPEinNewCell", t('met.multPE')], ["multiplyKidsNewCell", t('met.multKids')], ["multiplySundayAttendance", t('met.sundayInspAttended')]] },
    { title: t('met.phaseWin'),      fields: [["winSpiritualParents", t('met.spiritualParents')], ["winFriendsContacted", t('met.friendsContacted')], ["winRiseEventFriends", t('met.friendsLev')], ["winEDRFriends", t('met.friendsEDR')], ["winBaptizedFriends", t('met.friendsBaptized')]] },
    { title: t('met.phaseConsolidate'), fields: [["consolidateE1", t('met.e1Mat')], ["consolidateE2", t('met.e2Int')], ["consolidateE3", t('met.e3Ubi')], ["consolidateJoinEvent", t('met.evtUnete')], ["consolidateReencuentro", t('met.evtReencuentro')], ["consolidateMinistries", t('met.evtMinistries')]] },
    { title: t('met.phaseDisciple'), fields: [["discipleE1Vision", t('met.e1Vis')], ["discipleE2Character", t('met.e2Car')], ["discipleE3Profile", t('met.e3Perfil')], ["discipleLaunchMultiply", t('met.launchMult')]] },
    { title: t('met.sectSchools'),   fields: [["schoolFormative", t('met.eduFormative')], ["schoolParents", t('met.eduSpiritualParents')], ["schoolLeaders", t('met.eduLeaders')], ["schoolSupervisors", t('met.eduSupervisors')]] },
    { title: t('met.sectBaptisms'),  fields: [["baptismFirstQuarter", t('met.q1')], ["baptismSecondQuarter", t('met.q2')], ["baptismThirdQuarter", t('met.q3')], ["baptismYearTotal", t('met.totalYear')]] },
  ];
}

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

let catalogs = { people: [], systemPeople: [], cells: [] };
let appSettings = {};   // loaded from /api/settings
let historyScope = (typeof localStorage !== "undefined" && (localStorage.getItem("historyScope") === "all" || localStorage.getItem("historyScope") === "current"))
  ? localStorage.getItem("historyScope")
  : "current"; // "current" = solo cuatrimestre activo, "all" = todo
let editingReportId = null;
let editingReportWasFinalized = false;
let editingReportOriginWasFinalized = false;
let editingReportLoadedData = null;
let reportDirtySlices = createReportDirtySlices();
let recentFinalizedReportContext = null;
let submittedEditConfirmedReportId = null;
let reportReadOnlyMode = false;  // true when viewing a closed-week report in the form
let suppressWeekChangeHandler = false;  // prevents re-entrant change events from form.reset()
let activePeopleFilter = "all";
let activePeopleSearch = "";
let activeCellSearch = "";
let currentMemberAttendance = [];
let currentVisitors = [];
let currentKids = [];
let currentBaptisms = [];
let currentReachSupervisorVisits = [];
let reportsData = [];
let approvalsData = [];
let activeDashboardPeriod = "";
// Memoria por scope de tiempo: recordar la última semana/cuatrimestre/año
// seleccionado al cambiar de pestaña, para no saltar a la actual.
const dashboardPeriodByScope = { week: "", quarter: "", year: "" };

// ── AUTH ──────────────────────────────────────────────────────────────────
let currentUser = null;
const RC_SESSION_KEY = "rcSession";

const loginOverlay     = document.getElementById("login-overlay");
const loginPersonSelect = document.getElementById("login-username");
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

function canPersonLogin(p) {
  if (!p || p.role === "kid") return false;
  if (hasCoordinatorAccess(p)) return true;
  if (p.supervisorSector) return true;
  const id = String(p.id);
  return (catalogs.cells || []).some(c => String(c.leaderPersonId) === id || String(c.assistantPersonId) === id);
}

function hasCoordinatorAccess(person) {
  return !!(person && (person.isCoordinator || person.role === "pastor"));
}

function canUserViewAllCells(user = currentUser) {
  return !!(user && user.isAdmin);
}

function getUserScopeTabs(user = currentUser) {
  const tabs = [];
  if (!user) return tabs;
  const myCell = String(user.assignedCellNumber || "").trim();
  const mySector = String(user.supervisedSector || "").trim();
  if (myCell) tabs.push({ key: "cell", label: t('dash.scopeMyCell'), sublabel: t('cell.numbered', { n: myCell }) });
  if (mySector) tabs.push({ key: "sector", label: t('dash.scopeMySector'), sublabel: `Sector ${mySector}` });
  if (canUserViewAllCells(user)) tabs.push({ key: "all", label: t('dash.scopeAll'), sublabel: t('dash.scopeAllSub') });
  return tabs;
}

function getPreferredDashboardScope(user = currentUser, tabs = getUserScopeTabs(user)) {
  const availableScopes = new Set((tabs || []).map(tab => tab.key));
  if (availableScopes.has("all")) return "all";
  if (availableScopes.has("sector")) return "sector";
  if (availableScopes.has("cell")) return "cell";
  return tabs[0]?.key || null;
}

function getEffectiveDashboardScope(scope = null, user = currentUser) {
  if (!user) return scope || activeDashboardScope || "all";
  const explicitScope = String(scope || activeDashboardScope || "").trim();
  const tabs = getUserScopeTabs(user);
  const availableScopes = new Set(tabs.map(tab => tab.key));
  if (explicitScope && availableScopes.has(explicitScope)) return explicitScope;
  return getPreferredDashboardScope(user, tabs);
}

function isCellScopedLeaderView(user = currentUser) {
  return getEffectiveDashboardScope(null, user) === "cell"
    && getUserScopedCellNumbers("cell", user).size > 0;
}

function getUserScopedCellNumbers(scope = null, user = currentUser) {
  if (!user) {
    return new Set((catalogs.cells || []).map(cell => String(cell.cellNumber || "")).filter(Boolean));
  }
  const activeScope = getEffectiveDashboardScope(scope, user);
  const myCell = String(user.assignedCellNumber || "").trim();
  const mySector = String(user.supervisedSector || "").trim();
  if (activeScope === "cell") {
    return new Set(myCell ? [myCell] : []);
  }
  if (activeScope === "sector") {
    return new Set(
      (catalogs.cells || [])
        .filter(cell => String(cell.sector || "").trim() === mySector)
        .map(cell => String(cell.cellNumber || "").trim())
        .filter(Boolean)
    );
  }
  if (activeScope === "all") {
    if (!canUserViewAllCells(user)) {
      return getUserScopedCellNumbers(mySector ? "sector" : "cell", user);
    }
    return new Set((catalogs.cells || []).map(cell => String(cell.cellNumber || "").trim()).filter(Boolean));
  }
  return new Set();
}

function filterItemsByUserScope(items, getCellNumber, scope = null, user = currentUser) {
  if (!Array.isArray(items)) return [];
  const allowedCells = getUserScopedCellNumbers(scope, user);
  if (!allowedCells.size) return [];
  return items.filter(item => allowedCells.has(String(getCellNumber(item) || "").trim()));
}

function populateLoginSelect() {
  // Login ahora usa input de username; ya no se llena un combo.
  // Esta funcion se conserva como no-op para no romper llamadas existentes.
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
    segSubTab.hidden = !(user.assignedCellNumber || user.isAdmin || user.isSupervisor);
  }
  const supSubTab = document.querySelector(".seg-view-tab[data-segtab='supervisor']");
  if (supSubTab) {
    supSubTab.hidden = !(user.isAdmin || user.isSupervisor);
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
  // Re-render tablas que dependen de los permisos del usuario actual
  // (botones de reset-pwd, pestaña de cuentas de sistema, etc.) — si no se
  // hace, el usuario debe presionar F5 para verlas.
  try { renderPeopleRows(); } catch (_e) { /* puede no estar listo aún */ }
  try { renderSystemAccountsTable(); } catch (_e) { /* idem */ }
  try { renderCellsTable(); } catch (_e) { /* idem */ }
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

loginPersonSelect?.addEventListener("input", () => {
  // Reset estado al teclear; el lookup sucede al hacer blur o submit.
  loginAuthMode = "none";
  loginLookupResult = null;
  if (loginPasswordField) loginPasswordField.hidden = true;
  if (loginPasswordConfirmField) loginPasswordConfirmField.hidden = true;
  setLoginHelp('');
  setLoginError('');
  if (loginBtn) loginBtn.disabled = !(loginPersonSelect.value || '').trim();
});
loginPersonSelect?.addEventListener("blur", async () => {
  await refreshLoginPasswordUI();
});
loginPersonSelect?.addEventListener("keydown", (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    refreshLoginPasswordUI().then(() => {
      // Si ya hay password creado, foco al password
      if (loginAuthMode === 'enter') loginPasswordInput?.focus();
      else if (loginAuthMode === 'none' && loginLookupResult && loginBtn && !loginBtn.disabled) loginBtn.click();
    });
  }
});
const loginPasswordField        = document.getElementById("login-password-field");
const loginPasswordConfirmField = document.getElementById("login-password-confirm-field");
const loginPasswordInput        = document.getElementById("login-password");
const loginPasswordConfirm      = document.getElementById("login-password-confirm");
const loginPasswordLabel        = document.getElementById("login-password-label");
const loginHelp                 = document.getElementById("login-help");
const loginError                = document.getElementById("login-error");

let loginAuthMode = "none"; // 'none' | 'enter' | 'create' | 'reset'
let loginLookupResult = null; // { personId, name, hasPassword, mustChange }

[loginPasswordInput, loginPasswordConfirm].forEach(el => {
  el?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && loginBtn && !loginBtn.disabled) {
      e.preventDefault();
      loginBtn.click();
    }
  });
});

function setLoginError(msg) {
  if (!loginError) return;
  if (msg) { loginError.textContent = msg; loginError.hidden = false; }
  else { loginError.textContent = ''; loginError.hidden = true; }
}
function setLoginHelp(msg) {
  if (!loginHelp) return;
  if (msg) { loginHelp.textContent = msg; loginHelp.hidden = false; }
  else { loginHelp.textContent = ''; loginHelp.hidden = true; }
}
function _normalizeUsernameClient(raw) {
  return String(raw || '')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().trim()
    .replace(/[^a-z0-9._-]+/g, '');
}
async function refreshLoginPasswordUI() {
  setLoginError('');
  if (loginPasswordInput) loginPasswordInput.value = '';
  if (loginPasswordConfirm) loginPasswordConfirm.value = '';
  loginLookupResult = null;
  const raw = (loginPersonSelect?.value || '').trim();
  const username = _normalizeUsernameClient(raw);
  if (!username) {
    loginAuthMode = 'none';
    if (loginPasswordField) loginPasswordField.hidden = true;
    if (loginPasswordConfirmField) loginPasswordConfirmField.hidden = true;
    setLoginHelp('');
    if (loginBtn) loginBtn.disabled = true;
    return;
  }
  try {
    const r = await fetch(`/api/auth/lookup/${encodeURIComponent(username)}`);
    if (r.status === 404) {
      loginAuthMode = 'none';
      if (loginPasswordField) loginPasswordField.hidden = true;
      if (loginPasswordConfirmField) loginPasswordConfirmField.hidden = true;
      setLoginHelp('');
      setLoginError(t('login.userNotFound'));
      if (loginBtn) loginBtn.disabled = true;
      return;
    }
    const data = await r.json();
    if (!r.ok) { setLoginError(data.message || t('err.generic')); return; }
    loginLookupResult = data;
    if (data.hasPassword && !data.mustChange) {
      loginAuthMode = 'enter';
      if (loginPasswordLabel) loginPasswordLabel.textContent = t('login.passwordOf', { name: data.name });
      if (loginPasswordField) loginPasswordField.hidden = false;
      if (loginPasswordConfirmField) loginPasswordConfirmField.hidden = true;
      setLoginHelp('');
    } else if (data.mustChange) {
      loginAuthMode = 'reset';
      if (loginPasswordLabel) loginPasswordLabel.textContent = t('login.createNewPassword', { name: data.name });
      if (loginPasswordField) loginPasswordField.hidden = false;
      if (loginPasswordConfirmField) loginPasswordConfirmField.hidden = false;
      setLoginHelp(t('login.passwordReset'));
    } else {
      loginAuthMode = 'create';
      if (loginPasswordLabel) loginPasswordLabel.textContent = t('login.createPassword', { name: data.name });
      if (loginPasswordField) loginPasswordField.hidden = false;
      if (loginPasswordConfirmField) loginPasswordConfirmField.hidden = false;
      setLoginHelp(t('login.firstTime'));
    }
    if (loginBtn) loginBtn.disabled = false;
  } catch (err) {
    setLoginError(t('err.connection'));
    if (loginBtn) loginBtn.disabled = true;
  }
}

loginBtn?.addEventListener("click", async () => {
  const username = _normalizeUsernameClient(loginPersonSelect?.value);
  if (!username) return;
  setLoginError('');

  // Si no hay lookup todavia (no perdio el foco), hacerlo ahora.
  if (!loginLookupResult) {
    await refreshLoginPasswordUI();
    if (!loginLookupResult) return;
  }
  const lookup = loginLookupResult;

  // Validar/crear password segun modo
  let viaMaster = false;
  let loginResult = null;
  if (loginAuthMode === 'enter') {
    const pw = String(loginPasswordInput?.value || '');
    if (!pw) { setLoginError(t('login.enterPassword')); return; }
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password: pw }),
      });
      const data = await r.json();
      if (!r.ok) { setLoginError(data.message || t('login.cantEnter')); return; }
      loginResult = data;
      viaMaster = !!data.viaMaster;
    } catch (e) { setLoginError(t('err.connection')); return; }
  } else if (loginAuthMode === 'create' || loginAuthMode === 'reset') {
    const pw  = String(loginPasswordInput?.value || '');
    const pw2 = String(loginPasswordConfirm?.value || '');
    if (pw.length < 6) { setLoginError(t('login.passwordShort')); return; }
    if (pw !== pw2) { setLoginError(t('login.passwordsMismatch')); return; }
    try {
      const r = await fetch('/api/auth/set-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId: lookup.personId, newPassword: pw }),
      });
      const data = await r.json();
      if (!r.ok) { setLoginError(data.message || t('login.cantCreatePassword')); return; }

      const loginResponse = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId: lookup.personId, password: pw }),
      });
      const loginData = await loginResponse.json();
      if (!loginResponse.ok) { setLoginError(loginData.message || t('login.cantEnter')); return; }
      loginResult = loginData;
      viaMaster = !!loginData.viaMaster;
    } catch (e) { setLoginError(t('err.connection')); return; }
  }
  // 'none' = compat (sin password todavia, no se exigio)
  if (!loginResult) {
    try {
      const r = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personId: lookup.personId }),
      });
      const data = await r.json();
      if (!r.ok) { setLoginError(data.message || t('login.cantEnter')); return; }
      loginResult = data;
      viaMaster = !!data.viaMaster;
    } catch (e) { setLoginError(t('err.connection')); return; }
  }

  const person = (catalogs.people || []).find(p => String(p.id) === String(lookup.personId))
    || (catalogs.systemPeople || []).find(p => String(p.id) === String(lookup.personId));
  if (!person) { setLoginError(t('login.personNotFound')); return; }
  const ownedCellNumber = getCellForPerson(person.id);
  const assignedCellNumber = hasCoordinatorAccess(person) || person.supervisorSector
    ? (ownedCellNumber || null)
    : (ownedCellNumber || person.assignedCellNumber || null);

  const user = {
    personId: person.id,
    name: person.name,
    role: person.role,
    assignedCellNumber,
    supervisedSector: person.supervisorSector || null,
    isCoordinator: hasCoordinatorAccess(person),
    // Una cuenta de sistema implica automáticamente permisos de admin
    // (no necesita marcarse además como coordinador o admin).
    isAdmin: !!(hasCoordinatorAccess(person) || person.isAdmin || person.isSystemAccount) || viaMaster,
    isSupervisor: !!(person.supervisorSector),
    // Master-password elevación: el operador de soporte recibe permisos de
    // cuenta de sistema para poder editar/eliminar reportes de cualquier célula
    // y ejecutar operaciones sensibles (reset password, asignar admins, etc.).
    isSystemAccount: !!(person.isSystemAccount) || viaMaster,
    viaMaster,
    visitCount: Number(loginResult?.visitCount ?? person.visitCount ?? 0),
  };

  sessionStorage.setItem(RC_SESSION_KEY, JSON.stringify(user));
  // Mantener overlay visible mientras se carga toda la sesión. Antes lo
  // ocultábamos al instante y en Render (cold-start) el usuario alcanzaba
  // a navegar a t('dash.planning') antes de que llegara la respuesta del reporte,
  // así que el formulario aparecía vacío hasta que refrescaba la página.
  if (loginOverlay) {
    const loginCard = loginOverlay.querySelector(".login-card");
    if (loginCard) loginCard.setAttribute("aria-busy", "true");
    if (loginBtn) { loginBtn.disabled = true; loginBtn.textContent = t('common.loading'); }
  }
  applyUserSession(user);
  // Limpiar cualquier reporte que el bootstrap (sin usuario) haya auto-cargado
  // de otra célula antes del login. Si no se limpia, `editingReportId` queda
  // apuntando al reporte equivocado y `autoLoadExistingReportIfAny` (más abajo)
  // sale temprano por la guarda `if (editingReportId) return;`, dejando las
  // palomitas/datos de ese otro reporte en pantalla.
  if (editingReportId) {
    resetReportForm();
  }
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
const segViewMobileSwitch = document.querySelector("#seg-view-mobile-switch");
const segViewMobilePicker = document.querySelector("#seg-view-mobile-picker");
const segViewMobileButton = document.querySelector("#seg-view-mobile-button");
const segViewMobileButtonText = document.querySelector("#seg-view-mobile-button-text");
const segViewMobileMenu = document.querySelector("#seg-view-mobile-menu");
const segAccessScopeTabs = document.querySelector("#seg-access-scope-tabs");
const segScopeMobileSwitch = document.querySelector("#seg-scope-mobile-switch");
const segScopeMobilePicker = document.querySelector("#seg-scope-mobile-picker");
const segScopeMobileButton = document.querySelector("#seg-scope-mobile-button");
const segScopeMobileButtonText = document.querySelector("#seg-scope-mobile-button-text");
const segScopeMobileMenu = document.querySelector("#seg-scope-mobile-menu");

function closeSegViewMobileMenu() {
  if (segViewMobileMenu) segViewMobileMenu.hidden = true;
  if (segViewMobilePicker) segViewMobilePicker.classList.remove("is-open");
  if (segViewMobileButton) segViewMobileButton.setAttribute("aria-expanded", "false");
}

function toggleSegViewMobileMenu(forceOpen) {
  if (!segViewMobileMenu || !segViewMobilePicker || !segViewMobileButton) return;
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : segViewMobileMenu.hidden;
  segViewMobileMenu.hidden = !shouldOpen;
  segViewMobilePicker.classList.toggle("is-open", shouldOpen);
  segViewMobileButton.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
}

function closeSegScopeMobileMenu() {
  if (segScopeMobileMenu) segScopeMobileMenu.hidden = true;
  if (segScopeMobilePicker) segScopeMobilePicker.classList.remove("is-open");
  if (segScopeMobileButton) segScopeMobileButton.setAttribute("aria-expanded", "false");
}

function toggleSegScopeMobileMenu(forceOpen) {
  if (!segScopeMobileMenu || !segScopeMobilePicker || !segScopeMobileButton) return;
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : segScopeMobileMenu.hidden;
  segScopeMobileMenu.hidden = !shouldOpen;
  segScopeMobilePicker.classList.toggle("is-open", shouldOpen);
  segScopeMobileButton.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
}

function syncSegTabSelect(activeTabName) {
  const tabs = Array.from(document.querySelectorAll("#seg-view-tab-bar .seg-view-tab[data-segtab]"));
  const visibleTabs = tabs.filter((btn) => !btn.hidden);
  const nextOptions = visibleTabs.map((btn) => ({
    value: btn.dataset.segtab,
    label: (btn.textContent || btn.dataset.segtab || "").trim(),
  }));
  if (nextOptions.length) {
    const safeActive = nextOptions.some((opt) => opt.value === activeTabName) ? activeTabName : nextOptions[0].value;
    if (segViewMobileButtonText) {
      const activeLabel = nextOptions.find((opt) => opt.value === safeActive)?.label || safeActive;
      segViewMobileButtonText.textContent = activeLabel;
    }
    if (segViewMobileMenu) {
      segViewMobileMenu.innerHTML = nextOptions.map((opt) => `
        <button type="button" class="seg-view-mobile-option${opt.value === safeActive ? " is-active" : ""}" data-segtab="${escapeHtml(opt.value)}" role="option" aria-selected="${opt.value === safeActive ? "true" : "false"}">
          ${escapeHtml(opt.label)}
        </button>
      `).join("");
    }
    if (segViewMobileSwitch) segViewMobileSwitch.hidden = false;
  } else if (segViewMobileSwitch) {
    segViewMobileSwitch.hidden = true;
  }
}

function getActiveSegTabName() {
  return document.querySelector("#seg-view-tab-bar .seg-view-tab.is-active")?.dataset.segtab || "dashboard";
}

function rerenderActiveSeguimientoTab() {
  const activeTab = getActiveSegTabName();
  if (activeTab === "dashboard") renderDashboard(reportsData);
  if (activeTab === "seguimiento") renderSeguimiento(reportsData);
  if (activeTab === "goals") loadFriendTrackingPanel();
}

function renderIntegratedScopeMarkup(tabs, activeScope, bridgeClassName, stateClassName, tabsClassName) {
  if (tabs.length > 1) {
    return `
      <div class="dashboard-scope-tabs ${tabsClassName}" role="tablist">
        ${tabs.map(tab => `
          <button type="button" class="dashboard-scope-tab ${tab.key === activeScope ? "is-active" : ""}" data-scope="${escapeHtml(tab.key)}" role="tab" aria-selected="${tab.key === activeScope}">
            ${escapeHtml(tab.label)}
            ${tab.sublabel ? `<span class="scope-tab-sub">${escapeHtml(tab.sublabel)}</span>` : ""}
          </button>
        `).join("")}
      </div>
    `;
  }

  const tab = tabs[0];
  return `
    <div class="dashboard-scope-state ${stateClassName}" role="status" aria-live="polite">
      <span class="dashboard-scope-state-label">${escapeHtml(tab.label)}</span>
      ${tab.sublabel ? `<span class="dashboard-scope-state-sub">${escapeHtml(tab.sublabel)}</span>` : ""}
    </div>
  `;
}

function syncIntegratedSegScopeState(tabs, activeSegTab, shouldShow) {
  const stripBridge = reportContextStrip?.querySelector(".rcs-scope-bridge");
  const goalsBridge = friendTrackingPanel?.querySelector(".ft-scope-bridge");

  if (stripBridge) stripBridge.remove();
  if (goalsBridge) goalsBridge.remove();
  reportContextStrip?.classList.remove("has-scope-bridge");
  friendTrackingPanel?.classList.remove("has-scope-bridge");

  const canIntegrate = shouldShow && tabs.length > 0;

  if (!canIntegrate) {
    return false;
  }

  let container = null;
  let bridgeClassName = "";
  let stateClassName = "";
  let tabsClassName = "";

  if (activeSegTab === "seguimiento" && reportContextStrip) {
    container = reportContextStrip;
    bridgeClassName = "rcs-scope-bridge";
    stateClassName = "rcs-scope-state";
    tabsClassName = "rcs-scope-tabs";
  } else if (activeSegTab === "goals" && friendTrackingPanel) {
    container = friendTrackingPanel;
    bridgeClassName = "ft-scope-bridge";
    stateClassName = "ft-scope-state";
    tabsClassName = "ft-scope-tabs";
  }

  if (!container) {
    return false;
  }

  const bridge = document.createElement("div");
  bridge.className = bridgeClassName;
  bridge.innerHTML = renderIntegratedScopeMarkup(tabs, activeDashboardScope, bridgeClassName, stateClassName, tabsClassName);
  container.insertBefore(bridge, container.firstChild);
  container.classList.add("has-scope-bridge");

  if (!container.dataset.scopeBridgeWired) {
    container.dataset.scopeBridgeWired = "1";
    container.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".dashboard-scope-tab[data-scope]");
      if (!btn || !container.contains(btn)) return;
      const newScope = String(btn.dataset.scope || "").trim();
      if (!newScope || newScope === activeDashboardScope) return;
      activeDashboardScope = newScope;
      renderSegAccessScopeTabs();
      rerenderActiveSeguimientoTab();
    });
  }
  return true;
}

function renderSegAccessScopeTabs() {
  if (!segAccessScopeTabs) return false;
  const tabs = getUserScopeTabs();
  const activeSegTab = getActiveSegTabName();
  const hasMultipleScopes = tabs.length > 1;
  if (!activeDashboardScope || !tabs.some(tab => tab.key === activeDashboardScope)) {
    activeDashboardScope = getPreferredDashboardScope(currentUser, tabs);
  }
  const shouldShow = tabs.length > 0 && (activeSegTab === "seguimiento" || activeSegTab === "goals");
  const integratedScope = syncIntegratedSegScopeState(tabs, activeSegTab, shouldShow);
  if (!shouldShow) {
    segAccessScopeTabs.hidden = true;
    segAccessScopeTabs.innerHTML = "";
    if (segScopeMobileSwitch) segScopeMobileSwitch.hidden = true;
    if (segScopeMobileMenu) segScopeMobileMenu.innerHTML = "";
    return false;
  }
  if (integratedScope) {
    segAccessScopeTabs.hidden = true;
    segAccessScopeTabs.innerHTML = "";
    if (segScopeMobileSwitch) segScopeMobileSwitch.hidden = true;
    if (segScopeMobileMenu) segScopeMobileMenu.innerHTML = "";
    return false;
  }
  segAccessScopeTabs.hidden = false;
  segAccessScopeTabs.classList.toggle("is-single-scope", !hasMultipleScopes);
  segAccessScopeTabs.innerHTML = hasMultipleScopes
    ? tabs.map(tab => `
      <button type="button" class="dashboard-scope-tab ${tab.key === activeDashboardScope ? "is-active" : ""}" data-scope="${escapeHtml(tab.key)}" role="tab" aria-selected="${tab.key === activeDashboardScope}">
        ${escapeHtml(tab.label)}
        ${tab.sublabel ? `<span class="scope-tab-sub">${escapeHtml(tab.sublabel)}</span>` : ""}
      </button>
    `).join("")
    : tabs.map(tab => `
      <div class="dashboard-scope-state" role="status" aria-live="polite">
        <span class="dashboard-scope-state-label">${escapeHtml(tab.label)}</span>
        ${tab.sublabel ? `<span class="dashboard-scope-state-sub">${escapeHtml(tab.sublabel)}</span>` : ""}
      </div>
    `).join("");
  if (segScopeMobileButtonText) {
    segScopeMobileButtonText.textContent = tabs.find(tab => tab.key === activeDashboardScope)?.label || "Alcance";
  }
  if (segScopeMobileMenu) {
    segScopeMobileMenu.innerHTML = tabs.map(tab => `
      <button type="button" class="seg-view-mobile-option${tab.key === activeDashboardScope ? " is-active" : ""}" data-scope="${escapeHtml(tab.key)}" role="option" aria-selected="${tab.key === activeDashboardScope ? "true" : "false"}">
        ${escapeHtml(tab.label)}
      </button>
    `).join("");
  }
  if (segScopeMobileSwitch) segScopeMobileSwitch.hidden = !hasMultipleScopes;
  if (!segAccessScopeTabs.dataset.wired) {
    segAccessScopeTabs.dataset.wired = "1";
    segAccessScopeTabs.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".dashboard-scope-tab");
      if (!btn) return;
      const newScope = btn.dataset.scope;
      if (!newScope || newScope === activeDashboardScope) return;
      activeDashboardScope = newScope;
      renderSegAccessScopeTabs();
      rerenderActiveSeguimientoTab();
    });
  }
  if (segScopeMobileMenu && !segScopeMobileMenu.dataset.wired) {
    segScopeMobileMenu.dataset.wired = "1";
    segScopeMobileMenu.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".seg-view-mobile-option[data-scope]");
      if (!btn) return;
      const newScope = String(btn.dataset.scope || "").trim();
      if (!newScope || newScope === activeDashboardScope) return;
      activeDashboardScope = newScope;
      closeSegScopeMobileMenu();
      renderSegAccessScopeTabs();
      rerenderActiveSeguimientoTab();
    });
  }
  return true;
}

function activateSegTab(tabName) {
  const canSeeSeguimiento = currentUser?.assignedCellNumber || currentUser?.isAdmin || currentUser?.isSupervisor;
  const canSeeSupervisor = currentUser?.isAdmin || currentUser?.isSupervisor;
  if (tabName === "seguimiento" && !canSeeSeguimiento) tabName = "dashboard";
  if (tabName === "supervisor" && !canSeeSupervisor) tabName = "dashboard";

  const tabs = document.querySelectorAll("#seg-view-tab-bar .seg-view-tab");
  tabs.forEach(btn => btn.classList.toggle("is-active", btn.dataset.segtab === tabName));
  const segPanel = document.getElementById("seg-tab-seguimiento");
  const supPanel = document.getElementById("seg-tab-supervisor");
  const dashPanel = document.getElementById("seg-tab-dashboard");
  const goalsPanel = document.getElementById("seg-tab-goals");
  if (segPanel)  segPanel.hidden  = tabName !== "seguimiento";
  if (supPanel)  supPanel.hidden  = tabName !== "supervisor";
  if (dashPanel) dashPanel.hidden = tabName !== "dashboard";
  if (goalsPanel) goalsPanel.hidden = tabName !== "goals";
  syncSegTabSelect(tabName);
  renderSegAccessScopeTabs();
  closeSegViewMobileMenu();
  if (tabName === "dashboard") renderDashboard(reportsData);
  if (tabName === "seguimiento") renderSeguimiento(reportsData);
  if (tabName === "supervisor")  renderSeguimientoSupervisor(reportsData);
  if (tabName === "goals") loadFriendTrackingPanel();
}

function showView(viewName) {
  // "dashboard" is now a sub-tab inside seguimiento
  const resolvedView = viewName === "dashboard" ? "seguimiento" : viewName;
  // Default sub-tab: seguimiento for anyone with cell/supervisor/admin scope.
  const defaultSegTab = (currentUser?.assignedCellNumber || currentUser?.isAdmin || currentUser?.isSupervisor)
    ? "seguimiento"
    : "dashboard";
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
      ?? t('rep.cellReport');
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
        const payload = await response.json().catch(() => ({ message: t('err.unexpected') }));
        throw new Error(payload.message || t('err.unexpected'));
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
  throw lastErr || new Error(t('err.unexpected'));
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

function createReportDirtySlices() {
  return {
    members: false,
    visitors: false,
    kids: false,
    baptisms: false,
    reachSupervisor: false,
  };
}

function resetReportDirtySlices() {
  reportDirtySlices = createReportDirtySlices();
}

function markReportDirty(...sliceNames) {
  sliceNames.forEach((sliceName) => {
    if (Object.prototype.hasOwnProperty.call(reportDirtySlices, sliceName)) {
      reportDirtySlices[sliceName] = true;
    }
  });
}

function cloneReportData(value) {
  try {
    return JSON.parse(JSON.stringify(value ?? null));
  } catch {
    return value ?? null;
  }
}

function getReportRecencyValue(report) {
  const raw = String(report?.updatedAt || report?.createdAt || report?.reportDate || report?.formData?.reportDate || "").trim();
  const parsed = raw ? Date.parse(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : 0;
}

function findExistingReportForCellWeek(cell, week) {
  const normalizedCell = String(cell || "").trim();
  const normalizedWeek = String(week || "").trim();
  if (!normalizedCell || !normalizedWeek) return null;

  const cycleStartStr = String(appSettings?.cycle_start_date || "").trim();
  const targetYear = String(new Date().getFullYear());
  const targetQuarter = String(getCurrentQuarter());

  const candidates = (reportsData || []).filter((report) => {
    const reportCell = String(report.cellNumber || report.formData?.cellNumber || "").trim();
    const reportWeek = String(getReportWeek(report) || "").trim();
    if (reportCell !== normalizedCell || reportWeek !== normalizedWeek) return false;

    const reportDate = String(report.reportDate || report.formData?.reportDate || "").trim();
    if (cycleStartStr) {
      return !!reportDate && reportDate >= cycleStartStr;
    }

    return getReportYear(report) === targetYear && String(getReportQuarter(report)) === targetQuarter;
  });

  return candidates.sort((left, right) => {
    const leftFinalized = !isReportEffectivelyDraft(left);
    const rightFinalized = !isReportEffectivelyDraft(right);
    if (leftFinalized !== rightFinalized) return leftFinalized ? -1 : 1;

    const leftMeaningful = reportHasMeaningfulData(left);
    const rightMeaningful = reportHasMeaningfulData(right);
    if (leftMeaningful !== rightMeaningful) return leftMeaningful ? -1 : 1;

    const recencyDiff = getReportRecencyValue(right) - getReportRecencyValue(left);
    if (recencyDiff !== 0) return recencyDiff;

    return Number(right?.id || 0) - Number(left?.id || 0);
  })[0] || null;
}

// True si el reporte tiene contenido capturado (asistencias marcadas,
// visitas, niños o bautismos). Se usa para tratar reportes "vacíos"
// (cabecera sin datos) como borradores en el dashboard, evitando que
// se pinten en verde sin información real.
function reportHasMeaningfulData(report) {
  const fd = report?.formData || report || {};
  const visitors = Array.isArray(fd.visitors) ? fd.visitors : [];
  if (visitors.some(v => String(v?.name || "").trim())) return true;
  const kids = Array.isArray(fd.kids) ? fd.kids : [];
  if (kids.some(k => String(k?.name || "").trim())) return true;
  const baptisms = Array.isArray(fd.baptisms) ? fd.baptisms : [];
  if (baptisms.some(b => String(b?.name || "").trim())) return true;
  const reachSupervisorVisits = normalizeReachSupervisorVisits(fd.reachSupervisorVisits || fd.reachSupervisorVisitsJson);
  if (reachSupervisorVisits.length) return true;
  const members = Array.isArray(fd.memberAttendance) ? fd.memberAttendance : [];
  return members.some(m =>
    m?.planningAttended || m?.reachAttended || m?.sundayAttended ||
    m?.reachPrivileged || m?.sundayPrivileged ||
    (m?.planningStatus && m.planningStatus !== "pending") ||
    (m?.reachStatus && m.reachStatus !== "pending") ||
    (m?.sundayStatus && m.sundayStatus !== "pending") ||
    (m?.status && m.status !== "pending")
  );
}

function computeWeeklySummaryFromPayload(payload = {}) {
  const members = Array.isArray(payload.memberAttendance) ? payload.memberAttendance : [];
  const namedVisitors = normalizeVisitors(payload.visitors).filter((visitor) => String(visitor.name || "").trim());
  const namedKids = normalizeKids(payload.kids).filter((kid) => String(kid.name || "").trim());
  const baptisms = normalizeBaptisms(payload.baptisms).filter((entry) => entry.name);
  const reachSupervisorVisits = normalizeReachSupervisorVisits(payload.reachSupervisorVisits || payload.reachSupervisorVisitsJson);
  const counts = {
    totalMembers: members.length,
    planningMembersPresent: 0,
    planningMembersAbsent: 0,
    reachMembersPresent: 0,
    reachPrivilegedMembers: 0,
    reachFriendsPresent: 0,
    reachConversions: 0,
    reachKidsPresent: 0,
    reachSupervisorVisits: 0,
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

  members.forEach((entry) => {
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

  counts.reachSupervisorVisits = reachSupervisorVisits.length;
  counts.reachMembersPresent += counts.reachSupervisorVisits;

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

  RCM_MILESTONES.forEach(({ key, type }) => {
    counts[`rcm_${key}`] = members.filter((entry) => {
      const val = entry.rcmProgress?.[key];
      if (!val) return false;
      if (type === "clase") return String(val).startsWith("en_curso:");
      return true;
    }).length;
  });

  namedKids.forEach((kid) => {
    if (kid.reachAttended) counts.reachKidsPresent += 1;
    if (kid.sundayAttended) counts.sundayKidsPresent += 1;
  });

  counts.winBaptizedFriends = getBaptismCaptureStatus().isAllowed ? baptisms.length : 0;
  counts.planningMembersAbsent = Math.max(0, counts.totalMembers - counts.planningMembersPresent);
  counts.sundayTotal = counts.sundayMembersPresent + counts.sundayFriendsPresent + counts.sundayKidsPresent;
  counts.reachTotal = counts.reachMembersPresent + counts.reachFriendsPresent;

  return counts;
}

function preserveUntouchedReportSlices(payload) {
  if (!editingReportId || !editingReportLoadedData) return payload;

  const base = editingReportLoadedData;
  if (!reportDirtySlices.members && Array.isArray(base.memberAttendance)) {
    payload.memberAttendance = cloneReportData(base.memberAttendance);
  }
  if (!reportDirtySlices.visitors && Array.isArray(base.visitors)) {
    payload.visitors = cloneReportData(base.visitors);
  }
  if (!reportDirtySlices.kids && Array.isArray(base.kids)) {
    payload.kids = cloneReportData(base.kids);
  }
  if (!reportDirtySlices.baptisms && Array.isArray(base.baptisms)) {
    payload.baptisms = cloneReportData(base.baptisms);
  }
  if (!reportDirtySlices.reachSupervisor) {
    const baseSupervisorVisits = base.reachSupervisorVisits ?? base.reachSupervisorVisitsJson;
    if (baseSupervisorVisits != null) {
      payload.reachSupervisorVisits = cloneReportData(baseSupervisorVisits);
    }
  }
  return payload;
}

function isReportEffectivelyDraft(report) {
  const fd = report?.formData || {};
  if (fd._draft === true || fd._draft === "true") return true;
  return !reportHasMeaningfulData(report);
}

function isReportVisuallyDraft(report) {
  if (isReportEffectivelyDraft(report)) return true;
  const reportId = Number(report?.id || 0);
  return Boolean(reportId && editingReportId === reportId && submittedEditConfirmedReportId === reportId);
}

function refreshReportVisualState() {
  if (!Array.isArray(reportsData)) return;
  renderReports(reportsData);
  renderSeguimiento(reportsData);
  renderDashboard(reportsData);
}

async function confirmEditingSubmittedReport(report) {
  if (!report || isReportEffectivelyDraft(report)) {
    return true;
  }

  const cell = String(report.cellNumber || report.formData?.cellNumber || "").trim() || "—";
  const week = String(getReportWeek(report) || report.formData?.week || report.week || "").trim() || "—";
  return appConfirm(
    t('conf.editSubmittedReportMsg', { c: cell, w: week }),
    t('conf.editSubmittedReport')
  );
}

async function openReportForEditing(report, reportId, options = {}) {
  if (!report) return false;
  if (!isReportEditable(report)) {
    if (!options.silentBlockedFeedback) {
      setFeedback(t('fb.reportClosedNoEdit'), true);
    }
    return false;
  }
  if (options.confirmOnOpen !== false) {
    const confirmed = await confirmEditingSubmittedReport(report);
    if (!confirmed) {
      if (!options.silentCancelledFeedback) {
        setFeedback(t('fb.reportEditCancelled'));
      }
      return false;
    }
  }
  loadReportIntoForm(report, Number(reportId || report.id));
  if (options.confirmOnOpen !== false && !isReportEffectivelyDraft(report)) {
    submittedEditConfirmedReportId = Number(reportId || report.id);
  }
  refreshReportVisualState();
  showView("report");
  const formData = report.formData || report;
  const resumeStage = options.resumeStage || pickResumeStage(formData);
  showStage(resumeStage, { skipWeekCheck: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
  return true;
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
  return String(name || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

const VISITOR_HISTORY_HIDDEN_KEY = "visitor_history_hidden_map";

function getVisitorHistoryHiddenMap() {
  try {
    const parsed = JSON.parse(String(appSettings?.[VISITOR_HISTORY_HIDDEN_KEY] || "{}"));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function getHiddenVisitorNamesForCell(cellNumber = String(cellField?.value || "").trim()) {
  if (!cellNumber) return new Set();
  const hiddenMap = getVisitorHistoryHiddenMap();
  const list = Array.isArray(hiddenMap[cellNumber]) ? hiddenMap[cellNumber] : [];
  return new Set(list.map((name) => normalizeVisitorName(name)).filter(Boolean));
}

function updateVisitorHistoryHideButton() {
  if (!(visitorQuickHistory instanceof HTMLSelectElement)) {
    return;
  }
  const cellNumber = String(cellField?.value || "").trim();
  const selectedName = String(visitorQuickHistory.value || "").trim();
  const hasSelection = Boolean(selectedName) && Boolean(cellNumber);
  if (visitorQuickHistoryHideButton instanceof HTMLButtonElement) {
    visitorQuickHistoryHideButton.hidden = !hasSelection;
    visitorQuickHistoryHideButton.disabled = !hasSelection;
  }
  if (visitorQuickHistoryRestoreButton instanceof HTMLButtonElement) {
    const hiddenCount = getHiddenVisitorNamesForCell(cellNumber).size;
    const label = visitorQuickHistoryRestoreButton.querySelector(".visitor-quick-history-toolbar-label");
    visitorQuickHistoryRestoreButton.hidden = !cellNumber || hiddenCount === 0;
    visitorQuickHistoryRestoreButton.disabled = !cellNumber || hiddenCount === 0;
    const nextLabel = hiddenCount > 0
      ? `Restaurar ocultos (${hiddenCount})`
      : "Restaurar ocultos";
    if (label instanceof HTMLSpanElement) {
      label.textContent = nextLabel;
    }
  }
}

function getVisitorHistory() {
  // El historial de visitas/amigos se restringe SIEMPRE a la célula seleccionada
  // en el reporte actual. Esto evita fugas de datos entre células incluso si el
  // usuario es admin o supervisor.
  const activeCellNumber = String(cellField?.value || "").trim();
  if (!activeCellNumber) {
    return [];
  }
  const visitorMap = new Map();
  (reportsData || [])
    .filter((report) => String(report?.cellNumber || report?.formData?.cellNumber || "").trim() === activeCellNumber)
    .forEach((report) => {
      const visitors = Array.isArray(report?.formData?.visitors) ? report.formData.visitors : [];
      visitors.forEach((visitor) => {
        const normalizedName = normalizeVisitorName(visitor?.name);
        if (!normalizedName) {
          return;
        }
        const processEntry = normalizeVisitorProcessEntry(visitor?.processEntry, visitor?.kind, {
          lateRegistration: Boolean(visitor?.lateRegistration),
        });
        const previous = visitorMap.get(normalizedName) || {
          name: String(visitor?.name || "").trim(), invitedBy: "", phone: "", converted: false, kind: "amigo", visitCount: 0, lateRegistration: false,
          processEntry: "none", processRegisteredWeek: "", processRegisteredDate: "",
        };
        visitorMap.set(normalizedName, {
          name: previous.name || String(visitor?.name || "").trim(),
          invitedBy: String(visitor?.invitedBy || previous.invitedBy || "").trim(),
          phone: String(visitor?.phone || previous.phone || "").trim(),
          converted: Boolean(visitor?.converted) || Boolean(previous.converted),
          kind: normalizeVisitorKind(visitor?.kind || previous.kind),
          lateRegistration: Boolean(visitor?.lateRegistration) || Boolean(previous.lateRegistration),
          processEntry: previous.processEntry !== "none" ? previous.processEntry : processEntry,
          processRegisteredWeek: previous.processRegisteredWeek || (processEntry !== "none" ? String(report?.week || report?.formData?.week || "") : ""),
          processRegisteredDate: previous.processRegisteredDate || (processEntry !== "none" ? String(report?.reportDate || report?.formData?.reportDate || "") : ""),
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

const mobileFormPickerState = new WeakMap();

function closeAllMobileFormPickers(exceptSelect = null) {
  Array.from(reportForm?.querySelectorAll("select.mobile-form-picker-native") || []).forEach((select) => {
    if (exceptSelect && select === exceptSelect) return;
    const state = mobileFormPickerState.get(select);
    if (!state) return;
    state.menu.hidden = true;
    state.picker.classList.remove("is-open");
    state.button.setAttribute("aria-expanded", "false");
  });
}

function getMobileFormPickerLabel(select) {
  const label = select.closest("label");
  const labelSpan = label?.querySelector(":scope > span");
  return String(labelSpan?.textContent || select.getAttribute("aria-label") || select.name || "Seleccionar").trim();
}

function syncMobileFormPicker(select) {
  const state = mobileFormPickerState.get(select);
  if (!state) return;
  const options = Array.from(select.options || []);
  const selectedOption = options.find((option) => option.selected) || options[0] || null;
  state.buttonText.textContent = String(selectedOption?.textContent || "Seleccionar").trim();
  state.button.disabled = Boolean(select.disabled) || options.length === 0;
  state.menu.innerHTML = options.map((option) => {
    const value = String(option.value || "");
    const isActive = Boolean(option.selected);
    return `<button type="button" class="mobile-form-picker-option${isActive ? " is-active" : ""}" data-mobile-picker-value="${escapeHtml(value)}" role="option" aria-selected="${isActive ? "true" : "false"}"${option.disabled ? " disabled" : ""}>${escapeHtml(String(option.textContent || value).trim())}</button>`;
  }).join("");
  if (select.hidden || !select.offsetParent) {
    state.picker.hidden = true;
    closeAllMobileFormPickers();
    return;
  }
  state.picker.hidden = false;
  if (select.disabled) {
    closeAllMobileFormPickers();
  }
}

function ensureMobileFormPicker(select) {
  if (!(select instanceof HTMLSelectElement)) return null;
  const existing = mobileFormPickerState.get(select);
  if (existing) {
    syncMobileFormPicker(select);
    return existing;
  }
  const picker = document.createElement("div");
  picker.className = "mobile-form-picker";
  picker.hidden = false;
  picker.innerHTML = `
    <button type="button" class="mobile-form-picker-button" aria-haspopup="listbox" aria-expanded="false">
      <span class="mobile-form-picker-button-text"></span>
    </button>
    <div class="mobile-form-picker-menu" role="listbox" hidden></div>
  `;
  select.classList.add("mobile-form-picker-native");
  select.insertAdjacentElement("afterend", picker);
  const button = picker.querySelector(".mobile-form-picker-button");
  const buttonText = picker.querySelector(".mobile-form-picker-button-text");
  const menu = picker.querySelector(".mobile-form-picker-menu");
  if (!(button instanceof HTMLButtonElement) || !(buttonText instanceof HTMLSpanElement) || !(menu instanceof HTMLDivElement)) {
    return null;
  }
  button.setAttribute("aria-label", getMobileFormPickerLabel(select));
  const state = { picker, button, buttonText, menu };
  mobileFormPickerState.set(select, state);
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const shouldOpen = menu.hidden;
    closeAllMobileFormPickers(shouldOpen ? select : null);
    menu.hidden = !shouldOpen;
    picker.classList.toggle("is-open", shouldOpen);
    button.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
  });
  menu.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const optionButton = event.target.closest(".mobile-form-picker-option[data-mobile-picker-value]");
    if (!(optionButton instanceof HTMLButtonElement)) return;
    const nextValue = String(optionButton.dataset.mobilePickerValue || "");
    if (select.value !== nextValue) {
      select.value = nextValue;
      select.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      syncMobileFormPicker(select);
    }
    closeAllMobileFormPickers();
  });
  picker.addEventListener("click", (event) => {
    event.stopPropagation();
  });
  const observer = new MutationObserver(() => syncMobileFormPicker(select));
  observer.observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ["disabled", "hidden", "style", "class"] });
  select.addEventListener("change", () => syncMobileFormPicker(select));
  syncMobileFormPicker(select);
  return state;
}

function initMobileFormPickers() {
  return;
}

function syncQuickLateRegistrationState(name = "") {
  if (!(visitorQuickProcessEntry instanceof HTMLSelectElement)) {
    return;
  }
  const kind = normalizeVisitorKind(visitorQuickKind?.value);
  const history = findVisitorHistoryByName(name);
  const existingProcessEntry = normalizeVisitorProcessEntry(history?.processEntry, kind, {
    lateRegistration: history?.lateRegistration,
  });
  const availability = getCurrentProcessOptionAvailability();
  const selected = existingProcessEntry !== "none"
    ? existingProcessEntry
    : normalizeVisitorProcessEntry(visitorQuickProcessEntry.value, kind);
  if (existingProcessEntry !== "none") {
    visitorQuickProcessEntry.innerHTML = `<option value="${selected}">${getVisitorProcessStatusLabel(selected)}</option>`;
    visitorQuickProcessEntry.value = selected;
    visitorQuickProcessEntry.disabled = true;
    visitorQuickProcessEntry.title = `Registrado en semana ${history?.processRegisteredWeek || "?"}${history?.processRegisteredDate ? ` · ${history.processRegisteredDate}` : ""}`;
  } else {
    visitorQuickProcessEntry.disabled = false;
    visitorQuickProcessEntry.title = "";
    visitorQuickProcessEntry.innerHTML = renderVisitorProcessOptions(selected, availability);
    if ((!availability.allowNoted && selected === "noted") || (!availability.allowLate && selected === "late")) {
      visitorQuickProcessEntry.value = "none";
    }
  }
  if (visitorQuickProcessField) {
    visitorQuickProcessField.hidden = kind !== "amigo";
  }
  updateVisitorQuickProcessSummary();
}

function updateVisitorQuickProcessSummary() {
  if (!visitorQuickProcessSummary) {
    return;
  }
  const kind = normalizeVisitorKind(visitorQuickKind?.value);
  if (kind === "visita") {
    visitorQuickProcessSummary.textContent = "Restauración · fuera de proceso";
    return;
  }
  const processEntry = normalizeVisitorProcessEntry(visitorQuickProcessEntry?.value, kind);
  const countsReachAttendance = Boolean(visitorQuickReach?.checked);
  const reachLabel = countsReachAttendance ? "sí" : "no";
  const processLabel = processEntry === "late"
    ? "tardío"
    : processEntry === "noted"
      ? "sí"
      : "no";
  visitorQuickProcessSummary.textContent = `Alcance: ${reachLabel} · Proceso: ${processLabel}`;
}

function renderVisitorHistoryOptions() {
  if (!(visitorQuickHistory instanceof HTMLSelectElement)) {
    return;
  }
  const hiddenNames = getHiddenVisitorNamesForCell();
  const history = getVisitorHistory().filter((visitor) => !hiddenNames.has(normalizeVisitorName(visitor.name)));
  const options = history.map((visitor) => {
    return `<option value="${escapeHtml(visitor.name)}">${escapeHtml(visitor.name)}</option>`;
  }).join("");
  const placeholder = history.length
    ? `<option value="">Elegir del historial (${history.length})</option>`
    : `<option value="">Sin historial para esta célula</option>`;
  visitorQuickHistory.innerHTML = `${placeholder}${options}`;
  updateVisitorHistoryHideButton();
}

async function handleHideVisitorHistorySelection() {
  const cellNumber = String(cellField?.value || "").trim();
  const selectedName = String(visitorQuickHistory?.value || "").trim();
  if (!cellNumber || !selectedName) {
    return;
  }
  const ok = await appConfirm(
    `Ocultar "${selectedName}" de Vista previa para la célula ${cellNumber}?\nYa no se mostrará en este combo. No se borran reportes anteriores ni el historial real.\nPara recuperarlo usa \"Restaurar ocultos\".`,
    "Ocultar de vista previa"
  );
  if (!ok) return;

  const hiddenMap = getVisitorHistoryHiddenMap();
  const currentList = Array.isArray(hiddenMap[cellNumber]) ? hiddenMap[cellNumber] : [];
  const nextSet = new Set(currentList.map((name) => normalizeVisitorName(name)).filter(Boolean));
  nextSet.add(normalizeVisitorName(selectedName));
  hiddenMap[cellNumber] = Array.from(nextSet.values());

  await request("/api/settings", {
    method: "POST",
    body: JSON.stringify({
      [VISITOR_HISTORY_HIDDEN_KEY]: JSON.stringify(hiddenMap),
    }),
  });
  appSettings[VISITOR_HISTORY_HIDDEN_KEY] = JSON.stringify(hiddenMap);
  if (visitorQuickHistory instanceof HTMLSelectElement) {
    visitorQuickHistory.value = "";
  }
  renderVisitorHistoryOptions();
  updateVisitorHistoryHideButton();
  setFeedback(`"${selectedName}" ya no se mostrará en Vista previa para la célula ${cellNumber}. Puedes recuperarlo con "Restaurar ocultos".`);
}

async function handleRestoreHiddenVisitorHistory() {
  const cellNumber = String(cellField?.value || "").trim();
  if (!cellNumber) {
    return;
  }
  const hiddenMap = getVisitorHistoryHiddenMap();
  const currentList = Array.isArray(hiddenMap[cellNumber])
    ? hiddenMap[cellNumber].map((name) => String(name || "").trim()).filter(Boolean)
    : [];
  if (!currentList.length) {
    return;
  }
  const ok = await appConfirm(
    `Restaurar ${currentList.length === 1 ? `\"${currentList[0]}\"` : `${currentList.length} registros ocultos`} en Vista previa para la célula ${cellNumber}?\nVolverán a mostrarse solo en este combo.`,
    "Restaurar ocultos"
  );
  if (!ok) return;

  delete hiddenMap[cellNumber];
  await request("/api/settings", {
    method: "POST",
    body: JSON.stringify({
      [VISITOR_HISTORY_HIDDEN_KEY]: JSON.stringify(hiddenMap),
    }),
  });
  appSettings[VISITOR_HISTORY_HIDDEN_KEY] = JSON.stringify(hiddenMap);
  renderVisitorHistoryOptions();
  updateVisitorHistoryHideButton();
  setFeedback(`Se restauró la Vista previa de ${currentList.length === 1 ? `\"${currentList[0]}\"` : `${currentList.length} registros`} para la célula ${cellNumber}.`);
}

function applyQuickVisitorHistory(name) {
  const visitor = findVisitorHistoryByName(name);
  syncQuickLateRegistrationState(name);
  if (!visitor) {
    return;
  }
  if (visitorQuickInvitedBy instanceof HTMLSelectElement && !visitorQuickInvitedBy.value) {
    visitorQuickInvitedBy.value = visitor.invitedBy || leaderField.value || assistantField.value || "";
  }
  if (visitorQuickKind instanceof HTMLSelectElement && visitor.kind) {
    visitorQuickKind.value = normalizeVisitorKind(visitor.kind);
    syncVisitorQuickKindUI();
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
  return filterItemsByUserScope(catalogs.cells || [], cell => cell.cellNumber, activeDashboardScope);
}

function getScopedReports(reports) {
  return filterItemsByUserScope(reports || [], report => report.cellNumber || report.formData?.cellNumber, activeDashboardScope);
}

function getDashboardScopeLabel() {
  // Refleja la sub-pestaña activa si hay varias; si no, cae al rol.
  const myCell   = String(currentUser?.assignedCellNumber || "").trim();
  const mySector = String(currentUser?.supervisedSector || "").trim();
  if (activeDashboardScope === "cell" && myCell)     return t('cell.numbered', { n: myCell });
  if (activeDashboardScope === "sector" && mySector) return `Sector ${mySector}`;
  if (activeDashboardScope === "all")                return null; // sin chip cuando se ve todo
  if (!currentUser || currentUser.isAdmin) return null;
  if (currentUser.isSupervisor && mySector)          return `Sector ${mySector}`;
  if (myCell)                                        return t('cell.numbered', { n: myCell });
  return null;
}

// ── Sub-pestañas de ámbito del Dashboard ─────────────────────────────────
// Devuelve las pestañas disponibles para el usuario actual.
// Cada pestaña: { key, label, sublabel? }
// - "cell"   → solo su célula (requiere assignedCellNumber)
// - "sector" → su sector (requiere supervisedSector)
// - "all"    → todas las células (solo admin)
function getDashboardScopeTabs() {
  return getUserScopeTabs();
}

// Filtra reports (ya escopados por rol con getScopedReports) según la sub-pestaña activa.
function applyDashboardScopeFilter(reports) {
  if (!Array.isArray(reports) || !reports.length) return reports || [];
  const scope = activeDashboardScope;
  if (!scope || scope === "all") return reports;
  const myCell   = String(currentUser?.assignedCellNumber || "").trim();
  const mySector = String(currentUser?.supervisedSector || "").trim();
  if (scope === "cell" && myCell) {
    return reports.filter(r => String(r.cellNumber || r.formData?.cellNumber || "") === myCell);
  }
  if (scope === "sector" && mySector) {
    return filterItemsByUserScope(reports, report => report.cellNumber || report.formData?.cellNumber, "sector");
  }
  if (scope === "all") {
    return filterItemsByUserScope(reports, report => report.cellNumber || report.formData?.cellNumber, "all");
  }
  return reports;
}

// Pinta las sub-pestañas. Devuelve true si hay más de una pestaña (es decir, vale la pena mostrarlas).
function renderDashboardScopeTabs() {
  const wrap = document.getElementById("dashboard-scope-tabs");
  if (!wrap) return false;
  const tabs = getDashboardScopeTabs();
  if (tabs.length <= 1) {
    wrap.hidden = true;
    wrap.innerHTML = "";
    activeDashboardScope = getPreferredDashboardScope(currentUser, tabs);
    return false;
  }
  // Inicializar a la primera pestaña si aún no se ha elegido o ya no es válida.
  if (!activeDashboardScope || !tabs.some(t => t.key === activeDashboardScope)) {
    activeDashboardScope = getPreferredDashboardScope(currentUser, tabs);
  }
  wrap.hidden = false;
  wrap.innerHTML = tabs.map(tab => `
    <button type="button" class="dashboard-scope-tab ${tab.key === activeDashboardScope ? "is-active" : ""}" data-scope="${escapeHtml(tab.key)}" role="tab" aria-selected="${tab.key === activeDashboardScope}">
      ${escapeHtml(tab.label)}
      ${tab.sublabel ? `<span class="scope-tab-sub">${escapeHtml(tab.sublabel)}</span>` : ""}
    </button>
  `).join("");
  if (!wrap.dataset.wired) {
    wrap.addEventListener("click", (ev) => {
      const btn = ev.target.closest(".dashboard-scope-tab");
      if (!btn) return;
      const newScope = btn.dataset.scope;
      if (!newScope || newScope === activeDashboardScope) return;
      activeDashboardScope = newScope;
      renderDashboard(reportsData);
    });
    wrap.dataset.wired = "1";
  }
  return true;
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
  // Si el período actual pertenece a otro scope (porque venimos de cambiar de
  // pestaña), restaurar el último período seleccionado para este scope.
  const looksLikeWeek    = /^\d{4}-Q\d-W\d{2}$/.test(activeDashboardPeriod);
  const looksLikeQuarter = /^\d{4}-Q\d$/.test(activeDashboardPeriod);
  const looksLikeYear    = /^\d{4}$/.test(activeDashboardPeriod);
  const matchesScope =
    (activeDashboardTimeScope === "week"    && looksLikeWeek) ||
    (activeDashboardTimeScope === "quarter" && looksLikeQuarter) ||
    (activeDashboardTimeScope === "year"    && looksLikeYear);
  if (!matchesScope && dashboardPeriodByScope[activeDashboardTimeScope]) {
    activeDashboardPeriod = dashboardPeriodByScope[activeDashboardTimeScope];
  }

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
    dashboardPeriodByScope[activeDashboardTimeScope] = activeDashboardPeriod;
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
    dashboardPeriodByScope[activeDashboardTimeScope] = activeDashboardPeriod;
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
    `<option value="${escapeHtml(p.key)}">${escapeHtml(t('opt.weekOption', { w: p.week, q: p.quarter, y: p.year }))}</option>`
  ).join("");
  dashboardPeriodSelect.value = activeDashboardPeriod;
  dashboardPeriodByScope[activeDashboardTimeScope] = activeDashboardPeriod;
}

function formatRole(role) {
  switch (role) {
    case "coordinator": return t("role.coordinator");
    case "pastor":      return t("role.pastor");
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
  if (hasCoordinatorAccess(person)) return "coordinator";
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
  if (hasCoordinatorAccess(person)) fns.push("coordinator");
  if (person.supervisorSector) fns.push("supervisor");
  const id = String(person.id);
  for (const cell of catalogs.cells) {
    if (String(cell.leaderPersonId)    === id) { fns.push("leader");    break; }
    if (String(cell.assistantPersonId) === id) { fns.push("assistant"); break; }
    if (String(cell.hostPersonId)      === id) { fns.push("host");      break; }
  }
  return fns.length ? fns : ["member"];
}

function getDisplayFunctions(person) {
  if (person.role === "kid") return ["kid"];
  const fns = [];
  if (person.role === "pastor") fns.push("pastor");
  else if (hasCoordinatorAccess(person)) fns.push("coordinator");
  if (person.supervisorSector) fns.push("supervisor");
  const id = String(person.id);
  for (const cell of catalogs.cells) {
    if (String(cell.leaderPersonId) === id) { fns.push("leader"); break; }
    if (String(cell.assistantPersonId) === id) { fns.push("assistant"); break; }
    if (String(cell.hostPersonId) === id) { fns.push("host"); break; }
  }
  return fns.length ? fns : ["member"];
}

function getPrimaryDisplayFunction(person) {
  const displayFunctions = getDisplayFunctions(person);
  return displayFunctions[0] || "member";
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
  // El cuatrimestre se determina por la fecha del bautismo (baptismDate), no por la semana
  // en que se capturo el reporte. Por eso aceptamos bautismos "fuera-cierre" tambien:
  // siempre cuentan en su cuatrimestre y en el total anual.
  return reportsData
    .filter((report) => String(report.id) !== String(excludeReportId || "")
      && String(report.cellNumber || report.formData?.cellNumber || "") === String(cellNumber || "")
      && getReportYear(report) === String(year || ""))
    .flatMap((report) => normalizeBaptisms(report?.formData?.baptisms));
}

function computeBaptismMetrics() {
  const cellNumber = String(cellField.value || "").trim();
  const reportYear = getReportYearValue();
  // Los bautismos cuentan siempre por la fecha del bautismo (cuatrimestre del mes),
  // sin importar si fueron capturados en semana de cierre o "fuera-cierre".
  const currentReportBaptisms = normalizeBaptisms(currentBaptisms);
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
    getGuardianCandidates(selectedPersonId).map((person) => ({ value: String(person.id), label: `${person.name} · ${formatRole(getPrimaryDisplayFunction(person))}` })),
    t('sel.responsible')
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

function syncPeopleAccessFields() {
  const pastorCheck = /** @type {HTMLInputElement|null} */ (document.getElementById("people-is-pastor"));
  const coordCheck = /** @type {HTMLInputElement|null} */ (document.getElementById("people-is-coordinator"));
  if (!pastorCheck || !coordCheck) return;

  if (pastorCheck.checked) {
    if (coordCheck.dataset.pastorLocked !== "true") {
      coordCheck.dataset.prePastorChecked = coordCheck.checked ? "true" : "false";
      coordCheck.dataset.pastorLocked = "true";
    }
    coordCheck.checked = true;
    coordCheck.disabled = true;
    return;
  }

  if (coordCheck.dataset.pastorLocked === "true") {
    coordCheck.checked = coordCheck.dataset.prePastorChecked === "true";
  }
  delete coordCheck.dataset.pastorLocked;
  delete coordCheck.dataset.prePastorChecked;
  coordCheck.disabled = false;
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
    // Horas absolutas desde el último rollover (00:00 del weekStartDay más reciente).
    // Permite ventanas de gracia >24h (p.ej. 72h).
    const now = new Date();
    const weekStartDay = parseInt(appSettings?.week_start_day ?? "0", 10);
    const rollover = new Date(now);
    rollover.setHours(0, 0, 0, 0);
    const diff = (rollover.getDay() - weekStartDay + 7) % 7;
    rollover.setDate(rollover.getDate() - diff);
    const hoursElapsed = (now.getTime() - rollover.getTime()) / 3600000;
    if (hoursElapsed < graceHours) {
      // Dentro de la ventana de gracia: devolver la semana anterior (la que se captura).
      // NOTE: pasar ISO string (YYYY-MM-DD) — Date objects causan NaN dentro de getQuarterWeekNumber
      const refDay = new Date(rollover);
      refDay.setDate(refDay.getDate() - 1);
      const yStr = `${refDay.getFullYear()}-${String(refDay.getMonth() + 1).padStart(2, "0")}-${String(refDay.getDate()).padStart(2, "0")}`;
      return Math.max(1, getQuarterWeekNumber(yStr));
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
    const rollover = new Date(now);
    rollover.setHours(0, 0, 0, 0);
    const diff = (rollover.getDay() - weekStartDay + 7) % 7;
    rollover.setDate(rollover.getDate() - diff);
    const msElapsed = now.getTime() - rollover.getTime();
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
  metricSections.innerHTML = getMetricSectionDefinitions().map((section) => {
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
    const rollover = new Date(now); rollover.setHours(0,0,0,0);
    const diff = (rollover.getDay() - weekStartDay + 7) % 7;
    rollover.setDate(rollover.getDate() - diff);
    return (now.getTime() - rollover.getTime()) / 3600000 < graceHours;
  })();

  // Set of weeks for the current cell+cycle that ALREADY have a report.
  // Incluye la semana actual (no sólo pasadas) para poder mostrar "✓ entregado"
  // también cuando el líder recién terminó el reporte de esta semana.
  const cell = String(cellField?.value || "").trim();
  const cycleStartStr = appSettings?.cycle_start_date;
  const reportedPastWeeks = new Set();
  if (cell && cycleStartStr) {
    (reportsData || []).forEach(r => {
      const rCell = String(r.cellNumber || r.formData?.cellNumber || "").trim();
      if (rCell !== cell) return;
      const rWeek = Number(getReportWeek(r));
      if (!rWeek || rWeek > realWeek) return;
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
    } else {
      // Current week: editable; mark con ✓ si ya se finalizó.
      if (reportedPastWeeks.has(num)) note = " ✓ entregado";
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
  syncVisitorQuickKindUI();
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
    return t('person.duplicatedIn', { n: person.assignedCellCount });
  }
  if (person?.assignedCellNumber) {
    return t('cell.numbered', { n: person.assignedCellNumber });
  }
  return t('cell.none');
}

function getVisibleCells() {
  return catalogs.cells.filter((cell) => {
    const haystack = `${cell.cellNumber} ${cell.networkName || ""} ${cell.sector || ""} ${cell.zoneName || ""} ${cell.districtName || ""}`.toLowerCase();
    return !activeCellSearch || haystack.includes(activeCellSearch);
  });
}

function renderSelect(selectElement, options, placeholder) {
  const currentValue = selectElement?.value ?? "";
  selectElement.innerHTML = `<option value="">${escapeHtml(placeholder)}</option>${options.map((option) => `<option value="${escapeHtml(option.value)}">${escapeHtml(option.label)}</option>`).join("")}`;
  if (currentValue && options.some((option) => String(option.value) === String(currentValue))) {
    selectElement.value = currentValue;
  }
}

function renderReportPersonSelects() {
  renderSelect(leaderField, getPeopleByRole("leader").map((person) => ({ value: person.name, label: person.name })), t('sel.leader'));
  renderSelect(assistantField, getPeopleByRole("assistant").map((person) => ({ value: person.name, label: person.name })), t('sel.assistant'));
  renderSelect(hostField, getPeopleByRole("host").map((person) => ({ value: person.name, label: person.name })), t('sel.host'));
}

function renderCellRoleSelects() {
  renderSelect(cellLeaderSelect, getPeopleByRole("leader").map((person) => ({ value: String(person.id), label: person.name })), t('cell.noLeader'));
  renderSelect(cellAssistantSelect, getPeopleByRole("assistant").map((person) => ({ value: String(person.id), label: person.name })), t('cell.noAssistant'));
  renderSelect(cellHostSelect, getPeopleByRole("host").map((person) => ({ value: String(person.id), label: person.name })), t('cell.noHost'));
}

function renderCellOptions() {
  const options = catalogs.cells.map((cell) => {
    const memberCount = getCellMembers(cell).length;
    const kidCount = getCellKids(cell).length;
    const memberLabel = `${memberCount} miembro${memberCount === 1 ? "" : "s"}`;
    const kidLabel = `${kidCount} niño${kidCount === 1 ? "" : "s"}`;
    return { value: cell.cellNumber, label: `${cell.cellNumber} · ${cell.networkName || t('cell.noNetwork')} · ${memberLabel} · ${kidLabel}` };
  });
  renderSelect(cellField, options, t('sel.cell'));

  const adminOptions = catalogs.cells.map((cell) => ({ value: String(cell.id), label: t('cell.numbered', { n: cell.cellNumber }) }));
  renderSelect(cellAdminSelect, adminOptions, t('cell.createNew'));
}

function renderPeopleRows() {
  const visiblePeople = getVisiblePeople();
  if (!visiblePeople.length) {
    peopleTableBody.innerHTML = `<tr><td colspan="5" class="empty-state">${t('empty.noPeople')}</td></tr>`;
    const pg = document.getElementById("people-card-grid");
    if (pg) pg.innerHTML = `<p class="pc-empty">${t('empty.noPeople')}</p>`;
    return;
  }

  // Group order: coordinator → supervisor → leader → assistant → host → member → kid
  const GROUP_ORDER = ["coordinator", "supervisor", "leader", "assistant", "host", "member", "kid"];
  const GROUP_LABELS = {
    coordinator: "Coordinadores",
    supervisor:  "Supervisores",
    leader:      t('admin.leaders'),
    assistant:   "Asistentes",
    host:        "Anfitriones",
    member:      t('admin.members2'),
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
        <span class="member-admin-caption">${escapeHtml(getGuardianDisplay(person) || person.phone || person.email || t('person.noContact'))}</span>
      </td>
      <td data-label="Función">${getDisplayFunctions(person).map(fn => `<span class="fn-tag fn-tag--${fn}">${escapeHtml(formatRole(fn))}</span>`).join(" ")}</td>
      <td data-label="Asignación"><span class="catalog-assignment-chip${person.assignedCellNumber ? "" : " is-unassigned"}">${escapeHtml(getPersonAssignmentLabel(person))}</span></td>
      <td class="col-rcm" data-label="Progreso RCM">${rcmCell}</td>
      <td data-label="Acciones">
        <div class="row-actions">
          <button type="button" data-action="edit-person" data-id="${person.id}" data-tooltip="Editar datos de ${escapeHtml(person.name)}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4z"/></svg> Editar</button>
          ${(currentUser?.isSystemAccount && canPersonLogin(person)) ? `<button type="button" data-action="reset-password" data-id="${person.id}" data-tooltip="Resetear contraseña de ${escapeHtml(person.name)}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> Resetear pwd</button>` : ""}
          <button type="button" class="danger" data-action="delete-person" data-id="${person.id}" data-tooltip="Eliminar permanentemente a ${escapeHtml(person.name)}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg> Eliminar</button>
        </div>
      </td>
    </tr>`;
  };

  const buildPersonCard = (person) => {
    const { rcmCell, activeCount, totalCount, rcmPct, isTrackable } = buildPersonData(person);
    const fns = getDisplayFunctions(person).map(fn => `<span class="fn-tag fn-tag--${fn}">${escapeHtml(formatRole(fn))}</span>`).join(" ");
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
          ${(currentUser?.isSystemAccount && canPersonLogin(person)) ? `<button type="button" class="pc-icon-btn" data-action="reset-password" data-id="${person.id}" title="Resetear contraseña de ${escapeHtml(person.name)}"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></button>` : ""}
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

function renderSystemAccountsTable() {
  const tbody = document.getElementById("system-accounts-table-body");
  const tab = document.getElementById("admin-system-tab");
  const section = document.getElementById("admin-system-section");
  const list = catalogs.systemPeople || [];
  const isSuper = !!currentUser?.isSystemAccount;
  // Solo cuenta de sistema ve la pestaña y la sección
  if (tab) tab.classList.toggle("is-hidden", !isSuper);
  if (section && !isSuper) {
    section.classList.add("is-hidden");
    section.hidden = true;
  }
  if (!tbody) return;
  if (!list.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-state">${escapeHtml(t('admin.noSystemAccounts') || 'Sin cuentas de sistema.')}</td></tr>`;
    return;
  }
  tbody.innerHTML = list.map((p) => {
    const perms = [];
    if (p.isSystemAccount) perms.push('<span class="fn-tag fn-tag--leader">Cuenta sistema</span>');
    if (p.isAdmin) perms.push('<span class="fn-tag fn-tag--leader">Administrador</span>');
    if (p.role === "pastor") perms.push('<span class="fn-tag fn-tag--pastor">Pastor</span>');
    else if (hasCoordinatorAccess(p)) perms.push('<span class="fn-tag fn-tag--assistant">Coord.</span>');
    if (p.supervisorSector) perms.push(`<span class="fn-tag">Sup. ${escapeHtml(p.supervisorSector)}</span>`);
    return `<tr>
      <td data-label="Nombre"><strong>${escapeHtml(p.name)}</strong></td>
      <td data-label="Usuario"><code>${escapeHtml(p.username || '—')}</code></td>
      <td data-label="Rol">${escapeHtml(formatRole(p.role) || p.role || '—')}</td>
      <td data-label="Permisos">${perms.join(' ') || '<span class="muted">—</span>'}</td>
      <td data-label="Acciones">
        <div class="row-actions">
          <button type="button" data-action="edit-person" data-id="${p.id}">Editar</button>
          ${isSuper ? `<button type="button" data-action="reset-password" data-id="${p.id}">Resetear pwd</button>` : ''}
          ${isSuper ? `<button type="button" data-action="toggle-system-account" data-id="${p.id}">Volver a miembro real</button>` : ''}
        </div>
      </td>
    </tr>`;
  }).join('');
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
  const coordinators = catalogs.people.filter(p => hasCoordinatorAccess(p)).length;
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
    [t('admin.cells2'),       catalogs.cells.length, t('admin.totalReg')],
    [t('admin.leaders'),       leaderIds.size,         t('admin.asLeader')],
    ["Asistentes",    assistantIds.size,       "Asignados como asistente"],
    ["Anfitriones",   hostIds.size,            "Casas anfitrionas"],
    ["Coordinadores", coordinators,            "Con rol de coordinador"],
    ["Supervisores",  supervisors,             "Con sector asignado"],
    [t('admin.members2'),      members,                 t('admin.totalAdults')],
    [t('cell.none'),    unassignedMembers,        t('admin.unassignedAdults')],
    ["Niños",         kids,                    "Cargados por responsable"],
    [t('cell.noLeader'),     cellsWithoutLeader,       t('admin.cellsToCover')],
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
    cellsTableBody.innerHTML = `<tr><td colspan="5" class="empty-state">${t('empty.noCells')}</td></tr>`;
    const cg = document.getElementById("cells-card-grid");
    if (cg) cg.innerHTML = `<p class="pc-empty">${t('empty.noCells')}</p>`;
    return;
  }
  const buildCellCard = (cell) => {
    const leader = catalogs.people.find(p => String(p.id) === String(cell.leaderPersonId));
    const memberCount = getCellMembers(cell).length;
    const kidCount = getCellKids(cell).length;
    const leaderName = leader ? escapeHtml(leader.name) : `<span class="pc-muted">${t('cell.noLeader')}</span>`;
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
      <td data-label="Líder">${leader ? escapeHtml(leader.name) : `<span class="member-admin-caption">${t('cell.noLeader')}</span>`}</td>
      <td data-label=t('admin.members2')><span class="member-admin-caption">${memberCount} miembro${memberCount !== 1 ? "s" : ""}${kidCount ? ` · ${kidCount} niño${kidCount !== 1 ? "s" : ""}` : ""}</span></td>
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
  if (titleEl) titleEl.textContent = cell ? t('cell.editTitle', { n: cell.cellNumber }) : t('cell.new');
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

  const EVENT_LABELS = { P: t('dash.planning'), A: t('dash.reach'), C: t('dash.sunday') };
  // Mapeo de aplicabilidad de eventos según la última etapa guardada del reporte.
  // Si el reporte aun esta en "planificacion", el alcance y el culto siguen
  // pendientes (no han ocurrido); no deben contar como falta ni penalizar.
  const STAGES_ORDER = ["encabezado", "planificacion", "alcance", "culto", "cierre"];
  const stageReached = (fd, stageName) => {
    if (fd && fd._draft !== true && fd._draft !== "true") return true; // reporte cerrado
    const last = fd?.lastStage;
    if (!last) return false;
    return STAGES_ORDER.indexOf(last) >= STAGES_ORDER.indexOf(stageName);
  };
  let totalP = 0, totalA = 0, totalC = 0, totalFaltas = 0, totalJust = 0, totalWeeks = 0;
  let appliedP = 0, appliedA = 0, appliedC = 0; // denominadores: eventos aplicables
  const weekRows = [];

  sorted.forEach(r => {
    const entries = Array.isArray(r.formData?.memberAttendance) ? r.formData.memberAttendance : [];
    const entry = entries.find(e => String(e.personId || e.name || "") === memberKey || e.name === memberName);
    if (!entry) return;
    totalWeeks++;
    const fd = r.formData || {};
    const planApp   = stageReached(fd, "planificacion");
    const reachApp  = stageReached(fd, "alcance");
    const sundayApp = stageReached(fd, "culto");
    const planSt   = String(entry.planningStatus || "").toLowerCase();
    const reachSt  = String(entry.reachStatus    || "").toLowerCase();
    const sundaySt = String(entry.sundayStatus   || "").toLowerCase();
    // Fall back to boolean if status is empty/pending: attended true => present
    const stageState = (st, attended) => {
      if (st === "absent" || st === "justified" || st === "present" || st === "service") return st;
      return attended ? "present" : "pending";
    };
    const planning = stageState(planSt,   entry.planningAttended);
    const reach    = stageState(reachSt,  entry.reachAttended);
    const sunday   = stageState(sundaySt, entry.sundayAttended);
    const isPresentLike = (s) => s === "present" || s === "service";
    const isAbsentLike  = (s) => s === "absent"  || s === "justified";

    if (planApp)   { appliedP++; if (isPresentLike(planning)) totalP++; }
    if (reachApp)  { appliedA++; if (isPresentLike(reach))    totalA++; }
    if (sundayApp) { appliedC++; if (isPresentLike(sunday))   totalC++; }

    // Per-stage falta counters (correct: count each missed applicable event)
    const stageStates = [];
    if (planApp)   stageStates.push(planning);
    if (reachApp)  stageStates.push(reach);
    if (sundayApp) stageStates.push(sunday);
    stageStates.forEach(s => {
      if (isAbsentLike(s))   totalFaltas++;
      if (s === "justified") totalJust++;
    });

    const missed = [];
    if (planApp   && isAbsentLike(planning)) missed.push("P");
    if (reachApp  && isAbsentLike(reach))    missed.push("A");
    if (sundayApp && isAbsentLike(sunday))   missed.push("C");

    const rd = r.formData?.reportDate || r.reportDate || "";
    const dateLabel = rd ? new Date(rd + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" }) : "";
    const weekNum = getReportWeek(r);
    const yearNum = getReportYear(r);
    const quarter = getReportQuarter(r);

    weekRows.push({ weekNum, yearNum, quarter, dateLabel, planning, reach, sunday, planApp, reachApp, sundayApp, missed });
  });

  if (totalWeeks === 0) {
    memberDetailModal.close();
    return;
  }

  const totalApplied = appliedP + appliedA + appliedC;
  const avgPct = totalApplied > 0
    ? Math.round(((totalP + totalA + totalC) / totalApplied) * 100)
    : 0;
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
      <span class="mdl-ev-chip mdl-ev-p" title=t('dash.planning')>Plan. <strong>${totalP}/${appliedP}</strong></span>
      <span class="mdl-ev-chip mdl-ev-a" title=t('dash.reach')>Alc. <strong>${totalA}/${appliedA}</strong></span>
      <span class="mdl-ev-chip mdl-ev-c" title=t('dash.sunday')>Culto <strong>${totalC}/${appliedC}</strong></span>
    </div>
  `;

  // Week-by-week table
  const MONTHS = ["","Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const eventDot = (state, label, applicable = true) => {
    if (!applicable) return `<span class="mdl-dot mdl-dot-pending" title="${label} aún pendiente (no reportado)">-</span>`;
    if (state === "present" || state === "service") {
      return `<span class="mdl-dot mdl-dot-ok" title="${label}">✓</span>`;
    }
    if (state === "justified") {
      return `<span class="mdl-dot mdl-dot-just" title="Justificado en ${label}">J</span>`;
    }
    if (state === "absent") {
      return `<span class="mdl-dot mdl-dot-miss" title="Faltó a ${label}">✗</span>`;
    }
    return `<span class="mdl-dot mdl-dot-pending" title="${label} sin marcar">-</span>`;
  };

  memberModalBody.innerHTML = (() => {
    // Group by year+quarter, descending (current/latest first), then weeks desc within group
    const groups = new Map(); // key: "YYYY-Q" -> { year, quarter, rows: [] }
    weekRows.forEach(w => {
      const key = `${w.yearNum}-${w.quarter}`;
      if (!groups.has(key)) groups.set(key, { year: w.yearNum, quarter: w.quarter, rows: [] });
      groups.get(key).rows.push(w);
    });
    const orderedGroups = Array.from(groups.values()).sort((a, b) => {
      if (a.year !== b.year) return Number(b.year) - Number(a.year);
      return Number(b.quarter) - Number(a.quarter);
    });
    const renderRow = (w) => {
      const stagesApplied = [];
      if (w.planApp)   stagesApplied.push(w.planning);
      if (w.reachApp)  stagesApplied.push(w.reach);
      if (w.sundayApp) stagesApplied.push(w.sunday);
      const isPresentLike = (s) => s === "present" || s === "service";
      const allPending = stagesApplied.length === 0;
      const presents = stagesApplied.filter(isPresentLike).length;
      const absents  = stagesApplied.filter(s => s === "absent").length;
      const justs    = stagesApplied.filter(s => s === "justified").length;
      const pendings = stagesApplied.filter(s => s !== "present" && s !== "service" && s !== "absent" && s !== "justified").length;
      const missingApplied = absents + justs;
      let rowCls = "";
      let statusBadge = "";
      if (allPending) {
        statusBadge = `<span class="mdl-status-badge mdl-status-pending">Pendiente</span>`;
      } else if (presents === stagesApplied.length) {
        statusBadge = `<span class="mdl-status-badge mdl-status-ok">Completo</span>`;
      } else if (missingApplied === stagesApplied.length) {
        if (justs === stagesApplied.length) {
          rowCls = " mdl-row-just";
          statusBadge = `<span class="mdl-status-badge mdl-status-just">${t('att.justified')}</span>`;
        } else {
          rowCls = " mdl-row-falta";
          statusBadge = `<span class="mdl-status-badge mdl-status-absent">Falta</span>`;
        }
      } else if (pendings > 0 && missingApplied === 0) {
        statusBadge = `<span class="mdl-status-badge mdl-status-pending">En curso</span>`;
      } else {
        statusBadge = `<span class="mdl-status-badge mdl-status-partial">Parcial</span>`;
      }
      return `<tr class="${rowCls}">
        <td class="mdl-week">${w.weekNum}</td>
        <td class="mdl-date">${w.dateLabel}</td>
        <td class="mdl-ev">${eventDot(w.planning, t('dash.planning'), w.planApp)}</td>
        <td class="mdl-ev">${eventDot(w.reach, t('dash.reach'), w.reachApp)}</td>
        <td class="mdl-ev">${eventDot(w.sunday, t('dash.sunday'), w.sundayApp)}</td>
        <td>${statusBadge}</td>
      </tr>`;
    };
    return orderedGroups.map((g, idx) => {
      const rowsDesc = [...g.rows].sort((a, b) => Number(b.weekNum) - Number(a.weekNum));
      // Quarter summary stats
      let qPres = 0, qAbs = 0, qJust = 0;
      rowsDesc.forEach(w => {
        [["planApp", "planning"], ["reachApp", "reach"], ["sundayApp", "sunday"]].forEach(([appK, stK]) => {
          if (!w[appK]) return;
          const s = w[stK];
          if (s === "present" || s === "service") qPres++;
          else if (s === "absent")    qAbs++;
          else if (s === "justified") qJust++;
        });
      });
      const summaryChips = `
        <span class="mdl-qchip mdl-qchip-ok" title="Asistencias">${qPres}✓</span>
        ${qAbs  ? `<span class="mdl-qchip mdl-qchip-miss" title="Faltas">${qAbs}✗</span>` : ""}
        ${qJust ? `<span class="mdl-qchip mdl-qchip-just" title="Justificadas">${qJust}J</span>` : ""}
        <span class="mdl-qchip-weeks">${rowsDesc.length} sem.</span>
      `;
      return `<details class="mdl-qgroup"${idx === 0 ? " open" : ""}>
        <summary class="mdl-qgroup-summary">
          <span class="mdl-qgroup-title">Q${g.quarter} · ${g.year}</span>
          <span class="mdl-qgroup-stats">${summaryChips}</span>
        </summary>
        <table class="mdl-table">
          <thead><tr>
            <th>Sem.</th>
            <th>Fecha</th>
            <th title="${t('dash.planning')}">Plan.</th>
            <th title="${t('dash.reach')}">Alc.</th>
            <th title="${t('dash.sunday')}">Culto</th>
            <th>Estado</th>
          </tr></thead>
          <tbody>${rowsDesc.map(renderRow).join("")}</tbody>
        </table>
      </details>`;
    }).join("");
  })();

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

  let totalReach = 0, totalSunday = 0, converted = false, invitedBy = "", lateRegistration = false;
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
    if (entry.lateRegistration) lateRegistration = true;
    if (!invitedBy && entry.invitedBy) invitedBy = String(entry.invitedBy).trim();
    const rd = r.formData?.reportDate || r.reportDate || "";
    const dateLabel = rd ? new Date(rd + "T12:00:00").toLocaleDateString("es-MX", { day: "numeric", month: "short" }) : "";
    weekRows.push({
      weekNum: getReportWeek(r),
      yearNum: getReportYear(r),
      quarter: getReportQuarter(r),
      dateLabel,
      reach,
      sunday,
    });
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
    ${lateRegistration ? `<div class="mdl-stat"><strong class="mdl-stat-warn">Sí</strong><span>anotado tardío</span></div>` : ""}
    ${invitedBy ? `<div class="mdl-stat"><strong style="font-size:1rem">${escapeHtml(invitedBy)}</strong><span>lo invitó</span></div>` : ""}
    <div class="mdl-stat-bar">
      <span class="mdl-stat-pct">${overallPct}%</span>
      <div class="attend-bar-track mdl-bar-track">
        <div class="attend-bar-fill ${barCls}" style="width:${overallPct}%"></div>
      </div>
      <span class="mdl-stat-label">asistencia promedio</span>
    </div>
    <div class="mdl-stat-events">
      <span class="mdl-ev-chip mdl-ev-a" title=t('dash.reach')>Alc. <strong>${totalReach}/${totalVisits}</strong> (${reachPct}%)</span>
      <span class="mdl-ev-chip mdl-ev-c" title=t('dash.sunday')>Culto <strong>${totalSunday}/${totalVisits}</strong> (${sundayPct}%)</span>
    </div>
  `;

  const eventDot = (attended, label) => attended
    ? `<span class="mdl-dot mdl-dot-ok" title="${label}">✓</span>`
    : `<span class="mdl-dot mdl-dot-miss" title="No asistió a ${label}">✗</span>`;

  memberModalBody.innerHTML = (() => {
    const groups = new Map();
    weekRows.forEach(w => {
      const key = `${w.yearNum}-${w.quarter}`;
      if (!groups.has(key)) groups.set(key, { year: w.yearNum, quarter: w.quarter, rows: [] });
      groups.get(key).rows.push(w);
    });
    const orderedGroups = Array.from(groups.values()).sort((a, b) => {
      if (a.year !== b.year) return Number(b.year) - Number(a.year);
      return Number(b.quarter) - Number(a.quarter);
    });
    const renderRow = (w) => {
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
        <td class="mdl-ev">${eventDot(w.reach,  t('dash.reach'))}</td>
        <td class="mdl-ev">${eventDot(w.sunday, t('dash.sunday'))}</td>
        <td>${statusBadge}</td>
      </tr>`;
    };
    return orderedGroups.map((g, idx) => {
      const rowsDesc = [...g.rows].sort((a, b) => Number(b.weekNum) - Number(a.weekNum));
      let qReach = 0, qSun = 0;
      rowsDesc.forEach(w => { if (w.reach) qReach++; if (w.sunday) qSun++; });
      const summaryChips = `
        <span class="mdl-qchip mdl-qchip-ok" title="Alcance">A ${qReach}/${rowsDesc.length}</span>
        <span class="mdl-qchip mdl-qchip-ok" title="Culto">C ${qSun}/${rowsDesc.length}</span>
        <span class="mdl-qchip-weeks">${rowsDesc.length} sem.</span>
      `;
      return `<details class="mdl-qgroup"${idx === 0 ? " open" : ""}>
        <summary class="mdl-qgroup-summary">
          <span class="mdl-qgroup-title">Q${g.quarter} · ${g.year}</span>
          <span class="mdl-qgroup-stats">${summaryChips}</span>
        </summary>
        <table class="mdl-table">
          <thead><tr>
            <th>Sem.</th>
            <th>Fecha</th>
            <th title="${t('dash.reach')}">Alc.</th>
            <th title="${t('dash.sunday')}">Culto</th>
            <th>Asistencia</th>
          </tr></thead>
          <tbody>${rowsDesc.map(renderRow).join("")}</tbody>
        </table>
      </details>`;
    }).join("");
  })();

  memberDetailModal.showModal();
}

// ── Totals panel (seguimiento tab) ───────────────────────────────────────────
function renderSegTotalsPanel(weeklyReps, options = {}) {
  if (!segTotalsPanel || !segTotalsBody) return;
  if (!weeklyReps || weeklyReps.length === 0) { segTotalsPanel.hidden = true; return; }
  segTotalsPanel.hidden = false;

  // Get all sectors and cells from reports
  const sectors = [...new Set(weeklyReps.map(r => r.formData?.sector || r.sector || "?"))].sort();
  const cells   = [...new Set(weeklyReps.map(r => String(r.cellNumber || r.formData?.cellNumber || "?")))].sort((a,b) => Number(a)-Number(b));

  // Roster helpers (denominators) — restringidos a las células del scope del usuario actual
  const scopedCellsList = (typeof getScopedCells === 'function' ? getScopedCells() : (catalogs.cells || []));
  const allScopedSectors = [...new Set(scopedCellsList.map(c => String(c.sector || '?').trim()))].sort();
  const allScopedCellNums = [...new Set(scopedCellsList.map(c => String(c.cellNumber)))].sort((a,b) => Number(a)-Number(b));
  const rosterForCell = (cellNum) => {
    const c = scopedCellsList.find(c => String(c.cellNumber) === String(cellNum));
    return c ? getCellMembers(c).length : 0;
  };
  const rosterForSector = (sec) => scopedCellsList
    .filter(c => String(c.sector || '').trim() === String(sec).trim())
    .reduce((sum, c) => sum + getCellMembers(c).length, 0);
  const rosterForTotal = () => scopedCellsList.reduce((sum, c) => sum + getCellMembers(c).length, 0);
  const leaderForCell = (cellNum) => {
    const c = scopedCellsList.find(c => String(c.cellNumber) === String(cellNum));
    return c?.leaderName || '';
  };

  function buildRows(agg, label, roster) {
    const showOffering = (typeof localStorage !== 'undefined') && localStorage.getItem('segTotals.showOffering') === '1';
    const memberMax = roster && roster > 0
      ? roster
      : Math.max(agg.cellMembersUnique || 0, agg.planningPresent, agg.reachMembers, agg.sundayMembers, 1);
    const otherMax = Math.max(
      agg.reachFriends || 0, agg.reachRestor || 0, agg.reachKidsCell || 0, agg.reachKidsVisit || 0,
      agg.sundayFriends || 0, agg.sundayRestor || 0, agg.sundayKidsCell || 0, agg.sundayKidsVisit || 0,
      agg.sundayTotal || 0, agg.reachConversions || 0, agg.absent || 0, 1
    );
    const bar = (val, color, denom) => {
      const m = denom && denom > 0 ? denom : otherMax;
      const pct = Math.min(100, Math.round((val / m) * 100));
      return `<div class="tot-bar-track"><div class="tot-bar" style="width:${pct}%;background:${color}"></div></div>`;
    };
    const row = (label, val, color, hint, denom) => {
      const display = denom && denom > 0 ? `${val}/${denom}` : `${val}`;
      const pct = denom && denom > 0 ? ` <span class="tot-row-pct">(${Math.round((val/denom)*100)}%)</span>` : '';
      return `<div class="tot-row-wrap">
        <div class="tot-row">
          <span class="tot-row-label">${label}</span>
          ${bar(val, color, denom)}
          <strong class="tot-row-val">${display}${pct}</strong>
        </div>
        ${hint ? `<span class="tot-row-hint">${hint}</span>` : ''}
      </div>`;
    };
    // Para "Miembros únicos": si val > roster significa que se vieron ex-miembros
    // en reportes pasados. Invertimos a "roster/vistos" con nota explicativa.
    const rowMembers = (label, val, color, denom, hint) => {
      if (!denom || denom <= 0) return row(label, val, color, hint || '', 0);
      if (val > denom) {
        const extra = val - denom;
        const pct = Math.round((denom / val) * 100);
        const histHint = `+${extra} históric${extra !== 1 ? 'os' : 'o'} · aparecen en reportes pero ya no están en el roster`;
        const fullHint = hint ? `${hint} · ${histHint}` : histHint;
        return `<div class="tot-row-wrap">
          <div class="tot-row">
            <span class="tot-row-label">${label}</span>
            <div class="tot-bar-track"><div class="tot-bar" style="width:${pct}%;background:${color}"></div></div>
            <strong class="tot-row-val">${denom}/${val} <span class="tot-row-pct">(${pct}%)</span></strong>
          </div>
          <span class="tot-row-hint">${fullHint}</span>
        </div>`;
      }
      return row(label, val, color, hint || '', denom);
    };
    const sectionLabel = (txt) => `<div class="tot-section-label">${txt}</div>`;

    const planningTotal   = agg.planningPresent + agg.planningAbsent;
    const planningMissTxt = agg.planningAbsent ? t('dash.planningMissN', { n: agg.planningAbsent }) : '';
    const reachMissParts = [];
    if (agg.reachPrivileged) reachMissParts.push(`<span title="Hermanos con privilegios asignados durante el alcance (ofrenda, lectura, oración, etc.)">★ ${agg.reachPrivileged} con privilegio${agg.reachPrivileged!==1?'s':''}</span>`);
    if (agg.reachAbsentMembers > 0) reachMissParts.push(`${agg.reachAbsentMembers} no fue${agg.reachAbsentMembers!==1?'ron':''} al alcance`);
    const sundayMissTxt = agg.sundayAbsentMembers > 0 ? `${agg.sundayAbsentMembers} no fue${agg.sundayAbsentMembers!==1?'ron':''} al culto` : '';
    const rosterHint = roster && roster > 0 ? `de ${roster} hermanos asignados en esa semana` : '';

    return `<div class="tot-group">
      <p class="tot-group-label">${escapeHtml(label)}${rosterHint ? ` · <span class="tot-roster-hint">${rosterHint}</span>` : ''}</p>
      <div class="tot-rows">
        ${sectionLabel(t('dash.cellBrothers'))}
        ${rowMembers(t('dash.membersUnique'), agg.cellMembersUnique || 0, '#5063b8', roster)}

        ${sectionLabel(t('dash.planning'))}
        ${rowMembers('Asistieron',       agg.planningPresent,  'var(--brand)', roster, planningMissTxt) /* hint planningMiss omitido cuando capeamos */}

        ${sectionLabel(t('dash.reach'))}
        ${rowMembers('Hermanos',     agg.reachMembers,    '#2d8a55', roster, reachMissParts.join(' · '))}
        ${row(t('dash.friends'),       agg.reachFriends,    '#1565c0', agg.friendsUnique ? `${agg.friendsUnique} únic.` : '')}
        ${row(t('dash.restoration'), agg.reachRestor,     '#6a1b9a', agg.restorUnique  ? `${agg.restorUnique} únic.`  : '')}
        ${row(t('dash.kidsCell'), agg.reachKidsCell,   '#8e44ad', agg.kidsCellUnique  ? `${agg.kidsCellUnique} únic.`  : '')}
        ${row(t('dash.kidsVisit'), agg.reachKidsVisit,  '#a367d9', agg.kidsVisitUnique ? `${agg.kidsVisitUnique} únic.` : '')}
        ${agg.reachConversions ? row('Conversiones', agg.reachConversions, '#e0872a', '') : ''}

        ${sectionLabel(t('dash.sunday'))}
        ${rowMembers('Hermanos',     agg.sundayMembers,   '#3a7bd5', roster, sundayMissTxt)}
        ${row(t('dash.friends'),       agg.sundayFriends,   '#1565c0', '')}
        ${row(t('dash.restoration'), agg.sundayRestor,    '#6a1b9a', '')}
        ${row(t('dash.kidsCell'), agg.sundayKidsCell,  '#8e44ad', '')}
        ${row(t('dash.kidsVisit'), agg.sundayKidsVisit, '#a367d9', '')}
        ${row(t('dash.totalService'),  agg.sundayTotal,     '#0f3a91', `${agg.sundayMembers} hmnos · ${agg.sundayVisitors} visit. · ${agg.sundayKids} niños`)}
        ${showOffering ? `<div class="tot-row-wrap"><div class="tot-row tot-row-offering"><span class="tot-row-label">Ofrenda</span><div class="tot-bar-track"><div class="tot-bar" style="width:${agg.offering > 0 ? 100 : 0}%;background:#1f8a4d"></div></div><strong class="tot-row-val">$${Math.round(agg.offering || 0).toLocaleString('es-MX')}</strong></div></div>` : ''}
      </div>
    </div>`;
  }

  function renderScope(scope) {
    // Helper: cuando existe reporte para esa célula en la ventana, el denominador
    // debe salir del snapshot histórico guardado en ese reporte. Solo usamos el
    // roster actual del catálogo como fallback para células sin reporte.
    const snapshotMaxForCell = (cellNum) => {
      let maxSnap = 0;
      weeklyReps.forEach(r => {
        const rc = String(r.cellNumber || r.formData?.cellNumber || "");
        if (rc !== String(cellNum)) return;
        const n = Number(r.formData?.attendanceSummary?.totalMembers || 0);
        if (n > maxSnap) maxSnap = n;
      });
      return maxSnap;
    };
    const effectiveRosterForCell = (cellNum) => {
      if (options.isCurrentWeekScope) return rosterForCell(cellNum);
      const snap = snapshotMaxForCell(cellNum);
      return snap > 0 ? snap : rosterForCell(cellNum);
    };
    const effectiveRosterForSector = (sec) => {
      const cellsInSec = scopedCellsList.filter(c => String(c.sector || '').trim() === String(sec).trim());
      return cellsInSec.reduce((sum, c) => sum + effectiveRosterForCell(c.cellNumber), 0);
    };
    const effectiveRosterTotal = () => scopedCellsList.reduce((sum, c) => sum + effectiveRosterForCell(c.cellNumber), 0);

    if (scope === 'total') {
      const agg = aggregateMetrics(weeklyReps);
      const roster = effectiveRosterTotal();
      return `<div class="tot-scope-total">${buildRows(agg, `${weeklyReps.length} reporte${weeklyReps.length!==1?'s':''} esta semana`, roster)}</div>`;
    }
    if (scope === 'sector') {
      // Lista TODOS los sectores del scope, incluso sin reportes
      const sectorsToShow = allScopedSectors.length ? allScopedSectors : sectors;
      return `<div class="tot-scope-grid">${sectorsToShow.map(sec => {
        const reps = weeklyReps.filter(r => String(r.formData?.sector || r.sector || "?").trim() === sec);
        const agg  = aggregateMetrics(reps);
        const roster = effectiveRosterForSector(sec);
        const cellsInSector = scopedCellsList.filter(c => String(c.sector || '').trim() === sec).length;
        return buildRows(agg, `Sector ${sec} · ${reps.length}/${cellsInSector} célula${cellsInSector!==1?'s':''} reportó`, roster);
      }).join('')}</div>`;
    }
    // cell — lista TODAS las células del scope, incluso sin reportes
    const cellsToShow = allScopedCellNums.length ? allScopedCellNums : cells;
    return `<div class="tot-scope-grid">${cellsToShow.map(cellNum => {
      const reps = weeklyReps.filter(r => String(r.cellNumber || r.formData?.cellNumber || "?") === cellNum);
      const agg  = aggregateMetrics(reps);
      const leader = reps[0]?.leaderName || reps[0]?.formData?.leaderName || leaderForCell(cellNum);
      const roster = effectiveRosterForCell(cellNum);
      const noRep = reps.length === 0 ? t('dash.noReportSuffix') : '';
      return buildRows(agg, `Célula ${cellNum}${leader ? ` · ${leader}` : ''}${noRep}`, roster);
    }).join('')}</div>`;
  }

  // Mostrar/ocultar tabs según rol
  const activeScope = getEffectiveDashboardScope();
  const isAdmin = !!(currentUser && currentUser.isAdmin);
  const isSupervisor = !!(currentUser && currentUser.isSupervisor && currentUser.supervisedSector);
  const availableTotalsScopes = activeScope === 'all'
    ? (isAdmin ? ['total', 'sector', 'cell'] : (isSupervisor ? ['sector', 'cell'] : ['cell']))
    : (activeScope === 'sector' ? ['sector', 'cell'] : ['cell']);
  segTotalsPanel.querySelectorAll('.seg-totals-tab').forEach(tab => {
    const sc = tab.dataset.tscope;
    tab.hidden = !availableTotalsScopes.includes(sc);
  });

  // Scope inicial según rol
  let currentScope = availableTotalsScopes[0] || 'cell';
  // Marcar tab activa correcta
  segTotalsPanel.querySelectorAll('.seg-totals-tab').forEach(tab => {
    tab.classList.toggle('is-active', tab.dataset.tscope === currentScope);
  });

  const render = () => { segTotalsBody.innerHTML = renderScope(currentScope); };
  render();

  // Wire tab buttons — clonamos cada nodo para BORRAR listeners de renders previos.
  // Sin esto, cada re-render acumula handlers viejos cuyos closures referencian
  // un `currentScope` desactualizado, provocando que el body y la tab activa
  // se desincronicen (bug: tab "Todas" activa pero body por célula).
  segTotalsPanel.querySelectorAll('.seg-totals-tab').forEach(tab => {
    const fresh = tab.cloneNode(true);
    tab.parentNode.replaceChild(fresh, tab);
  });
  const tabs = segTotalsPanel.querySelectorAll('.seg-totals-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('is-active'));
      tab.classList.add('is-active');
      currentScope = tab.dataset.tscope;
      render();
    });
  });

  // Toggle ofrenda (persistente por usuario). Mismo patron: clonar para reemplazar
  // listeners viejos que retendrian un `currentScope` / `render` obsoletos.
  const oldToggle = segTotalsPanel.querySelector('#seg-totals-show-offering');
  if (oldToggle) {
    const offeringToggle = oldToggle.cloneNode(true);
    oldToggle.parentNode.replaceChild(offeringToggle, oldToggle);
    offeringToggle.checked = localStorage.getItem('segTotals.showOffering') === '1';
    offeringToggle.addEventListener('change', () => {
      localStorage.setItem('segTotals.showOffering', offeringToggle.checked ? '1' : '0');
      render();
    });
  }
}

// ── Dashboard para líderes (vista propia de célula por evento) ────────────────
function renderDashboardForLeader(reports) {
  // Pintar sub-pestañas (si el usuario es solo líder, no se muestran).
  renderDashboardScopeTabs();
  const allCellReports = Array.isArray(reports) ? reports : [];
  renderDashboardPeriodOptions(allCellReports);
  const leaderCellNumber = String(currentUser?.assignedCellNumber || allCellReports[0]?.cellNumber || allCellReports[0]?.formData?.cellNumber || cellField?.value || "").trim();
  const { year: parsedYear, quarter: parsedQuarter, week: parsedWeek } = parsePeriodKey(activeDashboardPeriod);
  const selectedYear = String(parsedYear || new Date().getFullYear());
  const selectedWeek = parsedWeek || Number(getQuarterWeekNumber());
  const selectedQuarter = String(parsedQuarter || getCurrentQuarter());
  const weekReport = allCellReports.find((report) => Number(getReportWeek(report)) === Number(selectedWeek) && getReportYear(report) === selectedYear) || null;
  let scopeReports = [];
  let scopeChipText = "";
  let scopeTitleText = "";
  if (activeDashboardTimeScope === "quarter") {
    // selectedQuarter from parsePeriodKey is 0 when key is "2026-Q2" format → use currentQuarter fallback
    const q = selectedQuarter;
    scopeReports   = allCellReports.filter(r => getReportYear(r) === selectedYear && String(getReportQuarter(r)) === q);
    scopeChipText  = `C${q} ${selectedYear}`;
    scopeTitleText = t('qfull.title', { range: t(q === "1" ? 'qrange.q1' : q === "2" ? 'qrange.q2' : 'qrange.q3'), year: selectedYear });
  } else if (activeDashboardTimeScope === "year") {
    scopeReports   = allCellReports.filter(r => getReportYear(r) === selectedYear);
    scopeChipText  = t('common.yearN', { n: selectedYear });
    scopeTitleText = t('common.yearN', { n: selectedYear });
  } else {
    scopeReports   = weekReport ? [weekReport] : [];
    scopeChipText  = t('common.weekShort', { n: selectedWeek });
    scopeTitleText = `Semana ${selectedWeek}`;
  }

  dashboardWeekChip.textContent = scopeChipText;
  if (dashboardScopeChip) dashboardScopeChip.hidden = true;
  if (dashboardScopeTitle) dashboardScopeTitle.textContent = scopeTitleText;

  // Summary cards — differentiated by scope
  if (activeDashboardTimeScope === "week") {
    const agg = aggregateMetrics(scopeReports, { baptismYear: selectedYear, baptismQuarter: selectedQuarter });
    dashboardSummaryGrid.innerHTML = [
      { label: t('dash.planningBrothers'), value: agg.planningPresent,    hint: t('dash.planningPresentHint') },
      { label: t('dash.planningAbsent'), value: agg.planningAbsent, hint: t('dash.planningAbsentHint') },
      { label: t('met.reachBros'),    value: agg.reachMembers,       hint: t('dash.reachMembersHint') },
      { label: t('met.reachFriends'),      value: agg.reachVisitors,      hint: t('dash.reachVisitorsHint'),  sub: (agg.reachRestor || 0) > 0 ? `${agg.reachFriends || 0} amigos · ${agg.reachRestor} restauración` : "" },
      { label: t('dash.reachKids'),       value: agg.reachKids,          hint: t('dash.reachKidsHint') },
      { label: t('met.cultoBros'),      value: agg.sundayMembers,      hint: t('dash.cultoBrosHint') },
      { label: t('met.cultoFriends'),        value: agg.sundayVisitors,     hint: t('dash.cultoFriendsHint'), sub: (agg.sundayRestor || 0) > 0 ? `${agg.sundayFriends || 0} amigos · ${agg.sundayRestor} restauración` : "" },
      { label: t('dash.sundayKids'),         value: agg.sundayKids,         hint: t('dash.sundayKidsHint') },
      ...(agg.reachConversions ? [{ label: t('met.conversions'), value: agg.reachConversions, hint: t('dash.faithHint') }] : []),
    ].map(({ label, value, hint, sub }) => `
      <article class="summary-card summary-card-dashboard">
        <span class="summary-label">${escapeHtml(label)}</span>
        <strong class="summary-value">${escapeHtml(String(value))}</strong>
        <span class="summary-hint">${escapeHtml(hint)}</span>
        ${sub ? `<span class="summary-sub">${escapeHtml(sub)}</span>` : ""}
      </article>
    `).join("");

  } else if (activeDashboardTimeScope === "quarter") {
    const ext = aggregateMetricsExtended(scopeReports, { baptismYear: selectedYear, baptismQuarter: parsedQuarter || getCurrentQuarter() });
    const qLabel = activeDashboardTimeScope === "quarter" ? scopeTitleText : "";
    dashboardSummaryGrid.innerHTML = [
      { label: t('dash.weeksReported'),       value: ext.n,                    hint: t('dash.weeksReportedHint'), cls: "accent-neutral" },
      { label: t('dash.consistentBros'), value: ext.consistentMembers,    hint: t('dash.consistentHint'),          cls: "accent-success" },
      { label: t('dash.avgPlanning'),      value: ext.avgPlanning,          hint: t('dash.avgPlanningHint'),           cls: "" },
      { label: t('dash.avgReach'),         value: ext.avgReachMembers,      hint: t('dash.avgReachHint'), cls: "" },
      { label: t('dash.avgFriendsReach'),value: ext.avgReachVisitors,     hint: t('dash.avgFriendsReachHint'),  cls: "" },
      { label: t('dash.avgCulto'),           value: ext.avgSundayMembers,     hint: t('dash.avgCultoHint'),  cls: "" },
      { label: t('dash.avgFriendsCulto'),  value: ext.avgSundayVisitors,    hint: t('dash.avgFriendsCultoHint'),    cls: "" },
      { label: t('met.conversions'),          value: ext.reachConversions,     hint: t('dash.faithHintQ'),   cls: "accent-faith" },
      { label: t('dash.bautismos'),             value: ext.baptisms,             hint: t('dash.baptismsHintQ'),           cls: "accent-faith" },
    ].map(({ label, value, hint, cls }) => `
      <article class="summary-card summary-card-dashboard ${cls || ""}">
        <span class="summary-label">${escapeHtml(label)}</span>
        <strong class="summary-value">${escapeHtml(String(value))}</strong>
        <span class="summary-hint">${escapeHtml(hint)}</span>
      </article>
    `).join("");

  } else {
    // Year scope
    const ext  = aggregateMetricsExtended(scopeReports, { baptismYear: selectedYear });
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
    `).join("") || `<tr><td colspan="5" class="scope-q-empty">${t('dash.noReports')}</td></tr>`;

    dashboardSummaryGrid.innerHTML = `
      <article class="summary-card summary-card-dashboard accent-neutral">
        <span class="summary-label">${t('dash.weeksReportedShort')}</span>
        <strong class="summary-value">${ext.n}</strong>
        <span class="summary-hint">${t('dash.weeksReportedYearHint')}</span>
      </article>
      <article class="summary-card summary-card-dashboard accent-success">
        <span class="summary-label">${t('dash.consistentBros')}</span>
        <strong class="summary-value">${ext.consistentMembers}</strong>
        <span class="summary-hint">${t('dash.consistentHint')}</span>
      </article>
      <article class="summary-card summary-card-dashboard accent-faith">
        <span class="summary-label">${t('met.conversions')}</span>
        <strong class="summary-value">${ext.reachConversions}</strong>
        <span class="summary-hint">${t('dash.faithHintY')}</span>
      </article>
      <article class="summary-card summary-card-dashboard accent-faith">
        <span class="summary-label">${t('dash.bautismos')}</span>
        <strong class="summary-value">${ext.baptisms}</strong>
        <span class="summary-hint">${t('dash.baptismsHintY')}</span>
      </article>
      <article class="summary-card summary-card-dashboard">
        <span class="summary-label">${t('dash.avgPlanningShort')}</span>
        <strong class="summary-value">${ext.avgPlanning}</strong>
        <span class="summary-hint">${t('dash.avgPlanningHintY')}</span>
      </article>
      <article class="summary-card summary-card-dashboard">
        <span class="summary-label">${t('dash.avgReach')}</span>
        <strong class="summary-value">${ext.avgReachMembers}</strong>
        <span class="summary-hint">${t('dash.avgReachHint')}</span>
      </article>
      <article class="summary-card summary-card-dashboard scope-table-card">
        <span class="summary-label">${t('dash.compareByQuarter')}</span>
        <table class="scope-q-table">
          <thead><tr><th></th><th>${t('dash.weekShort2')}</th><th>${t('dash.convShort')}</th><th>${t('dash.bautShort')}</th><th>${t('dash.avgReachShort')}</th></tr></thead>
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
      if (dashboardAbsenceTitle) dashboardAbsenceTitle.textContent = t('dash.absenceAlerts');
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
          // Per-stage: include only if absent OR justified (not pending/present/service)
          const missed = [];
          const planSt = String(entry.planningStatus || "").toLowerCase();
          const reachSt = String(entry.reachStatus    || "").toLowerCase();
          const sunSt  = String(entry.sundayStatus   || "").toLowerCase();
          if (planSt === "absent" || planSt === "justified") missed.push({ code: "P", justified: planSt === "justified" });
          if (reachSt === "absent" || reachSt === "justified") missed.push({ code: "A", justified: reachSt === "justified" });
          if (sunSt  === "absent" || sunSt  === "justified") missed.push({ code: "C", justified: sunSt  === "justified" });
          if (missed.length === 0) return;
          const key = String(entry.personId || entry.name || "");
          seenKeys.add(key);
          const streakInfo = streaks.get(key);
          rows.push({ name: entry.name || "", missed, streak: streakInfo?.streak || 0 });
        });
        rows.sort((a, b) => b.missed.length - a.missed.length || b.streak - a.streak);
      }
      const onlyStreak = Array.from(streaks.values())
        .filter(e => e.streak >= 2 && !seenKeys.has(String(e.name)))
        .sort((a, b) => b.streak - a.streak);

      let html = "";
      if (rows.length) {
        const EVENT_LABELS = { P: t('dash.planning'), A: t('dash.reach'), C: t('dash.sunday') };
        html += rows.map(row => {
          const chips = row.missed.map(m => {
            const cls = m.justified ? "alert-chip alert-chip-justified" : "alert-chip alert-chip-absent";
            const ttl = `${EVENT_LABELS[m.code]} — ${m.justified ? t('att.statuses.justified') : t('att.statuses.absent')}`;
            return `<span class="${cls}" title="${ttl}">${m.code}</span>`;
          }).join("");
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
        html += `<div class="quick-list-empty">${t('dash.noAbsThisWeek')}</div>`;
      } else {
        html += `<div class="quick-list-empty">${t('dash.noReportRegistered')}</div>`;
      }
      if (onlyStreak.length) {
        if (html) html += `<div class="alert-group-label" style="margin-top:10px">${t('dash.alsoInPrevWeeks')}</div>`;
        html += onlyStreak.slice(0, 5).map(e => {
          const cls = e.streak >= 4 ? "critical" : e.streak >= 3 ? "high" : "medium";
          return `<div class="absence-row">
            <span class="absence-row-name">${escapeHtml(e.name)}</span>
            <span class="absence-row-chips"></span>
            <span class="alert-streak-pill alert-streak-${cls}">${e.streak}×</span>
          </div>`;
        }).join("");
      }
      dashboardAbsenceAlerts.innerHTML = html || `<div class="quick-list-empty">${t('dash.noAlerts')}</div>`;

    } else {
      // ── Vista cuatrimestre / año: asistencia acumulada por miembro y amigos ──
      const periodLabel = activeDashboardTimeScope === "quarter" ? scopeTitleText : t('common.yearN', { n: selectedYear });
      if (dashboardAbsenceTitle) dashboardAbsenceTitle.textContent = `Seguimiento · ${periodLabel}`;
      if (dashboardAbsenceLegend) dashboardAbsenceLegend.hidden = true;

      // ── Hermanos ─────────────────────────────────────────────────────────────
      const STAGES_ORDER = ["encabezado", "planificacion", "alcance", "culto", "cierre"];
      const stageReached = (fd, stageName) => {
        if (fd && fd._draft !== true && fd._draft !== "true") return true;
        const last = fd?.lastStage;
        if (!last) return false;
        return STAGES_ORDER.indexOf(last) >= STAGES_ORDER.indexOf(stageName);
      };
      const memberStats = new Map(); // key → { key, name, weeks, planP, reachP, sundayP, planApp, reachApp, sundayApp, absent, justified }
      scopeReports.forEach(r => {
        const fd = r.formData || {};
        const planApp   = stageReached(fd, "planificacion");
        const reachApp  = stageReached(fd, "alcance");
        const sundayApp = stageReached(fd, "culto");
        const entries = Array.isArray(fd.memberAttendance) ? fd.memberAttendance : [];
        entries.forEach(e => {
          const key = String(e.personId || e.name || "");
          if (!key) return;
          const prev = memberStats.get(key) || { key, name: e.name || "", weeks: 0, planP: 0, reachP: 0, sundayP: 0, planApp: 0, reachApp: 0, sundayApp: 0, absent: 0, justified: 0 };
          prev.weeks += 1;
          if (planApp)   { prev.planApp   += 1; if (e.planningAttended) prev.planP   += 1; }
          if (reachApp)  { prev.reachApp  += 1; if (e.reachAttended)    prev.reachP  += 1; }
          if (sundayApp) { prev.sundayApp += 1; if (e.sundayAttended)   prev.sundayP += 1; }
          if (e.status === "absent")    prev.absent   += 1;
          if (e.status === "justified") prev.justified += 1;
          memberStats.set(key, prev);
        });
      });

      // ── Amigos ───────────────────────────────────────────────────────────────
      const visitorStats = new Map(); // normalizedName → { name, invitedBy, visits, reachCount, sundayCount, converted, lateRegistration }
      scopeReports.forEach(r => {
        const visitors = Array.isArray(r.formData?.visitors) ? r.formData.visitors : [];
        visitors.forEach(v => {
          const norm = normalizeVisitorName(v.name);
          if (!norm) return;
          const prev = visitorStats.get(norm) || { name: String(v.name || norm).trim(), invitedBy: String(v.invitedBy || "").trim(), visits: 0, reachCount: 0, sundayCount: 0, converted: false, kind: 'amigo', lateRegistration: false };
          prev.visits++;
          if (v.reachAttended)  prev.reachCount++;
          if (v.sundayAttended) prev.sundayCount++;
          if (v.converted)      prev.converted = true;
          if (v.lateRegistration) prev.lateRegistration = true;
          if (!prev.invitedBy && v.invitedBy) prev.invitedBy = String(v.invitedBy).trim();
          if ((v.kind || 'amigo') === 'visita') prev.kind = 'visita';
          visitorStats.set(norm, prev);
        });
      });

      // ── Build member rows ─────────────────────────────────────────────────────
      const buildMemberRows = () => {
        if (memberStats.size === 0) return `<tr><td colspan="3" class="attend-empty">${t('att.noAttendanceData')}</td></tr>`;
        const memberPct = m => {
          const applied = m.planApp + m.reachApp + m.sundayApp;
          return applied > 0 ? (m.planP + m.reachP + m.sundayP) / applied : 0;
        };
        const sorted = [...memberStats.values()].sort((a, b) => {
          return memberPct(a) - memberPct(b) || a.name.localeCompare(b.name);
        });
        return sorted.map(m => {
          const applied = m.planApp + m.reachApp + m.sundayApp;
          const avgPct = applied > 0 ? Math.round(((m.planP + m.reachP + m.sundayP) / applied) * 100) : 0;
          const barCls = avgPct >= 80 ? "attend-bar-good" : avgPct >= 50 ? "attend-bar-mid" : "attend-bar-low";
          const absTotal = m.absent + m.justified;
          const faltasCell = absTotal === 0
            ? `<span class="attend-ok-badge">✓ ${t('att.noAbsences')}</span>`
            : `<span class="attend-abs-badge">${absTotal} sem.</span>${m.justified > 0 ? ` <span class="attend-just-badge">${m.justified} just.</span>` : ""}`;
          const allSame = m.planP === m.reachP && m.reachP === m.sundayP
            && m.planApp === m.reachApp && m.reachApp === m.sundayApp;
          const evDetail = allSame
            ? `${m.planP} de ${m.planApp} semanas asistió a los 3 eventos`
            : `Plan. ${m.planP}/${m.planApp} · Alc. ${m.reachP}/${m.reachApp} · Culto ${m.sundayP}/${m.sundayApp}`;
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
        if (visitorStats.size === 0) return `<tr><td colspan="3" class="attend-empty">${t('att.noFriendsRegistered')}</td></tr>`;
        const sorted = [...visitorStats.values()].sort((a, b) => b.visits - a.visits || a.name.localeCompare(b.name));
        return sorted.map(v => {
          const normKey = normalizeVisitorName(v.name);
          const reachPct  = v.visits > 0 ? Math.round((v.reachCount  / v.visits) * 100) : 0;
          const sundayPct = v.visits > 0 ? Math.round((v.sundayCount / v.visits) * 100) : 0;
          const convertedBadge = v.converted ? `<span class="visitor-conv-badge">Convertido ✓</span>` : "";
          const lateBadge = v.lateRegistration ? `<span class="visitor-conv-badge" style="background:#fff4cc;color:#8a6d00;border-color:#f3d574;">Tardío</span>` : "";
          const invitadoBadge  = v.invitedBy ? `<span class="attend-ev-detail">Invitado por ${escapeHtml(v.invitedBy)}</span>` : "";
          const vKind = v.kind === 'visita' ? 'visita' : 'amigo';
          const kindLbl = vKind === 'visita' ? t('vis.kindRest') : t('vis.friend');
          const kindChip = `<span class="visitor-kind-chip is-${vKind}" title="${vKind === 'visita' ? t('vis.bapInRest') : t('vis.notBaptized')}">${escapeHtml(kindLbl)}</span>`;
          return `<tr class="attend-row attend-row-clickable" data-visitor-key="${escapeHtml(normKey)}" data-visitor-name="${escapeHtml(v.name)}" title="Ver detalle de ${escapeHtml(v.name)}">
            <td class="attend-name">
              ${kindChip} ${escapeHtml(v.name)} ${convertedBadge} ${lateBadge}
              ${invitadoBadge}
            </td>
            <td class="attend-falta-cell">
              <span class="attend-ev-chip attend-ev-a" title=t('dash.reach')>${v.reachCount}/${v.visits}</span>
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
          <button class="attend-tab" data-tab="amigos">Amigos <span class="attend-tab-count">${visitorStats.size}</span>${(() => { const r = [...visitorStats.values()].filter(x => x.kind === 'visita').length; return r > 0 ? ` <span class="attend-tab-count" title="En restauración" style="background:#f3e5f5;color:#6a1b9a;">+${r} rest.</span>` : ""; })()}</button>
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
            `${activeDashboardTimeScope === "quarter" ? t('common.quarter') : t('common.year')} · ${periodLabel}`
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
            `${activeDashboardTimeScope === "quarter" ? t('common.quarter') : t('common.year')} · ${periodLabel}`
          );
        });
      });
    }
  }

  // Metrics: scoped to this cell, selected time scope
  renderDashboardMetrics(scopeReports, leaderCellNumber ? t('cell.numbered', { n: leaderCellNumber }) : t('dash.scopeMyCell'));
  // Donas: usar el MISMO periodo de tiempo que las tarjetas para evitar discrepancias
  // (ej. tarjeta dice 91 esta semana y dona decía 134 del cuatrimestre).
  renderDashboardTrends(scopeReports, { selectedYear, selectedQuarter });
  renderDashboardBaptisms(allCellReports);
}

function renderDashboard(reports) {
  reports = filterVisibleReports(reports);
  // Pintar sub-pestañas de ámbito (Mi célula / Mi sector / Todos) y asegurar
  // que activeDashboardScope tenga un valor válido para el usuario actual.
  renderDashboardScopeTabs();
  // Si el usuario tiene célula asignada y eligió "Mi célula" (o no tiene más opciones),
  // usar la vista de líder enfocada en una sola célula.
  if (isCellScopedLeaderView()) {
    return renderDashboardForLeader(reports);
  }

  const scopedReports = applyDashboardScopeFilter(getScopedReports(reports));
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
    scopeTitleText = t('qfull.title', { range: t(selectedQuarter === "1" ? 'qrange.q1' : selectedQuarter === "2" ? 'qrange.q2' : 'qrange.q3'), year: selectedYear });
    hintSuffix     = t('qfull.hintSuffix');
  } else if (activeDashboardTimeScope === "year") {
    scopeTimeReports = scopedReports.filter(r => getReportYear(r) === selectedYear);
    scopeChipText  = t('common.yearN', { n: selectedYear });
    scopeTitleText = t('common.yearN', { n: selectedYear });
    hintSuffix     = t('dash.inTheYear');
  } else {
    scopeTimeReports = weeklyReports;
    scopeChipText  = t('common.weekShort', { n: selectedWeek });
    scopeTitleText = t('dash.weekInProgress');
    hintSuffix     = t('dash.thisWeek');
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

  // Para el filtro de bautismos: si scope=year usamos solo year; si scope=quarter o week usamos year+quarter.
  const baptismScopeOpts = activeDashboardTimeScope === "year"
    ? { baptismYear: selectedYear }
    : { baptismYear: selectedYear, baptismQuarter: selectedQuarter };
  const agg = aggregateMetrics(scopeTimeReports, baptismScopeOpts);
  const reportedCellsCount = new Set(scopeTimeReports.map(r => String(r.cellNumber || r.formData?.cellNumber || ""))).size;

  if (activeDashboardTimeScope === "week") {
    dashboardSummaryGrid.innerHTML = [
      [t('dash.reports'),    scopeTimeReports.length,                                                    hintSuffix === t('dash.thisWeek') ? t('dash.capturedThisWeek') : t('dash.capturedSuffix', { suffix: hintSuffix })],
      [t('admin.cells2'),     reportedCellsCount,                                                         t('dash.withReport')],
      [t('dash.pendingShort'),  pendingCells.length,                                                        t('dash.noReportThisWeek')],
      [t('dash.planning'),  agg.planningPresent,                                                        t('dash.brothersInPlanning')],
      [t('dash.reach'),     agg.reachMembers + agg.reachVisitors + agg.reachKids,                       t('dash.totalReach')],
      [t('dash.sunday'),       agg.sundayMembers + agg.sundayVisitors + agg.sundayKids,                    t('dash.totalSunday')],
      [t('dash.faltas'),      agg.absent + agg.justified,                                                 t('dash.absentJustifiedHint')],
      [t('dash.visits'),     agg.reachVisitors + agg.sundayVisitors,                                     t('dash.visitsHint')],
    ].map(([label, value, hint]) => `
      <article class="summary-card summary-card-dashboard">
        <span class="summary-label">${escapeHtml(label)}</span>
        <strong class="summary-value">${escapeHtml(String(value))}</strong>
        <span class="summary-hint">${escapeHtml(hint)}</span>
      </article>
    `).join("");

  } else if (activeDashboardTimeScope === "quarter") {
    const ext = aggregateMetricsExtended(scopeTimeReports, baptismScopeOpts);
    dashboardSummaryGrid.innerHTML = [
      { label: t('dash.weeksReported'),        value: reportedCellsCount ? `${scopeTimeReports.length}` : "0", hint: t('dash.reportsInQuarter'),         cls: "accent-neutral" },
      { label: t('dash.activeCells'),        value: reportedCellsCount,                                       hint: t('dash.activeCellsHint'),             cls: "accent-neutral" },
      { label: t('dash.avgReachPerCell'), value: ext.n > 0 ? Math.round((ext.reachMembers + ext.reachVisitors) / Math.max(1, reportedCellsCount)) : 0,
                                                                                                           hint: t('dash.avgReachPerCellHint'),     cls: "" },
      { label: t('dash.avgSundayPerCell'),   value: ext.n > 0 ? Math.round((ext.sundayMembers + ext.sundayVisitors) / Math.max(1, reportedCellsCount)) : 0,
                                                                                                           hint: t('dash.avgSundayPerCellHint'),       cls: "" },
      { label: t('met.conversions'),           value: ext.reachConversions,                                      hint: t('dash.faithHintQ'), cls: "accent-faith" },
      { label: t('dash.bautismos'),              value: ext.baptisms,                                              hint: t('dash.baptismsHintQ'),        cls: "accent-faith" },
      { label: t('dash.totalFaults'),         value: ext.absent + ext.justified,                                hint: t('dash.totalFaultsHint'),      cls: "" },
      { label: t('dash.pendingThisWk'),   value: pendingCells.length,                                       hint: t('dash.pendingHint'), cls: "" },
    ].map(({ label, value, hint, cls }) => `
      <article class="summary-card summary-card-dashboard ${cls || ""}">
        <span class="summary-label">${escapeHtml(label)}</span>
        <strong class="summary-value">${escapeHtml(String(value))}</strong>
        <span class="summary-hint">${escapeHtml(hint)}</span>
      </article>
    `).join("");

  } else {
    // Year scope — totals + per-quarter breakdown table
    const ext = aggregateMetricsExtended(scopeTimeReports, baptismScopeOpts);
    const allForYear = scopedReports.filter(r => getReportYear(r) === selectedYear);
    const byQ  = [1, 2, 3].map(q => {
      const reps = allForYear.filter(r => String(getReportQuarter(r)) === String(q));
      const ag   = aggregateMetrics(reps, { baptismYear: selectedYear, baptismQuarter: q });
      const cells = new Set(reps.map(r => String(r.cellNumber || r.formData?.cellNumber || ""))).size;
      return { q, n: reps.length, cells, conversions: ag.reachConversions, baptisms: ag.baptisms,
               avgReach: reps.length ? Math.round((ag.reachMembers + ag.reachVisitors) / Math.max(1, cells)) : 0 };
    });
    const QNAMES = ["", t('qrange.q1'), t('qrange.q2'), t('qrange.q3')];
    const qTableRows = byQ.filter(b => b.n > 0).map(b => `
      <tr>
        <td>C${b.q} <span class="scope-q-range">${QNAMES[b.q]}</span></td>
        <td class="scope-q-num">${b.n}</td>
        <td class="scope-q-num">${b.cells}</td>
        <td class="scope-q-num">${b.conversions}</td>
        <td class="scope-q-num">${b.baptisms}</td>
        <td class="scope-q-num">${b.avgReach}</td>
      </tr>
    `).join("") || `<tr><td colspan="6" class="scope-q-empty">${t('dash.noReports')}</td></tr>`;

    dashboardSummaryGrid.innerHTML = `
      <article class="summary-card summary-card-dashboard accent-neutral">
        <span class="summary-label">${t('dash.reportsInYear')}</span>
        <strong class="summary-value">${scopeTimeReports.length}</strong>
        <span class="summary-hint">${t('dash.totalReportsHint')}</span>
      </article>
      <article class="summary-card summary-card-dashboard accent-neutral">
        <span class="summary-label">${t('dash.activeCells')}</span>
        <strong class="summary-value">${reportedCellsCount}</strong>
        <span class="summary-hint">${t('dash.activeCellsYearHint')}</span>
      </article>
      <article class="summary-card summary-card-dashboard accent-faith">
        <span class="summary-label">${t('met.conversions')}</span>
        <strong class="summary-value">${ext.reachConversions}</strong>
        <span class="summary-hint">${t('dash.faithHintY')}</span>
      </article>
      <article class="summary-card summary-card-dashboard accent-faith">
        <span class="summary-label">${t('dash.bautismos')}</span>
        <strong class="summary-value">${ext.baptisms}</strong>
        <span class="summary-hint">${t('dash.baptismsHintY')}</span>
      </article>
      <article class="summary-card summary-card-dashboard scope-table-card">
        <span class="summary-label">${t('dash.compareByQuarter')}</span>
        <table class="scope-q-table">
          <thead><tr><th></th><th>${t('dash.repShort')}</th><th>${t('dash.cellsShort')}</th><th>${t('dash.convShort')}</th><th>${t('dash.bautShort')}</th><th>${t('dash.avgReachShort')}</th></tr></thead>
          <tbody>${qTableRows}</tbody>
        </table>
      </article>
    `;
  }

  // Para semana usamos scopedReports filtrados hasta la semana seleccionada
  // (necesitamos historial previo para calcular rachas). Para cuatrimestre/año
  // basta con los reportes ya filtrados por scope de tiempo.
  const alertsSource = activeDashboardTimeScope === "week"
    ? scopedReports.filter((report) => getReportPeriodKey(report) <= activeDashboardPeriod)
    : scopeTimeReports;
  const sortedReports = [...alertsSource].sort((left, right) => {
    const leftKey = `${getReportYear(left)}-${getReportWeek(left).padStart(2, "0")}`;
    const rightKey = `${getReportYear(right)}-${getReportWeek(right).padStart(2, "0")}`;
    return leftKey.localeCompare(rightKey);
  });
  // Alertas de faltas: rastrea rachas de inasistencia POR EVENTO (Planeación / Alcance / Culto).
  // En vista semanal muestra a TODOS los que faltaron a algún evento esta semana + rachas previas.
  // En vista cuatrimestre/año muestra solo rachas de 2+ semanas.
  const EVENT_DEFS = [
    { key: "planning", letter: "P", statusField: "planningStatus", attendedField: "planningAttended" },
    { key: "reach",    letter: "A", statusField: "reachStatus",    attendedField: "reachAttended"    },
    { key: "sunday",   letter: "C", statusField: "sundayStatus",   attendedField: "sundayAttended"   },
  ];
  const streaks = new Map();
  sortedReports.forEach((report) => {
    const pk = getReportPeriodKey(report);
    const cellNum = String(report.cellNumber || report.formData?.cellNumber || "");
    const leaderNm = report.leaderName || report.formData?.leaderName || "";
    const entries = Array.isArray(report?.formData?.memberAttendance) ? report.formData.memberAttendance : [];
    entries.forEach((entry) => {
      const key = String(entry.personId || entry.name || "");
      if (!key) return;
      if (!streaks.has(key)) streaks.set(key, { name: entry.name || "", cellNum, leaderNm, perEvent: {}, totalMissed: 0 });
      const rec = streaks.get(key);
      rec.name = entry.name || rec.name;
      if (cellNum) rec.cellNum = cellNum;
      if (leaderNm) rec.leaderNm = leaderNm;
      let missedHere = false;
      EVENT_DEFS.forEach((ev) => {
        const status = String(entry[ev.statusField] || "").toLowerCase();
        const attended = entry[ev.attendedField] === true;
        const cur = rec.perEvent[ev.key] || { streak: 0, last: "", justified: false, total: 0 };
        // Falta = no asistió. Justificado solo si está marcado explícitamente.
        if (!attended) {
          cur.streak = (cur.last && isNextPeriod(cur.last, pk)) ? cur.streak + 1 : 1;
          cur.last = pk;
          cur.justified = status === "justified";
          cur.total = (cur.total || 0) + 1;
          missedHere = true;
        } else {
          cur.streak = 0;
          cur.last = pk;
          cur.justified = false;
        }
        rec.perEvent[ev.key] = cur;
      });
      if (missedHere) rec.totalMissed = (rec.totalMissed || 0) + 1;
    });
  });

  const renderAlertRow = (entry) => {
    const severity = entry.maxStreak >= 4 ? "high" : entry.maxStreak >= 3 ? "medium" : entry.maxStreak >= 2 ? "soft" : "soft";
    const severityLabel = entry.maxStreak >= 4 ? "Crítica" : entry.maxStreak >= 3 ? "Alta" : entry.maxStreak >= 2 ? "Seguimiento" : "Nueva";
    const badges = entry.events.map((e) =>
      `<span class="absence-event-pill absence-pill-${e.letter.toLowerCase()}${e.justified ? ' is-justified' : ''}" title="${e.streak >= 2 ? e.streak + ' semanas seguidas' : 'esta semana'}">${e.letter}${e.streak >= 2 ? `<small>${e.streak}×</small>` : ''}</span>`
    ).join("");
    const ctx = [];
    if (entry.cellNum) ctx.push(`Cél ${escapeHtml(entry.cellNum)}`);
    if (entry.leaderNm) ctx.push(escapeHtml(entry.leaderNm));
    if (entry.totalMissed && entry.totalMissed >= 2) ctx.push(`${entry.totalMissed} sem. con faltas`);
    const ctxHtml = ctx.length ? `<span class="absence-row-meta">${ctx.join(" · ")}</span>` : "";
    return `<div class="absence-row-compact dashboard-alert-${severity}">
      <span class="absence-row-pills">${badges}</span>
      <span class="absence-row-main">
        <strong class="absence-row-name">${escapeHtml(entry.name)}</strong>
        ${ctxHtml}
      </span>
      <span class="absence-row-badge">${escapeHtml(severityLabel)}</span>
    </div>`;
  };

  let alertsHtml = "";
  if (activeDashboardTimeScope === "week") {
    // Vista semana: faltas de esta semana + rachas previas como segunda sección
    const weekKeys = new Set();
    const weekAlerts = [];
    weeklyReports.forEach((report) => {
      const cellNum = String(report.cellNumber || report.formData?.cellNumber || "");
      const leaderNm = report.leaderName || report.formData?.leaderName || "";
      const entries = Array.isArray(report?.formData?.memberAttendance) ? report.formData.memberAttendance : [];
      entries.forEach((entry) => {
        const events = [];
        EVENT_DEFS.forEach((ev) => {
          const status = String(entry[ev.statusField] || "").toLowerCase();
          const attended = entry[ev.attendedField] === true;
          if (!attended) {
            const key = String(entry.personId || entry.name || "");
            const stk = streaks.get(key)?.perEvent[ev.key]?.streak || 1;
            events.push({ letter: ev.letter, streak: stk, justified: status === "justified" });
          }
        });
        if (events.length === 0) return;
        const k = String(entry.personId || entry.name || "");
        if (!k) return;
        weekKeys.add(k);
        const rec = streaks.get(k);
        const maxStreak = events.reduce((m, e) => Math.max(m, e.streak), 0);
        weekAlerts.push({
          name: entry.name || "",
          cellNum, leaderNm,
          totalMissed: rec?.totalMissed || 1,
          maxStreak, events,
        });
      });
    });
    weekAlerts.sort((a, b) => b.maxStreak - a.maxStreak || b.events.length - a.events.length);

    const prevStreaks = Array.from(streaks.entries()).map(([k, rec]) => {
      let maxStreak = 0;
      const events = [];
      EVENT_DEFS.forEach((ev) => {
        const c = rec.perEvent[ev.key];
        if (c && c.streak >= 2) {
          maxStreak = Math.max(maxStreak, c.streak);
          events.push({ letter: ev.letter, streak: c.streak, justified: c.justified });
        }
      });
      return { key: k, name: rec.name, cellNum: rec.cellNum, leaderNm: rec.leaderNm, totalMissed: rec.totalMissed, maxStreak, events };
    }).filter((a) => a.maxStreak >= 2 && !weekKeys.has(a.key))
      .sort((a, b) => b.maxStreak - a.maxStreak)
      .slice(0, 5);

    if (weekAlerts.length) {
      alertsHtml += `<div class="absence-rows-wrap">${weekAlerts.map(renderAlertRow).join("")}</div>`;
    }
    if (prevStreaks.length) {
      alertsHtml += `<div class="alert-group-label" style="margin-top:10px">${t('dash.alsoInPrevWeeks') || 'También con racha previa'}</div>`;
      alertsHtml += `<div class="absence-rows-wrap">${prevStreaks.map(renderAlertRow).join("")}</div>`;
    }
    if (!alertsHtml) {
      alertsHtml = `<div class="quick-list-empty">${t('dash.noAbsThisWeek') || 'Sin faltas registradas esta semana.'}</div>`;
    }
  } else {
    // Vista cuatrimestre/año: top de personas con más faltas en el período.
    // Las pills muestran el total de faltas por evento (no la racha).
    const alerts = Array.from(streaks.values()).map((rec) => {
      const events = [];
      let maxStreak = 0;
      EVENT_DEFS.forEach((ev) => {
        const c = rec.perEvent[ev.key];
        if (c && c.total > 0) {
          events.push({ letter: ev.letter, streak: c.total, justified: c.justified });
          maxStreak = Math.max(maxStreak, c.streak || 0);
        }
      });
      return { name: rec.name, cellNum: rec.cellNum, leaderNm: rec.leaderNm, totalMissed: rec.totalMissed, maxStreak, events };
    }).filter((a) => a.totalMissed > 0)
      .sort((a, b) => b.totalMissed - a.totalMissed || b.events.length - a.events.length)
      .slice(0, 25);
    alertsHtml = alerts.length
      ? `<div class="absence-rows-wrap">${alerts.map(renderAlertRow).join("")}</div>`
      : `<div class="quick-list-empty">${t('dash.noConsecAlerts')}</div>`;
  }
  dashboardAbsenceAlerts.innerHTML = alertsHtml;

  // ── Métricas consolidadas ───────────────────────────────────────────────
  renderDashboardMetrics(scopeTimeReports, scopeLabel);
  // ── Composición (donas) ─────────────────────────────────────────────────
  // Usar scopeTimeReports (no scopedReports) para respetar la pestaña de tiempo
  // activa y que el total de cada dona cuadre con las tarjetas de métricas.
  renderDashboardTrends(scopeTimeReports, { selectedYear, selectedQuarter });
  // ── Bautismos ────────────────────────────────────────────────────────────
  renderDashboardBaptisms(scopedReports);
}

// `opts.baptismYear` y `opts.baptismQuarter` filtran los bautismos por su
// propia fecha (baptismDate), no por la fecha del reporte que los contiene.
// Esto evita que un bautismo del 2026-04-26 (Q1) capturado en un reporte de
// mayo (Q2) aparezca contabilizado en Q2 / semana de mayo.
function aggregateMetrics(reportsList, opts = {}) {
  const baptismYear = opts.baptismYear ? String(opts.baptismYear) : null;
  const baptismQuarter = opts.baptismQuarter ? String(opts.baptismQuarter) : null;
  const baptismMatchesScope = (entry) => {
    if (!baptismYear && !baptismQuarter) return true;
    const d = String(entry?.baptismDate || "");
    if (baptismYear && d.slice(0, 4) !== baptismYear) return false;
    if (baptismQuarter && String(getBaptismQuarter(d)) !== baptismQuarter) return false;
    return true;
  };

  // Para conteos "únicos" (miembros de la célula, niños de catálogo) usamos sets
  // por celda+persona para no inflar al sumar varias semanas.
  const memberSet = new Set();      // miembros únicos vistos en cualquier reporte
  const kidsCellSet = new Set();    // niños de catálogo (parte de la célula)
  const kidsVisitSet = new Set();   // niños de visita (no son de la célula)
  const friendsSet = new Set();     // amigos únicos (kind=amigo)
  const lateFriendsSet = new Set(); // amigos anotados tardío únicos
  const restorSet = new Set();      // visitas en restauración únicas (kind=visita)
  // Mapas de ausentes por evento: {nameLower → {name, count}}
  const planAbsMap   = new Map();
  const reachAbsMap  = new Map();
  const sundayAbsMap = new Map();

  const acc = reportsList.reduce((acc, report) => {
    const fd = report?.formData || {};
    const s  = fd.attendanceSummary || {};
    const cellNum = String(report.cellNumber || fd.cellNumber || "");
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
    // Roster acumulado (slots): suma de miembros del catálogo por reporte.
    // Permite calcular ausentes como roster - presentes para que los números cuadren.
    const rosterW = Number(s.totalMembers || (Array.isArray(fd.memberAttendance) ? fd.memberAttendance.length : 0));
    acc.rosterSlots += rosterW;
    // Justificados por evento (informativo)
    const memList = Array.isArray(fd.memberAttendance) ? fd.memberAttendance : [];
    memList.forEach((e) => {
      if (String(e.planningStatus || "").toLowerCase() === "justified") acc.planningJustEv += 1;
      if (String(e.reachStatus    || "").toLowerCase() === "justified") acc.reachJustEv    += 1;
      if (String(e.sundayStatus   || "").toLowerCase() === "justified") acc.sundayJustEv   += 1;
    });
    const baptList = Array.isArray(fd.baptisms) ? fd.baptisms : [];
    acc.baptisms         += baptList.filter(baptismMatchesScope).length;
    acc.offering         += Number(s.reachOffering || fd.reachOffering || 0);

    // ── Splits por kind (amigos vs visitas restauración) y origen de niños ──
    const visitors = Array.isArray(fd.visitors) ? fd.visitors : [];
    visitors.forEach((v) => {
      const name = String(v?.name || "").trim();
      if (!name) return;
      const kind = String(v?.kind || "amigo").toLowerCase() === "visita" ? "visita" : "amigo";
      const key = `${cellNum}|${name.toLowerCase()}`;
      if (kind === "visita") {
        restorSet.add(key);
        if (v.reachAttended)  acc.reachRestor  += 1;
        if (v.sundayAttended) acc.sundayRestor += 1;
      } else {
        friendsSet.add(key);
        if (v.lateRegistration) {
          lateFriendsSet.add(key);
          acc.lateFriends += 1;
        }
        if (v.reachAttended)  acc.reachFriends  += 1;
        if (v.sundayAttended) acc.sundayFriends += 1;
      }
    });

    const kids = Array.isArray(fd.kids) ? fd.kids : [];
    kids.forEach((k) => {
      const name = String(k?.name || "").trim();
      if (!name) return;
      const isCellKid = String(k?.source || "").toLowerCase() === "catalog";
      const key = `${cellNum}|${name.toLowerCase()}`;
      if (isCellKid) {
        kidsCellSet.add(key);
        if (k.reachAttended)  acc.reachKidsCell  += 1;
        if (k.sundayAttended) acc.sundayKidsCell += 1;
      } else {
        kidsVisitSet.add(key);
        if (k.reachAttended)  acc.reachKidsVisit  += 1;
        if (k.sundayAttended) acc.sundayKidsVisit += 1;
      }
    });

    const members = Array.isArray(fd.memberAttendance) ? fd.memberAttendance : [];
    members.forEach((mm) => {
      const name = String(mm?.name || mm?.memberName || "").trim();
      if (!name) return;
      memberSet.add(`${cellNum}|${name.toLowerCase()}`);
      const k = name.toLowerCase();
      const bump = (map) => {
        const prev = map.get(k) || { name, count: 0 };
        prev.name = name; prev.count += 1; map.set(k, prev);
      };
      if (!mm.planningAttended) bump(planAbsMap);
      if (!mm.reachAttended)    bump(reachAbsMap);
      if (!mm.sundayAttended)   bump(sundayAbsMap);
    });

    return acc;
  }, { planningPresent: 0, planningAbsent: 0, reachMembers: 0, reachPrivileged: 0,
       reachVisitors: 0, reachKids: 0, reachConversions: 0,
       sundayMembers: 0, sundayVisitors: 0, sundayKids: 0, sundayTotal: 0,
       absent: 0, justified: 0, baptisms: 0, offering: 0,
       rosterSlots: 0,
       planningJustEv:   0, reachJustEv:   0, sundayJustEv:   0,
      reachFriends: 0, reachRestor: 0, sundayFriends: 0, sundayRestor: 0, lateFriends: 0,
       reachKidsCell: 0, reachKidsVisit: 0, sundayKidsCell: 0, sundayKidsVisit: 0 });

  acc.cellMembersUnique = memberSet.size;
  acc.kidsCellUnique    = kidsCellSet.size;
  acc.kidsVisitUnique   = kidsVisitSet.size;
  acc.friendsUnique     = friendsSet.size;
  acc.lateFriendsUnique = lateFriendsSet.size;
  acc.restorUnique      = restorSet.size;
  // Listas de ausentes por evento ordenadas por cantidad de faltas desc
  const sortAbs = (map) => [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  acc.planningAbsentList = sortAbs(planAbsMap);
  acc.reachAbsentList    = sortAbs(reachAbsMap);
  acc.sundayAbsentList   = sortAbs(sundayAbsMap);
  // Faltas absolutas por etapa basadas en miembros únicos vistos en la ventana.
  // Si no hay miembros vistos, caer a planningAbsent que ya viene del summary.
  acc.reachAbsentMembers  = Math.max(0, acc.cellMembersUnique - acc.reachMembers);
  acc.sundayAbsentMembers = Math.max(0, acc.cellMembersUnique - acc.sundayMembers);
  return acc;
}

// Extended aggregation used for quarter/year views: adds averages + consistent-member count
// `opts` (mismo que aggregateMetrics) propaga el filtro de bautismos por baptismDate.
function aggregateMetricsExtended(reportsList, opts = {}) {
  const n = reportsList.length;
  const base = aggregateMetrics(reportsList, opts);
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
// Cada cuatrimestre filtra sus bautismos por baptismDate (no por la fecha del reporte).
function aggregateByQuarter(reportsList, year) {
  const quarters = [1, 2, 3].map(q => {
    const reps = reportsList.filter(r => getReportYear(r) === year && String(getReportQuarter(r)) === String(q));
    const agg  = aggregateMetrics(reps, { baptismYear: year, baptismQuarter: q });
    return { q, n: reps.length, conversions: agg.reachConversions, baptisms: agg.baptisms,
             avgReach: reps.length ? Math.round((agg.reachMembers + agg.reachVisitors) / reps.length) : 0 };
  });
  return quarters;
}

// Mini-dona SVG reutilizable para la tabla de métricas
function _trendMiniDonut(val, total, cls) {
  const hasTotal = total > 0;
  const pct = hasTotal ? Math.max(0, Math.min(1, val / total)) : 0;
  const R = 14, C = 2 * Math.PI * R;
  const dash = (pct * C).toFixed(2);
  const gap  = (C - pct * C).toFixed(2);
  const pctTxt = hasTotal ? `${Math.round(pct * 100)}%` : "";
  const subTxt = hasTotal ? `${val}/${total}` : `${val}`;
  const title  = hasTotal ? `${val} de ${total} (${pctTxt})` : `${val}`;
  return `<div class="trend-cell trend-cell-donut" title="${title}">
    <svg class="trend-donut trend-donut-${cls}" viewBox="0 0 36 36" aria-hidden="true">
      <circle class="trend-donut-track" cx="18" cy="18" r="${R}" fill="none" stroke-width="4"></circle>
      <circle class="trend-donut-fill"  cx="18" cy="18" r="${R}" fill="none" stroke-width="4"
              stroke-dasharray="${dash} ${gap}" stroke-dashoffset="0" stroke-linecap="round"
              transform="rotate(-90 18 18)"></circle>
      <text class="trend-donut-text" x="18" y="18" text-anchor="middle" dominant-baseline="central">${hasTotal ? pctTxt : val}</text>
    </svg>
    <span class="trend-donut-sub">${subTxt}</span>
  </div>`;
}

// ── Metrics: agrupado por célula (cuando la vista incluye múltiples células) ──
function renderMetricsTrendByCell(reports) {
  const cellLabelMap = new Map(
    (catalogs.cells || []).map(c => [String(c.cellNumber), c.label || c.name || ""])
  );
  const byCell = new Map();
  reports.forEach(r => {
    const num = String(r.cellNumber || r.formData?.cellNumber || "");
    if (!num) return;
    if (!byCell.has(num)) byCell.set(num, []);
    byCell.get(num).push(r);
  });

  const rows = Array.from(byCell.entries()).map(([cellNum, reps]) => {
    let totalRoster = 0, plan = 0, reach = 0, friends = 0, sunday = 0, sundayFriends = 0, conv = 0;
    let restor = 0, sundayRestor = 0;
    const friendsReachMap = new Map(), friendsSundayMap = new Map();
    const restorReachMap  = new Map(), restorSundayMap  = new Map();
    reps.forEach(r => {
      const s = r.formData?.attendanceSummary || {};
      totalRoster   += Number(s.totalMembers || 0);
      plan          += Number(s.planningMembersPresent  || 0);
      reach         += Number(s.reachMembersPresent     || 0);
      friends       += Number(s.reachFriendsPresent || s.visitors || 0);
      sunday        += Number(s.sundayMembersPresent    || 0);
      sundayFriends += Number(s.sundayFriendsPresent    || 0);
      conv          += Number(s.reachConversions        || 0);
      const vs = Array.isArray(r.formData?.visitors) ? r.formData.visitors : [];
      vs.forEach(v => {
        const nm = String(v?.name || "").trim();
        if (!nm) return;
        const k = nm.toLowerCase();
        const isRestor = String(v?.kind || "amigo").toLowerCase() === "visita";
        if (isRestor) {
          if (v.reachAttended)  { restor++;       restorReachMap.set(k,  (restorReachMap.get(k)  || nm)); }
          if (v.sundayAttended) { sundayRestor++; restorSundayMap.set(k, (restorSundayMap.get(k) || nm)); }
        } else {
          if (v.reachAttended)  friendsReachMap.set(k,  (friendsReachMap.get(k)  || nm));
          if (v.sundayAttended) friendsSundayMap.set(k, (friendsSundayMap.get(k) || nm));
        }
      });
    });
    const reachNames        = [...friendsReachMap.values()].sort((a, b) => a.localeCompare(b));
    const sundayNames       = [...friendsSundayMap.values()].sort((a, b) => a.localeCompare(b));
    const restorReachNames  = [...restorReachMap.values()].sort((a, b) => a.localeCompare(b));
    const restorSundayNames = [...restorSundayMap.values()].sort((a, b) => a.localeCompare(b));
    return {
      cellNum, label: cellLabelMap.get(cellNum) || "", weeks: reps.length,
      totalRoster, plan, reach, friends, sunday, sundayFriends, conv,
      friendsUniqReach: reachNames.length,
      friendsUniqSunday: sundayNames.length,
      reachNames, sundayNames,
      restor, sundayRestor,
      restorUniqReach: restorReachNames.length,
      restorUniqSunday: restorSundayNames.length,
      restorReachNames, restorSundayNames,
    };
  }).sort((a, b) => (Number(a.cellNum) || 0) - (Number(b.cellNum) || 0));

  const totals = rows.reduce((a, r) => ({
    plan: a.plan + r.plan, reach: a.reach + r.reach, sunday: a.sunday + r.sunday,
    roster: a.roster + r.totalRoster, friends: a.friends + r.friends,
    sundayFriends: a.sundayFriends + r.sundayFriends, conv: a.conv + r.conv,
    uniqReach: a.uniqReach + r.friendsUniqReach, uniqSunday: a.uniqSunday + r.friendsUniqSunday,
    restorUniqReach:  a.restorUniqReach  + r.restorUniqReach,
    restorUniqSunday: a.restorUniqSunday + r.restorUniqSunday,
    restor: a.restor + r.restor, sundayRestor: a.sundayRestor + r.sundayRestor,
  }), { plan: 0, reach: 0, sunday: 0, roster: 0, friends: 0, sundayFriends: 0, conv: 0, uniqReach: 0, uniqSunday: 0, restorUniqReach: 0, restorUniqSunday: 0, restor: 0, sundayRestor: 0 });

  dashboardMetricsBody.innerHTML = `
    <div class="trend-table-wrap">
      <table class="trend-table">
        <thead><tr>
          <th class="trend-th-week">Célula</th>
          <th class="trend-th-ev trend-th-section">Hermanos</th>
          <th class="trend-th-ev"></th>
          <th class="trend-th-ev"></th>
          <th class="trend-th-ev trend-th-section trend-th-friends">Amigos</th>
          <th class="trend-th-ev trend-th-friends"></th>
          <th class="trend-th-ev trend-th-section trend-th-restor">Restauración</th>
          <th class="trend-th-ev trend-th-restor"></th>
          <th class="trend-th-ev trend-th-friends"></th>
        </tr>
        <tr class="trend-subhead">
          <th></th>
          <th>Plan.</th>
          <th>Alcance</th>
          <th>${t('met.cultoBrosShort')}</th>
          <th title="Personas distintas que asistieron al alcance">Amigos únicos</th>
          <th title="Personas distintas que pasaron del alcance al culto">Retención (únicos)</th>
          <th title="Hermanos en restauración únicos en el alcance">Rest. alcance</th>
          <th title="Hermanos en restauración que pasaron del alcance al culto">Rest. culto</th>
          <th title="Decisiones de fe registradas">Conv.</th>
        </tr></thead>
        <tbody>${rows.map(r => {
          const sundayLowSet = new Set(r.sundayNames.map(n => n.toLowerCase()));
          const missedNames = r.reachNames.filter(n => !sundayLowSet.has(n.toLowerCase()));
          const reachPop  = r.reachNames.length
            ? `<span class="trend-pop"><span class="trend-pop-title">Amigos al alcance (${r.reachNames.length})</span>${r.reachNames.map(n => `<span class="trend-pop-name${sundayLowSet.has(n.toLowerCase()) ? ' is-sunday' : ''}">${n}</span>`).join("")}</span>`
            : '';
          const retPct = r.friendsUniqReach > 0 ? Math.round(r.friendsUniqSunday / r.friendsUniqReach * 100) : 0;
          const sundayPop = r.reachNames.length
            ? `<span class="trend-pop trend-pop-wide"><span class="trend-pop-title">Retención al culto · ${r.friendsUniqSunday}/${r.friendsUniqReach} (${retPct}%)</span>
                 ${r.sundayNames.length ? `<span class="trend-pop-section trend-pop-section-ok">Llegaron (${r.sundayNames.length})</span>${r.sundayNames.map(n => `<span class="trend-pop-name is-sunday">${n}</span>`).join("")}` : ''}
                 ${missedNames.length ? `<span class="trend-pop-section trend-pop-section-miss">No llegaron (${missedNames.length})</span>${missedNames.map(n => `<span class="trend-pop-name is-missed">${n}</span>`).join("")}` : ''}
               </span>`
            : '';
          const restorSundayLowSet = new Set(r.restorSundayNames.map(n => n.toLowerCase()));
          const restorMissedNames  = r.restorReachNames.filter(n => !restorSundayLowSet.has(n.toLowerCase()));
          const restorReachPop = r.restorReachNames.length
            ? `<span class="trend-pop"><span class="trend-pop-title">Restauración al alcance (${r.restorReachNames.length})</span>${r.restorReachNames.map(n => `<span class="trend-pop-name${restorSundayLowSet.has(n.toLowerCase()) ? ' is-sunday' : ''}">${n}</span>`).join("")}</span>`
            : '';
          const restorRetPct = r.restorUniqReach > 0 ? Math.round(r.restorUniqSunday / r.restorUniqReach * 100) : 0;
          const restorSundayPop = r.restorReachNames.length
            ? `<span class="trend-pop trend-pop-wide"><span class="trend-pop-title">Restauración al culto · ${r.restorUniqSunday}/${r.restorUniqReach} (${restorRetPct}%)</span>
                 ${r.restorSundayNames.length ? `<span class="trend-pop-section trend-pop-section-ok">Llegaron (${r.restorSundayNames.length})</span>${r.restorSundayNames.map(n => `<span class="trend-pop-name is-sunday">${n}</span>`).join("")}` : ''}
                 ${restorMissedNames.length ? `<span class="trend-pop-section trend-pop-section-miss">No llegaron (${restorMissedNames.length})</span>${restorMissedNames.map(n => `<span class="trend-pop-name is-missed">${n}</span>`).join("")}` : ''}
               </span>`
            : '';
          return `
          <tr class="trend-row">
            <td class="trend-week-cell"><strong>Célula ${r.cellNum}</strong><span class="trend-date">${r.weeks} sem · ${r.label || ""}</span></td>
            <td>${_trendMiniDonut(r.plan,    r.totalRoster, "plan")}</td>
            <td>${_trendMiniDonut(r.reach,   r.totalRoster, "reach")}</td>
            <td>${_trendMiniDonut(r.sunday,  r.totalRoster, "sunday")}</td>
            <td class="trend-td-hover">${_trendMiniDonut(r.friendsUniqReach, 0, "friends")}${r.friends !== r.friendsUniqReach ? `<div class="trend-names">${r.friends} visitas</div>` : ''}${reachPop}</td>
            <td class="trend-td-hover">${_trendMiniDonut(r.friendsUniqSunday, r.friendsUniqReach, "friends")}${sundayPop}</td>
            <td class="trend-td-hover">${_trendMiniDonut(r.restorUniqReach, 0, "restor")}${r.restor !== r.restorUniqReach ? `<div class="trend-names">${r.restor} visitas</div>` : ''}${restorReachPop}</td>
            <td class="trend-td-hover">${_trendMiniDonut(r.restorUniqSunday, r.restorUniqReach, "restor")}${restorSundayPop}</td>
            <td>${_trendMiniDonut(r.conv, 0, "friends")}</td>
          </tr>`;
        }).join("")}</tbody>
        <tfoot><tr class="trend-avg-row">
          <td class="trend-avg-label">Total</td>
          <td class="trend-avg-val">${totals.plan}</td>
          <td class="trend-avg-val">${totals.reach}</td>
          <td class="trend-avg-val">${totals.sunday}</td>
          <td class="trend-avg-val">${totals.uniqReach}</td>
          <td class="trend-avg-val">${totals.uniqReach > 0 ? Math.round(totals.uniqSunday / totals.uniqReach * 100) + "%" : "–"}</td>
          <td class="trend-avg-val">${totals.restorUniqReach}</td>
          <td class="trend-avg-val">${totals.restorUniqReach > 0 ? Math.round(totals.restorUniqSunday / totals.restorUniqReach * 100) + "%" : "–"}</td>
          <td class="trend-avg-val">${totals.conv}</td>
        </tr></tfoot>
      </table>
    </div>`;
}

// ── Metrics: week-by-week trend (quarter scope) ───────────────────────────────
function renderMetricsTrend(reports) {
  if (!dashboardMetricsBody) return;
  if (!reports.length) {
    dashboardMetricsBody.innerHTML = `<div class="quick-list-empty">${t('empty.noData')}</div>`;
    return;
  }

  // Si hay múltiples células en el conjunto (vista coord/supervisor), agrupar por célula
  const distinctCells = new Set(
    reports.map(r => String(r.cellNumber || r.formData?.cellNumber || "")).filter(Boolean)
  );
  if (distinctCells.size > 1) {
    renderMetricsTrendByCell(reports);
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
    const total = Number(s.totalMembers || 0);
    const vs = Array.isArray(r.formData?.visitors) ? r.formData.visitors : [];
    const friendsVs = vs.filter(v => String(v?.kind || "amigo").toLowerCase() !== "visita" && String(v?.name || "").trim());
    return {
      week:    getReportWeek(r),
      date:    dateLabel,
      total,
      plan:    Number(s.planningMembersPresent  || 0),
      reach:   Number(s.reachMembersPresent     || 0),
      friends: Number(s.reachFriendsPresent || s.visitors || 0),
      sundayFriends: Number(s.sundayFriendsPresent || 0),
      sunday:  Number(s.sundayMembersPresent    || 0),
      conv:    Number(s.reachConversions        || 0),
      friendsNames: friendsVs.map(v => String(v.name).trim()),
      friendsReachNames:  friendsVs.filter(v => v.reachAttended ).map(v => String(v.name).trim()),
      friendsSundayNames: friendsVs.filter(v => v.sundayAttended).map(v => String(v.name).trim()),
    };
  });

  const uniq = arr => new Set(arr.map(n => n.toLowerCase())).size;
  const allFriendsReach  = rows.flatMap(r => r.friendsReachNames);
  const allFriendsSunday = rows.flatMap(r => r.friendsSundayNames);
  const uniqReach  = uniq(allFriendsReach);
  const uniqSunday = uniq(allFriendsSunday);

  const totals = rows.reduce((a, r) => ({
    plan: a.plan + r.plan, reach: a.reach + r.reach, sunday: a.sunday + r.sunday,
    friends: a.friends + r.friends, sundayFriends: a.sundayFriends + r.sundayFriends,
    conv: a.conv + r.conv,
  }), { plan: 0, reach: 0, sunday: 0, friends: 0, sundayFriends: 0, conv: 0 });

  const miniDonut = _trendMiniDonut;
  const uniqRetention = uniqReach > 0 ? Math.round(uniqSunday / uniqReach * 100) + "%" : "–";

  dashboardMetricsBody.innerHTML = `
    <div class="trend-table-wrap">
      <table class="trend-table">
        <thead><tr>
          <th class="trend-th-week">Sem.</th>
          <th class="trend-th-ev trend-th-section">Hermanos</th>
          <th class="trend-th-ev"></th>
          <th class="trend-th-ev"></th>
          <th class="trend-th-ev trend-th-section trend-th-friends">Amigos</th>
          <th class="trend-th-ev trend-th-friends"></th>
          <th class="trend-th-ev trend-th-friends"></th>
        </tr>
        <tr class="trend-subhead">
          <th></th>
          <th>Plan.</th>
          <th>Alcance</th>
          <th>${t('met.cultoBrosShort')}</th>
          <th title="Amigos que asistieron al alcance">Asistieron</th>
          <th title="Amigos que pasaron del alcance al culto">Retención culto</th>
          <th title="Decisiones de fe registradas">Conv.</th>
        </tr></thead>
        <tbody>${rows.map(r => {
          const sundaySet = new Set(r.friendsSundayNames.map(n => n.toLowerCase()));
          const missedNames = r.friendsReachNames.filter(n => !sundaySet.has(n.toLowerCase()));
          const reachPop  = r.friendsReachNames.length
            ? `<span class="trend-pop"><span class="trend-pop-title">Amigos al alcance (${r.friendsReachNames.length})</span>${r.friendsReachNames.map(n => `<span class="trend-pop-name${sundaySet.has(n.toLowerCase()) ? ' is-sunday' : ''}">${n}</span>`).join("")}</span>`
            : '';
          const retPct = r.friends > 0 ? Math.round(r.sundayFriends / r.friends * 100) : 0;
          const sundayPop = r.friendsReachNames.length
            ? `<span class="trend-pop trend-pop-wide"><span class="trend-pop-title">Retención al culto · ${r.sundayFriends}/${r.friends} (${retPct}%)</span>
                 ${r.friendsSundayNames.length ? `<span class="trend-pop-section trend-pop-section-ok">Llegaron (${r.friendsSundayNames.length})</span>${r.friendsSundayNames.map(n => `<span class="trend-pop-name is-sunday">${n}</span>`).join("")}` : ''}
                 ${missedNames.length ? `<span class="trend-pop-section trend-pop-section-miss">No llegaron (${missedNames.length})</span>${missedNames.map(n => `<span class="trend-pop-name is-missed">${n}</span>`).join("")}` : ''}
               </span>`
            : '';
          return `
          <tr class="trend-row">
            <td class="trend-week-cell"><strong>${r.week}</strong><span class="trend-date">${r.date}</span></td>
            <td>${miniDonut(r.plan,    r.total, "plan")}</td>
            <td>${miniDonut(r.reach,   r.total, "reach")}</td>
            <td>${miniDonut(r.sunday,  r.total, "sunday")}</td>
            <td class="trend-td-hover">${miniDonut(r.friends, 0, "friends")}${reachPop}</td>
            <td class="trend-td-hover">${miniDonut(r.sundayFriends, r.friends, "friends")}${sundayPop}</td>
            <td>${miniDonut(r.conv, 0, "friends")}</td>
          </tr>`;
        }).join("")}</tbody>
        <tfoot>
          <tr class="trend-avg-row">
            <td class="trend-avg-label">Total visitas</td>
            <td class="trend-avg-val">${totals.plan}</td>
            <td class="trend-avg-val">${totals.reach}</td>
            <td class="trend-avg-val">${totals.sunday}</td>
            <td class="trend-avg-val">${totals.friends}</td>
            <td class="trend-avg-val">${totals.friends > 0 ? Math.round(totals.sundayFriends / totals.friends * 100) + "%" : "–"}</td>
            <td class="trend-avg-val">${totals.conv}</td>
          </tr>
          <tr class="trend-avg-row trend-uniq-row">
            <td class="trend-avg-label">Personas únicas</td>
            <td class="trend-avg-val" colspan="3" style="text-align:right; color:var(--muted); font-weight:600;">amigos →</td>
            <td class="trend-avg-val" title="Amigos distintos que asistieron al alcance en el período">${uniqReach}</td>
            <td class="trend-avg-val" title="Retención del culto contando solo personas únicas">${uniqRetention}</td>
            <td class="trend-avg-val">${uniqSunday}<small style="display:block; font-size:0.6rem; color:var(--muted); font-weight:500;">al culto</small></td>
          </tr>
        </tfoot>
      </table>
    </div>`;
}

// ── Metrics: quarterly comparison (year scope) ────────────────────────────────
function renderMetricsYearSummary(reports) {
  if (!dashboardMetricsBody) return;
  if (!reports.length) {
    dashboardMetricsBody.innerHTML = `<div class="quick-list-empty">${t('empty.noData')}</div>`;
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
          <div class="year-q-row"><span>${t('met.cultoBrosShort')}</span><strong>${avg(agg.sundayMembers)}</strong><small>/sem</small></div>
          <div class="year-q-row"><span>${t('met.cultoFriendsShort')}</span><strong>${avg(agg.sundayVisitors)}</strong><small>/sem</small></div>
          <div class="year-q-row year-q-conv"><span>${t('met.conversions')}</span><strong>${agg.reachConversions}</strong><small>total</small></div>
        </div>
      </div>`;
  });

  dashboardMetricsBody.innerHTML = `<div class="year-q-grid">${blocks.join("")}</div>`;
}

function renderMetricsBlock(label, metrics) {
  const m = metrics;
  const planAbsList   = Array.isArray(m.planningAbsentList) ? m.planningAbsentList : [];
  const reachAbsList  = Array.isArray(m.reachAbsentList)    ? m.reachAbsentList    : [];
  const sundayAbsList = Array.isArray(m.sundayAbsentList)   ? m.sundayAbsentList   : [];
  const planAbsCount   = Math.max(0, Number(m.rosterSlots || 0) - Number(m.planningPresent || 0));
  const reachAbsCount  = Math.max(0, Number(m.rosterSlots || 0) - Number(m.reachMembers   || 0));
  const sundayAbsCount = Math.max(0, Number(m.rosterSlots || 0) - Number(m.sundayMembers  || 0));
  const events = [
    {
      title: t('dash.planning'), cls: "planning",
      rows: [
        [t('met.brothersPresent'), m.planningPresent],
        [t('met.brothersAbsent'),  planAbsCount, "", planAbsList],
      ],
    },
    {
      title: t('dash.reach'), cls: "reach",
      rows: [
        [t('met.brothersPresent'), m.reachMembers],
        [t('met.brothersAbsent'),  reachAbsCount, "", reachAbsList],
        [t('met.privileged'),    m.reachPrivileged],
        [t('met.friendsPresent'),   m.reachVisitors, `${m.reachFriends || 0} amigos · ${m.reachRestor || 0} restauración`],
        [t('rcm.kidsPresent'),    m.reachKids],
        [t('met.conversions'),       m.reachConversions],
      ],
    },
    {
      title: t('met.sectSunday'), cls: "sunday",
      rows: [
        [t('rcm.totalAttendees'), m.sundayTotal],
        [t('met.brothers'),         m.sundayMembers],
        [t('met.brothersAbsent'),   sundayAbsCount, "", sundayAbsList],
        [t('dash.friends'),           m.sundayVisitors, `${m.sundayFriends || 0} amigos · ${m.sundayRestor || 0} restauración`],
        [t('met.kids'),            m.sundayKids],
      ],
    },
  ];
  const absRow = "";
  const renderNamesDetails = (list) => {
    if (!Array.isArray(list) || !list.length) return "";
    const items = list.map(x => `<li>${escapeHtml(x.name)}${x.count > 1 ? ` <small>×${x.count}</small>` : ""}</li>`).join("");
    return `<details class="metrics-names"><summary>Ver nombres</summary><ul class="metrics-names-list">${items}</ul></details>`;
  };
  return `
    <div class="metrics-sector-block">
      ${label ? `<p class="metrics-sector-label">${escapeHtml(label)}</p>` : ""}
      <div class="metrics-events-grid">
        ${events.map(ev => `
          <div class="metrics-event-block">
            <div class="metrics-event-title metrics-event--${ev.cls}">${escapeHtml(ev.title)}</div>
            <div class="metrics-event-rows">
              ${ev.rows.map(([name, val, sub, namesList]) => `
                <div class="metrics-event-row${val === 0 ? " is-zero" : ""}">
                  <span>${escapeHtml(name)}${sub ? `<small class="metrics-event-sub"> · ${escapeHtml(sub)}</small>` : ""}</span><strong>${val}</strong>
                </div>${val > 0 ? renderNamesDetails(namesList) : ""}`).join("")}
            </div>
          </div>`).join("")}
        ${absRow}
      </div>
    </div>`;
}

function renderDashboardMetrics(weeklyReports, scopeLabel) {
  if (!dashboardMetricsBody) return;

  const isAdmin = !currentUser || currentUser.isAdmin;
  const canCompareBroadScopes = isAdmin && getEffectiveDashboardScope() === "all";
  if (!canCompareBroadScopes) activeMetricsScope = "total";
  if (dashboardMetricsToggle) dashboardMetricsToggle.hidden = !canCompareBroadScopes || activeDashboardTimeScope !== "week";
  if (dashboardMetricsEyebrow) {
    dashboardMetricsEyebrow.textContent = scopeLabel
      ? t('met.scopeTitle', { scope: scopeLabel })
      : t('dash.metricsConsolidated');
  }

  if (!weeklyReports.length) {
    dashboardMetricsBody.innerHTML = `<div class="quick-list-empty">${t('dash.noReportCaptured')}</div>`;
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
  if (canCompareBroadScopes && activeMetricsScope === "sector") {
    const cellSectorMap = new Map(
      (catalogs.cells || []).map(c => [String(c.cellNumber), c.sector || t('dash.noSector')])
    );
    const bySector = new Map();
    weeklyReports.forEach(report => {
      const cellNum = String(report.cellNumber || report.formData?.cellNumber || "");
      const sector = cellSectorMap.get(cellNum) || t('dash.noSector');
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

// ── Composición del cuatrimestre (Chart.js — doughnut) ─────────────────────
// Reusa getScopedReports() para asegurar que cada rol solo vea lo que le toca.
// Liders → su célula. Supervisores → su sector. Coordinadores → todos los sectores.
const _donutChartInstances = {};   // {donutId: ChartInstance}
let _trendActiveScope = "auto";    // 'auto' | 'all' | 'sector:X' | 'cell:N'

const DONUT_PALETTES = {
  planning: ["#16a34a", "#dc2626"],                                     // presentes / ausentes
  reach:    ["#1d4ed8", "#f97316", "#9333ea", "#0891b2"],               // miembros / amigos / restauración / niños
  sunday:   ["#1d4ed8", "#f97316", "#0891b2"],                          // miembros / visitas / niños
  sectors:  ["#1d4ed8", "#16a34a", "#f97316", "#9333ea", "#0891b2", "#dc2626", "#a16207", "#475569"],
};

function _donutBuildPlanning(agg) {
  // Slices = totales (las proporciones son las mismas con totales o promedios).
  // El centro muestra la tasa de asistencia (%), no la suma — la suma de 13 semanas no es interpretable.
  return {
    labels: [t('dash.slicePresent'), t('dash.sliceAbsent')],
    values: [Number(agg.planningPresent || 0), Number(agg.planningAbsent || 0)],
    colors: DONUT_PALETTES.planning,
  };
}

function _donutBuildReach(agg) {
  return {
    labels: [t('dash.sliceMembers'), t('dash.sliceFriends'), t('dash.sliceRestor'), t('dash.sliceKids')],
    values: [
      Number(agg.reachMembers || 0),
      Number(agg.reachFriends || 0),
      Number(agg.reachRestor || 0),
      Number(agg.reachKids || 0),
    ],
    colors: DONUT_PALETTES.reach,
  };
}

function _donutBuildSunday(agg) {
  return {
    labels: [t('dash.sliceMembers'), t('dash.sliceVisits'), t('dash.sliceKids')],
    values: [
      Number(agg.sundayMembers || 0),
      Number(agg.sundayVisitors || 0),
      Number(agg.sundayKids || 0),
    ],
    colors: DONUT_PALETTES.sunday,
  };
}

function _donutBuildSectors(reportsByScope) {
  // reportsByScope: Map(sector → reports[])
  const labels = [];
  const values = [];
  const sortedSectors = [...reportsByScope.keys()].sort((a, b) => a.localeCompare(b, "es"));
  sortedSectors.forEach(sector => {
    const reps = reportsByScope.get(sector) || [];
    const agg = aggregateMetrics(reps);
    // Asistencia total = alcance + culto (miembros + visitas + niños de ambos)
    const total =
      Number(agg.reachMembers || 0) + Number(agg.reachFriends || 0) + Number(agg.reachRestor || 0) + Number(agg.reachKids || 0) +
      Number(agg.sundayMembers || 0) + Number(agg.sundayVisitors || 0) + Number(agg.sundayKids || 0);
    labels.push(`Sector ${sector}`);
    values.push(total);
  });
  return {
    labels,
    values,
    colors: DONUT_PALETTES.sectors,
  };
}

function _renderDonut(canvasId, titleText, dataset, totalLabel, centerOverride) {
  const canvas = document.getElementById(canvasId);
  if (!canvas || typeof Chart === "undefined") return;
  if (_donutChartInstances[canvasId]) {
    _donutChartInstances[canvasId].destroy();
    delete _donutChartInstances[canvasId];
  }
  const total = dataset.values.reduce((a, b) => a + Number(b || 0), 0);
  // Si todo es cero, dejar el canvas vacío
  if (total === 0) {
    const ctx2 = canvas.getContext("2d");
    ctx2.clearRect(0, 0, canvas.width, canvas.height);
    return;
  }
  const ctx = canvas.getContext("2d");
  _donutChartInstances[canvasId] = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: dataset.labels,
      datasets: [{
        data: dataset.values,
        backgroundColor: dataset.colors,
        borderColor: "#fff",
        borderWidth: 2,
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: "62%",
      plugins: {
        legend: {
          position: "bottom",
          labels: { boxWidth: 12, padding: 8, font: { size: 11 } },
        },
        tooltip: {
          callbacks: {
            label: (ctx) => {
              const v = Number(ctx.parsed || 0);
              const pct = total ? Math.round((v / total) * 100) : 0;
              return `${ctx.label}: ${v} (${pct}%)`;
            },
          },
        },
      },
    },
  });
  // Pintar el total en el centro de la dona
  const centerEl = document.getElementById(canvasId + "-center");
  if (centerEl) {
    if (centerOverride && centerOverride.value != null) {
      centerEl.innerHTML = `<strong>${escapeHtml(String(centerOverride.value))}</strong><span>${escapeHtml(String(centerOverride.label || totalLabel || ""))}</span>`;
    } else {
      centerEl.innerHTML = `<strong>${total}</strong><span>${totalLabel}</span>`;
    }
  }
}

function renderDashboardTrends(scopedReports, { selectedYear, selectedQuarter } = {}) {
  const container = document.getElementById("dashboard-trends-donuts");
  const emptyMsg  = document.getElementById("dashboard-trends-empty");
  const scopeWrap = document.getElementById("dashboard-trends-scope");
  if (!container || typeof Chart === "undefined") return;

  // Las pestañas globales del Dashboard ya filtran el ámbito; ocultamos el selector
  // duplicado de este panel.
  if (scopeWrap) { scopeWrap.hidden = true; scopeWrap.innerHTML = ""; }

  // Defensa en profundidad: re-aplicamos el filtro por rol y por sub-pestaña.
  // El llamador ya pasa los reportes filtrados por la pestaña de tiempo activa
  // (semana/cuatrimestre/año), así que NO volvemos a filtrar por cuatrimestre aquí.
  const safeReports = applyDashboardScopeFilter(getScopedReports(scopedReports || []));

  if (!safeReports.length) {
    if (emptyMsg) emptyMsg.hidden = false;
    container.innerHTML = "";
    Object.keys(_donutChartInstances).forEach(id => { _donutChartInstances[id].destroy(); delete _donutChartInstances[id]; });
    return;
  }
  if (emptyMsg) emptyMsg.hidden = true;

  // ── Construir UNA dona resumen ─────────────────────────────────────────
  // Composición consolidada (alcance + culto) en una sola dona, para no saturar
  // de gráficas redundantes (la tarjeta de Métricas ya muestra el desglose detallado).
  container.innerHTML = `
    <div class="donut-card donut-card-summary">
      <h3 class="donut-card-title">${escapeHtml(t('dash.donutSummary'))}</h3>
      <div class="donut-canvas-wrap">
        <canvas id="donut-summary" aria-label="${escapeHtml(t('dash.donutSummary'))}"></canvas>
        <div class="donut-center" id="donut-summary-center"></div>
      </div>
    </div>
  `;

  const agg = aggregateMetrics(safeReports);
  _renderDonut(
    "donut-summary",
    t('dash.donutSummary'),
    {
      labels: [t('dash.sliceMembers'), t('dash.sliceFriends'), t('dash.sliceRestor'), t('dash.sliceKids')],
      values: [
        Number(agg.reachMembers || 0) + Number(agg.sundayMembers || 0),
        Number(agg.reachFriends || 0) + Number(agg.sundayFriends || 0),
        Number(agg.reachRestor  || 0) + Number(agg.sundayRestor  || 0),
        Number(agg.reachKids    || 0) + Number(agg.sundayKids    || 0),
      ],
      colors: ["#1d4ed8", "#f97316", "#9333ea", "#0891b2"],
    },
    t('dash.donutTotal')
  );
}

function renderDashboardBaptisms(scopedReports) {
  const body  = document.getElementById("dashboard-baptisms-body");
  const chip  = document.getElementById("dashboard-baptisms-total-chip");
  if (!body) return;

  // Build: year → quarter → cell → count
  // Reads both the baptisms[] array (individual records) and the numeric summary fields
  // The numeric fields (baptismFirstQuarter, etc.) are auto-derived from baptisms[],
  // so they represent the SAME baptisms — we must take the MAX of the two sources
  // per (year, quarter, cell), not the sum, to avoid double-counting.
  const byYearQ = {};
  const setMax = (year, q, cell, val) => {
    if (!val) return;
    if (!byYearQ[year])          byYearQ[year] = {};
    if (!byYearQ[year][q])       byYearQ[year][q] = {};
    if (!byYearQ[year][q][cell]) byYearQ[year][q][cell] = 0;
    byYearQ[year][q][cell] = Math.max(byYearQ[year][q][cell], val);
  };

  scopedReports.forEach(report => {
    const fd   = report?.formData || {};
    const date = String(fd.reportDate || report.reportDate || "");
    const year = date.slice(0, 4) || "?";
    const cell = String(report.cellNumber || fd.cellNumber || "?");

    // 1. Individual records from baptisms[] array (only in closing weeks).
    // Cada bautismo se ubica por su propia `baptismDate` (no por la fecha del
    // reporte que lo contiene), para que coincida con cómo los campos numéricos
    // de cierre se derivan por cuatrimestre. Esto evita doble conteo si el
    // array quedó adjunto a un reporte de un cuatrimestre distinto al del
    // bautismo (p.ej. captura tardía).
    const bapArray = Array.isArray(fd.baptisms) ? fd.baptisms.filter(b => b.name) : [];
    if (bapArray.length) {
      const buckets = {};
      bapArray.forEach((b) => {
        const bDate = String(b.baptismDate || "").trim() || date;
        const bYear = bDate.slice(0, 4) || year;
        const bMonth = Number(bDate.slice(5, 7));
        const bQ = bMonth <= 4 ? "1" : bMonth <= 8 ? "2" : "3";
        const key = `${bYear}|${bQ}`;
        buckets[key] = (buckets[key] || 0) + 1;
      });
      Object.entries(buckets).forEach(([key, count]) => {
        const [bYear, bQ] = key.split("|");
        setMax(bYear, bQ, cell, count);
      });
    }

    // 2. Numeric summary fields (from Cierre metrics section, auto-derived per quarter)
    setMax(year, "1", cell, Number(fd.baptismFirstQuarter  || 0));
    setMax(year, "2", cell, Number(fd.baptismSecondQuarter || 0));
    setMax(year, "3", cell, Number(fd.baptismThirdQuarter  || 0));
  });

  const qName = q => q === "1" ? t('qname.q1') : q === "2" ? t('qname.q2') : t('qname.q3');
  const years = Object.keys(byYearQ).sort((a, b) => b - a);

  if (!years.length) {
    if (chip) chip.textContent = "0 total";
    body.innerHTML = `<p class="empty-state" style="padding:12px 0">${t('dash.noBaptisms')}</p>`;
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
          <span class="baptism-year-total">${t(yearTotal === 1 ? 'baptism.yearTotal' : 'baptism.yearTotalPlural', { n: yearTotal })}</span>
        </div>
        <div class="baptism-quarters-grid">
          ${quarters.map(q => {
            const cells  = byYearQ[year][q];
            const qTotal = Object.values(cells).reduce((s, n) => s + n, 0);
            const rows   = Object.entries(cells)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([cell, count]) => `
                <div class="baptism-cell-row">
                  <span class="baptism-cell-num">${t('baptism.cellRow', { n: escapeHtml(cell) })}</span>
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
  dashboardPeriodByScope[activeDashboardTimeScope] = activeDashboardPeriod;
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

function normalizeCellMemberAttendanceMode(value) {
  return value === "justified_default" ? "justified_default" : "normal";
}

function normalizeCellMemberAttendanceDefaults(value, mode = "normal") {
  const normalizedMode = normalizeCellMemberAttendanceMode(mode);
  if (normalizedMode !== "justified_default") {
    return {};
  }
  const raw = value && typeof value === "object" ? value : {};
  const defaults = {
    planning: Boolean(raw.planning),
    reach: Boolean(raw.reach),
    sunday: Boolean(raw.sunday),
  };
  if (!defaults.planning && !defaults.reach && !defaults.sunday) {
    return { planning: true, reach: true, sunday: true };
  }
  return defaults;
}

function getAttendanceDefaultsSummary(defaults, mode = "normal") {
  const normalized = normalizeCellMemberAttendanceDefaults(defaults, mode);
  const labels = [];
  if (normalized.planning) labels.push("Planeación");
  if (normalized.reach) labels.push("Alcance");
  if (normalized.sunday) labels.push("Culto");
  return labels.join(" · ");
}

function readMemberAttendanceDefaultsFromForm() {
  return normalizeCellMemberAttendanceDefaults({
    planning: memberDefaultPlanning?.checked,
    reach: memberDefaultReach?.checked,
    sunday: memberDefaultSunday?.checked,
  }, memberAttendanceModeSelect?.value);
}

function syncMemberAttendanceDefaultsForm() {
  const mode = normalizeCellMemberAttendanceMode(memberAttendanceModeSelect?.value);
  if (memberAttendanceDefaultsFields) {
    memberAttendanceDefaultsFields.hidden = mode !== "justified_default";
  }
}

function getCellMemberAttendanceModeLabel(value) {
  const mode = normalizeCellMemberAttendanceMode(value);
  return mode === "justified_default" ? "Justificada por defecto" : "Asistencia normal";
}

function renderCellMemberAttendanceModeOptions(selectedValue) {
  const selected = normalizeCellMemberAttendanceMode(selectedValue);
  return [
    ["normal", "Asistencia normal"],
    ["justified_default", "Justificada por defecto"],
  ].map(([value, label]) => `<option value="${value}"${value === selected ? " selected" : ""}>${label}</option>`).join("");
}

function isInProgressReportData(savedData) {
  if (!savedData || typeof savedData !== "object") return false;
  if (savedData._draft === true || savedData._draft === "true") return true;
  return Boolean(savedData.lastStage && savedData.lastStage !== "cierre");
}

function savedMemberEntryHasActivity(entry) {
  if (!entry || typeof entry !== "object") return false;
  return Boolean(
    entry.planningAttended
    || entry.reachAttended
    || entry.sundayAttended
    || entry.reachPrivileged
    || (entry.planningStatus && entry.planningStatus !== "pending")
    || (entry.reachStatus && entry.reachStatus !== "pending")
    || (entry.sundayStatus && entry.sundayStatus !== "pending")
    || String(entry.note || "").trim()
  );
}

function getReportMemberRoster(cell, savedEntries = [], savedData = null) {
  const currentMembers = getCellMembers(cell);
  const normalizedSavedEntries = Array.isArray(savedEntries)
    ? savedEntries.filter((entry) => String(entry?.personId || entry?.name || "").trim())
    : [];

  if (!normalizedSavedEntries.length) {
    return currentMembers;
  }

  const mapEntryToRosterMember = (entry) => {
    const catalogMember = currentMembers.find((member) => (
      String(member.id || "") === String(entry.personId || "")
      || String(member.name || "") === String(entry.name || "")
    ));
    return {
      id: entry.personId ?? catalogMember?.id ?? null,
      name: entry.name || catalogMember?.name || "",
      role: entry.role || catalogMember?.role || "member",
      attendanceMode: normalizeCellMemberAttendanceMode(entry.attendanceMode || catalogMember?.attendanceMode),
      attendanceDefaults: normalizeCellMemberAttendanceDefaults(entry.attendanceDefaults || catalogMember?.attendanceDefaults, entry.attendanceMode || catalogMember?.attendanceMode),
      rcmProgress: entry.rcmProgress || catalogMember?.rcmProgress || {},
    };
  };

  if (!isInProgressReportData(savedData)) {
    return normalizedSavedEntries.map(mapEntryToRosterMember);
  }

  const mergedRoster = currentMembers.map((member) => {
    const savedEntry = normalizedSavedEntries.find((entry) => (
      String(member.id || "") === String(entry.personId || "")
      || String(member.name || "") === String(entry.name || "")
    ));
    if (!savedEntry) return member;
    return {
      ...member,
      attendanceMode: normalizeCellMemberAttendanceMode(savedEntry.attendanceMode || member.attendanceMode),
      attendanceDefaults: normalizeCellMemberAttendanceDefaults(savedEntry.attendanceDefaults || member.attendanceDefaults, savedEntry.attendanceMode || member.attendanceMode),
      rcmProgress: savedEntry.rcmProgress || member.rcmProgress || {},
    };
  });

  const currentKeys = new Set(mergedRoster.map((member) => String(member.id || member.name || "")));
  const preservedSavedMembers = normalizedSavedEntries
    .filter((entry) => !currentKeys.has(String(entry.personId || entry.name || "")) && savedMemberEntryHasActivity(entry))
    .map(mapEntryToRosterMember);

  return [...mergedRoster, ...preservedSavedMembers];
}

function buildDefaultMemberAttendance(cell, savedEntries = [], savedData = null) {
  const savedByPersonId = new Map(
    (Array.isArray(savedEntries) ? savedEntries : []).map((entry) => [String(entry.personId || entry.name || ""), entry])
  );

  return getReportMemberRoster(cell, savedEntries, savedData).map((member) => {
    const savedEntry = savedByPersonId.get(String(member.id)) || savedByPersonId.get(String(member.name));
    // Cada sub-estado parte como "pending" por defecto. Solo se hereda
    // un valor explícitamente guardado para esa etapa.
    // Compatibilidad: algunos reportes legacy sólo guardaron el booleano
    // `...Attended`; en esos casos hidratamos "present" para que la UI no
    // se vea como "Sin marcar" aunque el resumen sí lo cuente.
    // Limpieza: si el sub-estado guardado es "present" pero el checkbox
    // de asistencia de esa etapa está en false, es contaminación del
    // bug anterior (migración legacy `status`→3 etapas). Se devuelve
    // "pending" para no mostrar "Presente" falso. Los estados manuales
    // (absent / justified / service) se respetan siempre.
    const sanitize = (status, attended) => {
      const normalizedStatus = String(status || "").toLowerCase();
      if (!normalizedStatus) return attended ? "present" : "pending";
      if (normalizedStatus === "present" && !attended) return "pending";
      return normalizedStatus;
    };
    const planningStatus = sanitize(savedEntry?.planningStatus, savedEntry?.planningAttended);
    const reachStatus    = sanitize(savedEntry?.reachStatus,    savedEntry?.reachAttended);
    const sundayStatus   = sanitize(savedEntry?.sundayStatus,   savedEntry?.sundayAttended);
    const attendanceMode = normalizeCellMemberAttendanceMode(savedEntry?.attendanceMode || member.attendanceMode);
    const attendanceDefaults = normalizeCellMemberAttendanceDefaults(savedEntry?.attendanceDefaults || member.attendanceDefaults, attendanceMode);
    const useJustifiedDefaults = !savedEntry && attendanceMode === "justified_default";
    const entry = {
      personId: member.id,
      name: member.name,
      role: member.role,
      attendanceMode,
      attendanceDefaults,
      rcmProgress: member.rcmProgress || {},
      planningStatus: useJustifiedDefaults && attendanceDefaults.planning ? "justified" : planningStatus,
      reachStatus: useJustifiedDefaults && attendanceDefaults.reach ? "justified" : reachStatus,
      sundayStatus: useJustifiedDefaults && attendanceDefaults.sunday ? "justified" : sundayStatus,
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

function normalizeVisitorKind(value) {
  return String(value || "").toLowerCase() === "visita" ? "visita" : "amigo";
}

function normalizeVisitorProcessEntry(value, kind = "amigo", fallback = {}) {
  const normalizedKind = normalizeVisitorKind(kind);
  if (normalizedKind !== "amigo") return "none";
  const raw = String(value || "").trim().toLowerCase();
  if (raw === "none" || raw === "noted" || raw === "late") {
    return raw;
  }
  if (fallback?.lateRegistration) return "late";
  return "none";
}

function getProcessLateGraceWeeks() {
  const raw = parseInt(String(appSettings?.process_entry_late_weeks ?? "14"), 10);
  return Number.isFinite(raw) ? Math.max(0, raw) : 14;
}

function getCurrentProcessOptionAvailability() {
  const weekNumber = parseInt(String(weekField?.value || "0"), 10);
  const lateGraceWeeks = getProcessLateGraceWeeks();
  return {
    allowNoted: weekNumber === 2,
    allowLate: Number.isFinite(weekNumber) && weekNumber >= 3 && weekNumber <= (2 + lateGraceWeeks),
  };
}

function getVisitorProcessStatusLabel(value) {
  const normalized = normalizeVisitorProcessEntry(value);
  if (normalized === "late") return "Proceso tardío";
  if (normalized === "noted") return "En proceso";
  return "Sin proceso";
}

function renderVisitorProcessOptions(selectedValue, availability = getCurrentProcessOptionAvailability()) {
  const selected = normalizeVisitorProcessEntry(selectedValue);
  return [
    ["none", "Sin proceso"],
    ["noted", "Al proceso"],
    ["late", "Tardío"],
  ]
    .filter(([value]) => {
      if (value === "noted") return availability.allowNoted || selected === "noted";
      if (value === "late") return availability.allowLate || selected === "late";
      return true;
    })
    .map(([value, label]) => `<option value="${value}"${selected === value ? " selected" : ""}>${label}</option>`)
    .join("");
}

function normalizeVisitors(savedVisitors = []) {
  if (!Array.isArray(savedVisitors)) {
    return [];
  }
  return savedVisitors.map((visitor) => {
    const kind = normalizeVisitorKind(visitor?.kind);
    const processEntry = normalizeVisitorProcessEntry(visitor?.processEntry, kind, {
      lateRegistration: Boolean(visitor?.lateRegistration),
    });
    return {
      name: visitor?.name || "",
      kind,
      invitedBy: visitor?.invitedBy || "",
      reachAttended: Boolean(visitor?.reachAttended),
      lateRegistration: kind === "amigo" ? processEntry === "late" : false,
      sundayAttended: Boolean(visitor?.sundayAttended),
      firstVisit: Boolean(visitor?.firstVisit),
      processEntry,
      // "converted" solo aplica a amigos (no bautizados); para visitas siempre false.
      converted: kind === "visita" ? false : Boolean(visitor?.converted),
      // "promoteToMember" solo aplica a visitas (ya bautizadas).
      promoteToMember: kind === "visita" ? Boolean(visitor?.promoteToMember) : false,
      contacted: Boolean(visitor?.contacted),
      eventAttended: Boolean(visitor?.eventAttended),
      phone: visitor?.phone || "",
      note: visitor?.note || "",
    };
  });
}

function normalizeReachSupervisorVisits(value) {
  let source = value;
  if (typeof source === "string") {
    try {
      source = JSON.parse(source);
    } catch {
      source = [];
    }
  }
  if (!Array.isArray(source)) {
    return [];
  }
  const seen = new Set();
  return source.map((entry) => {
    const rawPersonId = entry && typeof entry === "object" ? entry.personId ?? entry.id : entry;
    const personId = rawPersonId == null || rawPersonId === "" ? null : String(rawPersonId).trim();
    const catalogPerson = personId
      ? catalogs.people.find((person) => String(person.id || "") === personId)
      : null;
    const name = String((entry && typeof entry === "object" ? entry.name : "") || catalogPerson?.name || "").trim();
    const supervisorSector = String((entry && typeof entry === "object" ? entry.supervisorSector : "") || catalogPerson?.supervisorSector || "").trim();
    return { personId, name, supervisorSector };
  }).filter((entry) => {
    const key = entry.personId || entry.name.toLowerCase();
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function getReachSupervisorCandidates(cell) {
  const cellSector = String(cell?.sector || "").trim();
  return catalogs.people
    .filter((person) => {
      const supervisorSector = String(person.supervisorSector || "").trim();
      if (!supervisorSector) {
        return false;
      }
      return !cellSector || supervisorSector === cellSector;
    })
    .sort((left, right) => String(left.name || "").localeCompare(String(right.name || ""), "es"));
}

function syncReachSupervisorVisitFields() {
  if (reachSupervisionSectorCountField instanceof HTMLInputElement) {
    reachSupervisionSectorCountField.value = String(currentReachSupervisorVisits.length);
  }
  if (reachSupervisorVisitsJsonField instanceof HTMLInputElement) {
    reachSupervisorVisitsJsonField.value = JSON.stringify(currentReachSupervisorVisits);
  }
  if (reachSupervisorVisitSummary) {
    if (!currentReachSupervisorVisits.length) {
      reachSupervisorVisitSummary.textContent = "Sin supervisión capturada.";
    } else {
      const names = currentReachSupervisorVisits.map((entry) => entry.name).filter(Boolean);
      const countLabel = `${currentReachSupervisorVisits.length} supervisor${currentReachSupervisorVisits.length === 1 ? "" : "es"} presente${currentReachSupervisorVisits.length === 1 ? "" : "s"}`;
      reachSupervisorVisitSummary.textContent = names.length ? `${countLabel}: ${names.join(", ")}` : countLabel;
    }
  }
}

function renderReachSupervisorVisits(cell) {
  if (!reachSupervisorVisitList) {
    return;
  }
  const candidates = getReachSupervisorCandidates(cell);
  const extras = currentReachSupervisorVisits.filter((entry) => !candidates.some((person) => String(person.id || "") === String(entry.personId || "")));
  const rows = [...candidates, ...extras.map((entry) => ({
    id: entry.personId,
    name: entry.name,
    supervisorSector: entry.supervisorSector,
  }))];
  if (!cell) {
    currentReachSupervisorVisits = [];
    reachSupervisorVisitList.innerHTML = '<p class="member-admin-caption">Selecciona una célula para capturar supervisión.</p>';
    syncReachSupervisorVisitFields();
    return;
  }
  if (!rows.length) {
    currentReachSupervisorVisits = [];
    reachSupervisorVisitList.innerHTML = '<p class="member-admin-caption">No hay supervisores asignados para el sector de esta célula.</p>';
    syncReachSupervisorVisitFields();
    return;
  }
  const selectedKeys = new Set(currentReachSupervisorVisits.map((entry) => String(entry.personId || entry.name || "")));
  reachSupervisorVisitList.innerHTML = rows.map((person) => {
    const personId = String(person.id || person.personId || "").trim();
    const key = personId || String(person.name || "").trim();
    const sector = String(person.supervisorSector || "").trim();
    const checked = selectedKeys.has(key);
    return `
      <label class="reach-supervision-option">
        <input type="checkbox" data-supervision-person-id="${escapeHtml(personId)}" data-supervision-name="${escapeHtml(String(person.name || ""))}" data-supervision-sector="${escapeHtml(sector)}"${checked ? " checked" : ""}>
        <span class="reach-supervision-option-name">${escapeHtml(String(person.name || ""))}</span>
        ${sector ? `<span class="reach-supervision-option-meta">Sector ${escapeHtml(sector)}</span>` : ""}
      </label>
    `;
  }).join("");
  syncReachSupervisorVisitFields();
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
    reachSupervisorVisits: 0,
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

  counts.reachSupervisorVisits = currentReachSupervisorVisits.length;
  counts.reachMembersPresent += counts.reachSupervisorVisits;

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
    supervisionSector:         summary.reachSupervisorVisits,
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
  const activeStageField = STAGE_STATUS_FIELDS[currentStage] || null;
  const markedMembers = activeStageField
    ? currentMemberAttendance.filter((entry) => {
        const stageStatus = String(entry?.[activeStageField] || "pending").toLowerCase();
        return stageStatus !== "pending";
      }).length
    : (summary.totalMembers - summary.pending);
  attendanceProgressChip.textContent = `${markedMembers}/${summary.totalMembers} marcados`;
  attendanceSummaryCards.innerHTML = [
    [t('dash.planning'), summary.planningMembersPresent, "planificacion"],
    [t('dash.reach'),    summary.reachTotal,              "alcance"],
    [t('dash.sunday'),      summary.sundayTotal,             "culto"],
    [t('dash.friends'),     summary.visitors,               "alcance"],
    ["Niños",      currentKids.filter((kid) => String(kid.name || "").trim()).length, "alcance"],
  ].map(([label, value, stage]) => `
    <article class="summary-card summary-card-mini" data-summary-stage="${stage}">
      <span class="summary-label">${escapeHtml(label)}</span>
      <strong class="summary-value">${escapeHtml(String(value))}</strong>
    </article>
  `).join("");

  // "Faltaron esta semana" — vista por etapas + resumen consolidado.
  // Mostramos SÓLO el bloque correspondiente a la etapa activa
  // (Planeación / Alcance / Culto) y debajo el resumen consolidado de
  // toda la semana. Antes mostrábamos los 3 bloques siempre, lo cual
  // era ruido; en cada etapa al líder le interesa la fase en la que
  // está parado más el resumen general.
  const STAGE_PILL_LABELS = [
    { stage: "planificacion", field: "planningStatus", label: t('att.planning') || "Planeación" },
    { stage: "alcance",       field: "reachStatus",    label: t('att.reach')    || "Alcance" },
    { stage: "culto",         field: "sundayStatus",   label: t('att.service')  || "Culto" },
  ];

  // Sólo mostramos el "Resumen — faltantes de la semana" (los bloques por
  // etapa eran ruido). Cada pill agrupa a la persona con TODOS los eventos
  // a los que faltó/justificó. El color del pill refleja la severidad:
  // rojo si tiene al menos una falta, amarillo si todo es justificado.
  const perPerson = new Map();
  currentMemberAttendance.forEach((entry) => {
    STAGE_PILL_LABELS.forEach(({ field, label }) => {
      const v = entry[field];
      if (v !== "absent" && v !== "justified") return;
      const key = entry.name;
      if (!perPerson.has(key)) perPerson.set(key, []);
      perPerson.get(key).push({ label, status: v });
    });
  });
  let summaryBlock = "";
  if (perPerson.size > 0) {
    const items = [...perPerson.entries()].map(([name, evs]) => {
      const hasAbsent = evs.some((e) => e.status === "absent");
      const cls = hasAbsent ? "pill pill-absent" : "pill pill-justified";
      const parts = evs.map(({ label, status }) => {
        const tag = status === "justified" ? t('att.justified') : t('att.absent');
        return `${escapeHtml(label)} (${tag})`;
      }).join(", ");
      return `<span class="${cls}"><strong>${escapeHtml(name)}</strong> — ${parts}</span>`;
    }).join("");
    summaryBlock = `
      <div class="absent-summary-block">
        <span class="absent-stage-title">Resumen — faltantes de la semana <small>(${perPerson.size} ${perPerson.size === 1 ? 'persona' : 'personas'})</small></span>
        <div class="pill-row">${items}</div>
      </div>`;
  }

  // Si no hay nada que mostrar, dejamos el contenedor vacío (CSS oculta el label).
  absentMemberPills.innerHTML = summaryBlock;
  // Ocultar la etiqueta "Faltaron esta semana" cuando no hay faltas.
  const summaryLabel = absentMemberPills.parentElement?.querySelector('.member-summary-label');
  if (summaryLabel) {
    summaryLabel.style.display = summaryBlock ? "" : "none";
  }

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
      ? t('att.noMembersAssigned')
      : t('att.selectCellForAttendance');
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
          <option value="justified"${stageStatus === "justified" ? " selected" : ""}>${t('opt.justified')}</option>
          <option value="service"${stageStatus === "service" ? " selected" : ""}>Sirviendo</option>
        </select>
      </td>
      <td data-label="${t('dash.planning')}" class="checkbox-cell"><input data-attendance-index="${index}" data-attendance-field="planningAttended" type="checkbox"${entry.planningAttended ? " checked" : ""}></td>
      <td data-label="${t('dash.reach')}" class="checkbox-cell"><input data-attendance-index="${index}" data-attendance-field="reachAttended" type="checkbox"${entry.reachAttended ? " checked" : ""}></td>
      <td data-label="Privilegios" class="checkbox-cell"><input data-attendance-index="${index}" data-attendance-field="reachPrivileged" type="checkbox"${entry.reachPrivileged ? " checked" : ""}${!entry.reachAttended ? " disabled" : ""}></td>
      <td data-label="${t('dash.sunday')}" class="checkbox-cell"><input data-attendance-index="${index}" data-attendance-field="sundayAttended" type="checkbox"${entry.sundayAttended ? " checked" : ""}></td>
      ${eventCell}
      <td data-label="Observación">
        <input data-attendance-index="${index}" data-attendance-field="note" type="text" value="${escapeHtml(entry.note)}" placeholder="${t('att.note')}">
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
    { key: "restauracion",   label: t('dash.restoration'),    phase: "consolidar" },
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
    peopleRcmPanel.innerHTML = `<p class='empty-state'>${t('rcm.noTracking')}</p>`;
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

  // Bind handlers directly on each button (mobile-safe; evita problemas con delegacion en <dialog>)
  peopleRcmPanel.querySelectorAll("button.rcm-milestone-toggle").forEach((btn) => {
    btn.addEventListener("click", handleRcmMilestoneClick);
  });
  peopleRcmPanel.querySelectorAll("input.rcm-date-input").forEach((inp) => {
    inp.addEventListener("change", handleRcmDateChange);
  });
}

function renderVisitorTable() {
  const eventInfo = getRcmWeekInfo(weekField.value);
  const isEventWeek = eventInfo?.isEventWeek && eventInfo?.event;
  const eventName = isEventWeek ? eventInfo.event : null;
  const totalCols = isEventWeek ? 12 : 11;

  if (!currentVisitors.length) {
    visitorTableBody.innerHTML = `<tr><td colspan="${totalCols}" class="empty-state">Todavía no hay visitas registradas para esta semana.</td></tr>`;
    renderAttendanceSummary();
    return;
  }

  const invitedByPeople = getInvitedByPeople();

  visitorTableBody.innerHTML = currentVisitors.map((visitor, index) => {
    const kind = normalizeVisitorKind(visitor.kind);
    const kindLabel = kind === "visita" ? t('vis.kindRest') : t('vis.friend');
    const kindChip = `<span class="visitor-kind-chip is-${kind}" title="${kind === "visita" ? t('vis.bapInRest') : t('vis.notBaptized')}">${kindLabel}</span>`;
    const convertedCell = kind === "visita"
      ? `<td data-label="${escapeHtml(t('preview.conversion'))}" class="checkbox-cell col-conversion"><span class="member-admin-caption" title="${escapeHtml(t('vis.alreadyBaptized'))}">N/A</span></td>`
      : `<td data-label="${escapeHtml(t('preview.conversion'))}" class="checkbox-cell col-conversion"><input data-visitor-index="${index}" data-visitor-field="converted" type="checkbox"${visitor.converted ? " checked" : ""}></td>`;
    const promoteAction = kind === "visita"
      ? `<label class="visitor-promote-toggle" title=t('vis.promoteHint')><input data-visitor-index="${index}" data-visitor-field="promoteToMember" type="checkbox"${visitor.promoteToMember ? " checked" : ""}> <span>Promover a miembro</span></label>`
      : "";
    const processEntry = normalizeVisitorProcessEntry(visitor.processEntry, kind, {
      lateRegistration: visitor.lateRegistration,
    });
    const history = findVisitorHistoryByName(visitor.name);
    const historicalProcessEntry = normalizeVisitorProcessEntry(history?.processEntry, kind, {
      lateRegistration: history?.lateRegistration,
    });
    const effectiveProcessEntry = historicalProcessEntry !== "none" ? historicalProcessEntry : processEntry;
    const availability = getCurrentProcessOptionAvailability();
    const processStatusMeta = history?.processRegisteredWeek
      ? `Registrado sem. ${history.processRegisteredWeek}${history?.processRegisteredDate ? ` · ${history.processRegisteredDate}` : ""}`
      : "";
    // Resumen para móvil (cabecera colapsable)
    const flags = [];
    if (visitor.reachAttended) flags.push({ key: "reach", label: "Alc" });
    if (visitor.sundayAttended) flags.push({ key: "sunday", label: "Cul" });
    if (visitor.firstVisit) flags.push({ key: "first", label: "1ª" });
    if (effectiveProcessEntry === "noted") flags.push({ key: "proc", label: "Proc" });
    if (effectiveProcessEntry === "late") flags.push({ key: "late", label: "Tard" });
    if (visitor.converted) flags.push({ key: "conv", label: "Conv" });
    if (visitor.contacted) flags.push({ key: "cont", label: "Cont" });
    const flagsHtml = flags.length
      ? flags.map(f => `<span class="vsum-flag" data-flag="${f.key}">${f.label}</span>`).join("")
      : `<span class="vsum-flag is-empty">sin marcas</span>`;
    const displayName = String(visitor.name || "").trim() || `Visita ${index + 1}`;
    const invitedLabel = String(visitor.invitedBy || "").trim();
    const summaryCell = `
      <td class="visitor-summary-cell" data-label="">
        <button type="button" class="visitor-summary-toggle" data-action="toggle-visitor" data-visitor-index="${index}" aria-expanded="false">
          <div class="vsum-main">
            <span class="vsum-name">${escapeHtml(displayName)}</span>
            <span class="vsum-meta">${kind === "visita" ? t('vis.visit') : t('vis.friend')}${invitedLabel ? ` · invitó ${escapeHtml(invitedLabel)}` : ""}</span>
          </div>
          <div class="vsum-flags">${flagsHtml}</div>
          <svg class="vsum-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
      </td>`;
    return `
    <tr class="is-collapsed">
      ${summaryCell}
      <td data-label="Nombre">
        <div class="visitor-name-cell">
          <select data-visitor-index="${index}" data-visitor-field="kind" class="visitor-kind-select" title="Tipo de visita">
            <option value="amigo"${kind === "amigo" ? " selected" : ""}>Amigo (no bautizado)</option>
            <option value="visita"${kind === "visita" ? " selected" : ""}>Visita (restauración)</option>
          </select>
          <input data-visitor-index="${index}" data-visitor-field="name" type="text" value="${escapeHtml(visitor.name)}" placeholder="Nombre">
          ${kindChip}
        </div>
      </td>
      <td data-label="Invitó"><select data-visitor-index="${index}" data-visitor-field="invitedBy">${[
        '<option value="">— Quién invitó —</option>',
        ...invitedByPeople.map(p => `<option value="${escapeHtml(p.name)}"${visitor.invitedBy === p.name ? " selected" : ""}>${escapeHtml(p.name)}</option>`)
      ].join("")}</select></td>
      <td data-label="${escapeHtml(t('dash.reach'))}" class="checkbox-cell col-alcance"><input data-visitor-index="${index}" data-visitor-field="reachAttended" type="checkbox"${visitor.reachAttended ? " checked" : ""}></td>
      <td data-label="${escapeHtml(t('dash.sunday'))}" class="checkbox-cell col-culto"><input data-visitor-index="${index}" data-visitor-field="sundayAttended" type="checkbox"${visitor.sundayAttended ? " checked" : ""}></td>
      <td data-label="Primera vez" class="checkbox-cell"><input data-visitor-index="${index}" data-visitor-field="firstVisit" type="checkbox"${visitor.firstVisit ? " checked" : ""}></td>
      <td data-label="Proceso">${kind === "amigo"
        ? historicalProcessEntry !== "none"
          ? `<span class="member-admin-caption" title="${escapeHtml(processStatusMeta || getVisitorProcessStatusLabel(historicalProcessEntry))}">${escapeHtml(getVisitorProcessStatusLabel(historicalProcessEntry))}</span>`
          : `<select data-visitor-index="${index}" data-visitor-field="processEntry">${renderVisitorProcessOptions(processEntry, availability)}</select>`
        : `<span class="member-admin-caption">Restauración</span>`}</td>
      ${convertedCell}
      ${isEventWeek ? `<td data-label="${escapeHtml(eventName)}" class="checkbox-cell event-col"><input data-visitor-index="${index}" data-visitor-field="eventAttended" type="checkbox"${visitor.eventAttended ? " checked" : ""}></td>` : ""}
      <td data-label="Contactado" class="checkbox-cell col-contactado"><input data-visitor-index="${index}" data-visitor-field="contacted" type="checkbox"${visitor.contacted ? " checked" : ""}></td>
      <td data-label="Teléfono"><input data-visitor-index="${index}" data-visitor-field="phone" type="text" value="${escapeHtml(visitor.phone)}" placeholder="Teléfono"></td>
      <td data-label="Observación"><input data-visitor-index="${index}" data-visitor-field="note" type="text" value="${escapeHtml(visitor.note)}" placeholder="Observación"></td>
      <td data-label="Acciones">
        <div class="visitor-actions-cell">
          ${promoteAction}
          <button type="button" class="danger" data-action="remove-visitor" data-visitor-index="${index}">Quitar</button>
        </div>
      </td>
    </tr>
  `;
  }).join("");
  renderAttendanceSummary();
}

function renderKidsTable() {
  if (!currentKids.length) {
    kidsTableBody.innerHTML = `<tr><td colspan="7" class="empty-state">${t('cell.noKidsLoaded')}</td></tr>`;
    renderAttendanceSummary();
    return;
  }

  kidsTableBody.innerHTML = currentKids.map((kid, index) => {
    const isCatalogKid = kid.source === "catalog";
    return `
      <tr>
        <td data-label="${escapeHtml(t('role.kidShort'))}"><input data-kid-index="${index}" data-kid-field="name" type="text" value="${escapeHtml(kid.name)}" placeholder="Nombre"${isCatalogKid ? " disabled" : ""}></td>
        <td data-label="Responsable"><input data-kid-index="${index}" data-kid-field="guardianName" type="text" value="${escapeHtml(kid.guardianName)}" placeholder="Responsable"></td>
        <td data-label="Origen">${escapeHtml(isCatalogKid ? "Célula" : t('vis.visit'))}</td>
        <td data-label="${escapeHtml(t('dash.reach'))}" class="checkbox-cell"><input data-kid-index="${index}" data-kid-field="reachAttended" type="checkbox"${kid.reachAttended ? " checked" : ""}></td>
        <td data-label="${escapeHtml(t('dash.sunday'))}" class="checkbox-cell"><input data-kid-index="${index}" data-kid-field="sundayAttended" type="checkbox"${kid.sundayAttended ? " checked" : ""}></td>
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
      baptismSummaryPills.innerHTML = `<span class="member-admin-caption">${escapeHtml(captureStatus.isAllowed ? t('bap.noneInCycle') : registrationMessage)}</span>`;
    }
    renderAttendanceSummary();
    return;
  }

  baptismTableBody.innerHTML = baptisms.map((entry, index) => `
    <tr>
      <td data-label="Persona"><input data-baptism-index="${index}" data-baptism-field="name" type="text" value="${escapeHtml(entry.name)}" placeholder="Nombre completo"></td>
      <td data-label="Fecha"><input data-baptism-index="${index}" data-baptism-field="baptismDate" type="date" value="${escapeHtml(entry.baptismDate)}"></td>
      <td data-label="Origen">${escapeHtml(formatBaptismSource(entry.source))}</td>
      <td data-label=t('bap.addAsMember') class="checkbox-cell"><input data-baptism-index="${index}" data-baptism-field="promoteToMember" type="checkbox" title=t('bap.addAsMemberHint')${entry.promoteToMember ? " checked" : ""}></td>
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
  currentMemberAttendance = buildDefaultMemberAttendance(cell, savedData?.memberAttendance, savedData);
  currentVisitors = normalizeVisitors(savedData?.visitors);
  currentKids = buildDefaultKidsAttendance(cell, savedData?.kids);
  currentBaptisms = normalizeBaptisms(savedData?.baptisms);
  currentReachSupervisorVisits = normalizeReachSupervisorVisits(savedData?.reachSupervisorVisits || savedData?.reachSupervisorVisitsJson);
  resetVisitorQuickForm();
  resetKidQuickForm();
  renderReachSupervisorVisits(cell);
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
  updateVisitorHistoryHideButton();
  if (visitorQuickName instanceof HTMLInputElement) {
    visitorQuickName.value = "";
  }
  if (visitorQuickInvitedBy instanceof HTMLSelectElement) {
    visitorQuickInvitedBy.value = leaderField.value || assistantField.value || "";
  }
  if (visitorQuickReach instanceof HTMLInputElement) {
    visitorQuickReach.checked = true;
  }
  if (visitorQuickLate instanceof HTMLInputElement) {
    visitorQuickLate.checked = false;
  }
  if (visitorQuickSunday instanceof HTMLInputElement) {
    visitorQuickSunday.checked = false;
  }
  if (visitorQuickFirstVisit instanceof HTMLInputElement) {
    visitorQuickFirstVisit.checked = false;
  }
  if (visitorQuickProcessEntry instanceof HTMLSelectElement) {
    visitorQuickProcessEntry.value = "none";
  }
  if (visitorQuickConverted instanceof HTMLInputElement) {
    visitorQuickConverted.checked = false;
  }
  if (visitorQuickKind instanceof HTMLSelectElement) {
    visitorQuickKind.value = "amigo";
  }
  syncVisitorQuickKindUI();
}

function isLateRegistrationAvailable() {
  const selectedWeek = parseInt(String(weekField?.value || "0"), 10);
  return Number.isFinite(selectedWeek) && selectedWeek > 2;
}

// Cuando el tipo es "visita" (bautizado), oculta el toggle de Conversión.
function syncVisitorQuickKindUI() {
  const kind = normalizeVisitorKind(visitorQuickKind?.value);
  if (visitorQuickConvertedField) {
    visitorQuickConvertedField.hidden = kind === "visita";
  }
  if (kind === "visita" && visitorQuickConverted instanceof HTMLInputElement) {
    visitorQuickConverted.checked = false;
  }
  syncQuickLateRegistrationState(String(visitorQuickName?.value || "").trim());
  updateVisitorQuickProcessSummary();
}

function toggleHelperButtons() {
  const memberButtons = [
    fillPlanningMembersButton,
    fillReachMembersButton,
    fillReachPrivilegesButton,
    copyPlanningToReachButton,
    copyReachToSundayButton,
    markAllPrivilegesButton,
    clearMemberActivitiesButton,
  ];
  const visitorButtons = [];
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
  markReportDirty("members");
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
  markReportDirty("visitors");
  currentVisitors.forEach(mutator);
  renderVisitorTable();
}

function updateKids(mutator) {
  if (!currentKids.length) {
    return;
  }
  markReportDirty("kids");
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

function handleFillSundayMembers() {
  // Marca a TODOS los miembros como asistentes al Culto, sin importar Alcance.
  updateMemberActivities((entry) => {
    entry.sundayAttended = true;
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

function handleMarkAllVisitorsToSunday() {
  // Marca el Culto de TODOS los amigos/visitas registrados, sin importar
  // si fueron al Alcance o no.
  if (!currentVisitors.length) {
    setFeedback(t('friend.noneInReach'));
    return;
  }
  updateVisitors((visitor) => {
    visitor.sundayAttended = true;
  });
  setFeedback(`✓ Marcados al Culto los ${currentVisitors.length} amigos.`);
}

function handleCopyVisitorReachToSunday() {
  const target = currentVisitors.filter((v) => v.reachAttended).length;
  updateVisitors((visitor) => {
    visitor.sundayAttended = Boolean(visitor.reachAttended);
  });
  setFeedback(target ? `↪ Marcados en Culto los ${target} amigos que asistieron a Alcance.` : t('friend.noneInReach'));
}

function handleMarkVisitorFirstVisit() {
  if (!currentVisitors.length) return;
  updateVisitors((visitor) => {
    visitor.firstVisit = true;
  });
  setFeedback(`✓ Marcados como primera vez ${currentVisitors.length} amigos.`);
}

async function handleClearVisitorActivities() {
  const marked = currentVisitors.filter((v) => v.reachAttended || v.sundayAttended).length;
  if (!marked) {
    setFeedback(t('friend.noneInReachOrSunday'));
    return;
  }
  const ok = await appConfirm(
    `¿Desmarcar Alcance y Culto de ${marked} amigos?\nEsto solo desmarca la asistencia, no elimina amigos de la tabla.`,
    "Desmarcar asistencia"
  );
  if (!ok) return;
  updateVisitors((visitor) => {
    visitor.reachAttended = false;
    visitor.sundayAttended = false;
  });
  setFeedback(`✓ Desmarcada la asistencia de ${marked} amigos.`);
}

function handleCopyKidReachToSunday() {
  updateKids((kid) => {
    kid.sundayAttended = Boolean(kid.reachAttended);
  });
}

function handleFillSundayKids() {
  // Marca a TODOS los niños como asistentes al Culto.
  if (!currentKids.length) return;
  updateKids((kid) => {
    kid.sundayAttended = true;
  });
  setFeedback(`✓ Marcados al Culto los ${currentKids.length} niños.`);
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
    cyclesList.innerHTML = `<p class="empty-state" style="padding:16px 0">${t('rep.noReportsYet')}</p>`;
    return;
  }

  const quarterLabel = q => q === "1" ? t('qrange.q1') : q === "2" ? t('qrange.q2') : t('qrange.q3');
  const quarterName  = q => q === "1" ? t('qname.q1') : q === "2" ? t('qname.q2') : t('qname.q3');
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
        const totalDone = Object.values(byWeek).filter(r => !isReportVisuallyDraft(r)).length;

        const totalWeeks = getRcmTotalWeeks();
        const chips = Array.from({ length: totalWeeks }, (_, i) => {
          const w = String(i + 1);
          const info = getRcmWeekInfo(w);
          const rep = byWeek[w];
          const phaseKey = info ? phaseColors[info.phase] || "ganar" : "ganar";
          const verb = info?.verb || (Number(w) === totalWeeks ? "CIERRE" : "");
          const isEvent = info?.isEventWeek;
          if (rep) {
            const isDraft = isReportVisuallyDraft(rep);
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
        const baptismCount = reps.reduce((s, r) => {
          const list = Array.isArray(r.formData?.baptisms) ? r.formData.baptisms : [];
          return s + list.filter(b => String(getBaptismQuarter(b?.baptismDate)) === String(quarter)).length;
        }, 0);
        const baptismChip = baptismCount > 0
          ? `<span class="cycle-baptism-chip" title="${t('baptism.cycleChipTitle')}">${t(baptismCount === 1 ? 'baptism.cycleChip' : 'baptism.cycleChipPlural', { n: baptismCount })}</span>`
          : "";
        return `
          <div class="cycle-card" data-cell-number="${escapeHtml(String(cell))}">
            <div class="cycle-card-head">
              <div class="cycle-card-title">
                <span class="cycle-cell-badge">Célula ${escapeHtml(cell)}</span>
                <strong>${quarterName(quarter)}</strong>
                <span class="cycle-year-tag">${escapeHtml(year)}</span>
                <span class="cycle-range-tag">${quarterLabel(quarter)}</span>
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
}

// ── Seguimiento: vista de células para supervisor / coordinador ────────────
let seguimientoScope = (typeof localStorage !== "undefined" && (localStorage.getItem("seguimientoScope") === "all" || localStorage.getItem("seguimientoScope") === "current"))
  ? localStorage.getItem("seguimientoScope")
  : "current";
// Offset de semana para Seguimiento: 0 = esta semana, -1 = semana anterior.
let seguimientoWeekOffset = -1;
let friendTrackingRenderToken = 0;
let friendTrackingCellFilterValue = "";
let friendTrackingScopeContext = null;
let friendTrackingControlEntriesIndex = new Map();

function getFriendTrackingCellFilterLabel(value) {
  const normalized = String(value || "").trim();
  return normalized ? `Célula ${normalized}` : "Vista general";
}

function closeFriendTrackingCellFilterMenu() {
  if (friendTrackingFilterMenu) friendTrackingFilterMenu.hidden = true;
  if (friendTrackingFilterPicker) friendTrackingFilterPicker.classList.remove("is-open");
  if (friendTrackingFilterButton) friendTrackingFilterButton.setAttribute("aria-expanded", "false");
}

function toggleFriendTrackingCellFilterMenu(forceOpen) {
  if (!friendTrackingFilterMenu || !friendTrackingFilterPicker || !friendTrackingFilterButton || friendTrackingFilterPicker.hidden) return;
  const shouldOpen = typeof forceOpen === "boolean" ? forceOpen : friendTrackingFilterMenu.hidden;
  friendTrackingFilterMenu.hidden = !shouldOpen;
  friendTrackingFilterPicker.classList.toggle("is-open", shouldOpen);
  friendTrackingFilterButton.setAttribute("aria-expanded", shouldOpen ? "true" : "false");
}

// Oculta los reportes en borrador (_draft) según rol:
//  - Super-admin: ve todos los borradores.
//  - Líder de la célula del reporte: ve los suyos.
//  - Resto (supervisores, coordinadores, miembros): solo ven finalizados.
function filterVisibleReports(list) {
  if (!Array.isArray(list)) return list;
  if (currentUser?.isAdmin) return list;
  const myCell = String(currentUser?.assignedCellNumber || "");
  return list.filter(r => {
    const isDraft = r.formData?._draft === true || r.formData?._draft === "true";
    if (!isDraft) return true;
    const cell = String(r.cellNumber || r.formData?.cellNumber || "");
    return myCell && cell === myCell;
  });
}

function getFriendTrackingQueryParams() {
  const params = new URLSearchParams();
  const activeScope = getEffectiveDashboardScope();
  params.set("scope", seguimientoScope === "all" ? "all" : "current");
  if (seguimientoScope !== "all") {
    const now = new Date();
    const year = String(now.getFullYear());
    const month = now.getMonth();
    const quarter = String(month <= 3 ? 1 : month <= 7 ? 2 : 3);
    params.set("year", year);
    params.set("quarter", quarter);
  }
  if (activeScope !== "cell" && friendTrackingCellFilterValue) {
    params.set("cellNumber", String(friendTrackingCellFilterValue));
    return params;
  }
  if (activeScope === "cell" && currentUser?.assignedCellNumber) {
    params.set("cellNumber", String(currentUser.assignedCellNumber));
  } else if (activeScope === "sector" && currentUser?.supervisedSector) {
    params.set("sector", String(currentUser.supervisedSector));
  }
  return params;
}

function syncFriendTrackingCellFilter() {
  if (!(friendTrackingCellFilter instanceof HTMLSelectElement)) return;
  const activeScope = getEffectiveDashboardScope();
  const allowedCellNumbers = Array.from(getUserScopedCellNumbers(activeScope)).sort((left, right) => Number(left) - Number(right));
  const shouldShow = activeScope !== "cell" && allowedCellNumbers.length > 1;
  if (!shouldShow) {
    friendTrackingCellFilter.hidden = true;
    if (friendTrackingFilterPicker) friendTrackingFilterPicker.hidden = true;
    friendTrackingCellFilterValue = "";
    friendTrackingCellFilter.innerHTML = '<option value="">Vista general</option>';
    if (friendTrackingFilterButtonText) friendTrackingFilterButtonText.textContent = "Vista general";
    if (friendTrackingFilterMenu) friendTrackingFilterMenu.innerHTML = "";
    closeFriendTrackingCellFilterMenu();
    return;
  }
  const options = allowedCellNumbers.map(cellNumber => `<option value="${escapeHtml(String(cellNumber))}">Célula ${escapeHtml(String(cellNumber))}</option>`).join("");
  friendTrackingCellFilter.innerHTML = `<option value="">Vista general</option>${options}`;
  if (friendTrackingCellFilterValue && allowedCellNumbers.includes(String(friendTrackingCellFilterValue))) {
    friendTrackingCellFilter.value = String(friendTrackingCellFilterValue);
  } else {
    friendTrackingCellFilterValue = "";
    friendTrackingCellFilter.value = "";
  }
  friendTrackingCellFilter.hidden = true;
  if (friendTrackingFilterPicker) friendTrackingFilterPicker.hidden = false;
  if (friendTrackingFilterButtonText) friendTrackingFilterButtonText.textContent = getFriendTrackingCellFilterLabel(friendTrackingCellFilter.value);
  if (friendTrackingFilterMenu) {
    friendTrackingFilterMenu.innerHTML = ["", ...allowedCellNumbers].map((cellNumber) => {
      const value = String(cellNumber || "");
      const isActive = value === String(friendTrackingCellFilter.value || "");
      return `
        <button type="button" class="friend-tracking-filter-option${isActive ? " is-active" : ""}" data-cell-filter="${escapeHtml(value)}" role="option" aria-selected="${isActive ? "true" : "false"}">
          ${escapeHtml(getFriendTrackingCellFilterLabel(value))}
        </button>
      `;
    }).join("");
  }
}

friendTrackingCellFilter?.addEventListener("change", () => {
  friendTrackingCellFilterValue = String(friendTrackingCellFilter.value || "").trim();
  loadFriendTrackingPanel();
});

friendTrackingFilterButton?.addEventListener("click", () => {
  toggleFriendTrackingCellFilterMenu();
});

friendTrackingFilterMenu?.addEventListener("click", (ev) => {
  const btn = ev.target.closest(".friend-tracking-filter-option[data-cell-filter]");
  if (!btn || !(friendTrackingCellFilter instanceof HTMLSelectElement)) return;
  const nextValue = String(btn.dataset.cellFilter || "").trim();
  friendTrackingCellFilterValue = nextValue;
  friendTrackingCellFilter.value = nextValue;
  closeFriendTrackingCellFilterMenu();
  syncFriendTrackingCellFilter();
  loadFriendTrackingPanel();
});

function formatTrackingRange(start, end) {
  if (!start && !end) return "Sin fechas";
  if (!end || start === end) return start || end;
  return `${start} - ${end}`;
}

function formatTrackingDateLabel(value) {
  if (!value) return "";
  const match = String(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return String(value);
  return `${match[3]}/${match[2]}/${match[1]}`;
}

function formatTrackingRangeLabel(start, end) {
  const startLabel = formatTrackingDateLabel(start);
  const endLabel = formatTrackingDateLabel(end);
  if (!startLabel && !endLabel) return "Sin fechas";
  if (!endLabel || startLabel === endLabel) return startLabel || endLabel;
  return `${startLabel} — ${endLabel}`;
}

function getFriendTrackingStatusLabel(friend) {
  if (friend.completed && friend.converted) return "Completó y decidió";
  if (friend.completed) return "Terminó proceso";
  if ((friend.sundayCount || 0) > 0) return "Asiste a culto";
  if ((friend.reachCount || 0) > 0) return "En alcance";
  if (friend.converted) return "Decidió";
  return "En proceso";
}

function getFriendTrackingBackendOutcomeLabel(outcome, status = "") {
  const normalizedOutcome = String(outcome || "").trim().toLowerCase();
  const normalizedStatus = String(status || "").trim().toLowerCase();
  const labelMap = {
    in_process: "Sigue en proceso",
    converted_in_process: "Decidió dentro del proceso",
    converted: "Completó y decidió",
    completed_no_decision: "Completó sin decisión registrada",
    completed: "Ciclo completado",
    won_friend: "Amigo ganado",
    reactivated_won: "Reactivado en seguimiento",
    member: "Ya figura como miembro",
  };
  if (normalizedOutcome && labelMap[normalizedOutcome]) return labelMap[normalizedOutcome];
  if (normalizedStatus && labelMap[normalizedStatus]) return labelMap[normalizedStatus];
  if (normalizedOutcome) return normalizedOutcome.replace(/_/g, " ");
  if (normalizedStatus) return normalizedStatus.replace(/_/g, " ");
  return "Sin lectura backend";
}

function getFriendTrackingScopedReports(scope = friendTrackingScopeContext || {}) {
  const activeScope = getEffectiveDashboardScope();
  return filterItemsByUserScope(
    filterVisibleReports(Array.isArray(reportsData) ? reportsData : []),
    report => report.cellNumber || report.formData?.cellNumber,
    activeScope
  ).filter((report) => {
    const reportCell = String(report.cellNumber || report.formData?.cellNumber || "").trim();
    if (activeScope !== "cell" && friendTrackingCellFilterValue && reportCell !== String(friendTrackingCellFilterValue)) {
      return false;
    }
    const scopeYear = String(scope?.year || "").trim();
    const scopeQuarter = String(scope?.quarter || "").trim();
    if (scopeYear && String(getReportYear(report)) !== scopeYear) return false;
    if (scopeQuarter && String(getReportQuarter(report)) !== scopeQuarter) return false;
    return true;
  });
}

function buildRestorationTrackingEntries(scope = friendTrackingScopeContext || {}) {
  const scopedReports = getFriendTrackingScopedReports(scope);

  const restorationMap = new Map();
  scopedReports.forEach((report) => {
    const cellNumber = String(report.cellNumber || report.formData?.cellNumber || "").trim();
    const sector = String(report.sector || report.formData?.sector || "").trim();
    const reportDate = String(report.reportDate || report.formData?.reportDate || "").trim();
    normalizeVisitors(report.formData?.visitors).forEach((visitor) => {
      if (normalizeVisitorKind(visitor.kind) !== "visita") return;
      const normalizedName = normalizeVisitorName(visitor.name);
      if (!normalizedName) return;
      const key = `${cellNumber}::${normalizedName}`;
      const previous = restorationMap.get(key) || {
        key,
        name: String(visitor.name || "").trim(),
        cellNumber,
        sector,
        invitedBy: "",
        totalVisits: 0,
        reachCount: 0,
        sundayCount: 0,
        eventCount: 0,
        lastReportDate: "",
        firstReportDate: "",
      };
      previous.name = previous.name || String(visitor.name || "").trim();
      previous.cellNumber = previous.cellNumber || cellNumber;
      previous.sector = previous.sector || sector;
      previous.invitedBy = String(visitor.invitedBy || previous.invitedBy || "").trim();
      previous.totalVisits += 1;
      if (visitor.reachAttended) previous.reachCount += 1;
      if (visitor.sundayAttended) previous.sundayCount += 1;
      if (visitor.eventAttended) previous.eventCount += 1;
      if (!previous.firstReportDate || (reportDate && reportDate < previous.firstReportDate)) previous.firstReportDate = reportDate;
      if (!previous.lastReportDate || (reportDate && reportDate >= previous.lastReportDate)) previous.lastReportDate = reportDate;
      restorationMap.set(key, previous);
    });
  });

  return [...restorationMap.values()].sort((left, right) => {
    const weightDiff = (right.totalVisits || 0) - (left.totalVisits || 0);
    if (weightDiff !== 0) return weightDiff;
    return String(right.lastReportDate || "").localeCompare(String(left.lastReportDate || ""));
  });
}

function buildProcessControlEntries(scope = friendTrackingScopeContext || {}, friends = []) {
  const scopedReports = getFriendTrackingScopedReports(scope);
  const friendsByName = new Map(
    (Array.isArray(friends) ? friends : []).map((friend) => [normalizeVisitorName(friend.name), friend])
  );
  const processMap = new Map();

  scopedReports.forEach((report) => {
    const cellNumber = String(report.cellNumber || report.formData?.cellNumber || "").trim();
    const sector = String(report.sector || report.formData?.sector || "").trim();
    const reportDate = String(report.reportDate || report.formData?.reportDate || "").trim();
    const weekNumber = parseInt(String(report.week || report.formData?.week || "0"), 10) || 0;
    const weekMeta = getRcmWeekInfo(weekNumber);

    normalizeVisitors(report.formData?.visitors).forEach((visitor) => {
      if (normalizeVisitorKind(visitor.kind) !== "amigo") return;
      const normalizedName = normalizeVisitorName(visitor.name);
      if (!normalizedName) return;
      const key = `${cellNumber}::${normalizedName}`;
      const previous = processMap.get(key) || {
        key,
        name: String(visitor.name || "").trim(),
        cellNumber,
        sector,
        invitedBy: "",
        noted: false,
        lateEntry: false,
        notedWeek: 0,
        notedDate: "",
        levantate: false,
        levantateWeek: 0,
        levantateDate: "",
        restauracion: false,
        restauracionWeek: 0,
        restauracionDate: "",
        currentWeek: 0,
        firstReportDate: "",
        lastReportDate: "",
        totalReports: 0,
        reachCount: 0,
        sundayCount: 0,
      };

      const processEntry = normalizeVisitorProcessEntry(visitor.processEntry, visitor.kind, {
        lateRegistration: Boolean(visitor.lateRegistration),
      });
      previous.name = previous.name || String(visitor.name || "").trim();
      previous.cellNumber = previous.cellNumber || cellNumber;
      previous.sector = previous.sector || sector;
      previous.invitedBy = String(visitor.invitedBy || previous.invitedBy || "").trim();
      previous.noted = previous.noted || processEntry === "noted" || processEntry === "late";
      previous.lateEntry = previous.lateEntry || processEntry === "late";
      if ((processEntry === "noted" || processEntry === "late") && (!previous.notedWeek || (weekNumber && weekNumber < previous.notedWeek))) {
        previous.notedWeek = weekNumber;
        previous.notedDate = reportDate;
      }
      previous.currentWeek = Math.max(previous.currentWeek || 0, weekNumber || 0);
      previous.totalReports += 1;
      if (visitor.reachAttended) previous.reachCount += 1;
      if (visitor.sundayAttended) previous.sundayCount += 1;
      if (weekMeta?.rcmKey === "levantate" && visitor.eventAttended) {
        previous.levantate = true;
        if (!previous.levantateWeek || (weekNumber && weekNumber < previous.levantateWeek)) {
          previous.levantateWeek = weekNumber;
          previous.levantateDate = reportDate;
        }
      }
      if (weekMeta?.rcmKey === "restauracion" && visitor.eventAttended) {
        previous.restauracion = true;
        if (!previous.restauracionWeek || (weekNumber && weekNumber < previous.restauracionWeek)) {
          previous.restauracionWeek = weekNumber;
          previous.restauracionDate = reportDate;
        }
      }
      if (!previous.firstReportDate || (reportDate && reportDate < previous.firstReportDate)) previous.firstReportDate = reportDate;
      if (!previous.lastReportDate || (reportDate && reportDate >= previous.lastReportDate)) previous.lastReportDate = reportDate;
      processMap.set(key, previous);
    });
  });

  return [...processMap.values()]
    .map((entry) => {
      const backendFriend = friendsByName.get(normalizeVisitorName(entry.name));
      const cycleClosed = Boolean(backendFriend?.completed) || (entry.currentWeek || 0) >= 16;
      const outsideCohort = !entry.noted && (entry.levantate || entry.restauracion || cycleClosed);
      const complete = entry.noted && entry.levantate && entry.restauracion && cycleClosed;
      const pendingSteps = [];
      if (!entry.noted) pendingSteps.push("Anotar");
      if (!entry.levantate) pendingSteps.push("Levántate");
      if (!entry.restauracion) pendingSteps.push("Restauración");
      if (!cycleClosed) pendingSteps.push("Cierre semana 16");
      let statusKey = "pending";
      let statusLabel = "Pendiente";
      let statusDetail = pendingSteps.length ? `Pendiente: ${pendingSteps.join(", ")}` : "Sin pendientes detectados.";
      if (complete) {
        statusKey = "complete";
        statusLabel = "Trayecto completo";
        statusDetail = "Cohorte anotada y hitos principales cubiertos dentro del ciclo.";
      } else if (outsideCohort) {
        statusKey = "outside";
        statusLabel = "Fuera de cohorte";
        statusDetail = "Aparece en hitos del proceso, pero no viene de la cohorte anotada.";
      } else if (entry.noted && (entry.levantate || entry.restauracion || cycleClosed)) {
        statusKey = "progress";
        statusLabel = cycleClosed ? "Cierre parcial" : "En seguimiento";
        statusDetail = cycleClosed
          ? `Cerró ciclo, pero le faltó: ${pendingSteps.filter((step) => step !== "Cierre semana 16").join(", ") || "revisión manual"}`
          : `Avance detectado; falta: ${pendingSteps.join(", ")}`;
      }
      return {
        ...entry,
        processCount: Number(backendFriend?.processCount || 0),
        backendOutcome: String(backendFriend?.outcome || ""),
        backendStatus: String(backendFriend?.status || ""),
        cycleClosed,
        outsideCohort,
        complete,
        pendingSteps,
        statusKey,
        statusLabel,
        statusDetail,
      };
    })
    .filter((entry) => entry.noted || entry.levantate || entry.restauracion || entry.cycleClosed)
    .sort((left, right) => {
      const weightMap = { complete: 4, progress: 3, outside: 2, pending: 1 };
      const weightDiff = (weightMap[right.statusKey] || 0) - (weightMap[left.statusKey] || 0);
      if (weightDiff !== 0) return weightDiff;
      return String(right.lastReportDate || "").localeCompare(String(left.lastReportDate || ""));
    });
}

function wireFriendTrackingDetailClick(container) {
  container?.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action='friend-process-detail']");
    if (!button) return;
    const visitorKey = String(button.dataset.friendKey || "").trim();
    const visitorName = String(button.dataset.friendName || "").trim();
    const cellNumber = String(button.dataset.friendCell || "").trim();
    if (!visitorKey || !visitorName) return;

    if (container === friendTrackingControlList) {
      const controlEntry = friendTrackingControlEntriesIndex.get(`${cellNumber}::${visitorKey}`)
        || friendTrackingControlEntriesIndex.get(visitorKey);
      if (!controlEntry) return;
      openFriendTrackingControlDetail(controlEntry);
      return;
    }

    const scopeReports = filterVisibleReports(Array.isArray(reportsData) ? reportsData : []).filter((report) => {
      const reportCell = String(report.cellNumber || report.formData?.cellNumber || "").trim();
      if (cellNumber && reportCell !== cellNumber) return false;
      const scopeYear = String(friendTrackingScopeContext?.year || "").trim();
      const scopeQuarter = String(friendTrackingScopeContext?.quarter || "").trim();
      if (scopeYear && String(getReportYear(report)) !== scopeYear) return false;
      if (scopeQuarter && String(getReportQuarter(report)) !== scopeQuarter) return false;
      return true;
    });

    const periodLabel = friendTrackingScopeContext?.year && friendTrackingScopeContext?.quarter
      ? `Célula ${cellNumber || "—"} · Q${friendTrackingScopeContext.quarter} ${friendTrackingScopeContext.year}`
      : `Célula ${cellNumber || "—"} · Histórico`;
    openVisitorDetail(visitorKey, visitorName, scopeReports, periodLabel);
  });
}

function openFriendTrackingControlDetail(entry) {
  if (!previewVisitorsDialog || !previewVisitorsDialogBody) return;
  previewVisitorsDialog.dataset.mode = "friend-control";

  const cycleText = entry.processCount > 1
    ? `${entry.processCount} ciclos en histórico`
    : `${entry.processCount || 0} ciclo${entry.processCount === 1 ? " en histórico" : "s"}`;
  const missingText = entry.pendingSteps?.length ? entry.pendingSteps.join(", ") : "Ninguno";
  const outcomeText = entry.backendOutcome || entry.backendStatus
    ? getFriendTrackingBackendOutcomeLabel(entry.backendOutcome, entry.backendStatus)
    : entry.cycleClosed
      ? "Ciclo cerrado con datos actuales"
      : "Ciclo todavía abierto";
  const routeItems = [
    entry.notedWeek ? `Anotó sem. ${entry.notedWeek}` : "Sin semana de anotar",
    entry.levantateWeek ? `Levántate sem. ${entry.levantateWeek}` : "Sin Levántate",
    entry.restauracionWeek ? `Restauración sem. ${entry.restauracionWeek}` : "Sin Restauración",
    entry.cycleClosed ? `Cierre en sem. ${entry.currentWeek || 16}` : `Avance máx. sem. ${entry.currentWeek || 0}`,
  ];
  const milestoneTimeline = [
    {
      label: entry.lateEntry ? "Anotado tardío" : "Anotado",
      done: entry.noted,
      when: entry.noted
        ? `Sem. ${entry.notedWeek || "?"}${entry.notedDate ? ` · ${formatTrackingDateLabel(entry.notedDate)}` : ""}`
        : "Pendiente",
    },
    {
      label: "Levántate",
      done: entry.levantate,
      when: entry.levantate
        ? `Sem. ${entry.levantateWeek || "?"}${entry.levantateDate ? ` · ${formatTrackingDateLabel(entry.levantateDate)}` : ""}`
        : "Pendiente",
    },
    {
      label: "Restauración",
      done: entry.restauracion,
      when: entry.restauracion
        ? `Sem. ${entry.restauracionWeek || "?"}${entry.restauracionDate ? ` · ${formatTrackingDateLabel(entry.restauracionDate)}` : ""}`
        : "Pendiente",
    },
    {
      label: "Cierre semana 16",
      done: entry.cycleClosed,
      when: entry.cycleClosed
        ? `Sem. ${entry.currentWeek || 16}${entry.lastReportDate ? ` · ${formatTrackingDateLabel(entry.lastReportDate)}` : ""}`
        : "Pendiente",
    },
  ];
  const periodLabel = friendTrackingScopeContext?.year && friendTrackingScopeContext?.quarter
    ? `Q${friendTrackingScopeContext.quarter} ${friendTrackingScopeContext.year} · Célula ${entry.cellNumber || "—"}`
    : `Histórico · Célula ${entry.cellNumber || "—"}`;

  if (previewVisitorsDialogTitle) {
    previewVisitorsDialogTitle.textContent = `${entry.name} · Control del proceso`;
  }

  previewVisitorsDialogBody.innerHTML = `
    <div class="friend-control-modal">
      <section class="friend-control-modal-hero">
        <div class="friend-control-modal-headline">
          <p class="friend-control-modal-period">${escapeHtml(periodLabel)}</p>
          <div class="friend-control-modal-headrow">
            <strong class="friend-control-modal-name">${escapeHtml(entry.name)}</strong>
            <span class="friend-process-status friend-process-status-control ${escapeHtml(entry.statusKey === "complete"
              ? "is-complete"
              : entry.statusKey === "outside"
                ? "is-outside"
                : entry.statusKey === "progress"
                  ? "is-progress"
                  : "is-pending")}">${escapeHtml(entry.statusLabel)}</span>
          </div>
          <p class="friend-control-modal-summary">Le falta: ${escapeHtml(missingText)}</p>
        </div>
        <div class="friend-control-modal-tags">
          ${(entry.processCount > 1 ? `<span class="friend-control-cycle-badge is-repeat">${escapeHtml(cycleText)}</span>` : `<span class="friend-control-cycle-badge">${escapeHtml(cycleText)}</span>`)}
          <span class="friend-control-modal-tag">Invitó: ${escapeHtml(entry.invitedBy || "—")}</span>
          <span class="friend-control-modal-tag">${escapeHtml(formatTrackingRangeLabel(entry.firstReportDate, entry.lastReportDate))}</span>
        </div>
      </section>

      <section class="friend-control-modal-section">
        <div class="friend-control-milestones">
          ${[
            { label: entry.noted ? (entry.lateEntry ? "Anotado tardío" : "Anotado") : "No anotado", accent: entry.noted ? "is-done" : "is-off" },
            { label: "Levántate", accent: entry.levantate ? "is-done" : "is-off" },
            { label: "Restauración", accent: entry.restauracion ? "is-done" : "is-off" },
            { label: "Cierre sem. 16", accent: entry.cycleClosed ? "is-done" : "is-off" },
          ].map((milestone) => `<span class="friend-control-milestone ${milestone.accent}">${escapeHtml(milestone.label)}</span>`).join("")}
        </div>
      </section>

      <section class="friend-control-modal-grid">
        <div class="friend-control-detail-card">
          <span class="friend-control-detail-label">Lectura</span>
          <strong class="friend-control-detail-value">${escapeHtml(entry.statusDetail || "—")}</strong>
        </div>
        <div class="friend-control-detail-card">
          <span class="friend-control-detail-label">Salida backend</span>
          <strong class="friend-control-detail-value">${escapeHtml(outcomeText)}</strong>
        </div>
        <div class="friend-control-detail-card friend-control-detail-card-wide">
          <span class="friend-control-detail-label">Fechas clave</span>
          <div class="friend-control-timeline">
            ${milestoneTimeline.map((milestone) => `
              <div class="friend-control-timeline-row ${milestone.done ? "is-done" : "is-off"}">
                <span class="friend-control-timeline-step">${escapeHtml(milestone.label)}</span>
                <span class="friend-control-timeline-when">${escapeHtml(milestone.when)}</span>
              </div>
            `).join("")}
          </div>
        </div>
      </section>

      <section class="friend-control-modal-section">
        <span class="friend-control-detail-label">Ruta</span>
        <div class="friend-control-route">${escapeHtml(routeItems.join(" · "))}</div>
      </section>

      <section class="friend-control-modal-metrics">
        <article class="friend-control-modal-metric">
          <span class="friend-control-detail-label">Alcance</span>
          <strong>${escapeHtml(String(entry.reachCount || 0))}</strong>
        </article>
        <article class="friend-control-modal-metric">
          <span class="friend-control-detail-label">Culto</span>
          <strong>${escapeHtml(String(entry.sundayCount || 0))}</strong>
        </article>
        <article class="friend-control-modal-metric">
          <span class="friend-control-detail-label">Semana máx</span>
          <strong>${escapeHtml(String(entry.currentWeek || 0))}</strong>
        </article>
        <article class="friend-control-modal-metric">
          <span class="friend-control-detail-label">Histórico</span>
          <strong>${escapeHtml(cycleText)}</strong>
        </article>
      </section>
    </div>
  `;

  previewVisitorsDialog.showModal();
}

function renderFriendTrackingPanel(payload) {
  if (!friendTrackingSummaryGrid || !friendTrackingFriendsList || !friendTrackingGoals || !friendTrackingQuickChips || !friendTrackingRestorationChips || !friendTrackingRestorationList || !friendTrackingControlChips || !friendTrackingControlList) return;

  const summary = payload?.summary || {};
  const quickSignals = payload?.quickSignals || {};
  const goals = payload?.goals || {};
  const friends = Array.isArray(payload?.friends) ? payload.friends : [];
  const restorationVisitors = buildRestorationTrackingEntries(payload?.scope || {});
  const processControlEntries = buildProcessControlEntries(payload?.scope || {}, friends);
  friendTrackingControlEntriesIndex = new Map(processControlEntries.map((entry) => [`${String(entry.cellNumber || "").trim()}::${normalizeVisitorName(entry.name)}`, entry]));
  const scope = payload?.scope || {};
  friendTrackingScopeContext = scope;
  const activeScope = getEffectiveDashboardScope();
  const sortedFriends = [...friends].sort((left, right) => {
    const leftWeight = (right?.weeksSeen || 0) - (left?.weeksSeen || 0);
    if (leftWeight !== 0) return leftWeight;
    return String(right?.lastReportDate || "").localeCompare(String(left?.lastReportDate || ""));
  });

  if (friendTrackingScopeChip) {
    friendTrackingScopeChip.textContent = scope.year && scope.quarter ? `Q${scope.quarter}/${scope.year}` : "Histórico";
  }
  if (friendTrackingGoalsTabButton) {
    friendTrackingGoalsTabButton.textContent = scope.year && scope.quarter ? `Metas - Q${scope.quarter}/${scope.year}` : "Metas";
  }
  if (friendTrackingGoalsTitle) {
    friendTrackingGoalsTitle.textContent = scope.year && scope.quarter ? "En curso" : "Metas";
  }

  friendTrackingSummaryGrid.innerHTML = [
    {
      label: "Amigos activos",
      value: String(summary.activeFriends || 0),
      hint: "con alcance o culto en el periodo",
      accent: "accent-faith",
    },
    {
      label: "Padres espirituales",
      value: String(summary.spiritualParents || 0),
      hint: "personas trayendo amigos en el ciclo",
      accent: "accent-success",
    },
    {
      label: "Recurrentes",
      value: String(summary.recurrentFriends || 0),
      hint: "2 o más entradas al proceso",
      accent: "accent-neutral",
    },
    {
      label: "Largo plazo",
      value: String(summary.longTermFriends || 0),
      hint: "historial de 1 año o más",
      accent: "accent-neutral",
    },
    {
      label: "Seguimiento clave",
      value: summary.keyFollowUp
        ? `${String(summary.keyFollowUp.name || "")} · ${String(summary.keyFollowUp.processCount || 0)} veces`
        : "-",
      hint: summary.keyFollowUp
        ? "caso con mayor continuidad"
        : "sin caso destacado en este periodo",
      accent: "accent-faith friend-summary-card-key",
    },
  ].map(({ label, value, hint, accent }) => `
    <article class="summary-card summary-card-dashboard friend-summary-card ${escapeHtml(accent || "")}">
      <span class="summary-label">${escapeHtml(label)}</span>
      <strong class="summary-value">${escapeHtml(value)}</strong>
      <span class="summary-hint">${escapeHtml(hint)}</span>
    </article>
  `).join("");

  friendTrackingQuickChips.innerHTML = [
    ["En proceso", summary.activeFriends || 0],
    ["Ganados", summary.wonFriends || 0],
    ["Más de un ciclo", summary.recurrentFriends || 0],
    ["Con culto", quickSignals.withSunday || 0],
    ["Reactivados", quickSignals.reactivatedWon || 0],
  ].map(([label, value]) => `
    <span class="count-chip friend-tracking-count-chip">
      <span class="friend-tracking-count-label">${escapeHtml(String(label))}</span>
      <strong class="friend-tracking-count-value">${escapeHtml(String(value))}</strong>
    </span>
  `).join("");

  friendTrackingRestorationChips.innerHTML = [
    ["En restauración", restorationVisitors.length],
    ["Con alcance", restorationVisitors.filter((visitor) => (visitor.reachCount || 0) > 0).length],
    ["Con culto", restorationVisitors.filter((visitor) => (visitor.sundayCount || 0) > 0).length],
    ["Recurrentes", restorationVisitors.filter((visitor) => (visitor.totalVisits || 0) > 1).length],
  ].map(([label, value]) => `
    <span class="count-chip friend-tracking-count-chip friend-tracking-count-chip-restoration">
      <span class="friend-tracking-count-label">${escapeHtml(String(label))}</span>
      <strong class="friend-tracking-count-value">${escapeHtml(String(value))}</strong>
    </span>
  `).join("");

  friendTrackingControlChips.innerHTML = [
    ["Anotados", processControlEntries.filter((entry) => entry.noted).length],
    ["Trayecto completo", processControlEntries.filter((entry) => entry.complete).length],
    ["Pendientes", processControlEntries.filter((entry) => entry.noted && !entry.complete).length],
    ["Más de un ciclo", processControlEntries.filter((entry) => (entry.processCount || 0) > 1).length],
    ["Fuera de cohorte", processControlEntries.filter((entry) => entry.outsideCohort).length],
  ].map(([label, value]) => `
    <span class="count-chip friend-tracking-count-chip friend-tracking-count-chip-control">
      <span class="friend-tracking-count-label">${escapeHtml(String(label))}</span>
      <strong class="friend-tracking-count-value">${escapeHtml(String(value))}</strong>
    </span>
  `).join("");

  const goalProgress = payload.goalProgress || {};
  friendTrackingGoals.innerHTML = [
    ["Levántate", goals.levantateGoal || 0, goalProgress.levantate || 0],
    ["Restauración", goals.restauracionGoal || 0, goalProgress.restauracion || 0],
    ["Bautismos", goals.bautismosGoal || 0, goalProgress.bautismos || 0],
  ].map(([label, goal, current]) => {
    const target = Number(goal) || 0;
    const achieved = Number(current) || 0;
    const percent = target > 0 ? Math.min(100, Math.round((achieved / target) * 100)) : (achieved > 0 ? 100 : 0);
    const remaining = Math.max(target - achieved, 0);
    const foot = remaining > 0 ? `Faltan ${remaining}` : "Meta alcanzada";
    return `
    <div class="friend-tracking-goal-row friend-tracking-goal-progress-row">
      <div class="friend-tracking-goal-topline">
        <span class="friend-tracking-goal-label">${escapeHtml(label)}</span>
        <strong class="friend-tracking-goal-value">${escapeHtml(String(achieved))}/${escapeHtml(String(target))}</strong>
      </div>
      <div class="friend-tracking-goal-bar" aria-hidden="true">
        <div class="friend-tracking-goal-fill" style="width:${percent}%"></div>
      </div>
      <span class="friend-tracking-goal-foot">${escapeHtml(foot)}</span>
    </div>
  `;
  }).join("");

  const renderFriendProcessCard = (friend, options = {}) => {
    const statusLabel = getFriendTrackingStatusLabel(friend);
    const statusCls = friend.completed ? "is-complete" : friend.converted ? "is-converted" : "is-progress";
    const showCellBadge = Boolean(options.showCellBadge) && !!String(friend.cellNumber || "").trim();
    const participationCount = friend.weeksSeen || 0;
    const totalVisitCount = Math.max(Number(friend.totalReports || 0), participationCount);
    const processLabel = `${participationCount} ${participationCount === 1 ? "visita registrada" : "visitas registradas"}`;
    const totalVisitLabel = `${totalVisitCount} ${totalVisitCount === 1 ? "visita total" : "visitas totales"}`;
    const visitIcon = '<span class="friend-inline-icon" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4v6l4 2"/><circle cx="10" cy="10" r="7"/></svg></span>';
    const totalVisitIcon = '<span class="friend-inline-icon" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.5h12"/><path d="M4 10h12"/><path d="M4 13.5h8"/></svg></span>';
    const reachIcon = '<span class="friend-inline-icon" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="6"/><circle cx="10" cy="10" r="2"/><path d="M15.5 4.5l-2.5 2.5"/></svg></span>';
    const sundayIcon = '<span class="friend-inline-icon" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5 10 4l6 5.5"/><path d="M6 8.5V16h8V8.5"/><path d="M9 16v-3h2v3"/></svg></span>';
    const inviteIcon = '<span class="friend-inline-icon" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="3"/><path d="M2.5 16a5 5 0 0 1 9 0"/><path d="M13 7h4M15 5v4"/></svg></span>';
    return `
      <article class="friend-process-item">
        <div class="friend-process-head">
          <div>
            <strong class="friend-process-name">${escapeHtml(friend.name)}</strong>
          </div>
          <span class="friend-process-status ${statusCls}">${escapeHtml(statusLabel)}</span>
        </div>
        <div class="friend-process-times">${visitIcon}${escapeHtml(processLabel)}</div>
        ${totalVisitCount > participationCount ? `<div class="friend-process-sub friend-process-total-visits">${totalVisitIcon}Histórico total: ${escapeHtml(totalVisitLabel)}</div>` : ""}
        <div class="friend-process-meta">
          <div class="friend-process-statsbar">
            <span class="friend-process-stat">${reachIcon}Alcance: ${escapeHtml(String(friend.reachCount || 0))}</span>
            <span class="friend-process-stat-sep" aria-hidden="true">•</span>
            <span class="friend-process-stat">${sundayIcon}Culto: ${escapeHtml(String(friend.sundayCount || 0))}</span>
          </div>
          ${friend.lateEntry ? '<span class="count-chip friend-chip-late">ANOTAR tardío:1</span>' : ''}
        </div>
        <div class="friend-process-sub friend-process-date">${escapeHtml(formatTrackingRangeLabel(friend.entryDate, friend.lastReportDate))}</div>
        <div class="friend-process-sub friend-process-footer">
          <span class="friend-process-footer-main">${inviteIcon}Invitó: ${escapeHtml(friend.invitedBy || "—")}</span>
          <span class="friend-process-footer-actions">
            <button type="button" class="friend-process-detail-btn" data-action="friend-process-detail" data-friend-name="${escapeHtml(friend.name)}" data-friend-key="${escapeHtml(normalizeVisitorName(friend.name))}" data-friend-cell="${escapeHtml(String(friend.cellNumber || ""))}">Detalle</button>
            ${showCellBadge ? `<span class="friend-process-cell-badge friend-process-footer-badge">Célula ${escapeHtml(String(friend.cellNumber))}</span>` : ""}
          </span>
        </div>
      </article>
    `;
  };  

  const renderRestorationCard = (visitor, options = {}) => {
    const showCellBadge = Boolean(options.showCellBadge) && !!String(visitor.cellNumber || "").trim();
    const visitLabel = `${visitor.totalVisits || 0} ${(visitor.totalVisits || 0) === 1 ? "visita registrada" : "visitas registradas"}`;
    const visitIcon = '<span class="friend-inline-icon" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4v6l4 2"/><circle cx="10" cy="10" r="7"/></svg></span>';
    const reachIcon = '<span class="friend-inline-icon" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="10" r="6"/><circle cx="10" cy="10" r="2"/><path d="M15.5 4.5l-2.5 2.5"/></svg></span>';
    const sundayIcon = '<span class="friend-inline-icon" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5 10 4l6 5.5"/><path d="M6 8.5V16h8V8.5"/><path d="M9 16v-3h2v3"/></svg></span>';
    const inviteIcon = '<span class="friend-inline-icon" aria-hidden="true"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="7" cy="7" r="3"/><path d="M2.5 16a5 5 0 0 1 9 0"/><path d="M13 7h4M15 5v4"/></svg></span>';
    return `
      <article class="friend-process-item friend-restoration-item">
        <div class="friend-process-head">
          <div>
            <strong class="friend-process-name">${escapeHtml(visitor.name)}</strong>
          </div>
          <span class="friend-process-status friend-restoration-status">Restauración</span>
        </div>
        <div class="friend-process-times">${visitIcon}${escapeHtml(visitLabel)}</div>
        <div class="friend-process-meta">
          <div class="friend-process-statsbar">
            <span class="friend-process-stat">${reachIcon}Alcance: ${escapeHtml(String(visitor.reachCount || 0))}</span>
            <span class="friend-process-stat-sep" aria-hidden="true">•</span>
            <span class="friend-process-stat">${sundayIcon}Culto: ${escapeHtml(String(visitor.sundayCount || 0))}</span>
          </div>
        </div>
        <div class="friend-process-sub friend-process-date">${escapeHtml(formatTrackingRangeLabel(visitor.firstReportDate, visitor.lastReportDate))}</div>
        <div class="friend-process-sub friend-process-footer">
          <span class="friend-process-footer-main">${inviteIcon}Invitó: ${escapeHtml(visitor.invitedBy || "—")}</span>
          <span class="friend-process-footer-actions">
            <button type="button" class="friend-process-detail-btn" data-action="friend-process-detail" data-friend-name="${escapeHtml(visitor.name)}" data-friend-key="${escapeHtml(normalizeVisitorName(visitor.name))}" data-friend-cell="${escapeHtml(String(visitor.cellNumber || ""))}">Detalle</button>
            ${showCellBadge ? `<span class="friend-process-cell-badge friend-process-footer-badge">Célula ${escapeHtml(String(visitor.cellNumber))}</span>` : ""}
          </span>
        </div>
      </article>
    `;
  };

  const renderProcessControlCard = (entry, options = {}) => {
    const showCellBadge = Boolean(options.showCellBadge) && !!String(entry.cellNumber || "").trim();
    const statusClass = entry.statusKey === "complete"
      ? "is-complete"
      : entry.statusKey === "outside"
        ? "is-outside"
        : entry.statusKey === "progress"
          ? "is-progress"
          : "is-pending";
    const cohortLabel = entry.noted ? (entry.lateEntry ? "Anotado tardío" : "Anotado") : "No anotado";
    const milestoneItems = [
      { label: cohortLabel, done: entry.noted, accent: entry.noted ? "is-done" : "is-off" },
      { label: "Levántate", done: entry.levantate, accent: entry.levantate ? "is-done" : "is-off" },
      { label: "Restauración", done: entry.restauracion, accent: entry.restauracion ? "is-done" : "is-off" },
      { label: "Cierre sem. 16", done: entry.cycleClosed, accent: entry.cycleClosed ? "is-done" : "is-off" },
    ];
    const missingText = entry.pendingSteps?.length ? entry.pendingSteps.join(", ") : "Ninguno";
    const cycleText = entry.processCount > 1
      ? `${entry.processCount} ciclos en histórico`
      : `${entry.processCount || 0} ciclo${entry.processCount === 1 ? " en histórico" : "s"}`;
    return `
      <article class="friend-process-item friend-control-item">
        <div class="friend-control-main">
          <div class="friend-process-head friend-control-row-head">
            <div class="friend-control-heading">
              <strong class="friend-process-name">${escapeHtml(entry.name)}</strong>
              ${entry.processCount > 1 ? `<span class="friend-control-cycle-badge is-repeat">${escapeHtml(cycleText)}</span>` : ""}
            </div>
            <span class="friend-process-status friend-process-status-control ${statusClass}">${escapeHtml(entry.statusLabel)}</span>
          </div>
          <div class="friend-control-summary">
            <div class="friend-control-summary-main">${entry.complete ? "Trayecto cubierto" : `Le falta: ${escapeHtml(missingText)}`}</div>
            <div class="friend-control-summary-sub">Alcance ${escapeHtml(String(entry.reachCount || 0))} · Culto ${escapeHtml(String(entry.sundayCount || 0))} · Semana máx ${escapeHtml(String(entry.currentWeek || 0))}</div>
          </div>
          <div class="friend-control-milestones">
            ${milestoneItems.map((milestone) => `
              <span class="friend-control-milestone ${milestone.accent}">${escapeHtml(milestone.label)}</span>
            `).join("")}
          </div>
        </div>
        <div class="friend-control-side">
          <span class="friend-control-footer-meta">${escapeHtml(formatTrackingRangeLabel(entry.firstReportDate, entry.lastReportDate))}</span>
          <span class="friend-process-footer-actions friend-control-side-actions">
            <button type="button" class="friend-process-detail-btn" data-action="friend-process-detail" data-friend-name="${escapeHtml(entry.name)}" data-friend-key="${escapeHtml(normalizeVisitorName(entry.name))}" data-friend-cell="${escapeHtml(String(entry.cellNumber || ""))}">Detalle</button>
            ${showCellBadge ? `<span class="friend-process-cell-badge friend-process-footer-badge">Célula ${escapeHtml(String(entry.cellNumber))}</span>` : ""}
          </span>
        </div>
      </article>
    `;
  };

  const distinctCellNumbers = [...new Set(sortedFriends.map(friend => String(friend.cellNumber || "").trim()).filter(Boolean))];
  const shouldGroupByCell = activeScope !== "cell" && distinctCellNumbers.length > 1;
  friendTrackingFriendsList.classList.toggle("is-grouped", shouldGroupByCell);

  if (!sortedFriends.length) {
    friendTrackingFriendsList.innerHTML = '<div class="empty-state" style="padding:16px 0">Sin amigos en seguimiento para este alcance.</div>';
  } else if (!shouldGroupByCell) {
    const showCellBadge = activeScope !== "cell" && distinctCellNumbers.length === 1;
    friendTrackingFriendsList.innerHTML = sortedFriends.map(friend => renderFriendProcessCard(friend, { showCellBadge })).join("");
  } else {
    const groupedFriends = new Map();
    sortedFriends.forEach(friend => {
      const cellNumber = String(friend.cellNumber || "").trim() || "Sin célula";
      if (!groupedFriends.has(cellNumber)) groupedFriends.set(cellNumber, []);
      groupedFriends.get(cellNumber).push(friend);
    });

    const orderedGroupedFriends = [...groupedFriends.entries()].sort(([leftCell], [rightCell]) => {
      const leftIsNumeric = /^\d+$/.test(leftCell);
      const rightIsNumeric = /^\d+$/.test(rightCell);
      if (leftIsNumeric && rightIsNumeric) return Number(leftCell) - Number(rightCell);
      if (leftIsNumeric) return -1;
      if (rightIsNumeric) return 1;
      return leftCell.localeCompare(rightCell, "es", { numeric: true, sensitivity: "base" });
    });

    friendTrackingFriendsList.innerHTML = orderedGroupedFriends.map(([cellNumber, items]) => {
      const label = /^\d+$/.test(cellNumber) ? `Célula ${cellNumber}` : cellNumber;
      const subtitle = `${items.length} ${items.length === 1 ? "amigo en proceso" : "amigos en proceso"}`;
      return `
        <details class="friend-process-group">
          <summary class="friend-process-group-summary">
            <div class="friend-process-group-heading">
              <strong class="friend-process-group-title">${escapeHtml(label)}</strong>
              <span class="friend-process-group-count">${escapeHtml(subtitle)}</span>
            </div>
            <span class="friend-process-group-toggle" aria-hidden="true">Ver</span>
          </summary>
          <div class="friend-process-group-grid">
            ${items.map(friend => renderFriendProcessCard(friend)).join("")}
          </div>
        </details>
      `;
    }).join("");
  }

  const restorationCellNumbers = [...new Set(restorationVisitors.map(visitor => String(visitor.cellNumber || "").trim()).filter(Boolean))];
  const shouldGroupRestorationByCell = activeScope !== "cell" && restorationCellNumbers.length > 1;
  friendTrackingRestorationList.classList.toggle("is-grouped", shouldGroupRestorationByCell);

  if (!restorationVisitors.length) {
    friendTrackingRestorationList.innerHTML = '<div class="empty-state" style="padding:16px 0">Sin visitas en restauración para este alcance.</div>';
  } else if (!shouldGroupRestorationByCell) {
    const showCellBadge = activeScope !== "cell" && restorationCellNumbers.length === 1;
    friendTrackingRestorationList.innerHTML = restorationVisitors.map(visitor => renderRestorationCard(visitor, { showCellBadge })).join("");
  } else {
    const groupedRestoration = new Map();
    restorationVisitors.forEach(visitor => {
      const cellNumber = String(visitor.cellNumber || "").trim() || "Sin célula";
      if (!groupedRestoration.has(cellNumber)) groupedRestoration.set(cellNumber, []);
      groupedRestoration.get(cellNumber).push(visitor);
    });

    const orderedGroupedRestoration = [...groupedRestoration.entries()].sort(([leftCell], [rightCell]) => {
      const leftIsNumeric = /^\d+$/.test(leftCell);
      const rightIsNumeric = /^\d+$/.test(rightCell);
      if (leftIsNumeric && rightIsNumeric) return Number(leftCell) - Number(rightCell);
      if (leftIsNumeric) return -1;
      if (rightIsNumeric) return 1;
      return leftCell.localeCompare(rightCell, "es", { numeric: true, sensitivity: "base" });
    });

    friendTrackingRestorationList.innerHTML = orderedGroupedRestoration.map(([cellNumber, items]) => {
      const label = /^\d+$/.test(cellNumber) ? `Célula ${cellNumber}` : cellNumber;
      const subtitle = `${items.length} ${items.length === 1 ? "visita en restauración" : "visitas en restauración"}`;
      return `
        <details class="friend-process-group friend-restoration-group">
          <summary class="friend-process-group-summary">
            <div class="friend-process-group-heading">
              <strong class="friend-process-group-title">${escapeHtml(label)}</strong>
              <span class="friend-process-group-count">${escapeHtml(subtitle)}</span>
            </div>
            <span class="friend-process-group-toggle" aria-hidden="true">Ver</span>
          </summary>
          <div class="friend-process-group-grid">
            ${items.map(visitor => renderRestorationCard(visitor)).join("")}
          </div>
        </details>
      `;
    }).join("");
  }

  const controlCellNumbers = [...new Set(processControlEntries.map((entry) => String(entry.cellNumber || "").trim()).filter(Boolean))];
  const shouldGroupControlByCell = activeScope !== "cell" && controlCellNumbers.length > 1;
  friendTrackingControlList.classList.toggle("is-grouped", shouldGroupControlByCell);

  if (!processControlEntries.length) {
    friendTrackingControlList.innerHTML = '<div class="empty-state" style="padding:16px 0">Todavía no hay personas suficientes para comparar cohorte y hitos en este alcance.</div>';
  } else if (!shouldGroupControlByCell) {
    const showCellBadge = activeScope !== "cell" && controlCellNumbers.length === 1;
    friendTrackingControlList.innerHTML = processControlEntries.map((entry) => renderProcessControlCard(entry, { showCellBadge })).join("");
  } else {
    const groupedControl = new Map();
    processControlEntries.forEach((entry) => {
      const cellNumber = String(entry.cellNumber || "").trim() || "Sin célula";
      if (!groupedControl.has(cellNumber)) groupedControl.set(cellNumber, []);
      groupedControl.get(cellNumber).push(entry);
    });

    const orderedGroupedControl = [...groupedControl.entries()].sort(([leftCell], [rightCell]) => {
      const leftIsNumeric = /^\d+$/.test(leftCell);
      const rightIsNumeric = /^\d+$/.test(rightCell);
      if (leftIsNumeric && rightIsNumeric) return Number(leftCell) - Number(rightCell);
      if (leftIsNumeric) return -1;
      if (rightIsNumeric) return 1;
      return leftCell.localeCompare(rightCell, "es", { numeric: true, sensitivity: "base" });
    });

    friendTrackingControlList.innerHTML = orderedGroupedControl.map(([cellNumber, items]) => {
      const label = /^\d+$/.test(cellNumber) ? `Célula ${cellNumber}` : cellNumber;
      const subtitle = `${items.length} ${items.length === 1 ? "caso" : "casos"}`;
      return `
        <details class="friend-process-group friend-control-group">
          <summary class="friend-process-group-summary">
            <div class="friend-process-group-heading">
              <strong class="friend-process-group-title">${escapeHtml(label)}</strong>
              <span class="friend-process-group-count">${escapeHtml(subtitle)}</span>
            </div>
            <span class="friend-process-group-toggle" aria-hidden="true">Ver</span>
          </summary>
          <div class="friend-process-group-grid">
            ${items.map((entry) => renderProcessControlCard(entry)).join("")}
          </div>
        </details>
      `;
    }).join("");
  }
}

async function loadFriendTrackingPanel() {
  if (!friendTrackingSummaryGrid) return;
  renderSegAccessScopeTabs();
  syncFriendTrackingCellFilter();
  const token = ++friendTrackingRenderToken;
  try {
    const params = getFriendTrackingQueryParams();
    const payload = await request(`/api/friend-tracking?${params.toString()}`);
    if (token !== friendTrackingRenderToken) return;
    renderFriendTrackingPanel(payload);
  } catch (err) {
    if (token !== friendTrackingRenderToken) return;
    friendTrackingScopeContext = null;
    const errorMessage = escapeHtml(err.message || "No se pudo cargar el seguimiento de amigos.");
    if (friendTrackingSummaryGrid) {
      friendTrackingSummaryGrid.innerHTML = "";
    }
    if (friendTrackingQuickChips) {
      friendTrackingQuickChips.innerHTML = "";
    }
    if (friendTrackingRestorationChips) {
      friendTrackingRestorationChips.innerHTML = "";
    }
    if (friendTrackingControlChips) {
      friendTrackingControlChips.innerHTML = "";
    }
    if (friendTrackingFriendsList) {
      friendTrackingFriendsList.innerHTML = `<div class="empty-state" style="padding:16px 0">${errorMessage}</div>`;
    }
    if (friendTrackingRestorationList) {
      friendTrackingRestorationList.innerHTML = `<div class="empty-state" style="padding:16px 0">${errorMessage}</div>`;
    }
    if (friendTrackingControlList) {
      friendTrackingControlList.innerHTML = `<div class="empty-state" style="padding:16px 0">${errorMessage}</div>`;
    }
    if (friendTrackingGoals) {
      friendTrackingGoals.innerHTML = `<div class="empty-state" style="padding:16px 0">${errorMessage}</div>`;
    }
  }
}

wireFriendTrackingDetailClick(friendTrackingFriendsList);
wireFriendTrackingDetailClick(friendTrackingRestorationList);
wireFriendTrackingDetailClick(friendTrackingControlList);

function renderSeguimiento(reports) {
  const cyclesList = document.querySelector("#seguimiento-cycles-list");
  const countChip  = document.querySelector("#seg-report-count");
  if (!cyclesList) return;
  renderSegAccessScopeTabs();
  reports = filterVisibleReports(reports);

  // Selector de alcance (cuatrimestre actual / todo el historial)
  const scopeSelect = document.querySelector("#seg-scope-select");
  if (scopeSelect) {
    if (scopeSelect.value !== seguimientoScope) scopeSelect.value = seguimientoScope;
    if (!scopeSelect.dataset.bound) {
      scopeSelect.dataset.bound = "1";
      scopeSelect.addEventListener("change", () => {
        const v = scopeSelect.value === "all" ? "all" : "current";
        seguimientoScope = v;
        try { localStorage.setItem("seguimientoScope", v); } catch (_) {}
        renderSeguimiento(reportsData);
      });
    }
  }

  const seguimientoScopeTabs = getUserScopeTabs();
  if (!activeDashboardScope || !seguimientoScopeTabs.some(tab => tab.key === activeDashboardScope)) {
    activeDashboardScope = getPreferredDashboardScope(currentUser, seguimientoScopeTabs);
  }

  // Filtrar por alcance del usuario
  reports = filterItemsByUserScope(reports, report => report.cellNumber || report.formData?.cellNumber, activeDashboardScope);

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

  const quarterLabel = q => q === "1" ? t('qrange.q1') : q === "2" ? t('qrange.q2') : t('qrange.q3');
  const quarterName  = q => q === "1" ? t('qname.q1') : q === "2" ? t('qname.q2') : t('qname.q3');
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
    const myCells = filterItemsByUserScope(catalogs.cells || [], cell => cell.cellNumber, activeDashboardScope);
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
    cyclesList.innerHTML = `<p class="empty-state" style="padding:16px 0">${t('rep.noCellsInScope')}</p>`;
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
        const totalDone = Object.values(byWeek).filter(r => !isReportVisuallyDraft(r)).length;

        const totalWeeks = getRcmTotalWeeks();
        const chips = Array.from({ length: totalWeeks }, (_, i) => {
          const w = String(i + 1);
          const info = getRcmWeekInfo(w);
          const rep = byWeek[w];
          const phaseKey = info ? phaseColors[info.phase] || "ganar" : "ganar";
          const verb = info?.verb || (Number(w) === totalWeeks ? "CIERRE" : "");
          const isEvent = info?.isEventWeek;
          if (rep) {
            const isDraft = isReportVisuallyDraft(rep);
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
            const rollover = new Date(now); rollover.setHours(0,0,0,0);
            const diff = (rollover.getDay() - wsd + 7) % 7;
            rollover.setDate(rollover.getDate() - diff);
            return (now.getTime() - rollover.getTime()) / 3600000 < graceHours;
          })();
          const wNum = Number(w);
          const minOpen = inGrace ? Math.max(1, realWeek - 1) : realWeek;
          const weekOpen = wNum >= minOpen && wNum <= realWeek;
          // Solo el lider de la celula (o admin) puede capturar el reporte
          // de esa celula. Supervisores ven la semana pendiente pero el chip
          // queda deshabilitado para evitar que entren a capturar un reporte
          // que no les pertenece.
          const canCapture = currentUser?.isAdmin
            || String(currentUser?.assignedCellNumber || "") === String(cell);
          if (weekOpen && canCapture) {
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
        const baptismCount = reps.reduce((s, r) => {
          const list = Array.isArray(r.formData?.baptisms) ? r.formData.baptisms : [];
          // Solo cuentan los bautismos cuya fecha real (baptismDate) cae en el
          // cuatrimestre de esta card. Un bautismo del 2026-04-30 capturado en
          // un reporte de mayo pertenece a Q1, no a Q2.
          return s + list.filter(b => String(getBaptismQuarter(b?.baptismDate)) === String(quarter)).length;
        }, 0);
        const baptismChip  = baptismCount > 0
          ? `<span class="cycle-baptism-chip" title="${t('baptism.cycleChipTitle')}">${t(baptismCount === 1 ? 'baptism.cycleChip' : 'baptism.cycleChipPlural', { n: baptismCount })}</span>`
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

  // ── Toggle de semana (esta / anterior) ────────────────────────────────────
  // Usa la semana real (ignora la gracia): durante gracia, "Esta semana" es la
  // nueva (puede estar vacía) y "Semana anterior" es la que se está capturando.
  const baseWeekNum = getQuarterWeekNumber();
  const offsetTabs  = document.getElementById("seg-week-offset-tabs");
  if (offsetTabs) {
    // Solo tiene sentido si hay una semana anterior dentro del mismo cuatrimestre.
    offsetTabs.hidden = baseWeekNum <= 1;
    if (offsetTabs.hidden) seguimientoWeekOffset = 0;
    // Obtener los verbos reales de la semana actual y anterior
    const verbActual = getRcmWeekInfo(baseWeekNum)?.verb || "Semana actual";
    const verbAnterior = getRcmWeekInfo(baseWeekNum - 1)?.verb || "Semana anterior";
    const tabButtons = offsetTabs.querySelectorAll("button[data-weekoff]");
    tabButtons.forEach(b => {
      const weekoff = parseInt(b.dataset.weekoff, 10) || 0;
      if (weekoff === 0) {
        b.textContent = verbActual;
      } else if (weekoff === -1) {
        b.textContent = verbAnterior;
      }
      b.classList.toggle("is-active", String(b.dataset.weekoff) === String(seguimientoWeekOffset));
    });
  }
  const effectiveWeek = Math.max(1, baseWeekNum + seguimientoWeekOffset);
  const isPrevWeek    = seguimientoWeekOffset === -1 && baseWeekNum > 1;
  // El label de la semana seleccionada también debe ser dinámico
  const weekLabel     = getRcmWeekInfo(effectiveWeek)?.verb || (isPrevWeek ? "Semana anterior" : "Semana actual");

  // ── Células pendientes y actividad de la semana actual ────────────────────
  if (dashboardPendingCells || dashboardRecentActivity) {
    const curWeek    = String(effectiveWeek);
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
    const draftCellSet = new Set(
      weeklyReps
        .filter(r => isReportVisuallyDraft(r))
        .map(r => String(r.cellNumber || r.formData?.cellNumber || ""))
    );
    const pendingCells = getScopedCells().filter(c => !reportedSet.has(String(c.cellNumber)));

    if (dashboardPendingEyebrow) {
      const scopeLabel = getDashboardScopeLabel();
      dashboardPendingEyebrow.textContent = scopeLabel ? `${weekLabel} · ${scopeLabel}` : weekLabel;
    }
    const rcsActivityEyebrow = document.getElementById("rcs-activity-eyebrow");
    if (rcsActivityEyebrow) rcsActivityEyebrow.textContent = isPrevWeek ? "Reportaron la semana anterior" : "Reportaron esta semana";
    const segTotalsEyebrow = document.getElementById("seg-totals-eyebrow");
    if (segTotalsEyebrow) segTotalsEyebrow.textContent = weekLabel;

    if (dashboardPendingCells) {
      dashboardPendingCells.innerHTML = pendingCells.length
        ? pendingCells.map(cell =>
            `<article class="dashboard-list-item"><strong>Célula ${escapeHtml(cell.cellNumber)}</strong><span>${escapeHtml(cell.networkName || t('cell.noNetwork'))} · Sector ${escapeHtml(cell.sector || "-")}</span></article>`
          ).join("")
        : `<div class="quick-list-empty">${t('dash.allCellsReported')}</div>`;
    }

    if (dashboardRecentActivity) {
      dashboardRecentActivity.innerHTML = weeklyReps.length
        ? weeklyReps.map((report, idx) => {
            const summary = getReportAttendanceSummary(report);
            return `<article class="activity-card activity-card-clickable" role="button" tabindex="0" data-report-idx="${idx}" title=t('dash.viewFullReport')>
              <div class="activity-card-head">
                <strong>Célula ${escapeHtml(String(report.cellNumber || report.formData?.cellNumber || "-"))}</strong>
                <span>Semana ${escapeHtml(getReportWeek(report) || "-")}</span>
              </div>
              <p>${escapeHtml(report.leaderName || report.formData?.leaderName || t('cell.noLeader'))}</p>
              <div class="activity-metrics">
                <span>${escapeHtml(String(summary.present))} asistentes</span>
                <span>${escapeHtml(String(summary.visitors))} visitas</span>
              </div>
              <span class="activity-card-hint">Toca para ver detalle →</span>
            </article>`;
          }).join("")
        : `<div class="quick-list-empty">${t('dash.noneSubmittedYet')}</div>`;
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
              const leader = r.leaderName || r.formData?.leaderName || "-";
              const cell   = r.cellNumber || r.formData?.cellNumber || "-";
              const initials = leader.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w.charAt(0).toUpperCase()).join(".") + (leader && leader !== "-" ? "." : "");
              const isDraft = isReportVisuallyDraft(r);
              const chipCls = isDraft ? "rcs-chip-draft" : "rcs-chip-done";
              const draftMark = isDraft ? " · borrador" : "";
              const titleTxt = isDraft
                ? `Borrador en curso de Célula ${cell}`
                : `Ver Célula ${cell} en el grid`;
              return `<span class="rcs-chip ${chipCls}" data-goto-cell="${escapeHtml(String(cell))}" role="button" tabindex="0" title="${escapeHtml(titleTxt)} — ${escapeHtml(leader)}">Célula ${escapeHtml(String(cell))}<span class="rcs-leader-full"> · ${escapeHtml(leader)}</span>${draftMark}</span>`;
            }).join("")
          : `<span class="rcs-empty">${t('dash.noneYet')}</span>`;

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
    const isCurrentWeekScope = !isPrevWeek;
    renderSegTotalsPanel(weeklyReps, { isCurrentWeekScope });
  }
}

// ── Resumen por supervisor (sub-tab "supervisor") ──────────────────────────
// Vista read-only que suma todas las células de un supervisor para una semana
// dada. Es la base del flujo de aprobación supervisor → coordinador (los
// botones de aprobación se agregarán en el siguiente paso).
let supervisorViewState = { supervisorName: null, week: null };

function getVisibleSupervisors() {
  const supers = (catalogs.people || [])
    .filter(p => p.supervisorSector)
    .map(p => ({ name: p.name, sector: p.supervisorSector }));
  if (currentUser?.isAdmin) return supers;
  if (currentUser?.isSupervisor && currentUser.supervisedSector) {
    return supers.filter(s => s.sector === currentUser.supervisedSector);
  }
  return [];
}

function getCellsForSupervisor(supervisor) {
  if (!supervisor) return [];
  return (catalogs.cells || [])
    .filter(c => String(c.sector || "") === String(supervisor.sector || ""))
    .sort((a, b) => Number(a.cellNumber) - Number(b.cellNumber));
}

function renderSeguimientoSupervisor(reports) {
  const body = document.getElementById("seg-supervisor-body");
  const supSelect = document.getElementById("sup-supervisor-select");
  const weekSelect = document.getElementById("sup-week-select");
  if (!body || !supSelect || !weekSelect) return;

  const supervisors = getVisibleSupervisors();
  if (!supervisors.length) {
    supSelect.innerHTML = "";
    weekSelect.innerHTML = "";
    body.innerHTML = `<p class="empty-state" style="padding:16px 0">${t('sup.noSupervisors')}</p>`;
    return;
  }

  // Poblar selector de supervisores
  if (!supervisorViewState.supervisorName ||
      !supervisors.some(s => s.name === supervisorViewState.supervisorName)) {
    supervisorViewState.supervisorName = supervisors[0].name;
  }
  supSelect.innerHTML = supervisors.map(s =>
    `<option value="${escapeHtml(s.name)}"${s.name === supervisorViewState.supervisorName ? " selected" : ""}>${escapeHtml(s.name)} · Sector ${escapeHtml(s.sector)}</option>`
  ).join("");
  if (currentUser?.isAdmin && supervisors.length > 1) {
    supSelect.disabled = false;
  } else {
    supSelect.disabled = true;
  }

  // Poblar selector de semana — solo semanas ya transcurridas.
  // Por defecto seleccionamos la semana anterior (los líderes reportan la
  // semana pasada). La semana en curso se omite porque aún no tiene datos
  // cargados completos.
  const totalWeeks = getRcmTotalWeeks();
  const currentWeekNum = Math.max(1, Math.min(totalWeeks, getQuarterWeekNumber()));
  const lastSelectable = Math.max(1, currentWeekNum - 1); // semana anterior (o 1 si vamos en sem.1)
  if (!supervisorViewState.week || Number(supervisorViewState.week) > lastSelectable) {
    supervisorViewState.week = String(lastSelectable);
  }
  weekSelect.innerHTML = Array.from({ length: lastSelectable }, (_, i) => {
    const w = String(i + 1);
    const info = getRcmWeekInfo(w);
    const verb = info?.verb ? ` · ${info.verb}` : "";
    return `<option value="${w}"${w === supervisorViewState.week ? " selected" : ""}>Sem. ${w}${verb}</option>`;
  }).join("");

  // Bind listeners (una sola vez)
  if (!supSelect.dataset.bound) {
    supSelect.dataset.bound = "1";
    supSelect.addEventListener("change", () => {
      supervisorViewState.supervisorName = supSelect.value;
      renderSeguimientoSupervisor(reportsData);
    });
  }
  if (!weekSelect.dataset.bound) {
    weekSelect.dataset.bound = "1";
    weekSelect.addEventListener("change", () => {
      supervisorViewState.week = weekSelect.value;
      renderSeguimientoSupervisor(reportsData);
    });
  }
  if (!body.dataset.apprBound) {
    body.dataset.apprBound = "1";
    body.addEventListener("click", (ev) => {
      // Botón ojito → abrir vista previa del reporte en modal
      const peek = ev.target.closest("[data-sup-view-report]");
      if (peek) {
        const reportId = peek.dataset.supViewReport;
        openSupervisorReportPreview(reportId);
        return;
      }
      // Descargar tarjeta del supervisor como PNG
      const dlBtn = ev.target.closest("[data-sup-download]");
      if (dlBtn) {
        const capture = dlBtn.closest('.sup-capture');
        const sector  = capture?.dataset.supSector || 'supervisor';
        const week    = capture?.dataset.supWeek   || '';
        downloadElementAsPng(capture, `reporte-${sanitizeFileName(sector)}-S${week}.png`);
        return;
      }
      // Compartir resumen del supervisor por WhatsApp (imagen + texto)
      const waBtn = ev.target.closest("[data-sup-whatsapp]");
      if (waBtn) {
        const capture = waBtn.closest('.sup-capture');
        const sector  = capture?.dataset.supSector || '';
        const week    = capture?.dataset.supWeek   || supervisorViewState.week;
        const sup = supervisors.find(s => String(s.sector) === String(sector));
        if (sup) {
          const text = buildSupervisorWhatsAppText(sup, reportsData, week);
          const fname = `reporte-${sanitizeFileName(sector)}-S${week}.png`;
          shareElementWithText(capture, text, fname);
        }
        return;
      }
      const btn = ev.target.closest("[data-appr-action]");
      if (!btn) return;
      const action = btn.dataset.apprAction;
      const sector = btn.dataset.apprSector;
      const week   = btn.dataset.apprWeek;
      const year    = String(new Date().getFullYear());
      const quarter = String(getCurrentQuarter());
      btn.disabled = true;
      postApprovalAction(sector, week, year, quarter, action).finally(() => {
        btn.disabled = false;
      });
    });
  }

  const supervisor = supervisors.find(s => s.name === supervisorViewState.supervisorName);
  const cells = getCellsForSupervisor(supervisor);
  if (!cells.length) {
    body.innerHTML = `<p class="empty-state" style="padding:16px 0">${t('sup.noCells')}</p>`;
    return;
  }

  body.innerHTML = renderSupervisorSummaryTable(supervisor, cells, reports, supervisorViewState.week);
}

function renderSupervisorSummaryTable(supervisor, cells, reports, week) {
  const weekStr = String(week);
  const curYear = String(new Date().getFullYear());
  const curQuarter = String(getCurrentQuarter());
  const cellNums = cells.map(c => String(c.cellNumber));
  const cellSet = new Set(cellNums);

  // Reportes de las células de este supervisor en la semana indicada
  const visibleReports = (reports || []).filter(r => {
    const cn = String(r.cellNumber || r.formData?.cellNumber || "");
    if (!cellSet.has(cn)) return false;
    if (getReportWeek(r) !== weekStr) return false;
    if (getReportYear(r) !== curYear) return false;
    if (String(getReportQuarter(r)) !== curQuarter) return false;
    return true;
  });

  // Indexa reporte por número de célula (puede no haber para algunas)
  const byCell = new Map();
  visibleReports.forEach(r => {
    byCell.set(String(r.cellNumber || r.formData?.cellNumber || ""), r);
  });

  // Métricas por célula
  const perCellMetrics = cellNums.map(cn => {
    const rep = byCell.get(cn);
    return rep ? aggregateMetrics([rep]) : null;
  });

  // Acumulado total
  const totals = aggregateMetrics(visibleReports);

  // Verbo de la semana
  const weekInfo = getRcmWeekInfo(weekStr);
  const verbLabel = weekInfo?.verb || "—";

  // Helpers de render
  const cellHeaderCols = cellNums.map(cn => {
    const rep = byCell.get(cn);
    const eye = rep
      ? `<button type="button" class="sup-cell-peek" data-sup-view-report="${escapeHtml(String(rep.id))}" title="${t('sup.viewReport')}" aria-label="${t('sup.viewReport')}">🔍</button>`
      : "";
    return `<th class="sup-cell-col" data-cell="${escapeHtml(cn)}"><span class="sup-cell-col-num">${escapeHtml(cn)}</span>${eye}</th>`;
  }).join("");
  const moneyFmt = (n) => `$${Number(n || 0).toFixed(2)}`;

  const rowNum = (label, getter, opts = {}) => {
    const tds = perCellMetrics.map((m, i) => {
      const cn = cellNums[i];
      if (!m) return `<td class="sup-empty" data-cell="${escapeHtml(cn)}" title="${t('sup.noReportCellTitle')}">—</td>`;
      const v = getter(m);
      return `<td data-cell="${escapeHtml(cn)}">${opts.money ? moneyFmt(v) : escapeHtml(String(v))}</td>`;
    }).join("");
    const total = visibleReports.length
      ? (opts.money ? moneyFmt(getter(totals)) : escapeHtml(String(getter(totals))))
      : "—";
    return `<tr>
      <td class="sup-metric-label">${escapeHtml(label)}</td>
      ${tds}
      <td class="sup-total-col"><strong>${total}</strong></td>
    </tr>`;
  };

  const sectionHeader = (label, modifier) => `
    <tr class="sup-section-header sup-section-${modifier}">
      <td colspan="${cellNums.length + 2}">${escapeHtml(label)}</td>
    </tr>`;

  const reportedCount = visibleReports.length;
  const totalCells    = cellNums.length;

  // ── Aprobación (sector,año,quarter,semana) ────────────────────────────────
  const approval = findApproval(supervisor.sector, weekStr, curYear, curQuarter);
  const state    = approval?.state || "pendiente";
  const isAdmin = !!(currentUser && currentUser.isAdmin);
  const isSupervisor = !!(
    currentUser &&
    currentUser.isSupervisor &&
    String(currentUser.supervisedSector || "") === String(supervisor.sector)
  );
  // Rol efectivo para esta vista: si es supervisor del sector, actúa como
  // supervisor; si no, pero es admin/coordinador, actúa como coordinador.
  const isCoordinatorOnly = isAdmin && !isSupervisor;
  const stateClassMap = {
    pendiente:             'pending',
    revisado_supervisor:   'reviewed',
    aprobado_coordinador:  'approved',
  };
  const stateLabelMap = {
    pendiente:            t('appr.state.pending'),
    revisado_supervisor:  t('appr.state.reviewed'),
    aprobado_coordinador: t('appr.state.approved'),
  };
  const stateBadge = `<span class="appr-badge appr-badge--${stateClassMap[state]}">${escapeHtml(stateLabelMap[state] || state)}</span>`;

  const metaLines = [];
  if (approval?.supervisorName && approval?.supervisorAt) {
    metaLines.push(`<span class="appr-meta-line">${t('appr.reviewedBy', { who: escapeHtml(approval.supervisorName), when: escapeHtml(approval.supervisorAt.slice(0,16).replace('T',' ')) })}</span>`);
  }
  if (approval?.coordinatorName && approval?.coordinatorAt) {
    metaLines.push(`<span class="appr-meta-line">${t('appr.approvedBy', { who: escapeHtml(approval.coordinatorName), when: escapeHtml(approval.coordinatorAt.slice(0,16).replace('T',' ')) })}</span>`);
  }

  const buttons = [];
  // Solo el supervisor del sector puede revisar y enviar al coordinador
  if (state === 'pendiente' && isSupervisor) {
    buttons.push(`<button type="button" class="btn btn-sm btn-success" data-appr-action="supervisor_review" data-appr-sector="${escapeHtml(supervisor.sector)}" data-appr-week="${escapeHtml(weekStr)}">✓ ${t('appr.btnReview')}</button>`);
  }
  // Solo el coordinador aprueba (cuando el supervisor ya envió)
  if (state === 'revisado_supervisor' && isAdmin) {
    buttons.push(`<button type="button" class="btn btn-sm btn-success" data-appr-action="coordinator_approve" data-appr-sector="${escapeHtml(supervisor.sector)}" data-appr-week="${escapeHtml(weekStr)}">✓ ${t('appr.btnApprove')}</button>`);
  }
  // Regresar a pendiente: supervisor (si está enviado) o admin (cualquier estado ≠ pendiente)
  if (state !== 'pendiente' && ((isSupervisor && state === 'revisado_supervisor') || isAdmin)) {
    buttons.push(`<button type="button" class="btn btn-sm btn-ghost" data-appr-action="return_pending" data-appr-sector="${escapeHtml(supervisor.sector)}" data-appr-week="${escapeHtml(weekStr)}">${t('appr.btnReturn')}</button>`);
  }

  const approvalBar = `
    <div class="appr-bar appr-bar--${stateClassMap[state]}">
      <div class="appr-status">
        <span class="appr-status-label">${t('appr.status')}:</span>
        ${stateBadge}
        ${metaLines.length ? `<span class="appr-meta">${metaLines.join('<span class="appr-meta-sep">·</span>')}</span>` : ''}
      </div>
      <div class="appr-actions">${buttons.join('')}</div>
    </div>`;

  // Si el usuario actúa solo como coordinador y el supervisor aún no ha enviado,
  // ocultamos los datos detallados — el coordinador solo debe ver lo que el
  // supervisor ya revisó y envió.
  const hideDetailForCoordinator = isCoordinatorOnly && state === 'pendiente';

  const header = `
    <div class="sup-card-head">
      <div class="sup-card-meta">
        <span class="sup-meta-label">${t('sup.supervisor')}:</span>
        <strong>${escapeHtml(supervisor.name)}</strong>
        <span class="sup-meta-sep">·</span>
        <span class="sup-meta-label">${t('sup.sector')}:</span>
        <strong>${escapeHtml(supervisor.sector)}</strong>
        <span class="sup-meta-sep">·</span>
        <span class="sup-meta-label">${t('sup.verb')}:</span>
        <strong>${escapeHtml(verbLabel)}</strong>
      </div>
      <div class="sup-card-actions">
        <span class="sup-coverage-chip">${reportedCount}/${totalCells} ${t('sup.cellsReported')}</span>
        <button type="button" class="btn btn-sm btn-ghost" data-sup-download title="${t('share.downloadPng')}" aria-label="${t('share.downloadPng')}">${downloadIconSvg(14)} PNG</button>
        <button type="button" class="btn btn-sm btn-ghost" data-sup-whatsapp title="${t('share.whatsapp')}" aria-label="${t('share.whatsapp')}">${whatsappIconSvg(14)} WhatsApp</button>
      </div>
    </div>
    ${approvalBar}`;

  if (hideDetailForCoordinator) {
    return `<div class="sup-capture" data-sup-sector="${escapeHtml(supervisor.sector)}" data-sup-week="${escapeHtml(weekStr)}">${header}
      <div class="appr-waiting">
        <div class="appr-waiting-icon">⏳</div>
        <p class="appr-waiting-title">${t('appr.waitingTitle')}</p>
        <p class="appr-waiting-msg">${t('appr.waitingMsg', { who: escapeHtml(supervisor.name) })}</p>
      </div></div>`;
  }

  return `<div class="sup-capture" data-sup-sector="${escapeHtml(supervisor.sector)}" data-sup-week="${escapeHtml(weekStr)}">${header}
    <div class="sup-table-wrap">
      <table class="sup-table">
        <thead>
          <tr>
            <th class="sup-metric-label">${t('sup.meetings')}</th>
            <th colspan="${cellNums.length}" class="sup-cells-group">${t('sup.cell')}</th>
            <th rowspan="2" class="sup-total-col">${t('sup.total')}</th>
          </tr>
          <tr>
            <th></th>
            ${cellHeaderCols}
          </tr>
        </thead>
        <tbody>
          ${sectionHeader(t('dash.planning'), 'planning')}
          ${rowNum(t('sup.membersBaptized'),   m => m.cellMembersUnique)}
          ${rowNum(t('sup.membersAttending'),  m => m.planningPresent)}
          ${rowNum(t('sup.membersAbsent'),     m => m.planningAbsent)}

          ${sectionHeader(t('dash.reach'), 'reach')}
          ${rowNum(t('sup.membersAttending'),  m => m.reachMembers)}
          ${rowNum(t('sup.membersPrivileged'), m => m.reachPrivileged)}
          ${rowNum(t('sup.friendsPresent'),    m => m.reachFriends)}
          ${rowNum(t('sup.restorPresent'),     m => m.reachRestor)}
          ${rowNum(t('sup.kidsPresent'),       m => m.reachKids)}
          ${rowNum(t('sup.offering'),          m => m.offering, { money: true })}

          ${sectionHeader(t('sup.cultoInspirador'), 'sunday')}
          ${rowNum(t('sup.membersAttending'),  m => m.sundayMembers)}
          ${rowNum(t('sup.friends'),           m => m.sundayFriends)}
          ${rowNum(t('sup.restor'),            m => m.sundayRestor)}
          ${rowNum(t('sup.kidsPresent'),       m => m.sundayKids)}
        </tbody>
      </table>
    </div>
    <p class="sup-footnote">${t('sup.footnote')}</p>
  </div>`;
}

function compactPersonName(full) {
  const parts = String(full || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
}

function renderReportCellMembers(cell) {
  const savedData = arguments[1] || null;
  const members = getReportMemberRoster(cell, savedData?.memberAttendance, savedData);
  const kids = getCellKids(cell);
  memberCountChip.textContent = `${members.length} miembro${members.length === 1 ? "" : "s"}`;
  reportMemberPills.innerHTML = members.length
    ? members.map((member) => `<span class="pill pill-compact" title="${escapeHtml(member.name)}">${escapeHtml(compactPersonName(member.name))}</span>`).join("")
    : '<span class="member-admin-caption">Sin miembros asignados.</span>';
  if (reportKidPills) {
    reportKidPills.innerHTML = kids.length
      ? kids.map((kid) => `<span class="pill pill-compact" title="${escapeHtml(kid.name)}">${escapeHtml(compactPersonName(kid.name))}${getGuardianDisplay(kid) ? ` · ${escapeHtml(compactPersonName(getGuardianDisplay(kid)))}` : ""}</span>`).join("")
      : '<span class="member-admin-caption">Sin niños precargados.</span>';
  }
}

function renderAdminCellMembers(cell) {
  if (memberList) memberList.dataset.cellId = cell?.id ? String(cell.id) : "";
  if (selectedCellName) selectedCellName.textContent = cell ? t('cell.numbered', { n: cell.cellNumber }) : "";

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
        { key: "host",      label: t('preview.host'), cls: "fn-tag--host"      },
      ];
      cellMemberRoleTable.innerHTML = `
        <table class="catalog-table cell-role-table">
          <thead><tr><th>Nombre</th><th>Rol en la célula</th><th>Asistencia semanal</th><th></th></tr></thead>
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
              const attendanceMode = normalizeCellMemberAttendanceMode(member.attendanceMode);
              const attendanceDefaults = normalizeCellMemberAttendanceDefaults(member.attendanceDefaults, attendanceMode);
              return `<tr>
                <td><strong>${escapeHtml(member.name)}</strong></td>
                <td>${roleChips}</td>
                <td class="cell-member-mode-cell">
                  <div class="cell-member-mode-wrap">
                    <select class="cell-member-mode-select" data-action="set-membership-mode" data-person-id="${mid}" aria-label="Asistencia semanal de ${escapeHtml(member.name)}">
                      ${renderCellMemberAttendanceModeOptions(attendanceMode)}
                    </select>
                    <div class="cell-member-defaults"${attendanceMode === "justified_default" ? "" : " hidden"}>
                      <span>${escapeHtml(getAttendanceDefaultsSummary(attendanceDefaults, attendanceMode) ? "Justificar en:" : "Justificar en:")}</span>
                      <label><input type="checkbox" data-action="set-membership-default" data-person-id="${mid}" data-stage="planning"${attendanceDefaults.planning ? " checked" : ""}> Planeación</label>
                      <label><input type="checkbox" data-action="set-membership-default" data-person-id="${mid}" data-stage="reach"${attendanceDefaults.reach ? " checked" : ""}> Alcance</label>
                      <label><input type="checkbox" data-action="set-membership-default" data-person-id="${mid}" data-stage="sunday"${attendanceDefaults.sunday ? " checked" : ""}> Culto</label>
                    </div>
                  </div>
                </td>
                <td><button type="button" class="btn-remove-member" data-action="remove-member" data-person-id="${mid}" title=t('cell.removeFromCell')>✕</button></td>
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
    available.length ? t('cell.addMemberDots') : t('cell.noMembersAvail'));
  if (memberAttendanceModeSelect instanceof HTMLSelectElement) {
    memberAttendanceModeSelect.value = "normal";
  }
  if (memberDefaultPlanning instanceof HTMLInputElement) memberDefaultPlanning.checked = true;
  if (memberDefaultReach instanceof HTMLInputElement) memberDefaultReach.checked = true;
  if (memberDefaultSunday instanceof HTMLInputElement) memberDefaultSunday.checked = true;
  syncMemberAttendanceDefaultsForm();
}

function setCellLinkedFieldsLocked(locked) {
  [
    leaderField,
    assistantField,
    hostField,
    reportAddress,
    reportForm.elements.namedItem("networkName"),
    reportForm.elements.namedItem("sector"),
    reportForm.elements.namedItem("zoneName"),
    reportForm.elements.namedItem("districtName"),
  ].forEach((field) => {
    if (!field) return;
    field.disabled = locked;
    field.closest("label")?.classList.toggle("is-catalog-locked", locked);
  });
}

function applyCellCatalogFieldsToPayload(payload) {
  const cell = findCellByNumber(payload?.cellNumber || cellField?.value);
  if (!cell || !payload) return payload;
  payload.networkName = cell.networkName || payload.networkName || "";
  payload.sector = cell.sector || payload.sector || "";
  payload.zoneName = cell.zoneName || payload.zoneName || "";
  payload.districtName = cell.districtName || payload.districtName || "";
  payload.address = reportAddress.value || cell.address || payload.address || "";
  return payload;
}

function syncReportWithCell(force = false, savedData = null) {
  const cell = findCellByNumber(cellField.value);
  if (!cell) {
    setCellLinkedFieldsLocked(false);
    renderReportCellMembers(null);
    applyWeeklyCollectionsForCell(null, null);
    populateVisitorInvitedBySelect();
    applyReportFormPermissions();
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

  renderReportCellMembers(cell, savedData);
  applyWeeklyCollectionsForCell(cell, savedData);
  populateVisitorInvitedBySelect();
  // Refrescar dropdown "Visita previa" cada vez que cambia la célula activa
  // (sirve también cuando cellField.value se asigna por código y no dispara change).
  renderVisitorHistoryOptions();
  applyReportFormPermissions();
  setCellLinkedFieldsLocked(true);
}

// Determina si el usuario actual puede MODIFICAR el reporte de la célula
// activa en el formulario. Solo el líder de esa célula (vía
// assignedCellNumber) o un super-admin pueden guardar/finalizar. Pastores,
// coordinadores y supervisores ven el reporte en modo solo-lectura para
// evitar que modifiquen reportes de células ajenas por error.
function canModifyReportForCell(cellNumber) {
  if (!currentUser) return false;
  if (currentUser.isSystemAccount) return true;
  const activeCell = String(cellNumber || "").trim();
  if (!activeCell) return true;
  const ownCell = String(currentUser.assignedCellNumber || "").trim();
  return !!ownCell && ownCell === activeCell;
}

function canEditCurrentReport() {
  if (!currentUser) return false;
  const activeCell = String(cellField?.value || "").trim();
  return canModifyReportForCell(activeCell);
}

function isReportWithinEditableWindow(report) {
  const reportWeek = Number(getReportWeek(report));
  if (!reportWeek) return false;
  const realWeek = getQuarterWeekNumber();
  if (reportWeek === realWeek) return true;
  // Grace check: allow previous week during grace period
  const graceHours = parseInt(appSettings?.report_grace_hours ?? "0", 10) || 0;
  if (graceHours > 0 && reportWeek === realWeek - 1) {
    const weekStartDay = parseInt(appSettings?.week_start_day ?? "0", 10);
    const now = new Date();
    const rollover = new Date(now); rollover.setHours(0,0,0,0);
    const diff = (rollover.getDay() - weekStartDay + 7) % 7;
    rollover.setDate(rollover.getDate() - diff);
    if ((now.getTime() - rollover.getTime()) / 3600000 < graceHours) return true;
  }
  return false;
}

function applyReportFormPermissions() {
  const allowed = canEditCurrentReport();
  const SAVE_BUTTON_IDS = [
    "save-next-encabezado",
    "save-next-planificacion",
    "save-next-alcance",
    "save-next-culto",
    "finalizar-reporte",
  ];
  SAVE_BUTTON_IDS.forEach((id) => {
    const btn = document.getElementById(id);
    if (!btn) return;
    btn.disabled = !allowed;
    btn.title = allowed
      ? ""
      : t('form.readonlyLeader');
  });
  const banner = document.getElementById("report-readonly-banner");
  if (banner) banner.hidden = allowed;
}

function populatePeopleForm(person = null) {
  peopleForm.reset();
  peopleEditId.value = person ? String(person.id) : "";
  renderGuardianSelect(person?.id ? String(person.id) : "");
  peopleForm.name.value = person?.name || "";
  const isKidCheckbox = /** @type {HTMLInputElement|null} */ (document.getElementById("people-is-kid"));
  if (isKidCheckbox) isKidCheckbox.checked = person?.role === "kid";
  const isPastorCheckbox = /** @type {HTMLInputElement|null} */ (document.getElementById("people-is-pastor"));
  if (isPastorCheckbox) isPastorCheckbox.checked = person?.role === "pastor";
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
  // Username (solo cuenta de sistema)
  const usernameField = document.getElementById("people-username-field");
  const usernameInput = /** @type {HTMLInputElement|null} */ (document.getElementById("people-username"));
  if (usernameField && usernameInput) {
    if (currentUser?.isSystemAccount) {
      usernameField.hidden = false;
      usernameInput.value = person?.username || "";
    } else {
      usernameField.hidden = true;
      usernameInput.value = "";
    }
  }
  // Flag de administrador (solo cuenta de sistema puede asignar)
  const adminField = document.getElementById("people-admin-field");
  const adminInput = /** @type {HTMLInputElement|null} */ (document.getElementById("people-is-admin"));
  if (adminField && adminInput) {
    if (currentUser?.isSystemAccount) {
      adminField.hidden = false;
      adminInput.checked = !!(person?.isAdmin);
    } else {
      adminField.hidden = true;
      adminInput.checked = false;
    }
  }
  syncPeopleGuardianFields();
  syncPeopleAccessFields();
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
function enterReadOnlyMode(report, options = {}) {
  reportReadOnlyMode = true;
  editingReportId = null;
  const reason = options.reason === "permission" ? "permission" : "closed";

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
  if (reason === "permission") {
    if (weekField) weekField.disabled = false;
    if (cellField) cellField.disabled = false;
  }

  // Show closed banner (fixed element in HTML)
  const banner = document.getElementById("form-readonly-banner");
  if (banner) {
    const week = formData.week || report.week || "?";
    if (reason === "permission") {
      banner.hidden = true;
      banner.innerHTML = "";
      return;
    }
    const bannerMessage = reason === "permission"
      ? t('form.readonlyLeader')
      : t('form.weekClosedBanner', { w: week });
    banner.innerHTML = `${bannerMessage} <button type="button" id="form-readonly-exit-btn" style="margin-left:10px;font-size:0.8rem;padding:3px 10px">${t('form.newReport')}</button>`;
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
  editingReportWasFinalized = false;
  editingReportOriginWasFinalized = false;
  editingReportLoadedData = null;
  resetReportDirtySlices();
  recentFinalizedReportContext = null;
  submittedEditConfirmedReportId = null;
  suppressWeekChangeHandler = true;
  reportForm.reset();
  suppressWeekChangeHandler = false;
  currentVisitors = [];
  currentMemberAttendance = [];
  currentKids = [];
  currentBaptisms = [];
  currentReachSupervisorVisits = [];
  // Clear all stage badges and draft indicators
  document.querySelectorAll(".stage-tab-badge").forEach(b => b.hidden = true);
  document.querySelectorAll(".stage-tab").forEach(t => t.classList.remove("has-draft"));
  // Repopulate week options AFTER reset() (reset() clears the select value)
  populateWeekOptions();
  renderReportPersonSelects();
  renderCellOptions();
  if (catalogs.cells.length) {
    // Si el usuario tiene una célula asignada (líder/asistente), priorizarla
    // sobre la primera célula del catálogo: así "Limpiar" no lo deja en una
    // célula ajena (que dispara el banner de solo-lectura).
    const ownCellNum = String(currentUser?.assignedCellNumber || "").trim();
    const ownCell = ownCellNum ? findCellByNumber(ownCellNum) : null;
    const defaultCell = ownCell || findFirstCellWithMembers() || catalogs.cells[0];
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
  renderReachSupervisorVisits(findCellByNumber(cellField.value));
  // Refrescar permisos (oculta/show el banner de solo-lectura segun la celula activa)
  applyReportFormPermissions();
  refreshReportVisualState();
  // Llevar al usuario de regreso a la primera etapa (Inicio) para empezar limpio
  showStage("encabezado", { skipWeekCheck: true });
  // Scroll al inicio del formulario por comodidad
  try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch { /* noop */ }
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
  const allPeople = Array.isArray(payload.people) ? payload.people : [];
  // Las cuentas de sistema (fabian.admin y similares) se mantienen aparte:
  // no aparecen en listados, conteos, RCM ni reportes — solo en la
  // sub-sección "Cuentas de sistema" (visible para super admins).
  catalogs = {
    people: allPeople.filter(p => !p.isSystemAccount),
    systemPeople: allPeople.filter(p => p.isSystemAccount),
    cells: Array.isArray(payload.cells) ? payload.cells : [],
  };
  renderGuardianSelect(peopleEditId.value);
  renderAdminSummary();
  renderReportPersonSelects();
  renderCellRoleSelects();
  renderCellOptions();
  renderCellsTable();
  renderPeopleRows();
  renderSystemAccountsTable();
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
  const processLateWeeksInput = document.getElementById("setting-process-late-weeks");
  if (processLateWeeksInput) {
    processLateWeeksInput.value = appSettings.process_entry_late_weeks ?? "14";
  }
  const levantateInput = document.getElementById("setting-goal-levantate");
  if (levantateInput) levantateInput.value = appSettings.rcm_goal_levantate ?? "4";
  const restauracionInput = document.getElementById("setting-goal-restauracion");
  if (restauracionInput) restauracionInput.value = appSettings.rcm_goal_restauracion ?? "3";
  const bautismosInput = document.getElementById("setting-goal-bautismos");
  if (bautismosInput) bautismosInput.value = appSettings.rcm_goal_bautismos ?? "2";
  const goalsScope = document.getElementById("settings-goals-scope");
  if (goalsScope) {
    const now = new Date();
    const quarter = now.getMonth() <= 3 ? 1 : now.getMonth() <= 7 ? 2 : 3;
    const scopeParts = [`Q${quarter}/${now.getFullYear()}`];
    if (currentUser?.assignedCellNumber) {
      scopeParts.push(`Célula ${currentUser.assignedCellNumber}`);
    } else if (currentUser?.isSupervisor && currentUser?.supervisedSector) {
      scopeParts.push(`Sector ${currentUser.supervisedSector}`);
    } else {
      scopeParts.push("Metas generales");
    }
    goalsScope.textContent = scopeParts.join(" · ");
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
    { q: 1, label: t('qname.q1'), months: t('qmonths.q1'),          start: 0, end: 3  },
    { q: 2, label: t('qname.q2'), months: t('qmonths.q2'),          start: 4, end: 7  },
    { q: 3, label: t('qname.q3'), months: t('qmonths.q3'),          start: 8, end: 11 },
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
    <div class="sq-row" style="margin-bottom:4px"><span class="sq-badge" style="font-size:0.7rem">${t('common.weekShort', { n: week })}</span><strong>${t('form.weekN', { w: week })}${phaseLabel}</strong></div>
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
    const processLateWeeksInput = document.getElementById("setting-process-late-weeks");
    const processLateWeeks = Math.max(0, parseInt(processLateWeeksInput?.value ?? "14", 10) || 0);
    await request("/api/settings", { method: "POST", body: JSON.stringify({ cycle_start_date: val, week_start_day: weekDay, report_grace_hours: String(graceHours), process_entry_late_weeks: String(processLateWeeks) }) });
    appSettings.cycle_start_date = val;
    appSettings.week_start_day = weekDay;
    appSettings.report_grace_hours = String(graceHours);
    appSettings.process_entry_late_weeks = String(processLateWeeks);
    if (status) { status.textContent = "✓ Guardado"; status.className = "settings-save-status is-ok"; }
    setTimeout(() => { if (status) status.textContent = ""; }, 3000);
    syncWeekFieldWithReportDate(true);
  } catch {
    if (status) { status.textContent = "Error al guardar."; status.className = "settings-save-status is-error"; }
  }
});

document.getElementById("settings-goals-save-btn")?.addEventListener("click", async () => {
  const status = document.getElementById("settings-goals-status");
  const levantateGoal = Math.max(0, parseInt(document.getElementById("setting-goal-levantate")?.value ?? "4", 10) || 0);
  const restauracionGoal = Math.max(0, parseInt(document.getElementById("setting-goal-restauracion")?.value ?? "3", 10) || 0);
  const bautismosGoal = Math.max(0, parseInt(document.getElementById("setting-goal-bautismos")?.value ?? "2", 10) || 0);
  const now = new Date();
  const year = String(now.getFullYear());
  const quarter = String(now.getMonth() <= 3 ? 1 : now.getMonth() <= 7 ? 2 : 3);

  try {
    await request("/api/settings", {
      method: "POST",
      body: JSON.stringify({
        rcm_goal_levantate: String(levantateGoal),
        rcm_goal_restauracion: String(restauracionGoal),
        rcm_goal_bautismos: String(bautismosGoal),
      }),
    });
    appSettings.rcm_goal_levantate = String(levantateGoal);
    appSettings.rcm_goal_restauracion = String(restauracionGoal);
    appSettings.rcm_goal_bautismos = String(bautismosGoal);

    if (currentUser?.assignedCellNumber) {
      await request("/api/friend-tracking/goals", {
        method: "PUT",
        body: JSON.stringify({
          cellNumber: String(currentUser.assignedCellNumber),
          year,
          quarter,
          levantateGoal,
          restauracionGoal,
          bautismosGoal,
        }),
      });
    }

    if (status) {
      status.textContent = "✓ Metas guardadas";
      status.className = "settings-save-status is-ok";
    }
    if (!document.getElementById("seguimiento-view")?.hidden) {
      loadFriendTrackingPanel();
    }
    setTimeout(() => { if (status) status.textContent = ""; }, 3000);
  } catch {
    if (status) {
      status.textContent = "Error al guardar metas.";
      status.className = "settings-save-status is-error";
    }
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
  if (!confirm(t('conf.removeWeek', { week: week }))) return;
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
  if (!confirm(t('conf.resetCycleDefault'))) return;
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
    healthStatus.textContent = payload.ok ? t("nav.available") : t('common.noAnswer');
    if (healthStatusDot) healthStatusDot.dataset.ok = payload.ok ? "true" : "false";
    if (tmcStatusDot) tmcStatusDot.dataset.ok = payload.ok ? "true" : "false";
    if (tmcStatusText) tmcStatusText.textContent = payload.ok ? t("nav.available") : t('common.noAnswer');
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
    await loadApprovals();
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

async function loadApprovals() {
  try {
    const payload = await request("/api/approvals");
    approvalsData = payload.approvals || [];
  } catch (e) {
    approvalsData = [];
  }
}

function findApproval(sector, week, year, quarter) {
  return approvalsData.find(a =>
    String(a.sector) === String(sector) &&
    String(a.week)   === String(week) &&
    String(a.year)   === String(year) &&
    String(a.quarter)=== String(quarter)
  ) || null;
}

async function postApprovalAction(sector, week, year, quarter, action, notes = "") {
  const actor = (currentUser && (currentUser.displayName || currentUser.name || currentUser.username)) || "";
  try {
    const res = await request("/api/approvals", {
      method: "POST",
      body: JSON.stringify({ sector, year, quarter, week, action, actor, notes }),
    });
    if (res && res.approval) {
      // upsert in local cache
      const idx = approvalsData.findIndex(a => a.id === res.approval.id);
      if (idx >= 0) approvalsData[idx] = res.approval;
      else approvalsData.push(res.approval);
    } else {
      await loadApprovals();
    }
    renderSeguimientoSupervisor(reportsData);
  } catch (e) {
    alert(e.message || "Error al actualizar aprobación.");
  }
}

// ── Compartir / descargar reportes ──────────────────────────────────────
function sanitizeFileName(s) {
  return String(s || 'reporte').replace(/[^a-z0-9\-_]+/gi, '_').slice(0, 60);
}

async function downloadElementAsPng(el, filename) {
  const blob = await renderElementToPngBlob(el);
  if (!blob) return;
  const link = document.createElement('a');
  link.download = filename || 'reporte.png';
  link.href = URL.createObjectURL(blob);
  document.body.appendChild(link);
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1500);
  link.remove();
}

// Genera un Blob PNG del nodo (oculta botones de acción durante la captura)
async function renderElementToPngBlob(el) {
  if (!el) return null;
  if (typeof window.html2canvas !== 'function') {
    alert('No se pudo cargar la utilidad de captura (html2canvas). Verifica tu conexión.');
    return null;
  }
  el.classList.add('is-capturing');
  // Permite que el navegador aplique el layout expandido antes de medir
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  try {
    // Tomar el tamaño REAL del contenido expandido (no el visible del scroll)
    const fullWidth  = Math.max(el.scrollWidth,  el.offsetWidth,  el.clientWidth);
    const fullHeight = Math.max(el.scrollHeight, el.offsetHeight, el.clientHeight);
    const canvas = await window.html2canvas(el, {
      backgroundColor: '#ffffff',
      scale: Math.min(2, window.devicePixelRatio || 1) || 1,
      useCORS: true,
      logging: false,
      width:  fullWidth,
      height: fullHeight,
      windowWidth:  Math.max(fullWidth,  window.innerWidth),
      windowHeight: Math.max(fullHeight, window.innerHeight),
      scrollX: 0,
      scrollY: -window.scrollY,
    });
    return await new Promise(resolve => canvas.toBlob(b => resolve(b), 'image/png'));
  } catch (e) {
    alert('No se pudo generar la imagen: ' + (e.message || e));
    return null;
  } finally {
    el.classList.remove('is-capturing');
  }
}

function openWhatsApp(text) {
  const url = 'https://wa.me/?text=' + encodeURIComponent(text || '');
  window.open(url, '_blank', 'noopener');
}

// Comparte imagen + texto usando Web Share API (móvil/Android/iOS modernos).
// Si no es posible compartir archivos, descarga la imagen y abre WhatsApp con
// el texto, avisando al usuario que adjunte la imagen recién descargada.
async function shareElementWithText(el, _text, filename) {
  const blob = await renderElementToPngBlob(el);
  if (!blob) return;
  const file = new File([blob], filename || 'reporte.png', { type: 'image/png' });

  // 1) Intento moderno: compartir SOLO la imagen (sin texto — algunos clientes WhatsApp rechazan el combo)
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] });
      return;
    } catch (e) {
      if (e && e.name === 'AbortError') return;
    }
  }

  // 2) Fallback escritorio: descargar PNG y avisar al usuario
  const link = document.createElement('a');
  link.download = filename || 'reporte.png';
  link.href = URL.createObjectURL(blob);
  document.body.appendChild(link);
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1500);
  link.remove();
  alert('Se descargó la imagen. Abre WhatsApp y adjúntala manualmente con el clip 📎.');
}

// SVG oficial-ish del logo de WhatsApp (Simple Icons, dominio público).
function whatsappIconSvg(size = 14) {
  return `<svg viewBox="0 0 32 32" width="${size}" height="${size}" aria-hidden="true" style="vertical-align:-2px;display:inline-block">
    <path fill="#25D366" d="M16 .395C7.164.395 0 7.559 0 16.395c0 2.84.74 5.598 2.146 8.025L0 32l7.832-2.054a16.073 16.073 0 0 0 8.168 2.244h.007C24.844 32.19 32 25.026 32 16.19 32 7.355 24.836.394 16 .394Z"/>
    <path fill="#FFF" d="M23.42 19.396c-.314-.158-1.86-.918-2.149-1.022-.288-.105-.498-.158-.708.157-.21.314-.812 1.022-.996 1.232-.184.21-.367.236-.681.078-.314-.157-1.327-.489-2.527-1.56-.935-.834-1.567-1.864-1.751-2.179-.184-.314-.02-.484.138-.641.142-.142.314-.367.472-.55.158-.184.21-.315.314-.524.105-.21.053-.394-.026-.551-.078-.157-.708-1.708-.97-2.339-.255-.613-.515-.53-.708-.54-.184-.01-.394-.012-.604-.012-.21 0-.55.079-.838.393-.288.314-1.1 1.075-1.1 2.625 0 1.55 1.126 3.049 1.283 3.259.158.21 2.215 3.379 5.367 4.741.75.324 1.337.518 1.793.663.753.24 1.438.206 1.98.125.604-.09 1.86-.76 2.122-1.494.262-.733.262-1.36.184-1.494-.078-.131-.288-.21-.602-.367Z"/>
  </svg>`;
}
// Expone helper para usos fuera de módulo (footer del modal)
window.whatsappIconSvg = whatsappIconSvg;

function downloadIconSvg(size = 14) {
  return `<svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="vertical-align:-2px;display:inline-block">
    <path d="M12 3v12"/>
    <path d="m7 10 5 5 5-5"/>
    <path d="M5 21h14"/>
  </svg>`;
}
window.downloadIconSvg = downloadIconSvg;

function buildSupervisorWhatsAppText(supervisor, reports, week) {
  const weekStr  = String(week);
  const curYear  = String(new Date().getFullYear());
  const curQ     = String(getCurrentQuarter());
  const cells    = getCellsForSupervisor(supervisor);
  const cellNums = cells.map(c => String(c.cellNumber));
  const cellSet  = new Set(cellNums);
  const visible  = (reports || []).filter(r => {
    const cn = String(r.cellNumber || r.formData?.cellNumber || '');
    if (!cellSet.has(cn)) return false;
    if (getReportWeek(r) !== weekStr) return false;
    if (getReportYear(r) !== curYear) return false;
    if (String(getReportQuarter(r)) !== curQ) return false;
    return true;
  });
  const totals = aggregateMetrics(visible);
  const verb = getRcmWeekInfo(weekStr)?.verb || '';
  const reported = visible.length;
  const lines = [];
  lines.push(`📊 *Reporte semanal · Sector ${supervisor.sector}*`);
  lines.push(`Supervisor: ${supervisor.name}`);
  lines.push(`Semana ${weekStr}${verb ? ' · ' + verb : ''}`);
  lines.push(`Células reportadas: ${reported}/${cellNums.length}`);
  lines.push('');
  lines.push('*PLANEACIÓN*');
  lines.push(`• Miembros bautizados: ${totals.cellMembersUnique}`);
  lines.push(`• Miembros asistentes: ${totals.planningPresent}`);
  lines.push(`• Miembros ausentes: ${totals.planningAbsent}`);
  lines.push('');
  lines.push('*ALCANCE*');
  lines.push(`• Miembros asistentes: ${totals.reachMembers}`);
  lines.push(`• Con privilegios: ${totals.reachPrivileged}`);
  lines.push(`• Amigos: ${totals.reachFriends}`);
  lines.push(`• En restauración: ${totals.reachRestor}`);
  lines.push(`• Niños: ${totals.reachKids}`);
  lines.push(`• Ofrenda: $${Number(totals.offering || 0).toFixed(2)}`);
  lines.push('');
  lines.push('*CULTO INSPIRADOR*');
  lines.push(`• Miembros: ${totals.sundayMembers}`);
  lines.push(`• Amigos: ${totals.sundayFriends}`);
  lines.push(`• En restauración: ${totals.sundayRestor}`);
  lines.push(`• Niños: ${totals.sundayKids}`);
  return lines.join('\n');
}

function shareSupervisorOnWhatsApp(supervisor, reports, week) {
  openWhatsApp(buildSupervisorWhatsAppText(supervisor, reports, week));
}

function buildReportWhatsAppText(report) {
  const fd = report?.formData || {};
  const s  = fd.attendanceSummary || {};
  const cell = String(report.cellNumber || fd.cellNumber || '—');
  const week = String(fd.week || report.week || '—');
  const leader = String(fd.leaderName || report.leaderName || '');
  const totals = aggregateMetrics([report]);
  const lines = [];
  lines.push(`📋 *Reporte célula ${cell} · Semana ${week}*`);
  if (leader) lines.push(`Líder: ${leader}`);
  lines.push('');
  lines.push('*PLANEACIÓN*');
  lines.push(`• Miembros bautizados: ${totals.cellMembersUnique}`);
  lines.push(`• Asistentes: ${totals.planningPresent}`);
  lines.push(`• Ausentes: ${totals.planningAbsent}`);
  lines.push('');
  lines.push('*ALCANCE*');
  lines.push(`• Miembros: ${totals.reachMembers}`);
  lines.push(`• Con privilegios: ${totals.reachPrivileged}`);
  lines.push(`• Amigos: ${totals.reachFriends}`);
  lines.push(`• En restauración: ${totals.reachRestor}`);
  lines.push(`• Niños: ${totals.reachKids}`);
  lines.push(`• Ofrenda: $${Number(totals.offering || 0).toFixed(2)}`);
  lines.push('');
  lines.push('*CULTO INSPIRADOR*');
  lines.push(`• Miembros: ${totals.sundayMembers}`);
  lines.push(`• Amigos: ${totals.sundayFriends}`);
  lines.push(`• En restauración: ${totals.sundayRestor}`);
  lines.push(`• Niños: ${totals.sundayKids}`);
  return lines.join('\n');
}

async function openSupervisorReportPreview(reportId) {
  if (!reportPreviewDialog) return;
  try {
    const payload = await request(`/api/reports/${reportId}`);
    const report  = payload.report;
    const cell = String(report.cellNumber || report.formData?.cellNumber || "—");
    const week = String(report.formData?.week || report.week || "—");
    if (previewDialogTitle) previewDialogTitle.textContent = t('preview.cellWeekTitle', { c: cell, w: week });
    if (previewDialogBody)  previewDialogBody.innerHTML = buildReportPreviewHtmlFromData(report);
    activePreviewVisitorContext = { report };
    // Footer en modo solo-lectura (sin botón de editar — el supervisor solo revisa)
    if (previewDialogFooter) previewDialogFooter.hidden = false;
    const cancelBtn      = document.getElementById("preview-cancel-btn");
    const confirmBtn     = document.getElementById("preview-confirm-btn");
    const editFromSegBtn = document.getElementById("preview-edit-from-seg-btn");
    const dlBtn          = document.getElementById("preview-download-btn");
    const waBtn          = document.getElementById("preview-whatsapp-btn");
    if (cancelBtn)      cancelBtn.hidden      = true;
    if (confirmBtn)     confirmBtn.hidden     = true;
    if (editFromSegBtn) editFromSegBtn.hidden = true;
    if (dlBtn) {
      dlBtn.hidden = false;
      dlBtn.onclick = () => {
        downloadElementAsPng(previewDialogBody, `reporte-celula${cell}-S${week}.png`);
      };
    }
    if (waBtn) {
      waBtn.hidden = false;
      waBtn.onclick = () => {
        const text = buildReportWhatsAppText(report);
        shareElementWithText(previewDialogBody, text, `reporte-celula${cell}-S${week}.png`);
      };
    }
    reportPreviewDialog.showModal();
  } catch (err) {
    setFeedback(err.message, true);
  }
}

async function handleReportSubmit(event) {
  event.preventDefault();
  clearFeedback();
  const stageAfterSave = currentStage || "encabezado";

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
  payload.reachSupervisorVisits = currentReachSupervisorVisits;
  payload.visitors = currentVisitors.filter((visitor) => String(visitor.name || "").trim());
  payload.kids = currentKids.filter((kid) => String(kid.name || "").trim());
  payload.baptisms = normalizeBaptisms(currentBaptisms).filter((entry) => entry.name);
  payload.attendanceSummary = computeWeeklySummary();
  payload.cycleReportId = computeCycleReportId(payload.cellNumber, getReportYearValue());
  const promotedCount = countBaptismsToPromote(payload.baptisms);
  const createdMessage = promotedCount ? `${t('err.saved')} ${promotedCount} bautizado(s) agregado(s) como miembro(s).` : t('err.saved');
  const updatedMessage = promotedCount ? t('fb.reportUpdatedWithBap', { n: promotedCount }) : t('fb.reportUpdated');
  const successMessage = editingReportId ? updatedMessage : createdMessage;

  try {
    let savedReportId = editingReportId;
    if (editingReportId) {
      await request(`/api/reports/${editingReportId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
    } else {
      const result = await request("/api/reports", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      savedReportId = Number(result?.id || 0) || null;
    }
    await loadCatalogs();
    await loadReports();
    if (savedReportId) {
      editingReportId = Number(savedReportId);
      const savedPayload = await request(`/api/reports/${savedReportId}`);
      loadReportIntoForm(savedPayload.report, Number(savedReportId));
      showStage(stageAfterSave, { skipWeekCheck: true });
    } else if (payload.cellNumber) {
      cellField.value = String(payload.cellNumber);
      syncReportWithCell(true);
      showStage(stageAfterSave, { skipWeekCheck: true });
    }
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
  payload.role = payload.isKid === "on" ? "kid" : payload.isPastor === "on" ? "pastor" : "member";
  delete payload.isKid;
  delete payload.isPastor;
  // Normalize boolean-like fields from form
  payload.isCoordinator = payload.isCoordinator === "on";
  // Solo enviamos isAdmin si el usuario actual es cuenta de sistema (el backend lo valida igual)
  if (currentUser?.isSystemAccount) {
    payload.isAdmin = payload.isAdmin === "on";
  } else {
    delete payload.isAdmin;
  }
  const editId = peopleEditId.value;

  // Read desired cell and role from outside-form controls
  const newCellId   = peopleDialogCellSelect?.value || "";
  const newCellRole = peopleDialogCellRoleSelect?.value || ""; // "leader"|"assistant"|"host"|""
  const person      = catalogs.people.find(p => String(p.id) === editId)
    || (catalogs.systemPeople || []).find(p => String(p.id) === editId);
  const oldCellId   = String(person?.assignedCellId || "");
  const cellChanged = newCellId !== oldCellId;

  // Validate: if assigning as leader, check cell doesn't already have one
  if (newCellRole === "leader" && newCellId) {
    const targetCell = catalogs.cells.find(c => String(c.id) === newCellId);
    if (targetCell?.leaderPersonId && String(targetCell.leaderPersonId) !== editId) {
      const leaderName = catalogs.people.find(p => String(p.id) === String(targetCell.leaderPersonId))?.name || "otra persona";
      const ok = await appConfirm(`La célula ${targetCell.cellNumber} ya tiene a "${leaderName}" como líder.\n¿Reemplazar a "${leaderName}" y asignar a "${payload.name || t('common.thisPerson')}" como nuevo líder?`, t('conf.leaderChange'));
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
    // Si username viene en el form pero el usuario actual NO es super-admin,
    // lo quitamos para que el backend NO rechace la peticion (403).
    // Tambien quitamos username si el campo esta vacio en una EDICION sin cambios:
    // mejor no enviar la clave que enviar "" (que el backend interpreta como borrar).
    const actorHeaders = currentUser?.personId
      ? { "X-Acting-Person-Id": String(currentUser.personId) }
      : {};
    if (!currentUser?.isSystemAccount) {
      delete payload.username;
    } else {
      // Cuenta de sistema: si el campo no cambio respecto al original, no lo enviamos
      const originalUsername = (
        catalogs.people.find(p => String(p.id) === editId)
        || (catalogs.systemPeople || []).find(p => String(p.id) === editId)
      )?.username || "";
      const submittedUsername = String(payload.username || "");
      if (editId && submittedUsername === originalUsername) {
        delete payload.username;
      }
    }
    if (editId) {
      await request(`/api/catalogs/people/${editId}`, {
        method: "PUT",
        headers: actorHeaders,
        body: JSON.stringify(payload),
      });
      setFeedback("Persona actualizada.");
    } else {
      const created = await request("/api/catalogs/people", {
        method: "POST",
        headers: actorHeaders,
        body: JSON.stringify(payload),
      });
      savedPersonId = String(created.id);
      setFeedback("Persona agregada.");
    }

    // Si la cuenta de sistema tocó el flag is_admin, aplicarlo en endpoint dedicado
    if (currentUser?.isSystemAccount && savedPersonId && typeof payload.isAdmin === "boolean") {
      const currentVal = !!person?.isAdmin;
      if (currentVal !== payload.isAdmin) {
        await request(`/api/catalogs/people/${savedPersonId}/admin`, {
          method: "PATCH",
          headers: actorHeaders,
          body: JSON.stringify({ isAdmin: payload.isAdmin }),
        });
      }
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
      setFeedback(t('fb.cellUpdated'));
    } else {
      const created = await request("/api/catalogs/cells", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      cellsEditId.value = String(created.id);
      setFeedback(t('fb.cellAdded'));
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
  const attendanceMode = normalizeCellMemberAttendanceMode(memberAttendanceModeSelect?.value);
  const attendanceDefaults = readMemberAttendanceDefaultsFromForm();

  if (!pendingPersonId) {
    setCellDialogMsg(t('fb.selectPersonForMember'), true);
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
      document.querySelector("#cell-dialog-title").textContent = t('cell.editTitle', { n: saved?.cellNumber || "" });
    } catch (err) {
      setCellDialogMsg(err.message, true);
      return;
    }
  }

  try {
    await request(`/api/catalogs/cells/${cellId}/members`, {
      method: "POST",
      body: JSON.stringify({ personId: pendingPersonId, attendanceMode, attendanceDefaults }),
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
//   - Solo el líder o asistente de la célula (o super-admin) puede editar
//     reportes de su célula. Coordinadores y supervisores NO pueden modificar
//     reportes de células que no lideran.
//   - Adicionalmente, la semana del reporte debe ser la semana actual, o
//     bien estar dentro del periodo de gracia de la semana anterior.
function isReportEditable(report) {
  const reportCell = String(report?.cellNumber ?? report?.formData?.cellNumber ?? "").trim();
  return canModifyReportForCell(reportCell) && isReportWithinEditableWindow(report);
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
      await openReportForEditing(report, reportId);
      return;
    }

    if (button.dataset.action === "delete-report") {
      // Solo líder/asistente de la célula (o admin) puede eliminar
      try {
        const payload = await request(`/api/reports/${reportId}`);
        const report = payload.report;
        if (currentUser && !currentUser.isSystemAccount) {
          const reportCell = String(report?.cellNumber ?? report?.formData?.cellNumber ?? "").trim();
          const ownCell = String(currentUser.assignedCellNumber || "").trim();
          if (!ownCell || ownCell !== reportCell) {
            setFeedback(t('fb.noDeletePermission'), true);
            return;
          }
        }
      } catch (_e) { /* si no se puede verificar, continuar al confirm */ }
      const ok = await appConfirm("¿Eliminar este reporte?\nEsta acción no se puede deshacer.", t('conf.deleteReport'));
      if (!ok) return;
      await request(`/api/reports/${reportId}`, { method: "DELETE" });
      if (editingReportId === Number(reportId)) {
        resetReportForm();
      }
      await loadReports();
      setFeedback(t('fb.reportDeleted'));
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
  // Anti-doble-disparo (pointerup + click consecutivos en mobile)
  if (btn.dataset.rcmFiring === "1") return;
  btn.dataset.rcmFiring = "1";
  setTimeout(() => { delete btn.dataset.rcmFiring; }, 700);
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
    alert("RCM: " + (err.message || "no se pudo guardar"));
  }
}

function openPeopleEditDialog(person = null) {
  populatePeopleForm(person);
  if (peopleDialogTitle) peopleDialogTitle.textContent = person ? t('pdlg.editTitleNamed', { name: person.name }) : t('pdlg.newPerson2');

  // Info row: all current functions + current cell
  if (person && peopleDialogInfoRow) {
    peopleDialogInfoRow.hidden = false;
    if (peopleDialogFnBadges) {
      const chips = [];
      if (person.role === "pastor") chips.push("pastor");
      else if (hasCoordinatorAccess(person)) chips.push("coordinator");
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
      peopleDialogCellBadge.textContent = person.assignedCellNumber ? t('cell.numbered', { n: person.assignedCellNumber }) : t('cell.none');
      peopleDialogCellBadge.className = `catalog-assignment-chip${person.assignedCellNumber ? "" : " is-unassigned"}`;
    }
  } else if (peopleDialogInfoRow) {
    peopleDialogInfoRow.hidden = true;
  }

  // Cell select: populate with all cells, pre-select current
  if (peopleDialogCellSelect) {
    peopleDialogCellSelect.innerHTML =
      `<option value="">${t('pdlg.noCell')}</option>` +
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
  const person = catalogs.people.find((item) => String(item.id) === button.dataset.id)
    || (catalogs.systemPeople || []).find((item) => String(item.id) === button.dataset.id);
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
      const ok = await appConfirm(t('conf.deletePersonMsg', { name: person.name }), t('conf.deletePerson'));
      if (!ok) return;
      await request(`/api/catalogs/people/${person.id}`, { method: "DELETE" });
      if (peopleEditDialog?.open) peopleEditDialog.close();
      populatePeopleForm();
      await loadCatalogs();
      setFeedback("Persona eliminada.");
    }
    if (button.dataset.action === "reset-password") {
      if (!currentUser?.isSystemAccount) return;
      const ok = await appConfirm(t('conf.resetPasswordMsg', { name: person.name }), t('conf.resetPassword'));
      if (!ok) return;
      const resp = await fetch(`/api/auth/admin-reset/${person.id}`, {
        method: "POST",
        headers: { "X-Acting-Person-Id": String(currentUser.personId || "") },
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) { setFeedback(data.message || "No se pudo resetear.", true); return; }
      setFeedback(t('fb.passwordResetOf', { name: person.name }));
    }
    if (button.dataset.action === "toggle-system-account") {
      if (!currentUser?.isSystemAccount) return;
      const becoming = !person.isSystemAccount;
      const msg = becoming
        ? `¿Convertir a "${person.name}" en cuenta de sistema? Dejará de aparecer en listados, RCM y reportes.`
        : `¿Convertir a "${person.name}" en miembro real? Volverá a aparecer en listados, RCM y reportes.`;
      const ok = await appConfirm(msg, becoming ? "Convertir en cuenta de sistema" : "Convertir en miembro real");
      if (!ok) return;
      const resp = await fetch(`/api/catalogs/people/${person.id}/system-account`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "X-Acting-Person-Id": String(currentUser.personId || "") },
        body: JSON.stringify({ isSystemAccount: becoming }),
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) { setFeedback(data.message || "No se pudo cambiar el estado.", true); return; }
      await loadCatalogs();
      setFeedback(becoming ? "Convertida en cuenta de sistema." : "Convertida en miembro real.");
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
  markReportDirty("members");

  if (target.dataset.attendanceField === "status" && target instanceof HTMLSelectElement) {
    const stageField = STAGE_STATUS_FIELDS[currentStage];
    if (stageField) {
      entry[stageField] = target.value;
    } else {
      // Fallback raro (etapa sin sub-estado): editar el campo derivado.
      entry.status = target.value;
    }
    // Sincroniza el check de la etapa activa con el estado seleccionado:
    //  - present / service → check = true (asistió, aun "sirviendo")
    //  - absent / justified → check = false (no asistió)
    //  - pending           → no se fuerza nada
    const stageAttendedField = {
      planificacion: "planningAttended",
      alcance:       "reachAttended",
      culto:         "sundayAttended",
    }[currentStage];
    if (stageAttendedField) {
      const v = target.value;
      if (v === "present" || v === "service") {
        entry[stageAttendedField] = true;
      } else if (v === "absent" || v === "justified") {
        entry[stageAttendedField] = false;
        // Si dejamos de marcar Alcance, también limpiar Privilegios.
        if (stageAttendedField === "reachAttended") entry.reachPrivileged = false;
      }
      entry.status = deriveOverallStatus(entry);
      // Re-pintar para reflejar los checks actualizados (incluye disabled de Privilegios).
      renderAttendanceTable();
      return;
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
    // Mantener el <select> "Estado" coherente con el check de la etapa activa.
    // Solo ajustamos cuando el sub-estado es "soft" (pending/present/service):
    // no pisamos selecciones manuales como "absent" (Faltó) o "justified" (Justificado).
    const stageMap = {
      planningAttended: { stage: "planificacion", field: "planningStatus" },
      reachAttended:    { stage: "alcance",       field: "reachStatus" },
      sundayAttended:   { stage: "culto",         field: "sundayStatus" },
    };
    const m = stageMap[target.dataset.attendanceField];
    if (m && currentStage === m.stage) {
      const cur = entry[m.field];
      if (target.checked) {
        if (cur === "pending" || cur === "absent" || !cur) entry[m.field] = "present";
        // si era "service" o "justified" lo dejamos; ya refleja una decisión manual
      } else {
        // Al desmarcar, lo registramos como "Faltó" (no como "Sin marcar"):
        // la interacción del usuario es una decisión, no ausencia de dato.
        if (cur === "present" || cur === "service" || cur === "pending" || !cur) entry[m.field] = "absent";
      }
      entry.status = deriveOverallStatus(entry);
      // Refrescar el <select> de esta fila sin re-render completo (evita perder foco).
      const sel = attendanceTableBody.querySelector(`[data-attendance-index="${target.dataset.attendanceIndex}"][data-attendance-field="status"]`);
      if (sel) sel.value = entry[m.field];
    }
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
  markReportDirty("kids");

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
  markReportDirty("visitors");

  const fieldName = target.dataset.visitorField;
  if (fieldName === "kind" && target instanceof HTMLSelectElement) {
    visitor.kind = normalizeVisitorKind(target.value);
    if (visitor.kind === "visita") {
      visitor.converted = false;
      visitor.lateRegistration = false;
      visitor.processEntry = "none";
    } else {
      visitor.promoteToMember = false;
      visitor.processEntry = normalizeVisitorProcessEntry(visitor.processEntry, visitor.kind, {
        lateRegistration: visitor.lateRegistration,
      });
      visitor.lateRegistration = Boolean(visitor.lateRegistration);
    }
    renderAttendanceSummary();
    renderVisitorTable();
    return;
  }
  if (fieldName === "processEntry" && target instanceof HTMLSelectElement) {
    visitor.processEntry = normalizeVisitorProcessEntry(target.value, visitor.kind, {
      lateRegistration: visitor.lateRegistration,
    });
    visitor.lateRegistration = visitor.processEntry === "late";
    renderAttendanceSummary();
    renderVisitorTable();
    return;
  }
  if (fieldName === "promoteToMember" && target instanceof HTMLInputElement) {
    visitor.promoteToMember = target.checked;
    return;
  }
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

async function handleVisitorTableClick(event) {
  // Toggle expand/collapse de la tarjeta (móvil)
  const toggleBtn = event.target.closest("button[data-action='toggle-visitor']");
  if (toggleBtn) {
    const tr = toggleBtn.closest("tr");
    if (tr) {
      const collapsed = tr.classList.toggle("is-collapsed");
      toggleBtn.setAttribute("aria-expanded", collapsed ? "false" : "true");
    }
    return;
  }
  const button = event.target.closest("button[data-action='remove-visitor']");
  if (!button) {
    return;
  }
  const idx = Number(button.dataset.visitorIndex);
  const visitor = currentVisitors[idx];
  if (!visitor) return;
  const hasData = String(visitor.name || "").trim()
    || visitor.reachAttended
    || visitor.sundayAttended
    || visitor.converted
    || visitor.contacted
    || String(visitor.phone || "").trim()
    || String(visitor.note || "").trim();
  if (hasData) {
    const label = String(visitor.name || "").trim() || "esta visita";
    const ok = await appConfirm(t('conf.removeRowMsg', { name: label }), t('conf.removeVisit'));
    if (!ok) return;
  }
  currentVisitors.splice(idx, 1);
  markReportDirty("visitors");
  renderVisitorTable();
}

function handleKidsTableClick(event) {
  const button = event.target.closest("button[data-action='remove-kid']");
  if (!button) {
    return;
  }
  markReportDirty("kids");
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
  markReportDirty("baptisms");
  entry[target.dataset.baptismField] = target.type === "checkbox" ? target.checked : target.value;
  if (target.dataset.baptismField === "promoteToMember") {
    setFeedback(target.checked ? t('fb.bapWillBeMember') : t('fb.bapWontBeMember'));
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
  markReportDirty("baptisms");
  currentBaptisms.splice(Number(button.dataset.baptismIndex), 1);
  renderBaptismTable();
}

function handleAddVisitorClick() {
  markReportDirty("visitors");
  currentVisitors.push({ name: "", kind: "amigo", invitedBy: "", reachAttended: true, lateRegistration: false, sundayAttended: false, firstVisit: false, processEntry: "none", converted: false, promoteToMember: false, contacted: false, eventAttended: false, phone: "", note: "" });
  renderVisitorTable();
}

function resetKidQuickForm() {
  if (!kidQuickForm) return;
  if (kidQuickName instanceof HTMLInputElement) kidQuickName.value = "";
  if (kidQuickGuardian instanceof HTMLInputElement) kidQuickGuardian.value = "";
  if (kidQuickReach instanceof HTMLInputElement) kidQuickReach.checked = true;
  if (kidQuickSunday instanceof HTMLInputElement) kidQuickSunday.checked = false;
}

function handleAddKidClick() {
  const name = String(kidQuickName?.value || "").trim();
  if (!name) {
    setFeedback("Escribe el nombre del niño para agregarlo.", true);
    kidQuickName?.focus();
    return;
  }

  // Dedupe insensible a mayúsculas / acentos / espacios
  const normalizeName = (s) => String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\s+/g, " ").trim();
  const key = normalizeName(name);
  const dupKid = currentKids.find((k) => normalizeName(k.name) === key);
  if (dupKid) {
    setFeedback(`Ya hay un niño registrado con el nombre "${dupKid.name}". Usa un nombre distinto (p. ej. agrega apellido).`, true);
    kidQuickName?.focus();
    kidQuickName?.select?.();
    return;
  }

  clearFeedback();
  markReportDirty("kids");
  currentKids.push({
    personId: null,
    name,
    guardianName: String(kidQuickGuardian?.value || "").trim(),
    source: "visit",
    reachAttended: Boolean(kidQuickReach?.checked),
    sundayAttended: Boolean(kidQuickSunday?.checked),
    note: "",
  });
  renderKidsTable();
  resetKidQuickForm();
  // Resaltar la fila recién agregada
  if (kidsTableBody) {
    const rows = kidsTableBody.querySelectorAll("tr");
    const lastRow = rows[rows.length - 1];
    if (lastRow) {
      lastRow.classList.add("is-just-added");
      setTimeout(() => lastRow.classList.remove("is-just-added"), 1800);
    }
  }
  setFeedback(`Niño "${name}" agregado.`);
  kidQuickName?.focus();
}

async function handleKidQuickReset() {
  const hasData = String(kidQuickName?.value || "").trim() || String(kidQuickGuardian?.value || "").trim();
  if (hasData) {
    const ok = await appConfirm(
      "¿Vaciar los campos del formulario rápido?\nNo afecta a la tabla de niños.",
      "Vaciar formulario"
    );
    if (!ok) return;
  }
  resetKidQuickForm();
  clearFeedback();
}

function handleAddBaptismClick() {
  const captureStatus = getBaptismCaptureStatus();
  markReportDirty("baptisms");
  currentBaptisms.push({
    name: "",
    baptismDate: getReportDateValue(),
    source: captureStatus.isAllowed ? "report" : "fuera-cierre",
    note: "",
    promoteToMember: true,
  });
  if (!captureStatus.isAllowed) {
    setFeedback(t('fb.baptismAddedOutsideCycle'));
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

  // Validación duplicados (case + acentos insensibles, espacios normalizados)
  const normalizeName = (s) => String(s || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/\s+/g, " ").trim();
  const key = normalizeName(name);
  const dupVisitor = currentVisitors.find((v) => normalizeName(v.name) === key);
  if (dupVisitor) {
    setFeedback(`Ya hay una visita registrada con el nombre "${dupVisitor.name}". Revisa la tabla o usa un nombre distinto (p. ej. agrega apellido).`, true);
    visitorQuickName?.focus();
    visitorQuickName?.select?.();
    return;
  }
  const dupMember = Array.isArray(catalogs?.people)
    ? catalogs.people.find((p) => normalizeName(p.name) === key)
    : null;
  if (dupMember) {
    setFeedback(`Ojo: "${dupMember.name}" ya existe como miembro del catálogo. Si es la misma persona, no la agregues como visita; si es otra, usa un nombre distintivo.`, true);
    visitorQuickName?.focus();
    visitorQuickName?.select?.();
    return;
  }

  clearFeedback();
  applyQuickVisitorHistory(name);
  const history = findVisitorHistoryByName(name);
  const quickKind = normalizeVisitorKind(visitorQuickKind?.value);
  const processEntry = normalizeVisitorProcessEntry(visitorQuickProcessEntry?.value, quickKind);
  markReportDirty("visitors");
  currentVisitors.push({
    name,
    kind: quickKind,
    invitedBy: String(visitorQuickInvitedBy?.value || "").trim(),
    reachAttended: Boolean(visitorQuickReach?.checked),
    lateRegistration: processEntry === "late",
    sundayAttended: Boolean(visitorQuickSunday?.checked),
    firstVisit: Boolean(visitorQuickFirstVisit?.checked),
    processEntry,
    converted: quickKind === "visita" ? false : Boolean(visitorQuickConverted?.checked),
    promoteToMember: false,
    contacted: false,
    eventAttended: Boolean(visitorQuickEvent?.checked),
    phone: String(history?.phone || "").trim(),
    note: "",
  });
  renderVisitorTable();
  resetVisitorQuickForm();
  // Resaltar visualmente la fila recién agregada (última de la tabla).
  if (visitorTableBody) {
    const rows = visitorTableBody.querySelectorAll("tr");
    const lastRow = rows[rows.length - 1];
    if (lastRow) {
      lastRow.classList.add("is-just-added");
      setTimeout(() => lastRow.classList.remove("is-just-added"), 1800);
    }
  }
  setFeedback(t('fb.friendAddedTotal', { name: name, n: currentVisitors.length }));
  if (visitorQuickName instanceof HTMLInputElement) {
    visitorQuickName.focus();
  }
}

async function handleVisitorQuickReset() {
  const hasData = String(visitorQuickName?.value || "").trim()
    || (visitorQuickInvitedBy?.value)
    || (visitorQuickHistory?.value);
  if (hasData) {
    const ok = await appConfirm(
      "¿Vaciar los campos del formulario rápido?\nNo afecta a la tabla de amigos.",
      "Vaciar formulario"
    );
    if (!ok) return;
  }
  resetVisitorQuickForm();
  clearFeedback();
}

async function handleMemberListClick(event) {
  const button = event.target.closest("button[data-action='remove-member']");
  const activeCellId = cellsEditId.value || memberList?.dataset.cellId || "";
  if (!button || !activeCellId) return;

  const memberName = catalogs.people.find(p => String(p.id) === button.dataset.personId)?.name || t('common.thisPerson');
  const ok = await appConfirm(t('conf.removeMemberMsg', { name: memberName }), t('conf.removeMember'));
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
    setFeedback(t('fb.memberRemoved'));
  } catch (error) {
    setFeedback(error.message, true);
  }
}

reportForm.addEventListener("focusin", handleReportNumberInputFocusIn);
reportForm.addEventListener("focusout", handleReportNumberInputFocusOut);
reportForm.addEventListener("submit", handleReportSubmit);
peopleForm.addEventListener("submit", handlePeopleSubmit);
cellsForm.addEventListener("submit", handleCellsSubmit);
memberForm.addEventListener("submit", handleMemberSubmit);
memberAttendanceModeSelect?.addEventListener("change", syncMemberAttendanceDefaultsForm);

const pendingMembershipAttendanceUpdates = new Map();

function queueMembershipAttendanceUpdate(cellId, personId, payload) {
  const key = `${cellId}:${personId}`;
  const previous = pendingMembershipAttendanceUpdates.get(key) || Promise.resolve();
  const next = previous
    .catch(() => {})
    .then(async () => {
      await request(`/api/catalogs/cells/${cellId}/members/${personId}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      await loadCatalogs();
      const fresh = findCellById(cellId);
      populateCellsForm(fresh);
      if (cellField.value === fresh?.cellNumber) {
        syncReportWithCell(false, formData);
      }
    });

  pendingMembershipAttendanceUpdates.set(
    key,
    next.finally(() => {
      if (pendingMembershipAttendanceUpdates.get(key) === next) {
        pendingMembershipAttendanceUpdates.delete(key);
      }
    })
  );

  return next;
}

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
    const memberName = catalogs.people.find(p => String(p.id) === personId)?.name || t('common.thisPerson');
    const ok = await appConfirm(t('conf.removeMemberMsg', { name: memberName }), t('conf.removeMember'));
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

cellMemberRoleTable?.addEventListener("change", async (e) => {
  const modeSelect = e.target.closest("select[data-action='set-membership-mode']");
  const defaultsCheckbox = e.target.closest("input[data-action='set-membership-default']");
  if (!modeSelect && !defaultsCheckbox) return;
  const cellId = memberList?.dataset.cellId || cellsEditId?.value || "";
  if (!cellId) return;
  const personId = modeSelect?.dataset.personId || defaultsCheckbox?.dataset.personId;
  const row = (modeSelect || defaultsCheckbox)?.closest("tr");
  const mode = normalizeCellMemberAttendanceMode(row?.querySelector("select[data-action='set-membership-mode']")?.value);
  const attendanceDefaults = normalizeCellMemberAttendanceDefaults({
    planning: row?.querySelector("input[data-action='set-membership-default'][data-stage='planning']")?.checked,
    reach: row?.querySelector("input[data-action='set-membership-default'][data-stage='reach']")?.checked,
    sunday: row?.querySelector("input[data-action='set-membership-default'][data-stage='sunday']")?.checked,
  }, mode);
  try {
    await queueMembershipAttendanceUpdate(cellId, personId, {
      attendanceMode: mode,
      attendanceDefaults,
    });
  } catch (err) {
    setFeedback(err.message, true);
  }
});
weekField.addEventListener("change", () => {
  syncPhaseIndicator();
  if (reportReadOnlyMode && cellField?.value && weekField?.value) {
    autoLoadExistingReportIfAny(cellField.value, Number(weekField.value));
  }
});
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
segViewMobileButton?.addEventListener("click", () => {
  toggleSegViewMobileMenu();
});
segScopeMobileButton?.addEventListener("click", () => {
  toggleSegScopeMobileMenu();
});
segViewMobileMenu?.addEventListener("click", (e) => {
  const btn = e.target.closest(".seg-view-mobile-option[data-segtab]");
  if (!btn) return;
  const nextTab = String(btn.dataset.segtab || "").trim();
  if (!nextTab) return;
  activateSegTab(nextTab);
});
document.addEventListener("click", (e) => {
  if (!segViewMobilePicker?.classList.contains("is-open")) return;
  if (segViewMobilePicker.contains(e.target)) return;
  closeSegViewMobileMenu();
});
document.addEventListener("click", (e) => {
  if (!segScopeMobilePicker?.classList.contains("is-open")) return;
  if (segScopeMobilePicker.contains(e.target)) return;
  closeSegScopeMobileMenu();
});
document.addEventListener("click", (e) => {
  if (!friendTrackingFilterPicker?.classList.contains("is-open")) return;
  if (friendTrackingFilterPicker.contains(e.target)) return;
  closeFriendTrackingCellFilterMenu();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeSegViewMobileMenu();
    closeSegScopeMobileMenu();
    closeFriendTrackingCellFilterMenu();
  }
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
      setFeedback(t('fb.cannotAdvanceWeek', { sel: selectedWeek, max: maxWeek }), true);
      return;
    }
  }
  currentStage = stage;
  document.querySelectorAll(".stage-tab").forEach(btn => {
    btn.classList.toggle("is-active", btn.dataset.stage === stage);
  });

  // Asegurar que el tab activo sea visible (centrado) en pantallas angostas
  // donde la stage-nav hace scroll horizontal en móvil.
  const activeTab = document.querySelector(`.stage-tab.is-active[data-stage="${stage}"]`);
  if (activeTab && typeof activeTab.scrollIntoView === "function") {
    try {
      activeTab.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    } catch { /* navegadores muy viejos */ }
  }

  // Show/hide: visible if data-stage contains the current stage (space-separated list supported)
  document.querySelectorAll("[data-stage]").forEach(el => {
    if (el.classList.contains("stage-nav") || el.classList.contains("stage-tab") || el.closest(".stage-nav")) return;
    const elStages = (el.dataset.stage || "").split(" ");
    const isVisible = el.classList.contains("stage-save-bar")
      ? elStages.includes(stage)
      : elStages.includes(stage);
    el.classList.toggle("stage-visible", isVisible);
  });

  const stageLabels = { encabezado: t('stage.encabezado'), planificacion: t('stage.planificacion'), alcance: t('stage.alcance'), culto: t('stage.culto'), cierre: t('stage.cierre') };
  if (topbarRouteLabel) topbarRouteLabel.textContent = stageLabels[stage] ?? "Reporte";
  document.body.dataset.activeStage = stage;
  // Sincronizar los defaults del mini-form de "Agregar amigo" con la etapa
  // activa, pero solo si el formulario est\u00e1 vac\u00edo (para no pisar lo que el
  // usuario ya tecle\u00f3). Reach=true en Alcance, Sunday=true en Culto.
  if ((stage === "culto" || stage === "alcance")
      && visitorQuickName instanceof HTMLInputElement
      && !String(visitorQuickName.value || "").trim()) {
    const inCulto = stage === "culto";
    if (visitorQuickReach instanceof HTMLInputElement) {
      visitorQuickReach.checked = !inCulto;
    }
    if (visitorQuickSunday instanceof HTMLInputElement) {
      visitorQuickSunday.checked = inCulto;
    }
  }
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
    const rollover = new Date(now); rollover.setHours(0,0,0,0);
    const diff = (rollover.getDay() - weekStartDay + 7) % 7;
    rollover.setDate(rollover.getDate() - diff);
    return (now.getTime() - rollover.getTime()) / 3600000 < graceHours;
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
  // Si el reporte ya fue finalizado (no es borrador), no tiene sentido empujar
  // al usuario a la etapa de "cierre" (Finalizar) cada vez que abre el form.
  // Lo dejamos en "Inicio" (encabezado) y desde ahí decide si quiere revisar
  // alguna etapa o re-editar (sólo posible mientras siga editable la semana).
  const isDraft = fd._draft === true || fd._draft === "true";
  if (!isDraft && !fd.lastStage) {
    return "encabezado";
  }
  if (fd.lastStage && STAGES.includes(fd.lastStage)) {
    const idx = STAGES.indexOf(fd.lastStage);
    // Avanza a la siguiente etapa; si ya estaba en la última, quédate ahí.
    return idx >= 0 && idx < STAGES.length - 1 ? STAGES[idx + 1] : fd.lastStage;
  }
  // Sin lastStage (p.ej. reporte finalizado y reabierto): ir a la primera
  // etapa SIN datos. Antes devolvíamos la primera CON datos (review-first),
  // lo que dejaba al usuario en Planificación cuando ya había llenado
  // Planificación + Alcance y esperaba aterrizar en Culto.
  return inferNextIncompleteStage(fd);
}

function pickHeaderContinueStage(formData) {
  const resumeStage = pickResumeStage(formData);
  if (resumeStage !== "encabezado") return resumeStage;

  const fd = formData || {};
  const members = Array.isArray(fd.memberAttendance) ? fd.memberAttendance : [];
  const visitors = Array.isArray(fd.visitors) ? fd.visitors.filter(v => String(v?.name || "").trim()) : [];
  const kids = Array.isArray(fd.kids) ? fd.kids.filter(k => String(k?.name || "").trim()) : [];
  const baptisms = Array.isArray(fd.baptisms) ? fd.baptisms.filter(b => String(b?.name || "").trim()) : [];
  const reachSupervisorVisits = normalizeReachSupervisorVisits(fd.reachSupervisorVisits || fd.reachSupervisorVisitsJson);

  if (members.some(m => m?.planningAttended || (m?.planningStatus && m.planningStatus !== "pending"))) {
    return "planificacion";
  }
  if (
    members.some(m => m?.reachAttended || m?.reachPrivileged || (m?.reachStatus && m.reachStatus !== "pending"))
    || visitors.some(v => v?.reachAttended)
    || kids.some(k => k?.reachAttended)
    || reachSupervisorVisits.length > 0
  ) {
    return "alcance";
  }
  if (
    members.some(m => m?.sundayAttended || (m?.sundayStatus && m.sundayStatus !== "pending"))
    || visitors.some(v => v?.sundayAttended)
    || kids.some(k => k?.sundayAttended)
    || baptisms.length > 0
  ) {
    return "culto";
  }
  return "planificacion";
}

function inferLastCompletedStage(formData) {
  const fd = formData || {};
  const members = Array.isArray(fd.memberAttendance) ? fd.memberAttendance : [];
  const visitors = Array.isArray(fd.visitors) ? fd.visitors.filter(v => String(v?.name || "").trim()) : [];
  const kids = Array.isArray(fd.kids) ? fd.kids.filter(k => String(k?.name || "").trim()) : [];
  const baptisms = Array.isArray(fd.baptisms) ? fd.baptisms.filter(b => String(b?.name || "").trim()) : [];
  const reachSupervisorVisits = normalizeReachSupervisorVisits(fd.reachSupervisorVisits || fd.reachSupervisorVisitsJson);
  const hasPlanificacion = members.some(m => m?.planningAttended || (m?.planningStatus && m.planningStatus !== "pending"));
  const hasAlcance = members.some(m => m?.reachAttended || m?.reachPrivileged || (m?.reachStatus && m.reachStatus !== "pending"))
    || visitors.some(v => v?.reachAttended)
    || kids.some(k => k?.reachAttended)
    || reachSupervisorVisits.length > 0;
  const hasCulto = members.some(m => m?.sundayAttended || (m?.sundayStatus && m.sundayStatus !== "pending"))
    || visitors.some(v => v?.sundayAttended)
    || kids.some(k => k?.sundayAttended)
    || baptisms.length > 0;
  const hasCierre = baptisms.length > 0 || String(fd.notes || "").trim().length > 0;

  if (hasCierre) return "cierre";
  if (hasCulto) return "culto";
  if (hasAlcance) return "alcance";
  if (hasPlanificacion) return "planificacion";
  return "encabezado";
}

function resolveDraftLastStage(formData, fallbackStage) {
  const fallback = STAGES.includes(fallbackStage) ? fallbackStage : "encabezado";
  const inferred = inferLastCompletedStage(formData);
  const stages = [fallback, inferred];

  const loadedLastStage = String(editingReportLoadedData?.lastStage || "").trim();
  if (STAGES.includes(loadedLastStage)) {
    stages.push(loadedLastStage);
  }
  if (editingReportOriginWasFinalized) {
    stages.push(inferred);
  }

  return stages.reduce((furthest, candidate) => {
    return STAGES.indexOf(candidate) > STAGES.indexOf(furthest) ? candidate : furthest;
  }, "encabezado");
}

async function tryOpenExistingReportFromHeaderContinue(cell, week) {
  let existing = findExistingReportForCellWeek(cell, week);
  if (!existing) {
    try {
      await loadReports();
    } catch (error) {
      console.warn("[save-next-encabezado] no se pudo recargar reportsData", error);
    }
    existing = findExistingReportForCellWeek(cell, week);
  }

  if (!existing) return null;

  if (!isReportEditable(existing)) {
    setFeedback(t('fb.reportClosedNoEdit') || "Esta semana ya está cerrada, no se puede modificar.", true);
    return false;
  }

  if (!isReportEffectivelyDraft(existing)) {
    const confirmed = await appConfirm(
      `La semana ${week} ya tiene un reporte entregado.\n¿Deseas abrirlo para editarlo?`,
      "Reporte ya entregado"
    );
    if (!confirmed) {
      setFeedback(t('fb.reportEditCancelled'));
      return false;
    }
  }

  try {
    const payload = await request(`/api/reports/${existing.id}`);
    loadReportIntoForm(payload.report, Number(existing.id));
    if (!isReportEffectivelyDraft(payload.report)) {
      submittedEditConfirmedReportId = Number(existing.id);
      refreshReportVisualState();
    }
    showStage(pickHeaderContinueStage(payload.report.formData || payload.report), { skipWeekCheck: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
    setFeedback(
      isReportEffectivelyDraft(payload.report)
        ? `Semana ${week} ya tiene reporte; continuando captura existente.`
        : `Semana ${week} ya fue entregada; editando el reporte existente.`
    );
    return true;
  } catch (error) {
    console.warn("[save-next-encabezado] no se pudo abrir reporte existente", error);
    setFeedback("No se pudo abrir el reporte ya entregado. No se realizaron cambios.", true);
    return false;
  }
}

async function tryOpenRecentFinalizedReportFromHeaderContinue(cell, week) {
  const normalizedCell = String(cell || "").trim();
  const normalizedWeek = String(week || "").trim();
  const recent = recentFinalizedReportContext;
  if (!recent) return null;
  if (String(recent.cellNumber || "").trim() !== normalizedCell) return null;
  if (String(recent.week || "").trim() !== normalizedWeek) return null;
  if (!recent.reportId) return null;

  const payload = await request(`/api/reports/${recent.reportId}`);
  const report = payload?.report;
  if (!report) {
    setFeedback("No se pudo recuperar el reporte recién finalizado. No se realizaron cambios.", true);
    return false;
  }

  if (!isReportEditable(report)) {
    setFeedback(t('fb.reportClosedNoEdit') || "Esta semana ya está cerrada, no se puede modificar.", true);
    return false;
  }

  const confirmed = await appConfirm(
    `La semana ${normalizedWeek} ya tiene un reporte entregado.\n¿Deseas abrirlo para editarlo?`,
    "Reporte ya entregado"
  );
  if (!confirmed) {
    setFeedback(t('fb.reportEditCancelled'));
    return false;
  }

  loadReportIntoForm(report, Number(recent.reportId));
  submittedEditConfirmedReportId = Number(recent.reportId);
  refreshReportVisualState();
  showStage(pickHeaderContinueStage(report.formData || report), { skipWeekCheck: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
  setFeedback(`Semana ${normalizedWeek} ya fue entregada; editando el reporte existente.`);
  recentFinalizedReportContext = null;
  return true;
}

async function autoLoadExistingReportIfAny(cell, week) {
  if (editingReportId) return;

  // Si reportsData está vacío, intentar recargar (puede haber fallado durante init)
  if (!Array.isArray(reportsData) || reportsData.length === 0) {
    console.warn("[autoLoad] reportsData vacío, recargando…");
    try {
      await loadReports();
    } catch (e) {
      console.error("[autoLoad] no se pudo recargar reportsData", e);
    }
  }

  const existing = findExistingReportForCellWeek(cell, week);
  if (!existing) {
    console.info(`[autoLoad] sin reporte previo para cell=${cell} week=${week} (reportsData.length=${reportsData.length})`);
    return;
  }
  // If the report is no longer editable (closed week), show in read-only mode
  if (!isReportEditable(existing)) {
    try {
      const payload = await request(`/api/reports/${existing.id}`);
      const reportCell = String(existing.cellNumber || existing.formData?.cellNumber || "").trim();
      const reason = canModifyReportForCell(reportCell) ? "closed" : "permission";
      enterReadOnlyMode(payload.report, { reason });
    } catch (e) {
      console.error("[autoLoad] error cargando reporte readonly", e);
    }
    return;
  }

  try {
    const payload = await request(`/api/reports/${existing.id}`);
    const didOpen = await openReportForEditing(payload.report, existing.id, {
      confirmOnOpen: false,
      silentCancelledFeedback: true,
      silentBlockedFeedback: true,
    });
    if (!didOpen) return;
    return payload.report;
  } catch (e) {
    console.error("[autoLoad] error cargando reporte editable", e);
  }
  return null;
}

// Carga un reporte en el formulario en el orden correcto, asegurando que
// currentMemberAttendance/visitors/kids/baptisms queden sincronizados con
// la data guardada. Centraliza la lógica que antes estaba duplicada en
// autoLoadExistingReportIfAny / handleReportTableClick / edit-from-preview.
function loadReportIntoForm(report, reportId, options = {}) {
  if (!report) return;
  const formData = report.formData || report;

  editingReportId = Number(reportId || report.id);
  editingReportWasFinalized = !isReportEffectivelyDraft(report);
  editingReportOriginWasFinalized = options.preserveFinalizeOrigin
    ? Boolean(editingReportOriginWasFinalized || editingReportWasFinalized)
    : editingReportWasFinalized;
  editingReportLoadedData = cloneReportData(formData);
  resetReportDirtySlices();
  submittedEditConfirmedReportId = null;

  // 0. Limpiar badges/draft de las pestañas antes de re-marcarlas según el
  //    estado real del reporte que vamos a cargar. Evita que palomitas
  //    residuales (p. ej. de una carga previa durante el bootstrap antes
  //    del login) se queden visibles aunque el reporte cargado no las
  //    tenga.
  document.querySelectorAll(".stage-tab-badge").forEach(b => { b.hidden = true; });
  document.querySelectorAll(".stage-tab").forEach(t => t.classList.remove("has-draft"));

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

  // Refrescar el dropdown "Visita previa" con los amigos previos de esta célula.
  renderVisitorHistoryOptions();
  syncStageBadgesFromReport({ formData });
}

function syncStageBadgesFromReport(report) {
  const formData = report?.formData || report || {};
  const STAGE_ORDER = ["encabezado", "planificacion", "alcance", "culto", "cierre"];
  document.querySelectorAll(".stage-tab-badge").forEach(b => { b.hidden = true; });
  document.querySelectorAll(".stage-tab").forEach(t => t.classList.remove("has-draft"));

  const lastStage = formData?.lastStage;
  const isDraftFlag = formData?._draft === true || formData?._draft === "true";
  const inProgress = isDraftFlag || (lastStage && lastStage !== "cierre");
  if (inProgress) {
    if (lastStage) {
      const idx = STAGE_ORDER.indexOf(lastStage);
      if (idx >= 0) STAGE_ORDER.slice(0, idx + 1).forEach(markStageSaved);
    } else {
      const nextIncomplete = inferNextIncompleteStage(formData);
      const idx = STAGE_ORDER.indexOf(nextIncomplete);
      if (idx > 0) STAGE_ORDER.slice(0, idx).forEach(markStageSaved);
    }
    return;
  }

  if (!isReportEffectivelyDraft({ formData })) {
    STAGE_ORDER.forEach(markStageSaved);
  }
}

// Guardar borrador — saves current form state without browser validation
async function saveDraft(stage) {
  clearFeedback();
  const stageBeforeSave = currentStage || stage || "encabezado";
  // Defensa: si el reporte cargado pertenece a una semana ya cerrada (fuera
  // de gracia), no permitir guardar cambios — ni siquiera como borrador.
  if (editingReportId) {
    const _existing = (reportsData || []).find(r => Number(r.id) === Number(editingReportId));
    if (_existing && !isReportEditable(_existing)) {
      setFeedback(t('fb.reportClosedNoEdit') || "Esta semana ya está cerrada, no se puede modificar.", true);
      return false;
    }
  }
  const fd = new FormData(reportForm);
  const payload = Object.fromEntries(fd.entries());
  payload.week          = weekField.value      || payload.week          || "";
  payload.cellNumber    = cellField.value        || payload.cellNumber    || "";
  payload.leaderName    = leaderField.value    || payload.leaderName    || "";
  payload.assistantName = assistantField.value || payload.assistantName || "";
  payload.hostName      = hostField.value      || payload.hostName      || "";
  payload.address       = reportAddress.value  || payload.address       || "";
  applyCellCatalogFieldsToPayload(payload);
  payload.memberAttendance  = currentMemberAttendance;
  payload.reachSupervisorVisits = currentReachSupervisorVisits;
  payload.visitors          = currentVisitors.filter(v => String(v.name || "").trim());
  payload.kids              = currentKids.filter(k => String(k.name || "").trim());
  payload.baptisms          = normalizeBaptisms(currentBaptisms).filter(e => e.name);
  preserveUntouchedReportSlices(payload);
  payload.attendanceSummary = computeWeeklySummaryFromPayload(payload);
  // "Guardar" siempre regresa el reporte a borrador, incluso si antes ya
  // estaba finalizado. Así la re-edición se acumula como borrador hasta que
  // el usuario vuelva a finalizar explícitamente.
  payload._draft = true;
  payload.lastStage = resolveDraftLastStage(payload, stage);
  payload.cycleReportId = computeCycleReportId(payload.cellNumber, getReportYearValue());

  if (!payload.week || !payload.cellNumber) {
    setFeedback(t("err.selectWeekCell"), true);
    return false;
  }
  try {
    let savedReportId = editingReportId;
    if (editingReportId) {
      await request(`/api/reports/${editingReportId}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      const result = await request("/api/reports", { method: "POST", body: JSON.stringify(payload) });
      if (result?.id) {
        savedReportId = Number(result.id);
        editingReportId = savedReportId;
      }
    }
    // Marca ✓ en la pestaña de la etapa que el usuario acaba de guardar.
    markStageSaved(stage);
    await loadCatalogs();
    await loadReports();
    if (savedReportId) {
      const savedPayload = await request(`/api/reports/${savedReportId}`);
      loadReportIntoForm(savedPayload.report, Number(savedReportId), { preserveFinalizeOrigin: true });
      showStage(stageBeforeSave, { skipWeekCheck: true });
    }
    setFeedback(t("err.draftSaved", { stage }));
    return true;
  } catch (err) {
    setFeedback(err.message, true);
    return false;
  }
}

document.querySelector("#save-next-culto")?.addEventListener("click",           () => saveDraftAndAdvance("culto"));
document.querySelector("#finalizar-reporte")?.addEventListener("click",         () => finalizarReporte());

// Verifica si la etapa tiene datos capturados (asistencias, status, visitas, etc.)
function stageHasData(stage) {
  const members  = Array.isArray(currentMemberAttendance) ? currentMemberAttendance : [];
  const visitors = Array.isArray(currentVisitors) ? currentVisitors.filter(v => String(v.name || "").trim()) : [];
  const kids     = Array.isArray(currentKids)     ? currentKids.filter(k => String(k.name || "").trim())     : [];
  const baptisms = Array.isArray(currentBaptisms) ? currentBaptisms.filter(b => String(b.name || "").trim()) : [];
  if (stage === "planificacion") {
    return members.some(m => m.planningAttended || (m.planningStatus && m.planningStatus !== "pending"));
  }
  if (stage === "alcance") {
    if (members.some(m => m.reachAttended || m.reachPrivileged || (m.reachStatus && m.reachStatus !== "pending"))) return true;
    if (visitors.some(v => v.reachAttended)) return true;
    if (currentReachSupervisorVisits.length) return true;
    return false;
  }
  if (stage === "culto") {
    if (members.some(m => m.sundayAttended || (m.sundayStatus && m.sundayStatus !== "pending"))) return true;
    if (visitors.some(v => v.sundayAttended)) return true;
    if (kids.some(k => k.sundayAttended)) return true;
    if (baptisms.length) return true;
    return false;
  }
  return true;
}

function memberEntryHasCapturedActivity(member) {
  if (!member) return false;
  if (member.planningAttended || member.reachAttended || member.sundayAttended || member.reachPrivileged) return true;
  if (String(member.note || "").trim()) return true;

  const expectedStatus = {
    planningStatus: member.attendanceMode === "justified_default" && member.attendanceDefaults?.planning ? "justified" : "pending",
    reachStatus: member.attendanceMode === "justified_default" && member.attendanceDefaults?.reach ? "justified" : "pending",
    sundayStatus: member.attendanceMode === "justified_default" && member.attendanceDefaults?.sunday ? "justified" : "pending",
  };

  return ["planningStatus", "reachStatus", "sundayStatus"].some((fieldName) => {
    const currentStatus = String(member[fieldName] || "pending").toLowerCase();
    return currentStatus !== expectedStatus[fieldName];
  });
}

function isCurrentReportFormEmpty() {
  const hasMemberActivity = (currentMemberAttendance || []).some(
    (member) => memberEntryHasCapturedActivity(member)
  );
  const hasVisitors = (currentVisitors || []).some((visitor) => visitor && String(visitor.name || "").trim());
  const hasKids = (currentKids || []).some((kid) => kid && (
    kid.reachAttended
    || kid.sundayAttended
    || String(kid.note || "").trim()
    || (kid.source !== "catalog" && String(kid.name || "").trim())
  ));
  const hasBaptisms = (currentBaptisms || []).some((entry) => entry && String(entry.name || "").trim());
  return !hasMemberActivity && !hasVisitors && !hasKids && !hasBaptisms;
}

// Guardar y continuar — saves then advances to next stage
async function saveDraftAndAdvance(stage) {
  if (stage === "encabezado" && !editingReportId && isCurrentReportFormEmpty()) {
    const cellVal = String(cellField?.value || "").trim();
    const weekVal = String(weekField?.value || "").trim();
    if (cellVal && weekVal) {
      const recentReopenResult = await tryOpenRecentFinalizedReportFromHeaderContinue(cellVal, weekVal);
      if (recentReopenResult !== null) {
        return;
      }
      const reopenResult = await tryOpenExistingReportFromHeaderContinue(cellVal, weekVal);
      if (reopenResult !== null) {
        return;
      }
    }
  }

  if (editingReportId && submittedEditConfirmedReportId !== Number(editingReportId)) {
    const editingExisting = (reportsData || []).find(r => Number(r.id) === Number(editingReportId));
    const confirmed = await confirmEditingSubmittedReport(editingExisting);
    if (!confirmed) {
      setFeedback(t('fb.reportEditCancelled'));
      return;
    }
    submittedEditConfirmedReportId = Number(editingReportId);
  }
  if (["planificacion", "alcance", "culto"].includes(stage) && !stageHasData(stage)) {
    const labels = { planificacion: t('dash.planning'), alcance: t('dash.reach'), culto: t('dash.sunday') };
    const ok = await appConfirm(
      t('conf.noDataInStageMsg', { stage: labels[stage] }),
      t('conf.noDataCaptured')
    );
    if (!ok) return;
  }
  const saved = await saveDraft(stage);
  if (!saved) return;
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
  applyCellCatalogFieldsToPayload(payload);
  payload.memberAttendance  = currentMemberAttendance;
  payload.reachSupervisorVisits = currentReachSupervisorVisits;
  payload.visitors          = currentVisitors.filter(v => String(v.name || "").trim());
  payload.kids              = currentKids.filter(k => String(k.name || "").trim());
  payload.baptisms          = normalizeBaptisms(currentBaptisms).filter(e => e.name);
  preserveUntouchedReportSlices(payload);
  payload.attendanceSummary = computeWeeklySummaryFromPayload(payload);
  payload.cycleReportId     = computeCycleReportId(payload.cellNumber, getReportYearValue());
  delete payload._draft;
  delete payload.lastStage;

  if (!payload.week || !payload.cellNumber) {
    setFeedback(t("err.selectWeekCellFin"), true);
    return;
  }

  // Evitar "finalizar" un reporte que no tiene NINGÚN dato capturado
  // (sin asistencias, sin visitas, sin niños, sin bautismos). Si el usuario
  // no llenó nada, esto sería un reporte fantasma en verde en el dashboard.
  if (!reportHasMeaningfulData({ formData: payload })) {
    const ok = await appConfirm(
      "Este reporte no tiene asistencias, supervisión, visitas, niños ni bautismos capturados.\n¿Seguro que deseas finalizarlo así?",
      t('conf.reportNoData')
    );
    if (!ok) return;
  }

  // Aviso por etapa sin información: si alguna de las 3 fases (Planeación,
  // Alcance, Culto) no tiene ningún dato registrado (nadie marcado, sin
  // visitas/niños/bautismos según corresponda), advertimos al líder antes
  // de finalizar para que sepa qué le falta.
  const emptyStages = [];
  const att = Array.isArray(payload.memberAttendance) ? payload.memberAttendance : [];
  const anyMarked = (field) => att.some((e) => {
    const v = e && e[field];
    return v && v !== "pending";
  });
  const anyChecked = (field) => att.some((e) => e && e[field] === true);
  if (!anyMarked("planningStatus") && !anyChecked("planningAttended")) {
    emptyStages.push("Planeación");
  }
  if (!anyMarked("reachStatus") && !anyChecked("reachAttended") &&
      normalizeReachSupervisorVisits(payload.reachSupervisorVisits || payload.reachSupervisorVisitsJson).length === 0 &&
      (!Array.isArray(payload.visitors) || payload.visitors.length === 0) &&
      (!Array.isArray(payload.kids)     || payload.kids.length === 0)) {
    emptyStages.push("Alcance");
  }
  if (!anyMarked("sundayStatus") && !anyChecked("sundayAttended") &&
      (!Array.isArray(payload.baptisms) || payload.baptisms.length === 0)) {
    emptyStages.push("Culto");
  }
  if (emptyStages.length > 0) {
    const list = emptyStages.join(", ");
    const ok = await appConfirm(
      `No se registró información en: ${list}.\n¿Deseas finalizar el reporte de todas formas?`,
      "Etapa(s) sin información"
    );
    if (!ok) return;
  }

  // Si el reporte YA estaba finalizado (no es borrador) y se está re-editando,
  // pedir confirmación explícita: el líder está modificando un reporte ya
  // entregado oficialmente. Esto sólo es posible mientras la semana sigue
  // abierta o dentro del periodo de gracia (la UI ya bloquea lo demás).
  if (editingReportId) {
    const existing = (reportsData || []).find(r => Number(r.id) === Number(editingReportId));
    // Defensa adicional: si la semana del reporte ya está cerrada (fuera de
    // gracia), bloquear cualquier cambio aunque el formulario haya quedado
    // cargado. Sólo se puede editar la semana actual o la anterior en gracia.
    if (existing && !isReportEditable(existing)) {
      setFeedback(t('fb.reportClosedNoEdit') || "Esta semana ya está cerrada, no se puede modificar.", true);
      return;
    }
    const wasFinalized = Boolean(
      editingReportOriginWasFinalized
      || editingReportWasFinalized
      || (existing && !isReportEffectivelyDraft(existing))
    );
    if (wasFinalized) {
      const ok = await appConfirm(
        "Este reporte ya estaba finalizado.\n¿Seguro que deseas guardar los cambios y sobrescribir la versión entregada?",
        "Modificar reporte finalizado"
      );
      if (!ok) return;
    }
  }

  const promotedCount = countBaptismsToPromote(payload.baptisms);
  const msg = promotedCount
    ? t('fb.reportFinalizedWithBap', { n: promotedCount })
    : t('fb.reportFinalized');

  try {
    let finalizedReportId = Number(editingReportId || 0) || null;
    if (editingReportId) {
      await request(`/api/reports/${editingReportId}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      const result = await request("/api/reports", { method: "POST", body: JSON.stringify(payload) });
      if (result?.id) {
        editingReportId = result.id;
        finalizedReportId = Number(result.id) || null;
      }
    }
    // Al finalizar: marcar TODAS las etapas como completadas (✓ verde).
    ["encabezado", "planificacion", "alcance", "culto", "cierre"].forEach(markStageSaved);
    const savedCell = payload.cellNumber;
    const savedWeek = String(payload.week || "");
    await loadCatalogs();
    await loadReports();
    resetReportForm();
    // Después de finalizar, regresamos al "Inicio" del flujo (etapa Encabezado)
    // con el formulario en blanco. Conservamos la célula seleccionada y
    // refrescamos el dropdown de semanas para que se vea el ✓ entregado.
    // NO auto-cargamos otro reporte ni auto-avanzamos semana: si no hay más
    // semanas por reportar, el botón "Siguiente" quedará deshabilitado de
    // forma natural y el usuario verá la pantalla de Inicio limpia.
    if (savedCell) {
      cellField.value = String(savedCell);
      syncReportWithCell(true);
      populateWeekOptions();
      if (savedWeek) weekField.value = savedWeek;
      // populateWeekOptions ya selecciona la semana real en curso y marca
      // "✓ entregado" si esta semana ya fue finalizada. Dejamos esa selección
      // para que el dropdown no aparezca vacío y el indicador de fase se vea.
      syncPhaseIndicator();
      const finalizedReport = finalizedReportId
        ? (reportsData || []).find(r => Number(r.id) === Number(finalizedReportId))
        : null;
      if (finalizedReport) {
        syncStageBadgesFromReport(finalizedReport);
      }
    }
    recentFinalizedReportContext = finalizedReportId
      ? { reportId: Number(finalizedReportId), cellNumber: String(savedCell || ""), week: String(savedWeek || "") }
      : null;
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
resetButton.addEventListener("click", async () => {
  clearFeedback();
  // Confirmar solo si hay algo en juego: un reporte en edición o datos capturados
  // en cualquiera de las etapas. Evita perder un borrador por un tap accidental.
  const hasInMemoryData =
    (Array.isArray(currentVisitors) && currentVisitors.some(v => String(v?.name || "").trim())) ||
    (Array.isArray(currentMemberAttendance) && currentMemberAttendance.length > 0) ||
    (Array.isArray(currentKids) && currentKids.some(k => String(k?.name || "").trim())) ||
    (Array.isArray(currentBaptisms) && currentBaptisms.some(b => String(b?.name || "").trim()));
  if (editingReportId || hasInMemoryData) {
    const ok = await appConfirm(t('conf.resetFormMsg'), t('conf.resetForm'));
    if (!ok) return;
  }
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
  // Delegación robusta para taps en mobile: escuchar también a nivel dialog
  // y deduplicar pointerup/click con un flag por evento.
  peopleRcmDialog.addEventListener("click", handleRcmMilestoneClick);
  peopleRcmDialog.addEventListener("pointerup", (e) => {
    if (e.pointerType === "mouse") return;             // mouse usa click normal
    const btn = e.target.closest("button.rcm-milestone-toggle");
    if (!btn || btn.dataset.rcmBusy === "1") return;
    btn.dataset.rcmBusy = "1";
    setTimeout(() => { delete btn.dataset.rcmBusy; }, 600);
    handleRcmMilestoneClick(e);
  });
  peopleRcmDialog.addEventListener("change", handleRcmDateChange);
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
  const preview = cells.map((c, i) => t('conf.renumberRow', { from: c.cellNumber, to: i + 1 })).join("\n");
  const ok = await appConfirm(
    t('conf.renumberCellsMsg', { n: cells.length, preview: preview }),
    t('conf.renumberCells')
  );
  if (!ok) return;
  try {
    await request("/api/catalogs/cells/renumber", { method: "POST" });
    await loadCatalogs();
    setFeedback(t('fb.cellsRenumbered'));
  } catch (err) {
    setFeedback(err.message, true);
  }
});
document.querySelector("#cell-dialog-close-btn")?.addEventListener("click", () => cellEditDialog?.close());
cellEditDialog?.addEventListener("click", (e) => { if (e.target === cellEditDialog) cellEditDialog.close(); });

// t('pdlg.newPerson2') button inside cell dialog — opens people edit dialog with cell pre-selected
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
    const ok = await appConfirm(t('conf.deleteCellMsg', { n: cell?.cellNumber }), t('conf.deleteCell'));
    if (!ok) return;
    try {
      await request(`/api/catalogs/cells/${cellId}`, { method: "DELETE" });
      await loadCatalogs();
      setFeedback(t('fb.cellDeleted'));
    } catch (err) { setFeedback(err.message, true); }
  }
});
cellField.addEventListener("change", () => {
  syncReportWithCell(true);
  populateWeekOptions(); // re-evaluate disabled past weeks for the new cell
  autoAdvanceWeekForCell(cellField.value);
  renderVisitorHistoryOptions(); // historial de visitas restringido a la célula activa
});
reportForm.elements.namedItem("reportDate")?.addEventListener?.("change", () => {
  syncWeekFieldWithReportDate(true);
  renderBaptismTable();
});
// people role toggles live inside the modal, attach after DOM is ready
document.getElementById("people-is-kid")?.addEventListener("change", () => {
  const pastorCheck = /** @type {HTMLInputElement|null} */ (document.getElementById("people-is-pastor"));
  const kidCheck = /** @type {HTMLInputElement|null} */ (document.getElementById("people-is-kid"));
  if (kidCheck?.checked && pastorCheck) pastorCheck.checked = false;
  syncPeopleGuardianFields();
  syncPeopleAccessFields();
});
document.getElementById("people-is-pastor")?.addEventListener("change", () => {
  const pastorCheck = /** @type {HTMLInputElement|null} */ (document.getElementById("people-is-pastor"));
  const kidCheck = /** @type {HTMLInputElement|null} */ (document.getElementById("people-is-kid"));
  if (pastorCheck?.checked && kidCheck) kidCheck.checked = false;
  syncPeopleGuardianFields();
  syncPeopleAccessFields();
});
reportTableBody.addEventListener("click", handleReportTableClick);
document.getElementById("report-cycles-list")?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  if (btn.dataset.action === "new-report-for-cell") {
    const cell = btn.dataset.cell;
    const week = btn.dataset.week;
    const realWeek = getQuarterWeekNumber();
    if (Number(week) < realWeek) {
      setFeedback(t('fb.weekClosedNoCapture', { w: week }), true);
      return;
    }
    resetReportForm();
    if (cell) { cellField.value = cell; syncReportWithCell(true); }
    if (week) { weekField.value = week; syncPhaseIndicator(); }
    renderVisitorHistoryOptions();
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
      if (previewDialogTitle) previewDialogTitle.textContent = t('preview.cellWeekTitle', { c: cell, w: week });
      if (previewDialogBody)  previewDialogBody.innerHTML = buildReportPreviewHtmlFromData(report);
      activePreviewVisitorContext = { report };
      if (previewDialogFooter) previewDialogFooter.hidden = false;
      const cancelBtn  = document.getElementById("preview-cancel-btn");
      const confirmBtn = document.getElementById("preview-confirm-btn");
      const editFromSegBtn = document.getElementById("preview-edit-from-seg-btn");
      if (cancelBtn)  cancelBtn.hidden  = true;
      if (confirmBtn) confirmBtn.hidden = true;
      if (editFromSegBtn) {
        editFromSegBtn.hidden = !isReportEditable(report);
        editFromSegBtn.onclick = async () => {
          const fullPayload = await request(`/api/reports/${reportId}`);
          const didOpen = await openReportForEditing(fullPayload.report, reportId, {
            resumeStage: "encabezado",
          });
          if (didOpen) reportPreviewDialog.close();
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
    // Defensive: solo el lider de la celula (o admin) puede capturar
    const canCapture = currentUser?.isAdmin
      || String(currentUser?.assignedCellNumber || "") === String(cell);
    if (!canCapture) {
      setFeedback(t('fb.onlyLeaderCanCapture', { c: cell }), true);
      return;
    }
    const realWeek = getQuarterWeekNumber();
    // Block past weeks — should not be reachable (chip is disabled), but defensive
    if (Number(week) < realWeek) {
      setFeedback(t('fb.weekClosedNoCapture', { w: week }), true);
      return;
    }
    resetReportForm();
    if (cell) { cellField.value = cell; syncReportWithCell(true); }
    if (week) { weekField.value = week; syncPhaseIndicator(); }
    renderVisitorHistoryOptions();
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
      if (previewDialogTitle) previewDialogTitle.textContent = t('preview.cellWeekTitle', { c: cell, w: week });
      if (previewDialogBody)  previewDialogBody.innerHTML = buildReportPreviewHtmlFromData(report);
      activePreviewVisitorContext = { report };
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
          const fullPayload = await request(`/api/reports/${reportId}`);
          const didOpen = await openReportForEditing(fullPayload.report, reportId, {
            resumeStage: "encabezado",
          });
          if (didOpen) reportPreviewDialog.close();
        };
        editFromSegBtn.onclick = handler;
      }
      reportPreviewDialog.showModal();
    } catch (err) {
      setFeedback(err.message, true);
    }
  }
});

// Seguimiento: toggle esta semana / semana anterior
document.getElementById("seg-week-offset-tabs")?.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-weekoff]");
  if (!btn) return;
  seguimientoWeekOffset = parseInt(btn.dataset.weekoff, 10) || 0;
  document.querySelectorAll("#seg-week-offset-tabs .filter-tab").forEach(b =>
    b.classList.toggle("is-active", b === btn)
  );
  renderSeguimiento(reportsData);
});

// Preferences save
document.getElementById("settings-prefs-save-btn")?.addEventListener("click", () => {
  const selected = document.querySelector("input[name='history_scope']:checked")?.value || "current";
  historyScope = selected;
  try { localStorage.setItem("historyScope", selected); } catch (_) {}
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
document.getElementById("system-accounts-table-body")?.addEventListener("click", handlePeopleTableClick);
document.getElementById("cells-card-grid")?.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const cellId = btn.dataset.id;
  if (btn.dataset.action === "edit-cell") {
    openCellEditDialog(findCellById(cellId));
  } else if (btn.dataset.action === "delete-cell") {
    const cell = findCellById(cellId);
    const ok = await appConfirm(t('conf.deleteCellMsg', { n: cell?.cellNumber }), t('conf.deleteCell'));
    if (!ok) return;
    try {
      await request(`/api/catalogs/cells/${cellId}`, { method: "DELETE" });
      await loadCatalogs();
      setFeedback(t('fb.cellDeleted'));
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
if (kidQuickForm) {
  kidQuickForm.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      handleAddKidClick();
    }
  });
}
if (addKidQuickButton) {
  addKidQuickButton.addEventListener("click", handleAddKidClick);
}
if (resetKidQuickButton) {
  resetKidQuickButton.addEventListener("click", handleKidQuickReset);
}
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
// Enter en el campo de nombre = Agregar visita (UX r\u00e1pida)
if (visitorQuickName instanceof HTMLInputElement) {
  visitorQuickName.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleVisitorQuickSubmit();
    }
  });
}
if (visitorQuickKind) {
  visitorQuickKind.addEventListener("change", syncVisitorQuickKindUI);
}
if (visitorQuickName instanceof HTMLInputElement) {
  visitorQuickName.addEventListener("input", () => {
    syncQuickLateRegistrationState(String(visitorQuickName.value || "").trim());
  });
  visitorQuickName.addEventListener("change", () => {
    syncQuickLateRegistrationState(String(visitorQuickName.value || "").trim());
  });
}
if (visitorQuickProcessEntry instanceof HTMLSelectElement) {
  visitorQuickProcessEntry.addEventListener("change", () => {
    updateVisitorQuickProcessSummary();
  });
}
if (visitorQuickReach instanceof HTMLInputElement) {
  visitorQuickReach.addEventListener("change", updateVisitorQuickProcessSummary);
}
if (resetVisitorQuickButton) {
  resetVisitorQuickButton.addEventListener("click", handleVisitorQuickReset);
}
if (visitorQuickHistory instanceof HTMLSelectElement) {
  visitorQuickHistory.addEventListener("change", () => {
    const selectedName = String(visitorQuickHistory.value || "").trim();
    updateVisitorHistoryHideButton();
    if (visitorQuickName instanceof HTMLInputElement) {
      visitorQuickName.value = selectedName;
    }
    syncQuickLateRegistrationState(selectedName);
    if (selectedName) {
      applyQuickVisitorHistory(selectedName);
    }
  });
}
if (visitorQuickHistoryHideButton instanceof HTMLButtonElement) {
  visitorQuickHistoryHideButton.addEventListener("click", () => {
    handleHideVisitorHistorySelection().catch((error) => setFeedback(error.message, true));
  });
}
if (visitorQuickHistoryRestoreButton instanceof HTMLButtonElement) {
  visitorQuickHistoryRestoreButton.addEventListener("click", () => {
    handleRestoreHiddenVisitorHistory().catch((error) => setFeedback(error.message, true));
  });
}
initMobileFormPickers();
document.addEventListener("click", (event) => {
  if (event.target.closest(".mobile-form-picker")) return;
  closeAllMobileFormPickers();
});
fillPlanningMembersButton.addEventListener("click", handleFillPlanningMembers);
fillReachMembersButton?.addEventListener("click", handleFillReachMembers);
fillReachPrivilegesButton?.addEventListener("click", handleFillReachPrivileges);
copyPlanningToReachButton?.addEventListener("click", handleCopyPlanningToReach);
copyReachToSundayButton.addEventListener("click", handleCopyReachToSunday);
fillSundayMembersButton?.addEventListener("click", handleFillSundayMembers);
markAllVisitorsToSundayButton?.addEventListener("click", handleMarkAllVisitorsToSunday);
copyVisitorReachToSundayButton?.addEventListener("click", handleCopyVisitorReachToSunday);
markAllPrivilegesButton?.addEventListener("click", handleMarkAllPrivileges);
clearMemberActivitiesButton.addEventListener("click", handleClearMemberActivities);
copyKidReachToSundayButton?.addEventListener("click", handleCopyKidReachToSunday);
fillSundayKidsButton?.addEventListener("click", handleFillSundayKids);
clearKidActivitiesButton?.addEventListener("click", handleClearKidActivities);
memberList.addEventListener("click", handleMemberListClick);
reachSupervisorVisitList?.addEventListener("change", (event) => {
  const input = event.target.closest("input[type='checkbox'][data-supervision-name]");
  if (!(input instanceof HTMLInputElement) || !reachSupervisorVisitList) return;
  markReportDirty("reachSupervisor");
  currentReachSupervisorVisits = Array.from(reachSupervisorVisitList.querySelectorAll("input[type='checkbox'][data-supervision-name]:checked")).map((checkbox) => ({
    personId: String(checkbox.dataset.supervisionPersonId || "").trim() || null,
    name: String(checkbox.dataset.supervisionName || "").trim(),
    supervisorSector: String(checkbox.dataset.supervisionSector || "").trim(),
  }));
  syncReachSupervisorVisitFields();
  renderAttendanceSummary();
});

// ── Report preview dialog ────────────────────────────────────────────────────
const reportPreviewDialog = /** @type {HTMLDialogElement|null} */ (document.querySelector("#report-preview-dialog"));
const reportPreviewOpenBtn  = document.querySelector("#report-preview-open-btn");
const previewCloseBtn       = document.querySelector("#preview-close-btn");
const previewCancelBtn      = document.querySelector("#preview-cancel-btn");
const previewConfirmBtn     = document.querySelector("#preview-confirm-btn");
const previewDialogTitle    = document.querySelector("#preview-dialog-title");
const previewDialogBody     = document.querySelector("#preview-dialog-body");
const previewDialogFooter   = document.querySelector("#preview-dialog-footer");
const previewVisitorsDialog = /** @type {HTMLDialogElement|null} */ (document.querySelector("#preview-visitors-dialog"));
const previewVisitorsDialogTitle = document.querySelector("#preview-visitors-dialog-title");
const previewVisitorsDialogBody = document.querySelector("#preview-visitors-dialog-body");
const previewVisitorsCloseBtn = document.querySelector("#preview-visitors-close-btn");
const previewVisitorsCancelBtn = document.querySelector("#preview-visitors-cancel-btn");

// Texto de WhatsApp más reciente generado por buildReportPreviewHtml()
// (sirve para que los botones del modal lo reusen sin reconstruirlo).
let lastPreviewWhatsAppText = "";
let activePreviewVisitorContext = null;

function buildPreviewReportSnapshot() {
  return {
    cellNumber: cellField.value || "",
    reportDate: getReportDateValue(),
    formData: {
      cellNumber: cellField.value || "",
      reportDate: getReportDateValue(),
      week: weekField.value || "",
      visitors: currentVisitors.filter((entry) => String(entry?.name || "").trim()),
    },
  };
}

function getPreviewVisitorScopeReports(reportLike) {
  const cell = String(reportLike?.cellNumber || reportLike?.formData?.cellNumber || "").trim();
  const year = String(getReportYear(reportLike) || "").trim();
  const quarter = String(getReportQuarter(reportLike) || "").trim();
  return filterVisibleReports(Array.isArray(reportsData) ? reportsData : []).filter((entry) => {
    const entryCell = String(entry.cellNumber || entry.formData?.cellNumber || "").trim();
    if (!cell || entryCell !== cell) return false;
    if (year && String(getReportYear(entry)) !== year) return false;
    if (quarter && String(getReportQuarter(entry)) !== quarter) return false;
    return true;
  });
}

function getPreviewVisitorPeriodLabel(reportLike) {
  const cell = String(reportLike?.cellNumber || reportLike?.formData?.cellNumber || "").trim() || "—";
  const year = String(getReportYear(reportLike) || new Date().getFullYear());
  const quarter = String(getReportQuarter(reportLike) || "").trim();
  return quarter ? `Célula ${cell} · Q${quarter} ${year}` : `Célula ${cell} · ${year}`;
}

function openPreviewVisitorsDialog() {
  if (!previewVisitorsDialog || !previewVisitorsDialogBody || !activePreviewVisitorContext?.report) return;
  delete previewVisitorsDialog.dataset.mode;
  const reportLike = activePreviewVisitorContext.report;
  const visitors = (Array.isArray(reportLike?.formData?.visitors) ? reportLike.formData.visitors : [])
    .filter((entry) => String(entry?.name || "").trim());

  if (previewVisitorsDialogTitle) {
    previewVisitorsDialogTitle.textContent = `Detalle de amigos (${visitors.length})`;
  }

  if (!visitors.length) {
    previewVisitorsDialogBody.innerHTML = '<p class="empty-state">No hay amigos capturados en este reporte.</p>';
    previewVisitorsDialog.showModal();
    return;
  }

  previewVisitorsDialogBody.innerHTML = `
    <div class="preview-visitors-picker-list">
      ${visitors.map((entry) => {
        const key = normalizeVisitorName(entry.name || "");
        const kind = (entry.kind || "amigo") === "visita" ? "Restauración" : "Amigo";
        const badges = [
          entry.reachAttended ? "Alcance" : "",
          entry.sundayAttended ? "Culto" : "",
          entry.converted ? "Conversión" : "",
        ].filter(Boolean).join(" · ");
        const meta = [kind, entry.invitedBy ? `Invitó: ${entry.invitedBy}` : "", badges].filter(Boolean).join(" · ");
        return `
          <div class="preview-visitors-picker-row">
            <div class="preview-visitors-picker-main">
              <span class="preview-visitors-picker-name">${escapeHtml(entry.name || "")}</span>
              <span class="preview-visitors-picker-meta">${escapeHtml(meta || "Sin detalle adicional")}</span>
            </div>
            <button type="button" class="preview-section-action" data-action="open-visitor-history" data-key="${escapeHtml(key)}" data-name="${escapeHtml(entry.name || "")}">Ver detalle</button>
          </div>`;
      }).join("")}
    </div>`;
  previewVisitorsDialog.showModal();
}

function buildReportPreviewHtml() {
  const data = Object.fromEntries(new FormData(reportForm).entries());
  // Disabled fields aren't in FormData — read directly
  data.leaderName   = leaderField.value   || data.leaderName   || "—";
  data.assistantName = assistantField.value || data.assistantName || "—";
  data.hostName     = hostField.value     || data.hostName     || "—";

  const summary = computeWeeklySummary();
  const weekInfo = getRcmWeekInfo(weekField.value);
  const phaseLabel = weekInfo ? `${weekInfo.phaseLabel}` : "";
  const namedVisitors = currentVisitors.filter((entry) => String(entry?.name || "").trim());

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
        [t('admin.members2'), summary.planningMembersPresent],
        [t('dash.friends'), summary.visitors],
        [t('met.kids'), currentKids.filter(k => String(k.name || "").trim()).length],
        [t('met.sundayInsp'), summary.sundayTotal],
        [t('met.conversions'), summary.reachConversions],
      ].map(([lbl, val]) => `
        <div class="preview-stat-card">
          <span class="preview-stat-val">${escapeHtml(String(val))}</span>
          <span class="preview-stat-lbl">${escapeHtml(lbl)}</span>
        </div>`).join("")}
    </div>`;

  // Preview section definitions — match original PDF exactly
  // (reads from all form inputs including standalone Ofrendas and Supervisión panels)
  const PREVIEW_SECTIONS = [
    { title: t('dash.planning'),      fields: [["planningMembersPresent", t('met.membersAttending')], ["planningMembersAbsent", t('met.membersAbsent')]] },
    { title: t('dash.reach'),         fields: [["reachMembersPresent", t('met.membersAttending')], ["reachPrivilegedMembers", t('met.membersPrivileged')], ["reachFriendsPresent", t('met.friendsPresentLong')], ["reachConversions", t('met.conversions')], ["reachKidsPresent", t('rcm.kidsPresent')], ["reachOffering", t('met.offering')]] },
    { title: t('met.sectMultiplication'),  fields: [["multiplyBrothersNewCell", t('met.multBros')], ["multiplyPEinNewCell", t('met.multPE')], ["multiplyKidsNewCell", t('met.multKids')], ["multiplySundayAttendance", t('met.sundayInspAttended')]] },
    { title: t('met.phaseWin'),       fields: [["winSpiritualParents", t('met.spiritualParents')], ["winFriendsContacted", t('met.friendsContacted')], ["winRiseEventFriends", t('met.friendsLev')], ["winEDRFriends", t('met.friendsEDR')], ["winBaptizedFriends", t('met.friendsBaptized')]] },
    { title: t('met.phaseConsolidate'), fields: [["consolidateE1", t('met.e1Mat')], ["consolidateE2", t('met.e2Int')], ["consolidateE3", t('met.e3Ubi')], ["consolidateJoinEvent", t('met.evtUnete')], ["consolidateReencuentro", t('met.evtReencuentro')], ["consolidateMinistries", t('met.evtMinistries')]] },
    { title: t('met.phaseDisciple'),  fields: [["discipleE1Vision", t('met.e1Vis')], ["discipleE2Character", t('met.e2Car')], ["discipleE3Profile", t('met.e3Perfil')], ["discipleLaunchMultiply", t('met.launchMult')]] },
    { title: t('met.sectSupervision'), fields: [["supervisionNetwork", t('met.supRed')], ["supervisionSector", t('met.supSector')], ["supervisionZone", t('met.supZona')], ["supervisionRegion", t('met.supRegion')], ["supervisionArea", t('met.supArea')]] },
    { title: t('met.sectSchools'),    fields: [["schoolFormative", t('met.eduFormative')], ["schoolParents", t('met.eduSpiritualParents')], ["schoolLeaders", t('met.eduLeaders')], ["schoolSupervisors", t('met.eduSupervisors')]] },
    { title: t('met.sectBaptisms'),   fields: [["baptismFirstQuarter", t('met.q1')], ["baptismSecondQuarter", t('met.q2')], ["baptismThirdQuarter", t('met.q3')], ["baptismYearTotal", t('met.totalYear')]] },
  ];

  // Visitor kind split (used to enrich "Amigos presentes" row in the Alcance card)
  const _namedVisPrev = (Array.isArray(currentVisitors) ? currentVisitors : []).filter(v => String(v?.name || "").trim());
  const _friendsPrev  = _namedVisPrev.filter(v => (v.kind || 'amigo') !== 'visita').length;
  const _restorPrev   = _namedVisPrev.filter(v => (v.kind || 'amigo') === 'visita').length;

  // Metric sections
  const metricsHtml = PREVIEW_SECTIONS.map(section => {
    const rows = section.fields.map(([name, label]) => {
      const el = reportForm.elements.namedItem(name);
      const val = (el instanceof HTMLInputElement ? el.value : data[name]) || "0";
      const num = parseFloat(val) || 0;
      const row = { label, val: num === 0 ? "—" : String(num), isEmpty: num === 0 };
      if (name === "reachFriendsPresent" && _restorPrev > 0) {
        row.sublabel = `${_friendsPrev} amigo${_friendsPrev === 1 ? "" : "s"} · ${_restorPrev} restauración`;
      }
      return row;
    });
    const hasData = rows.some(r => !r.isEmpty);
    return `
      <div class="preview-metric-card${hasData ? "" : " preview-metric-empty"}">
        <div class="preview-metric-title">${escapeHtml(section.title)}</div>
        <div class="preview-metric-rows">
          ${rows.map(r => `
            <div class="preview-metric-row${r.isEmpty ? " is-zero" : ""}">
              <span class="preview-metric-label">${escapeHtml(r.label)}${r.sublabel ? `<small class="preview-metric-sub"> · ${escapeHtml(r.sublabel)}</small>` : ""}</span>
              <span class="preview-metric-value">${escapeHtml(r.val)}</span>
            </div>`).join("")}
        </div>
      </div>`;
  }).join("");

  // Members list — árbol colapsable por evento de la semana.
  // Por cada evento (Planeación / Alcance / Culto) listamos quiénes asistieron
  // y quiénes faltaron / justificaron. Colapsado por defecto para no abrumar.
  const STAGE_LABELS_PREVIEW = [
    { field: "planningStatus", label: "Planeación" },
    { field: "reachStatus",    label: "Alcance" },
    { field: "sundayStatus",   label: "Culto" },
  ];
  const totalMembers = currentMemberAttendance.length;
  const eventBlocks = STAGE_LABELS_PREVIEW.map(({ field, label }) => {
    const present = currentMemberAttendance.filter(e => e[field] === "present" || e[field] === "service");
    const absent  = currentMemberAttendance.filter(e => e[field] === "absent");
    const justified = currentMemberAttendance.filter(e => e[field] === "justified");
    const pending = currentMemberAttendance.filter(e => !e[field] || e[field] === "pending");
    const reachSupervisors = field === "reachStatus"
      ? normalizeReachSupervisorVisits(currentReachSupervisorVisits)
      : [];
    const presentPills = present.map(e => `<span class="preview-pill is-present">${escapeHtml(e.name)}${e[field] === "service" ? " · sirviendo" : ""}</span>`).join("");
    const absentPills = absent.map(e => `<span class="preview-pill is-absent">${escapeHtml(e.name)}</span>`).join("");
    const justifiedPills = justified.map(e => `<span class="preview-pill is-justified">${escapeHtml(e.name)}</span>`).join("");
    const supervisorPills = reachSupervisors.map(entry => `<span class="preview-pill is-present">Supervisor · ${escapeHtml(entry.name || "")}</span>`).join("");
    const pendingNote = pending.length ? `<div class="preview-empty-note" style="margin-top:6px">${pending.length} sin marcar</div>` : "";
    return `
      <details class="preview-event-tree">
        <summary>
          <span class="preview-event-tree-label">${escapeHtml(label)}</span>
          <span class="preview-event-tree-counts">
            <span class="ev-tally ev-tally--ok">✓ ${present.length}</span>
            <span class="ev-tally ev-tally--miss">✗ ${absent.length}</span>
            ${justified.length ? `<span class="ev-tally ev-tally--just">J ${justified.length}</span>` : ""}
            ${reachSupervisors.length ? `<span class="ev-tally ev-tally--ok">Sup ${reachSupervisors.length}</span>` : ""}
          </span>
        </summary>
        <div class="preview-event-tree-body">
          ${present.length ? `
            <div class="preview-event-tree-group">
              <span class="preview-event-tree-grouplabel">Asistieron (${present.length})</span>
              <div class="preview-pills">${presentPills}</div>
            </div>` : ""}
          ${reachSupervisors.length ? `
            <div class="preview-event-tree-group">
              <span class="preview-event-tree-grouplabel">Supervisión (${reachSupervisors.length})</span>
              <div class="preview-pills">${supervisorPills}</div>
            </div>` : ""}
          ${absent.length ? `
            <div class="preview-event-tree-group">
              <span class="preview-event-tree-grouplabel">Faltaron (${absent.length})</span>
              <div class="preview-pills">${absentPills}</div>
            </div>` : ""}
          ${justified.length ? `
            <div class="preview-event-tree-group">
              <span class="preview-event-tree-grouplabel">Justificados (${justified.length})</span>
              <div class="preview-pills">${justifiedPills}</div>
            </div>` : ""}
          ${pendingNote}
          ${(!present.length && !absent.length && !justified.length) ? '<span class="preview-empty-note">Sin información en este evento</span>' : ""}
        </div>
      </details>`;
  }).join("");
  const membersHtml = `
    <div class="preview-section-title">Asistencia por evento (${totalMembers} miembros)</div>
    <div class="preview-event-tree-list">${eventBlocks}</div>`;

  // Lista de "presentes" para el resumen de WhatsApp: cualquier miembro que
  // estuvo presente o sirviendo en al menos UN evento de la semana.
  const presentMembers = currentMemberAttendance.filter((e) =>
    STAGE_LABELS_PREVIEW.some(({ field }) => e[field] === "present" || e[field] === "service")
  );

  // Notes
  const notesHtml = data.notes ? `
    <div class="preview-section-title">Observaciones</div>
    <p class="preview-notes">${escapeHtml(data.notes)}</p>` : "";

  // WhatsApp message builder
  function buildWhatsAppText() {
    const lines = [
      t('share.header', { c: escapeHtml(data.cellNumber || '—'), w: escapeHtml(data.week || '—') }),
      `📅 Fecha: ${escapeHtml(data.reportDate || "—")}`,
      t('share.leader', { name: escapeHtml(data.leaderName || '—') }),
      `${t('share.network', { net: escapeHtml(data.networkName || '—'), sec: escapeHtml(data.sector || '—') })}`,
      ``,
      t('share.attendance'),
      t('share.members', { n: summary.planningMembersPresent }),
      t('share.friendsLine', { n: summary.visitors }),
      t('share.cultoInsp', { n: summary.sundayTotal }),
      t('share.conversionsLine', { n: summary.reachConversions }),
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
  // Exponer el texto generado para que botones externos (compartir/descargar) puedan reusarlo.
  lastPreviewWhatsAppText = buildWhatsAppText();

  const friendsPreviewHtml = namedVisitors.length ? `
    <div class="preview-section-head">
      <div class="preview-section-title">Amigos capturados (${namedVisitors.length})</div>
      <button type="button" class="preview-section-action" data-action="open-preview-visitors">Ver detalle</button>
    </div>
    <div class="preview-pills">${namedVisitors.map((entry) => `<span class="preview-pill is-visitor">${escapeHtml(entry.name || "")}</span>`).join("")}</div>` : "";

  return headerHtml + attendanceHtml +
    `<div class="preview-section-title">${t('met.reportMetrics')}</div><div class="preview-metrics-grid">${metricsHtml}</div>` +
    friendsPreviewHtml +
    membersHtml + notesHtml;
}

function openReportPreviewDialog() {
  if (!reportPreviewDialog) return;
  // Ensure all auto-computed fields are fresh before reading form values
  syncDerivedMetricFields();
  const weekVal = weekField.value || "—";
  const cellVal = cellField.value || "—";
  if (previewDialogTitle) previewDialogTitle.textContent = t('preview.weekCellTitle', { w: weekVal, c: cellVal });
  if (previewDialogBody)  previewDialogBody.innerHTML = buildReportPreviewHtml();
  activePreviewVisitorContext = { report: buildPreviewReportSnapshot() };
  // Restore normal footer buttons
  if (previewDialogFooter) previewDialogFooter.hidden = false;
  const cancelBtn  = document.getElementById("preview-cancel-btn");
  const confirmBtn = document.getElementById("preview-confirm-btn");
  const editFromSegBtn = document.getElementById("preview-edit-from-seg-btn");
  if (cancelBtn)  cancelBtn.hidden  = false;
  if (confirmBtn) confirmBtn.hidden = true;
  if (editFromSegBtn) editFromSegBtn.hidden = true;
  // Habilitar botones de Descargar PNG y WhatsApp (imagen + texto)
  const dlBtn = document.getElementById("preview-download-btn");
  const waBtn = document.getElementById("preview-whatsapp-btn");
  const filename = `reporte-celula${cellVal}-S${weekVal}.png`;
  if (dlBtn) {
    dlBtn.hidden = false;
    dlBtn.onclick = () => downloadElementAsPng(previewDialogBody, filename);
  }
  if (waBtn) {
    waBtn.hidden = false;
    waBtn.onclick = () => shareElementWithText(previewDialogBody, lastPreviewWhatsAppText, filename);
  }
  reportPreviewDialog.showModal();
}

if (reportPreviewOpenBtn)  reportPreviewOpenBtn.addEventListener("click",  openReportPreviewDialog);
if (previewCloseBtn  && reportPreviewDialog) previewCloseBtn.addEventListener("click",  () => reportPreviewDialog.close());
// Resetear botones de compartir/descargar al cerrar el modal de preview,
// para que no aparezcan en otras vistas previas que no los necesiten.
if (reportPreviewDialog) {
  reportPreviewDialog.addEventListener('close', () => {
    const dl = document.getElementById('preview-download-btn');
    const wa = document.getElementById('preview-whatsapp-btn');
    if (dl) { dl.hidden = true; dl.onclick = null; }
    if (wa) { wa.hidden = true; wa.onclick = null; }
    activePreviewVisitorContext = null;
  });
}
if (previewCancelBtn && reportPreviewDialog) previewCancelBtn.addEventListener("click", () => reportPreviewDialog.close());
if (reportPreviewDialog) reportPreviewDialog.addEventListener("click", (e) => { if (e.target === reportPreviewDialog) reportPreviewDialog.close(); });
if (previewDialogBody) {
  previewDialogBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action='open-preview-visitors']");
    if (!button) return;
    openPreviewVisitorsDialog();
  });
}
if (previewConfirmBtn) previewConfirmBtn.addEventListener("click", () => {
  if (reportPreviewDialog) reportPreviewDialog.close();
  reportForm.requestSubmit();
});

if (previewVisitorsDialogBody) {
  previewVisitorsDialogBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-action='open-visitor-history']");
    if (!button || !activePreviewVisitorContext?.report) return;
    const visitorKey = String(button.dataset.key || "");
    const visitorName = String(button.dataset.name || "");
    previewVisitorsDialog?.close();
    openVisitorDetail(
      visitorKey,
      visitorName,
      getPreviewVisitorScopeReports(activePreviewVisitorContext.report),
      getPreviewVisitorPeriodLabel(activePreviewVisitorContext.report)
    );
  });
}
if (previewVisitorsCloseBtn && previewVisitorsDialog) previewVisitorsCloseBtn.addEventListener("click", () => previewVisitorsDialog.close());
if (previewVisitorsCancelBtn && previewVisitorsDialog) previewVisitorsCancelBtn.addEventListener("click", () => previewVisitorsDialog.close());
if (previewVisitorsDialog) previewVisitorsDialog.addEventListener("click", (e) => { if (e.target === previewVisitorsDialog) previewVisitorsDialog.close(); });

// ── Preview read-only desde dashboard ───────────────────────────────────────

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
  const reachSupervisorVisits = normalizeReachSupervisorVisits(fd.reachSupervisorVisits || fd.reachSupervisorVisitsJson);

  // ── Resumen global (badges) ─────────────────────────────────────────────────
  const conversions  = Number(s.reachConversions || 0);
  const baptisms     = Array.isArray(fd.baptisms) ? fd.baptisms.length : 0;
  const spirParents  = Number(s.winSpiritualParents || fd.winSpiritualParents || 0);
  const totalOffering = Number(s.reachOffering || fd.reachOffering || 0);
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
  function memberChip(member, attended, extra, status) {
    const normalizedStatus = String(status || "").toLowerCase();
    const isPending = !normalizedStatus || normalizedStatus === "pending";
    const isJustified = normalizedStatus === "justified";
    const isAbsent = normalizedStatus === "absent";
    const isPresentLike = normalizedStatus === "present" || normalizedStatus === "service" || (isPending && attended);
    const isPrivileged = extra === "privileged" && isPresentLike && !isJustified && !isAbsent;
    const cls  = isJustified  ? "justified"
               : isAbsent     ? "missed"
               : isPrivileged ? "privileged"
               : isPresentLike ? "attended"
               : "pending";
    const icon = isJustified  ? "J"
               : isAbsent     ? "✗"
               : isPrivileged ? "★"
               : isPresentLike ? "✓"
               : "•";
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
        ${planTotal ? `<div class="ev-chip-grid">${memberAttendance.map(m => memberChip(m, m.planningAttended, null, m.planningStatus)).join("")}</div>` : "<p class='preview-empty-note'>Sin registro de asistencia</p>"}
        ${fd.planningNotes ? `<p class="ev-notes">${escapeHtml(fd.planningNotes)}</p>` : ""}
      </div>
    </div>`;

  // ── ALCANCE ─────────────────────────────────────────────────────────────────
  const reachPresent    = memberAttendance.filter(m => m.reachAttended).length;
  const reachPriv       = memberAttendance.filter(m => m.reachPrivileged).length;
  const reachOfrenda    = Number(s.reachOffering || fd.reachOffering || 0);
  const friendsCount = namedVisitors.filter(v => (v.kind || 'amigo') !== 'visita').length;
  const restorCount  = namedVisitors.filter(v => (v.kind || 'amigo') === 'visita').length;
  const supervisorHtml = reachSupervisorVisits.length ? `
    <div class="ev-subsection">
      <p class="ev-subsection-title">Supervisión (${reachSupervisorVisits.length})</p>
      <div class="ev-visitor-list">
        ${reachSupervisorVisits.map(entry => `
          <div class="ev-visitor-row">
            <span class="ev-visitor-name">Supervisor · ${escapeHtml(entry.name || "")}</span>
            ${entry.supervisorSector ? `<span class="ev-visitor-meta">Sector ${escapeHtml(entry.supervisorSector)}</span>` : ""}
          </div>`).join("")}
      </div>
    </div>` : "";
  const visitorsTitle = restorCount > 0
    ? `Amigos (${friendsCount}) · Restauración (${restorCount})`
    : `Amigos (${friendsCount})`;
  const visitorsHtml = namedVisitors.length ? `
    <div class="ev-subsection">
      <div class="ev-subsection-head">
        <p class="ev-subsection-title">${visitorsTitle}</p>
        <button type="button" class="preview-section-action" data-action="open-preview-visitors">Ver detalle</button>
      </div>
      <div class="ev-visitor-list">
        ${namedVisitors.map(v => {
          const vKind = (v.kind || 'amigo') === 'visita' ? 'visita' : 'amigo';
          const kindLbl = vKind === 'visita' ? t('vis.kindRest') : t('vis.friend');
          const kindChip = `<span class="visitor-kind-chip is-${vKind}" title="${vKind === 'visita' ? t('vis.bapInRest') : t('vis.notBaptized')}">${escapeHtml(kindLbl)}</span>`;
          return `
          <div class="ev-visitor-row">
            ${kindChip}
            <span class="ev-visitor-name">${escapeHtml(v.name || "")}</span>
            ${v.invitedBy ? `<span class=\"ev-visitor-meta\">${t('preview.invitedBy', { name: escapeHtml(v.invitedBy) })}</span>` : ""}
            <span class="ev-visitor-badges">
              ${v.converted      ? '<span class="ev-badge ev-badge--conversion">Conversión</span>'  : ""}
              ${v.sundayAttended ? '<span class="ev-badge ev-badge--sunday">↪ Culto</span>'         : ""}
            </span>
          </div>`;
        }).join("")}
      </div>
    </div>` : "";
  const kidsHtml = namedKids.length ? `
    <div class="ev-subsection">
      <p class="ev-subsection-title">Niños (${namedKids.length})</p>
      <div class="ev-visitor-list">
        ${namedKids.map(k => `
          <div class="ev-visitor-row">
            <span class="ev-visitor-name">${escapeHtml(k.name || "")}</span>
            ${k.guardianName ? `<span class=\"ev-visitor-meta\">${t('preview.guardian', { name: escapeHtml(k.guardianName) })}</span>` : ""}
            ${k.sundayAttended ? '<span class="ev-badge ev-badge--sunday">↪ Culto</span>' : ""}
          </div>`).join("")}
      </div>
    </div>` : "";
  const reachSection = `
    <div class="ev-section">
      <div class="ev-head ev-head--reach">
        <span class="ev-title">🌱 Alcance</span>
        <span class="ev-count">${reachPresent} hmnos${reachPriv ? ` · ${reachPriv} privilegiados` : ""}${reachSupervisorVisits.length ? ` · ${reachSupervisorVisits.length} supervisor${reachSupervisorVisits.length === 1 ? "" : "es"}` : ""} · ${friendsCount} amigos${restorCount ? ` · ${restorCount} restauración` : ""} · ${namedKids.length} niños</span>
      </div>
      <div class="ev-body">
        ${planTotal ? `<div class="ev-chip-grid">${memberAttendance.map(m => memberChip(m, m.reachAttended, m.reachPrivileged ? "privileged" : null, m.reachStatus)).join("")}</div>` : ""}
        ${supervisorHtml}
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
        <span class="ev-title">${t('preview.cultoTitle')}</span>
        <span class="ev-count">${t('preview.cultoCount', { tot: sundayTotal, b: sundayMembersCount, f: sundayVisitorsCount, k: sundayKidsCount })}</span>
      </div>
      <div class="ev-body">
        ${planTotal ? `<div class="ev-chip-grid">${memberAttendance.map(m => memberChip(m, m.sundayAttended, null, m.sundayStatus)).join("")}</div>` : "<p class='preview-empty-note'>Sin registro de asistencia</p>"}
        ${fd.cultoNotes ? `<p class="ev-notes">${escapeHtml(fd.cultoNotes)}</p>` : ""}
      </div>
    </div>`;

  // Nota: ya no renderizamos un bloque "Ausencias" — cada evento
  // (Planeación / Alcance / Culto) muestra los chips por miembro con su
  // estado (verde si asistió, rojo si faltó), así que el bloque resumen
  // era redundante.

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

  return headerHtml + summaryHtml + legendHtml + planSection + reachSection + cultoSection + notesHtml;
}

function openReportPreviewFromDashboard(report) {
  if (!reportPreviewDialog) return;
  const cell = String(report.cellNumber || report.formData?.cellNumber || "—");
  const week = String(report.formData?.week || report.week || "—");
  if (previewDialogTitle) previewDialogTitle.textContent = t('preview.weekCellTitle', { w: week, c: cell });
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
    setFeedback(t('fb.selectAtLeastOne'), true);
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

// ── Graduar clase: marca Completado en bloque y opcionalmente inscribe a la siguiente ──
const graduarDialog       = /** @type {HTMLDialogElement|null} */ (document.querySelector("#graduar-dialog"));
const graduarOpenBtn      = document.querySelector("#graduar-open-btn");
const graduarCloseBtn     = document.querySelector("#graduar-close-btn");
const graduarCancelBtn    = document.querySelector("#graduar-cancel-btn");
const graduarConfirmBtn   = document.querySelector("#graduar-confirm-btn");
const graduarClaseSelect  = /** @type {HTMLSelectElement|null} */ (document.querySelector("#graduar-clase-select"));
const graduarMemberList   = document.querySelector("#graduar-member-list");
const graduarNextWrap     = document.querySelector("#graduar-next-wrap");
const graduarEnrollNext   = /** @type {HTMLInputElement|null} */ (document.querySelector("#graduar-enroll-next"));
const graduarNextLabel    = document.querySelector("#graduar-next-label");

// Cadena de progresión: al graduarse de X se sugiere inscribir a Y.
// Las Escuelas no encadenan.
const NEXT_CLASS_AFTER = {
  e1Maduracion: "e2Integracion",
  e2Integracion: "e3Ubicacion",
  e1Vision: "e2Caracter",
  e2Caracter: "e3Perfil",
};

function getNextClassMilestone(key) {
  const next = NEXT_CLASS_AFTER[key];
  return next ? CLASS_MILESTONES.find(m => m.key === next) : null;
}

function refreshGraduarNextHint() {
  if (!graduarClaseSelect || !graduarNextWrap || !graduarNextLabel || !graduarEnrollNext) return;
  const next = getNextClassMilestone(graduarClaseSelect.value);
  if (next) {
    graduarNextWrap.style.display = "";
    graduarNextLabel.textContent = `Inscribir además a la siguiente clase (${next.label})`;
    graduarEnrollNext.disabled = false;
  } else {
    graduarNextWrap.style.display = "none";
    graduarEnrollNext.checked = false;
  }
}

function populateGraduarDialog() {
  if (!graduarClaseSelect) return;
  const selectedKey = graduarClaseSelect.value || CLASS_MILESTONES[0]?.key;
  graduarClaseSelect.innerHTML = CLASS_MILESTONES.map(m =>
    `<option value="${m.key}"${m.key === selectedKey ? " selected" : ""}>${escapeHtml(m.sectionLabel + " · " + m.label)}</option>`
  ).join("");
  populateGraduarMembers();
  refreshGraduarNextHint();
}

function populateGraduarMembers() {
  if (!graduarMemberList || !graduarClaseSelect) return;
  const key = graduarClaseSelect.value;
  const trackableRoles = ["member", "leader", "assistant", "host"];
  // Mostrar los que tienen la clase 'en curso' (han sido convocados pero no completados)
  const eligible = catalogs.people.filter(p => {
    if (!trackableRoles.includes(p.role)) return false;
    const val = p.rcmProgress?.[key];
    return typeof val === "string" && val.startsWith("en_curso:");
  });

  if (!eligible.length) {
    graduarMemberList.innerHTML = `<p class="empty-state">Ningún miembro tiene esta clase en curso.</p>`;
    return;
  }
  graduarMemberList.innerHTML = eligible
    .sort((a, b) => a.name.localeCompare(b.name, "es"))
    .map(p => {
      const start = (p.rcmProgress?.[key] || "").slice(9); // tras 'en_curso:'
      return `<label class="convocar-member-row">
        <input type="checkbox" data-person-id="${p.id}" value="${p.id}" checked>
        <span>${escapeHtml(p.name)}</span>
        <span class="member-admin-caption">${escapeHtml(formatRole(p.role))}${start ? ` · Inicio ${escapeHtml(start)}` : ""}</span>
      </label>`;
    }).join("");
}

async function handleGraduarConfirm() {
  if (!graduarMemberList || !graduarClaseSelect || !graduarDialog) return;
  const key = graduarClaseSelect.value;
  const today = new Date().toISOString().slice(0, 10);
  const checked = /** @type {NodeListOf<HTMLInputElement>} */ (graduarMemberList.querySelectorAll("input[type=checkbox]:checked"));
  if (!checked.length) {
    setFeedback(t('fb.selectAtLeastOne'), true);
    return;
  }
  const personIds = Array.from(checked).map(cb => parseInt(cb.value, 10));
  const next = getNextClassMilestone(key);
  const enrollNext = !!(next && graduarEnrollNext?.checked);

  try {
    await Promise.all(personIds.map(async (personId) => {
      // 1) marcar completada la clase actual (fecha de hoy)
      const body = { [key]: today };
      if (enrollNext) body[next.key] = `en_curso:${today}`;
      const result = await request(`/api/catalogs/people/${personId}/rcm`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      const person = catalogs.people.find(p => p.id === personId);
      if (person) {
        if (!person.rcmProgress) person.rcmProgress = {};
        person.rcmProgress[key] = result.rcmProgress?.[key] ?? today;
        if (enrollNext) person.rcmProgress[next.key] = result.rcmProgress?.[next.key] ?? `en_curso:${today}`;
      }
    }));
    const milestone = CLASS_MILESTONES.find(m => m.key === key);
    const msg = enrollNext
      ? `${personIds.length} miembro(s) graduados de ${milestone?.label ?? key} e inscritos en ${next.label}.`
      : `${personIds.length} miembro(s) graduados de ${milestone?.label ?? key}.`;
    setFeedback(msg);
    graduarDialog.close();
    renderPeopleRows();
  } catch (err) {
    setFeedback(err.message, true);
  }
}

if (graduarOpenBtn && graduarDialog) {
  graduarOpenBtn.addEventListener("click", () => {
    populateGraduarDialog();
    graduarDialog.showModal();
  });
}
if (graduarClaseSelect) {
  graduarClaseSelect.addEventListener("change", () => {
    populateGraduarMembers();
    refreshGraduarNextHint();
  });
}
if (graduarCloseBtn && graduarDialog)  graduarCloseBtn.addEventListener("click",  () => graduarDialog.close());
if (graduarCancelBtn && graduarDialog) graduarCancelBtn.addEventListener("click", () => graduarDialog.close());
if (graduarDialog) graduarDialog.addEventListener("click", (e) => { if (e.target === graduarDialog) graduarDialog.close(); });
if (graduarConfirmBtn) graduarConfirmBtn.addEventListener("click", handleGraduarConfirm);



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
    _appSplashSub.textContent = t('splash.serverWaking');
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
      currentUser.isAdmin = !!(currentUser.isCoordinator || currentUser.role === "pastor");
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
    _appSplashSub.textContent = t('splash.loadFailed');
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
    // Re-render the report form's metric sections so labels follow the new language
    if (typeof metricSections !== "undefined" && metricSections) {
      renderMetricSections();
    }
  });
})();

// --- Trend popover positioning (clamp to viewport, escape overflow containers) ---
function _positionTrendPop(cell) {
  const pop = cell.querySelector('.trend-pop');
  if (!pop) return;
  cell.classList.add('is-pop-open');
  // Reset for measurement
  pop.style.setProperty('--pop-left', '-9999px');
  pop.style.setProperty('--pop-top', '-9999px');
  // Measure after display
  requestAnimationFrame(() => {
    const cr = cell.getBoundingClientRect();
    const pr = pop.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const margin = 8;
    let left = cr.left + cr.width / 2 - pr.width / 2;
    left = Math.max(margin, Math.min(left, vw - pr.width - margin));
    let top = cr.bottom + 6;
    if (top + pr.height > vh - margin) {
      const above = cr.top - pr.height - 6;
      if (above >= margin) top = above;
      else top = Math.max(margin, vh - pr.height - margin);
    }
    pop.style.setProperty('--pop-left', left + 'px');
    pop.style.setProperty('--pop-top', top + 'px');
  });
}
function _hideTrendPop(cell) {
  cell.classList.remove('is-pop-open');
  const pop = cell.querySelector('.trend-pop');
  if (pop) {
    pop.style.removeProperty('--pop-left');
    pop.style.removeProperty('--pop-top');
  }
}
document.addEventListener('pointerenter', (e) => {
  const cell = e.target.closest && e.target.closest('.trend-td-hover');
  if (cell) _positionTrendPop(cell);
}, true);
document.addEventListener('pointerleave', (e) => {
  const cell = e.target.closest && e.target.closest('.trend-td-hover');
  if (cell) _hideTrendPop(cell);
}, true);
window.addEventListener('scroll', () => {
  document.querySelectorAll('.trend-td-hover.is-pop-open').forEach(_hideTrendPop);
}, true);
