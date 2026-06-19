const storageKey = "graphic-design-priority-hub-state-v2";
const apiBase = window.location.protocol === "file:" ? "http://127.0.0.1:4173/api" : "/api";
let backendReady = false;

const workflowStatuses = [
  "New Request",
  "Brief Check",
  "Missing Information",
  "Ready for Prioritization",
  "Scheduled",
  "In Design",
  "Internal Review",
  "Donor / Partner Review",
  "Revisions",
  "Final Approval",
  "Delivered",
  "Archived",
  "On Hold",
  "Cancelled"
];

const sampleEntries = [
  {
    id: "1",
    projectName: "GCFAlbADAPTGCF",
    projectNumber: "G-011947-003",
    contactPerson: "emi.kaduku@giz.de;klea.medini@giz.de",
    approvalOwner: "klea.medini@giz.de",
    donorPartner: "EU",
    request: ["Leaflet"],
    designType: ["Print"],
    numberOfDeliverables: 1,
    requestedDeliveryDate: "2026-05-04T22:00:00Z",
    eventPublicationDate: "2026-05-04T22:00:00Z",
    urgencyLevel: "High - needed this week",
    visibilitySensitivity: "High - external publication with partner/donor logos",
    politicalSensitivity: "Medium",
    contentStatus: "Text still missing",
    sourceFilesStatus: "Some files missing",
    estimatedComplexity: "M - standard design package",
    designStatus: "Missing Information",
    strategicImportance: "High programme priority",
    deadlineRisk: "Due in 24/48 hours",
    created: "2026-03-31T14:12:26Z",
    createdBy: "klea.medini@giz.de",
    delivered: ""
  },
  {
    id: "2",
    projectName: "ZME",
    projectNumber: "G-012342-120",
    contactPerson: "dorisa.lala@giz.de;etleva.vertopi@giz.de",
    approvalOwner: "dorisa.lala@giz.de",
    donorPartner: "BMZ",
    request: ["PPT", "Main Event Poster", "Speaker Banner for LED"],
    designType: ["Digital"],
    numberOfDeliverables: 3,
    requestedDeliveryDate: "2026-05-13T22:00:00Z",
    eventPublicationDate: "2026-05-13T22:00:00Z",
    urgencyLevel: "Normal - planned request",
    visibilitySensitivity: "Medium - standard external communication",
    politicalSensitivity: "None",
    contentStatus: "Final text attached",
    sourceFilesStatus: "All files attached",
    estimatedComplexity: "L - complex design / multiple formats",
    designStatus: "Delivered",
    strategicImportance: "Normal project communication",
    deadlineRisk: "Due later",
    created: "2026-04-08T14:01:33Z",
    createdBy: "dorisa.lala@giz.de",
    delivered: "Yes"
  },
  {
    id: "4",
    projectName: "GreenVjosa",
    projectNumber: "#N/A",
    contactPerson: "klejdi.domi@giz.de",
    approvalOwner: "klejdi.domi@giz.de",
    donorPartner: "Internal only",
    request: ["PPT"],
    designType: ["Digital"],
    numberOfDeliverables: 1,
    requestedDeliveryDate: "2026-04-21T22:00:00Z",
    eventPublicationDate: "2026-04-21T22:00:00Z",
    urgencyLevel: "Low - flexible timeline",
    visibilitySensitivity: "Low - internal or informal use",
    politicalSensitivity: "None",
    contentStatus: "Final text attached",
    sourceFilesStatus: "All files attached",
    estimatedComplexity: "S - simple design",
    designStatus: "Delivered",
    strategicImportance: "Internal / low strategic value",
    deadlineRisk: "Due later",
    created: "2026-04-22T12:49:27Z",
    createdBy: "klejdi.domi@giz.de",
    delivered: "Yes"
  },
  {
    id: "5",
    projectName: "GCFAlbADAPTGCF",
    projectNumber: "G-011947-003",
    contactPerson: "laureta.spahiu@giz.de",
    approvalOwner: "laureta.spahiu@giz.de",
    donorPartner: "EU",
    request: ["Factsheet"],
    designType: ["Digital"],
    numberOfDeliverables: 1,
    requestedDeliveryDate: "2026-06-11T22:00:00Z",
    eventPublicationDate: "2026-06-11T22:00:00Z",
    urgencyLevel: "High - needed this week",
    visibilitySensitivity: "High - external publication with partner/donor logos",
    politicalSensitivity: "Medium",
    contentStatus: "Draft text attached",
    sourceFilesStatus: "All files attached",
    estimatedComplexity: "M - standard design package",
    designStatus: "Brief Check",
    strategicImportance: "High programme priority",
    deadlineRisk: "Due in 3-5 days",
    created: "2026-05-26T09:34:57Z",
    createdBy: "laureta.spahiu@giz.de",
    delivered: ""
  }
];

const scoringRules = [
  {
    key: "urgencyScore",
    label: "Urgency",
    help: "Shows how quickly the requester says the work is needed. Critical requests receive 25 points; high 18; normal 10; low 3.",
    effect: "Adds 3-25 points",
    type: "boost",
    max: 25
  },
  {
    key: "strategicScore",
    label: "Strategic importance",
    help: "Shows how important the request is to programme goals. Critical work receives 20 points; high 15; normal 8; low 3.",
    effect: "Adds 3-20 points",
    type: "boost",
    max: 20
  },
  {
    key: "visibilityScore",
    label: "Public visibility",
    help: "Raises work that will be seen by donors, partners, or the public. The four visibility levels add 20, 15, 8, or 3 points.",
    effect: "Adds 3-20 points",
    type: "boost",
    max: 20
  },
  {
    key: "politicalScore",
    label: "Political sensitivity",
    help: "Raises work that needs extra care because of political context. Critical adds 15 points; high 12; medium 7; none 0.",
    effect: "Adds 0-15 points",
    type: "boost",
    max: 15
  },
  {
    key: "deadlineRiskScore",
    label: "Deadline risk",
    help: "Raises requests with little time remaining. Work due within 24-48 hours adds 10 points; 3-5 days adds 8; 1-2 weeks adds 4; later adds 1.",
    effect: "Adds 1-10 points",
    type: "boost",
    max: 10
  },
  {
    key: "completenessPenalty",
    label: "Content readiness",
    help: "Lowers priority when the designer cannot start because content is not ready. Missing text subtracts 20 points; editing 12; draft 7; final content has no penalty.",
    effect: "Subtracts 0-20 points",
    type: "penalty",
    max: 20
  },
  {
    key: "complexityPenalty",
    label: "Design complexity",
    help: "Accounts for the effort needed to deliver the request. XL work subtracts 10 points; L 7; M 4; S 2; XS has no penalty.",
    effect: "Subtracts 0-10 points",
    type: "penalty",
    max: 10
  }
];

const state = loadState();

const elements = {
  body: document.querySelector("#queue-body"),
  categoryFilter: document.querySelector("#category-filter"),
  connectForm: document.querySelector("#connect-form"),
  connectMessage: document.querySelector("#connect-message"),
  count: document.querySelector("#queue-count"),
  csvInput: document.querySelector("#csv-input"),
  entryForm: document.querySelector("#entry-form"),
  entryMessage: document.querySelector("#entry-message"),
  exportCsv: document.querySelector("#export-csv"),
  listBody: document.querySelector("#list-body"),
  listCount: document.querySelector("#list-count"),
  listMessage: document.querySelector("#list-message"),
  metricAverage: document.querySelector("#metric-average"),
  metricDue: document.querySelector("#metric-due"),
  metricHigh: document.querySelector("#metric-high"),
  metricTotal: document.querySelector("#metric-total"),
  navButtons: document.querySelectorAll(".nav-button"),
  resetFilters: document.querySelector("#reset-filters"),
  resetRules: document.querySelector("#reset-rules"),
  ruleGrid: document.querySelector("#rule-grid"),
  scoreFilter: document.querySelector("#score-filter"),
  scoreOutput: document.querySelector("#score-output"),
  searchInput: document.querySelector("#search-input"),
  sortDue: document.querySelector("#sort-due"),
  sortPriority: document.querySelector("#sort-priority"),
  statusFilter: document.querySelector("#status-filter"),
  previewBreakdown: document.querySelector("#preview-breakdown"),
  previewLevel: document.querySelector("#preview-level"),
  previewScore: document.querySelector("#preview-score"),
  views: document.querySelectorAll(".view")
};

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved) {
      return {
        entries: Array.isArray(saved.entries) ? saved.entries : [],
        sort: saved.sort || "priority",
        filters: saved.filters || { search: "", status: "all", category: "all", score: 0 },
        connection: saved.connection || {}
      };
    }
  } catch {
    /* Local storage is optional. */
  }

  return {
    entries: [],
    sort: "priority",
    filters: { search: "", status: "all", category: "all", score: 0 },
    connection: {}
  };
}

function saveState() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch {
    /* The app can run without persistence. */
  }
}

async function apiRequest(path, options = {}) {
  const response = await fetch(`${apiBase}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });
  if (!response.ok) {
    let message = `Server request failed (${response.status})`;
    try {
      const payload = await response.json();
      if (payload.error) message = payload.error;
    } catch {
      /* Use the HTTP status message. */
    }
    throw new Error(message);
  }
  if (response.status === 204) return null;
  return response.json();
}

function showBackendError(error) {
  backendReady = false;
  console.error(error);
  if (elements.listMessage) elements.listMessage.textContent = "Server unavailable — changes kept locally";
}

async function loadBackendEntries() {
  try {
    const payload = await apiRequest("/entries");
    backendReady = true;

    if (!payload.entries.length && state.entries.length) {
      const migrated = await apiRequest("/entries/import", {
        method: "POST",
        body: JSON.stringify({ entries: state.entries, mode: "replace" })
      });
      state.entries = migrated.entries;
      elements.listMessage.textContent = `Migrated ${migrated.imported} entries to the server`;
    } else {
      state.entries = payload.entries;
      elements.listMessage.textContent = "Connected — edits save to the server";
    }

    saveState();
    renderAll();
  } catch (error) {
    backendReady = false;
    showBackendError(error);
  }
}

function parseChoiceList(value) {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter(Boolean) : [String(parsed)];
  } catch {
    return String(value)
      .split(";")
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function parseCsv(text) {
  const content = text.replace(/^\uFEFF/, "");
  const csvStart = content.indexOf("\n\"ID\"");
  const csvText = csvStart >= 0 ? content.slice(csvStart + 1) : content;
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const next = csvText[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(cell);
      if (row.some((value) => value !== "")) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const headers = rows.shift() || [];
  return rows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]))
  );
}

function pick(row, names) {
  const key = names.find((name) => Object.prototype.hasOwnProperty.call(row, name));
  return key ? row[key] : "";
}

function normalizeCsvRow(row) {
  const delivered = pick(row, ["Delivered"]);
  const contentConfirmed = pick(row, ["Confrim Attached Content ", "Confirm Attached Content", "Confirm Attached Content "]);
  const eventDate = pick(row, ["Event / Publication Date", "Event date", "Event Date"]);
  const requestedDate = pick(row, ["Requested Delivery Date"]) || eventDate;
  const contentStatus =
    pick(row, ["Content Status"]) ||
    (contentConfirmed === "Yes" ? "Final text attached" : "Text still missing");

  return {
    id: pick(row, ["ID"]),
    title: pick(row, ["Title", "Titel"]),
    projectName: pick(row, ["Project Name", "Title", "Titel"]),
    projectNumber: pick(row, ["Project Number"]),
    contactPerson: pick(row, ["Contact Person"]),
    approvalOwner: pick(row, ["Approval Owner"]) || pick(row, ["Contact Person"]),
    donorPartner: pick(row, ["Donor / Partner"]) || inferDonor(row),
    request: parseChoiceList(pick(row, ["Request"])),
    designType: parseChoiceList(pick(row, ["Design Type"])),
    numberOfDeliverables: Number(pick(row, ["Number of Deliverables"])) || parseChoiceList(pick(row, ["Request"])).length || 1,
    requestedDeliveryDate: requestedDate,
    eventPublicationDate: eventDate,
    urgencyLevel: pick(row, ["Urgency Level"]) || inferUrgency(requestedDate),
    urgencyJustification: pick(row, ["Urgency Justification"]),
    visibilitySensitivity: pick(row, ["Visibility Sensitivity"]) || inferVisibility(row),
    politicalSensitivity: pick(row, ["Political Sensitivity"]) || "None",
    externalApprovalRequired: pick(row, ["External Approval Required"]),
    contentStatus,
    confirmAttachedContent: contentConfirmed || "No",
    sourceFilesStatus: pick(row, ["Source Files Status"]) || "Some files missing",
    languageRequirements: pick(row, ["Language requirements"]),
    estimatedComplexity: pick(row, ["Estimated Complexity"]) || inferComplexity(row),
    designStatus: pick(row, ["Design Status"]) || inferDesignStatus(delivered, contentStatus),
    assignedDesigner: pick(row, ["Assigned Designer"]),
    strategicImportance: pick(row, ["Strategic Importance"]) || inferStrategic(row),
    deadlineRisk: pick(row, ["Deadline Risk"]) || inferDeadlineRisk(requestedDate),
    revisionRound: pick(row, ["Revision Round"]),
    finalDeliveryLink: pick(row, ["Final Delivery Link"]),
    internalNotes: pick(row, ["Internal Notes"]),
    created: pick(row, ["Created"]),
    createdBy: pick(row, ["Created By"]),
    modified: pick(row, ["Modified"]),
    modifiedBy: pick(row, ["Modified By"]),
    delivered
  };
}

function inferDonor(row) {
  const name = `${pick(row, ["Project Name"])} ${pick(row, ["Project Number"])}`.toLowerCase();
  if (name.includes("eu") || name.includes("gcf")) return "EU";
  if (name.includes("bmz") || name.includes("zme")) return "BMZ";
  return "Internal only";
}

function daysUntil(dateText) {
  if (!dateText) return 999;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dateText);
  due.setHours(0, 0, 0, 0);
  return Math.ceil((due - today) / 86400000);
}

function inferUrgency(dateText) {
  const days = daysUntil(dateText);
  if (days <= 2) return "Critical - needed within 24/48 hours";
  if (days <= 7) return "High - needed this week";
  if (days <= 30) return "Normal - planned request";
  return "Low - flexible timeline";
}

function inferDeadlineRisk(dateText) {
  const days = daysUntil(dateText);
  if (days <= 2) return "Due in 24/48 hours";
  if (days <= 5) return "Due in 3-5 days";
  if (days <= 14) return "Due in 1-2 weeks";
  if (days < 999) return "Due later";
  return "No fixed deadline";
}

function inferVisibility(row) {
  const requests = parseChoiceList(pick(row, ["Request"])).join(" ").toLowerCase();
  if (requests.includes("event") || requests.includes("speaker") || requests.includes("stage")) {
    return "High - external publication with partner/donor logos";
  }
  if (requests.includes("social") || requests.includes("web") || requests.includes("poster")) {
    return "Medium - standard external communication";
  }
  return "Low - internal or informal use";
}

function inferComplexity(row) {
  const requests = parseChoiceList(pick(row, ["Request"]));
  if (requests.length >= 4) return "XL - campaign / event identity / publication";
  if (requests.length >= 2) return "L - complex design / multiple formats";
  const requestText = requests.join(" ").toLowerCase();
  if (requestText.includes("identity") || requestText.includes("backdrop") || requestText.includes("report")) {
    return "L - complex design / multiple formats";
  }
  if (requestText.includes("ppt") || requestText.includes("banner") || requestText.includes("factsheet")) {
    return "M - standard design package";
  }
  return "S - simple design";
}

function inferStrategic(row) {
  const donor = inferDonor(row);
  if (donor === "EU" || donor === "BMZ") return "High programme priority";
  return "Normal project communication";
}

function inferDesignStatus(delivered, contentStatus) {
  if (delivered === "Yes") return "Delivered";
  if (contentStatus === "Text still missing" || contentStatus === "Text needs editing") return "Missing Information";
  if (contentStatus === "Draft text attached") return "Brief Check";
  return "New Request";
}

function scoreEntry(entry) {
  const urgencyScore =
    entry.urgencyLevel === "Critical - needed within 24/48 hours" ? 25 :
    entry.urgencyLevel === "High - needed this week" ? 18 :
    entry.urgencyLevel === "Normal - planned request" ? 10 : 3;
  const strategicScore =
    entry.strategicImportance === "Critical institutional priority" ? 20 :
    entry.strategicImportance === "High programme priority" ? 15 :
    entry.strategicImportance === "Normal project communication" ? 8 : 3;
  const visibilityScore =
    entry.visibilitySensitivity === "Critical - donor/political/public visibility" ? 20 :
    entry.visibilitySensitivity === "High - external publication with partner/donor logos" ? 15 :
    entry.visibilitySensitivity === "Medium - standard external communication" ? 8 : 3;
  const politicalScore =
    entry.politicalSensitivity === "Critical" ? 15 :
    entry.politicalSensitivity === "High" ? 12 :
    entry.politicalSensitivity === "Medium" ? 7 : 0;
  const deadlineRiskScore =
    entry.deadlineRisk === "Due in 24/48 hours" ? 10 :
    entry.deadlineRisk === "Due in 3-5 days" ? 8 :
    entry.deadlineRisk === "Due in 1-2 weeks" ? 4 :
    entry.deadlineRisk === "Due later" ? 1 : 0;
  const completenessPenalty =
    entry.contentStatus === "Text still missing" ? 20 :
    entry.contentStatus === "Text needs editing" ? 12 :
    entry.contentStatus === "Draft text attached" ? 7 : 0;
  const complexityPenalty =
    entry.estimatedComplexity === "XL - campaign / event identity / publication" ? 10 :
    entry.estimatedComplexity === "L - complex design / multiple formats" ? 7 :
    entry.estimatedComplexity === "M - standard design package" ? 4 :
    entry.estimatedComplexity === "S - simple design" ? 2 : 0;
  const priorityScore =
    urgencyScore + strategicScore + visibilityScore + politicalScore + deadlineRiskScore -
    completenessPenalty - complexityPenalty;

  return {
    urgencyScore,
    strategicScore,
    visibilityScore,
    politicalScore,
    deadlineRiskScore,
    completenessPenalty,
    complexityPenalty,
    priorityScore: Math.max(0, priorityScore)
  };
}

function readEntryForm() {
  const data = Object.fromEntries(new FormData(elements.entryForm).entries());
  const requestedDeliveryDate = data.requestedDeliveryDate ? `${data.requestedDeliveryDate}T00:00:00` : "";
  const attachments = Array.from(elements.entryForm.elements.attachments?.files || []).map((file) => file.name);
  const delivered = data.delivered === "Yes" ? "Yes" : "";
  const confirmAttachedContent = data.confirmAttachedContent || "No";
  const contentStatus = confirmAttachedContent === "Yes" && data.contentStatus === "Text still missing"
    ? "Final text attached"
    : data.contentStatus || "Text still missing";

  return {
    id: `local-${Date.now()}`,
    title: data.title || "",
    projectName: data.projectName || "",
    projectNumber: data.projectNumber || "",
    contactPerson: data.contactPerson || "",
    approvalOwner: data.approvalOwner || "",
    donorPartner: data.donorPartner || "",
    request: data.request ? [data.request] : [],
    requestDetails: data.requestDetails || "",
    designType: data.designType ? [data.designType] : [],
    numberOfDeliverables: Number(data.numberOfDeliverables) || 1,
    requestedDeliveryDate,
    eventPublicationDate: requestedDeliveryDate,
    euVisibilityRequired: data.euVisibilityRequired || "No",
    partnerLogosRequired: data.partnerLogosRequired || "No",
    languageRequirements: data.languageRequirements || "",
    confirmAttachedContent,
    urgencyLevel: data.urgencyLevel || "Normal - planned request",
    visibilitySensitivity: data.visibilitySensitivity || "Medium - standard external communication",
    politicalSensitivity: data.politicalSensitivity || "None",
    contentStatus,
    sourceFilesStatus: "",
    estimatedComplexity: data.estimatedComplexity || "M - standard design package",
    designStatus: data.designStatus || "New Request",
    strategicImportance: data.strategicImportance || "Normal project communication",
    deadlineRisk: data.deadlineRisk || "Due later",
    attachments,
    created: new Date().toISOString(),
    createdBy: "local entry",
    delivered
  };
}

function renderEntryPreview() {
  if (!elements.entryForm) return;
  const entry = readEntryForm();
  const status = getStatus(entry);
  const scores = scoreEntry(entry);
  const level = getPriorityLevel(scores.priorityScore, status);

  elements.previewLevel.textContent = level;
  elements.previewLevel.className = `preview-level ${level.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  elements.previewScore.textContent = scores.priorityScore;
  elements.previewBreakdown.innerHTML = scoringRules.map((rule) => {
    const value = scores[rule.key];
    const signed = rule.key.includes("Penalty") && value > 0 ? `-${value}` : value;
    return `<span><b>${rule.label}</b><strong>${signed}</strong></span>`;
  }).join("");
}

function getPriorityLevel(score, status) {
  if (status === "Delivered" || status === "Archived" || status === "Cancelled") return "Backlog";
  if (score >= 80) return "P0 Critical";
  if (score >= 60) return "P1 High";
  if (score >= 40) return "P2 Normal";
  if (score >= 20) return "P3 Low";
  return "Backlog";
}

function getStatus(entry) {
  return workflowStatuses.includes(entry.designStatus) ? entry.designStatus : inferDesignStatus(entry.delivered, entry.contentStatus);
}

function getCategory(entry) {
  return entry.request[0] || entry.designType[0] || "Uncategorized";
}

function getRankedEntries() {
  const search = state.filters.search.toLowerCase().trim();

  return state.entries
    .map((entry) => {
      const scores = scoreEntry(entry);
      const status = getStatus(entry);
      return {
        ...entry,
        ...scores,
        score: scores.priorityScore,
        status,
        priority: getPriorityLevel(scores.priorityScore, status),
        priorityClass: getPriorityLevel(scores.priorityScore, status).toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        days: daysUntil(entry.requestedDeliveryDate),
        category: getCategory(entry)
      };
    })
    .filter((entry) => {
      const haystack = [
        entry.projectName,
        entry.projectNumber,
        entry.contactPerson,
        entry.approvalOwner,
        entry.donorPartner,
        entry.request.join(" "),
        entry.designType.join(" "),
        entry.status
      ].join(" ").toLowerCase();
      return (
        (!search || haystack.includes(search)) &&
        (state.filters.status === "all" || entry.status === state.filters.status) &&
        (state.filters.category === "all" || entry.category === state.filters.category) &&
        entry.score >= Number(state.filters.score)
      );
    })
    .sort((a, b) => {
      if (state.sort === "due") return a.days - b.days || b.score - a.score;
      return b.score - a.score || a.days - b.days;
    });
}

function renderCategories() {
  const categories = [...new Set(state.entries.map(getCategory))].sort();
  elements.categoryFilter.innerHTML = '<option value="all">All categories</option>';
  categories.forEach((category) => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    elements.categoryFilter.append(option);
  });
  elements.categoryFilter.value = state.filters.category;
}

function renderMetrics(ranked) {
  const active = state.entries.filter((entry) => !["Delivered", "Archived", "Cancelled"].includes(getStatus(entry)));
  const scored = state.entries.map((entry) => {
    const scores = scoreEntry(entry);
    return { ...entry, ...scores, status: getStatus(entry), priority: getPriorityLevel(scores.priorityScore, getStatus(entry)) };
  });
  elements.metricTotal.textContent = active.length;
  elements.metricHigh.textContent = scored.filter((entry) => ["P0 Critical", "P1 High"].includes(entry.priority)).length;
  elements.metricDue.textContent = active.filter((entry) => daysUntil(entry.requestedDeliveryDate) <= 7).length;
  elements.metricAverage.textContent = active.filter((entry) => getStatus(entry) === "Missing Information").length;
  elements.count.textContent = `${ranked.length} ${ranked.length === 1 ? "entry" : "entries"}`;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderQueue() {
  const ranked = getRankedEntries();
  elements.body.innerHTML = "";
  elements.sortPriority.classList.toggle("active", state.sort === "priority");
  elements.sortDue.classList.toggle("active", state.sort === "due");
  elements.sortPriority.setAttribute("aria-pressed", String(state.sort === "priority"));
  elements.sortDue.setAttribute("aria-pressed", String(state.sort === "due"));

  if (!ranked.length) {
    elements.body.append(document.querySelector("#empty-template").content.cloneNode(true));
  }

  ranked.forEach((entry, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><span class="rank">${index + 1}</span></td>
      <td>
        <strong>${escapeHtml(entry.title || entry.projectName || "(No title)")}</strong>
        <span>${escapeHtml(entry.projectName || "No project")} &middot; ${escapeHtml(entry.projectNumber)} &middot; ${escapeHtml(entry.request.join(", ") || "No request type")}</span>
      </td>
      <td><meter min="0" max="100" value="${entry.score}"></meter><b>${entry.score}</b></td>
      <td><span class="priority ${entry.priorityClass}">${entry.priority}</span></td>
      <td>${formatDue(entry)}</td>
      <td>${entry.status}</td>
      <td>${escapeHtml(shortContacts(entry.contactPerson))}</td>
    `;
    elements.body.append(row);
  });

  renderMetrics(ranked);
}

function toDateInputValue(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}

function renderOptions(options, selected) {
  return options.map((option) => {
    const isSelected = option === selected ? " selected" : "";
    return `<option${isSelected}>${escapeHtml(option)}</option>`;
  }).join("");
}

function getEditableEntry(entry) {
  const scores = scoreEntry(entry);
  const status = getStatus(entry);
  return {
    ...entry,
    score: scores.priorityScore,
    status,
    priority: getPriorityLevel(scores.priorityScore, status),
    priorityClass: getPriorityLevel(scores.priorityScore, status).toLowerCase().replace(/[^a-z0-9]+/g, "-")
  };
}

function renderList() {
  if (!elements.listBody) return;
  elements.listBody.innerHTML = "";
  elements.listCount.textContent = `${state.entries.length} ${state.entries.length === 1 ? "entry" : "entries"}`;

  if (!state.entries.length) {
    elements.listBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-state">Import a CSV or add an Entry to edit list items here.</td>
      </tr>
    `;
    return;
  }

  state.entries.forEach((rawEntry, index) => {
    const entry = getEditableEntry(rawEntry);
    const row = document.createElement("tr");
    row.dataset.index = String(index);
    row.innerHTML = `
      <td><textarea data-field="title" rows="2">${escapeHtml(entry.title || "")}</textarea></td>
      <td>
        <input data-field="projectName" value="${escapeHtml(entry.projectName || "")}" />
        <input data-field="projectNumber" value="${escapeHtml(entry.projectNumber || "")}" />
      </td>
      <td>
        <input data-field="contactPerson" value="${escapeHtml(entry.contactPerson || "")}" />
        <input data-field="approvalOwner" value="${escapeHtml(entry.approvalOwner || "")}" />
      </td>
      <td>
        <select data-field="request">${renderOptions([
          "PPT",
          "Brochure",
          "Leaflet",
          "Roll-up",
          "Banner",
          "Main Event Poster",
          "Factsheet",
          "Invitation",
          "Agenda",
          "Event Backdrop",
          "Web Banner",
          "Social Media Post",
          "Stage Branding",
          "Infographic Design",
          "Report Layout"
        ], entry.request[0] || "PPT")}</select>
        <select data-field="designType">${renderOptions(["Digital", "Print"], entry.designType[0] || "Digital")}</select>
      </td>
      <td><input data-field="requestedDeliveryDate" type="date" value="${toDateInputValue(entry.requestedDeliveryDate)}" /></td>
      <td>
        <select data-field="designStatus">${renderOptions(workflowStatuses, entry.status)}</select>
      </td>
      <td><meter min="0" max="100" value="${entry.score}"></meter><b>${entry.score}</b></td>
      <td><span class="priority ${entry.priorityClass}">${entry.priority}</span></td>
    `;
    elements.listBody.append(row);
  });
}

async function updateEntryField(index, field, value, rerenderList = true) {
  const entry = state.entries[index];
  if (!entry) return;

  if (field === "request" || field === "designType") {
    entry[field] = value ? [value] : [];
  } else if (field === "requestedDeliveryDate") {
    entry.requestedDeliveryDate = value ? `${value}T00:00:00` : "";
    entry.eventPublicationDate = entry.requestedDeliveryDate;
    entry.urgencyLevel = inferUrgency(entry.requestedDeliveryDate);
    entry.deadlineRisk = inferDeadlineRisk(entry.requestedDeliveryDate);
  } else {
    entry[field] = value;
  }

  saveState();
  renderCategories();
  renderQueue();
  if (rerenderList) renderList();
  renderEntryPreview();
  elements.listMessage.textContent = backendReady ? "Saving…" : "Saved locally — server unavailable";

  if (!backendReady) return;
  try {
    const payload = await apiRequest(`/entries/${encodeURIComponent(entry.id)}`, {
      method: "PATCH",
      body: JSON.stringify(entry)
    });
    state.entries[index] = payload.entry;
    saveState();
    elements.listMessage.textContent = "Saved to server";
    if (rerenderList) renderList();
  } catch (error) {
    showBackendError(error);
  }
}

function shortContacts(value) {
  const contacts = String(value || "").split(";").map((item) => item.trim()).filter(Boolean);
  if (contacts.length <= 1) return contacts[0] || "";
  return `${contacts[0]} +${contacts.length - 1}`;
}

function formatDue(entry) {
  if (!entry.requestedDeliveryDate) return '<span class="due">No date</span>';
  if (entry.days < 0) return `<span class="due overdue">${Math.abs(entry.days)}d overdue</span>`;
  if (entry.days === 0) return '<span class="due soon">Today</span>';
  if (entry.days <= 7) return `<span class="due soon">${entry.days}d</span>`;
  const label = new Intl.DateTimeFormat("en", { month: "short", day: "numeric" }).format(new Date(entry.requestedDeliveryDate));
  return `<span class="due">${label}</span>`;
}

function renderRules() {
  elements.ruleGrid.innerHTML = "";
  scoringRules.forEach((rule, index) => {
    const card = document.createElement("article");
    card.className = `rule-card rule-card-${rule.type}`;
    card.style.setProperty("--rule-delay", `${index * 55}ms`);
    card.innerHTML = `
      <div class="rule-card-meta">
        <span class="rule-number">${String(index + 1).padStart(2, "0")}</span>
        <span class="rule-type">${rule.type === "boost" ? "Priority boost" : "Score reduction"}</span>
      </div>
      <div>
        <h3>${rule.label}</h3>
        <p>${rule.help}</p>
      </div>
      <div class="rule-impact">
        <span class="impact-track" aria-hidden="true"><i style="width: ${rule.max * 4}%"></i></span>
        <div><strong class="formula-chip">${rule.effect}</strong><small>Maximum impact: ${rule.max}</small></div>
      </div>
    `;
    elements.ruleGrid.append(card);
  });
}

function renderConnection() {
  Object.entries(state.connection).forEach(([key, value]) => {
    const input = elements.connectForm.elements[key];
    if (input) input.value = value;
  });
}

function renderAll() {
  elements.searchInput.value = state.filters.search;
  elements.statusFilter.value = state.filters.status;
  elements.scoreFilter.value = state.filters.score;
  elements.scoreOutput.textContent = state.filters.score;
  renderCategories();
  renderRules();
  renderConnection();
  renderEntryPreview();
  renderQueue();
  renderList();
}

function setView(viewName) {
  document.body.dataset.view = viewName;
  elements.navButtons.forEach((button) => {
    const isActive = button.dataset.view === viewName;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });
  elements.views.forEach((view) => {
    view.classList.toggle("open", view.id === `${viewName}-view`);
  });
}

function updateFilter(key, value) {
  state.filters[key] = value;
  saveState();
  renderQueue();
}

async function importCsvFile(file) {
  const text = await file.text();
  const entries = parseCsv(text).map(normalizeCsvRow);
  if (backendReady) {
    const payload = await apiRequest("/entries/import", {
      method: "POST",
      body: JSON.stringify({ entries, mode: "replace" })
    });
    state.entries = payload.entries;
    elements.listMessage.textContent = `Imported ${payload.imported} entries to the server`;
  } else {
    state.entries = entries;
    elements.listMessage.textContent = "Imported locally — server unavailable";
  }
  state.filters = { search: "", status: "all", category: "all", score: 0 };
  saveState();
  renderAll();
}

elements.navButtons.forEach((button) => button.addEventListener("click", () => setView(button.dataset.view)));
elements.listBody.addEventListener("input", (event) => {
  const field = event.target.dataset.field;
  const row = event.target.closest("tr[data-index]");
  if (!field || !row) return;
  window.clearTimeout(elements.listBody.editTimer);
  elements.listBody.editTimer = window.setTimeout(() => {
    updateEntryField(Number(row.dataset.index), field, event.target.value, false);
  }, 250);
});
elements.listBody.addEventListener("change", (event) => {
  const field = event.target.dataset.field;
  const row = event.target.closest("tr[data-index]");
  if (!field || !row) return;
  updateEntryField(Number(row.dataset.index), field, event.target.value);
});
elements.entryForm.addEventListener("input", renderEntryPreview);
elements.entryForm.addEventListener("reset", () => {
  window.setTimeout(() => {
    elements.entryMessage.textContent = "";
    renderEntryPreview();
  }, 0);
});
elements.entryForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  let entry = readEntryForm();
  if (!entry.title || !entry.projectName || !entry.contactPerson || !entry.approvalOwner || !entry.requestedDeliveryDate) return;
  elements.entryMessage.textContent = backendReady ? "Saving to server…" : "Saving locally…";
  if (backendReady) {
    try {
      const payload = await apiRequest("/entries", {
        method: "POST",
        body: JSON.stringify(entry)
      });
      entry = payload.entry;
    } catch (error) {
      showBackendError(error);
      elements.entryMessage.textContent = "Server unavailable. Entry saved locally.";
    }
  }
  state.entries = [entry, ...state.entries];
  state.filters = { search: "", status: "all", category: "all", score: 0 };
  saveState();
  renderAll();
  elements.entryMessage.textContent = backendReady ? "Added and saved to server." : "Added locally.";
  setView("queue");
});
elements.csvInput.addEventListener("change", async (event) => {
  const [file] = event.target.files;
  if (file) {
    try {
      await importCsvFile(file);
    } catch (error) {
      showBackendError(error);
    }
  }
  event.target.value = "";
});
elements.searchInput.addEventListener("input", (event) => updateFilter("search", event.target.value));
elements.statusFilter.addEventListener("change", (event) => updateFilter("status", event.target.value));
elements.categoryFilter.addEventListener("change", (event) => updateFilter("category", event.target.value));
elements.scoreFilter.addEventListener("input", (event) => {
  elements.scoreOutput.textContent = event.target.value;
  updateFilter("score", event.target.value);
});
elements.exportCsv?.addEventListener("click", async () => {
  try {
    const response = await fetch(`${apiBase}/entries/export.csv`);
    if (!response.ok) throw new Error(`Export failed (${response.status})`);
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `gd-hub-entries-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  } catch (error) {
    showBackendError(error);
  }
});
elements.resetFilters.addEventListener("click", () => {
  state.filters = { search: "", status: "all", category: "all", score: 0 };
  saveState();
  renderAll();
});
elements.sortPriority.addEventListener("click", () => {
  state.sort = "priority";
  saveState();
  renderQueue();
});
elements.sortDue.addEventListener("click", () => {
  state.sort = "due";
  saveState();
  renderQueue();
});
elements.resetRules.addEventListener("click", renderRules);
elements.connectForm.addEventListener("input", () => {
  state.connection = Object.fromEntries(new FormData(elements.connectForm).entries());
  saveState();
  elements.connectMessage.textContent = "Saved locally";
});
async function bootstrap() {
  renderAll();
  setView(document.body.dataset.view || "queue");
  await loadBackendEntries();
}

bootstrap();
