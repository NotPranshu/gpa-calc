const CREDITS_PER_COURSE = 15;
const ACADEMIC_PROFILE_STORAGE_KEY = "gpa-academic-profile";
const PLANNER_STORAGE_KEY = "gpa-planner-state";
const SEMESTER_HISTORY_STORAGE_KEY = "gpa-semester-history";
const MAX_GPA_SCALE = 4.5;

const GRADE_SCALE = [
  { grade: "A+", min: 85, max: 100, points: 4.5 },
  { grade: "A", min: 80, max: 84, points: 4.0 },
  { grade: "B+", min: 75, max: 79, points: 3.5 },
  { grade: "B", min: 65, max: 74, points: 3.0 },
  { grade: "C+", min: 60, max: 64, points: 2.5 },
  { grade: "C", min: 50, max: 59, points: 2.0 },
  { grade: "D", min: 40, max: 49, points: 1.0, label: "Fail/Borderline" },
  { grade: "E", min: 0, max: 39, points: 0.0, label: "Fail" },
];

const coursesList = document.getElementById("coursesList");
const gpaValue = document.getElementById("gpaValue");
const gpaMeta = document.getElementById("gpaMeta");
const scaleTableBody = document.getElementById("scaleTableBody");
const hasExistingGpa = document.getElementById("hasExistingGpa");
const existingGpaFields = document.getElementById("existingGpaFields");
const existingGpaInput = document.getElementById("existingGpa");
const priorCoursesInput = document.getElementById("priorCourses");
const exportPdfBtn = document.getElementById("exportPdfBtn");
const addCourseBtn = document.getElementById("addCourseBtn");
const saveStatusBadge = document.getElementById("saveStatusBadge");
const saveStatusDetails = document.getElementById("saveStatusDetails");
const storageLastSaved = document.getElementById("storageLastSaved");
const storageSemesterCount = document.getElementById("storageSemesterCount");
const storageCourseCount = document.getElementById("storageCourseCount");
const storageCurrentCgpa = document.getElementById("storageCurrentCgpa");
const storageTargetGpa = document.getElementById("storageTargetGpa");
const clearDataBtn = document.getElementById("clearDataBtn");
const exportJsonBtn = document.getElementById("exportJsonBtn");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const importDataBtn = document.getElementById("importDataBtn");
const importDataInput = document.getElementById("importDataInput");
const restoreNotice = document.getElementById("restoreNotice");

const semesterTrendSection = document.getElementById("semesterTrendSection");
const semesterTrendChartCanvas = document.getElementById("semesterTrendChart");
const semesterTrendEmptyState = document.getElementById("semesterTrendEmptyState");
const semesterTrendForm = document.getElementById("semesterTrendForm");
const semesterLabelInput = document.getElementById("semesterLabel");
const semesterGpaInput = document.getElementById("semesterGpa");
const semesterTargetInput = document.getElementById("semesterTargetGpa");
const semesterAddBtn = document.getElementById("semesterAddBtn");
const semesterCancelBtn = document.getElementById("semesterCancelBtn");
const semesterUseCurrentBtn = document.getElementById("semesterUseCurrentBtn");
const semesterHistoryList = document.getElementById("semesterHistoryList");
const semesterBestCard = document.getElementById("semesterBestCard");
const semesterGrowthCard = document.getElementById("semesterGrowthCard");
const semesterTrendCard = document.getElementById("semesterTrendCard");
const semesterProjectionCard = document.getElementById("semesterProjectionCard");
const semesterComparisonCard = document.getElementById("semesterComparisonCard");
const semesterTargetCard = document.getElementById("semesterTargetCard");
const semesterChartLegend = document.getElementById("semesterChartLegend");

const plannerCurrentGpaInput = document.getElementById("plannerCurrentGpa");
const plannerCompletedCreditsInput = document.getElementById("plannerCompletedCredits");
const plannerTargetGpaInput = document.getElementById("plannerTargetGpa");
const plannerTotalCreditsInput = document.getElementById("plannerTotalCredits");
const plannerCourseList = document.getElementById("plannerCourseList");
const plannerAddCourseBtn = document.getElementById("plannerAddCourseBtn");
const plannerResetBtn = document.getElementById("resetPlannerBtn");
const plannerResultsCard = document.getElementById("plannerResultsCard");
const plannerStatusBadge = document.getElementById("plannerStatusBadge");
const plannerProgressFill = document.getElementById("plannerProgressFill");
const plannerMarkerCurrent = document.getElementById("plannerMarkerCurrent");
const plannerMarkerTarget = document.getElementById("plannerMarkerTarget");
const plannerMarkerProjected = document.getElementById("plannerMarkerProjected");
const plannerFeedback = document.getElementById("plannerFeedback");
const plannerCurrentStat = document.getElementById("plannerCurrentStat");
const plannerTargetStat = document.getElementById("plannerTargetStat");
const plannerCompletedStat = document.getElementById("plannerCompletedStat");
const plannerRemainingStat = document.getElementById("plannerRemainingStat");
const plannerRequiredStat = document.getElementById("plannerRequiredStat");
const plannerProjectedStat = document.getElementById("plannerProjectedStat");
const plannerSemesterStat = document.getElementById("plannerSemesterStat");
const plannerProgressCurrentLabel = document.getElementById("plannerProgressCurrentLabel");
const plannerProgressTargetLabel = document.getElementById("plannerProgressTargetLabel");
const plannerProgressProjectedLabel = document.getElementById("plannerProgressProjectedLabel");

const hasCalculatorPage = Boolean(coursesList && gpaValue && scaleTableBody && hasExistingGpa && exportPdfBtn && addCourseBtn);
const hasPlannerPage = Boolean(plannerCurrentGpaInput && plannerCourseList && plannerAddCourseBtn && plannerResetBtn && plannerResultsCard);
const hasTrendPage = Boolean(semesterTrendSection && semesterTrendChartCanvas && semesterTrendForm && semesterLabelInput && semesterGpaInput && semesterTargetInput && semesterHistoryList);
const hasStorageControls = Boolean(saveStatusBadge && saveStatusDetails && storageLastSaved && storageSemesterCount && storageCourseCount && storageCurrentCgpa && storageTargetGpa);

let courseIdCounter = 0;
let plannerCourseIdCounter = 0;
let semesterTrendChart = null;
let semesterHistory = [];
let semesterEditingId = null;
let academicProfile = null;
let profileLoaded = false;

function createEmptyAcademicProfile() {
  return {
    version: 1,
    lastSavedAt: null,
    draftCourses: [],
    semesters: [],
    currentCGPA: null,
    targetGPA: null,
    planner: {
      currentGpa: "",
      completedCredits: "",
      targetGpa: "",
      totalCredits: "",
      courses: [],
    },
    existingGpa: {
      enabled: false,
      gpa: "",
      priorCourses: "",
    },
  };
}

function clonePlainObject(value) {
  return JSON.parse(JSON.stringify(value));
}

function safeNumber(value) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function safeInteger(value) {
  const parsed = parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatRelativeTime(dateString) {
  if (!dateString) return "Never";

  const savedTime = new Date(dateString).getTime();
  if (!Number.isFinite(savedTime)) return "Never";

  const delta = Date.now() - savedTime;
  const minutes = Math.max(0, Math.floor(delta / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function createSemesterId() {
  return `semester-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function clampGpa(value) {
  return Math.max(0, Math.min(MAX_GPA_SCALE, value));
}

function formatGpa(value, fractionDigits = 2) {
  return Number.isFinite(value) ? value.toFixed(fractionDigits) : "—";
}

function normalizeSemesterLabel(label, fallbackIndex) {
  const trimmed = label.trim();
  return trimmed || `Semester ${fallbackIndex}`;
}

function getSemesterGpaValue(record) {
  const value = safeNumber(record?.semesterGPA ?? record?.gpa);
  return value === null ? null : clampGpa(value);
}

function serializeCourseRow(row) {
  return {
    name: row.querySelector(".name-input")?.value.trim() || "",
    grade: row.querySelector(".grade-input")?.value || "",
  };
}

function captureSemesterCourses() {
  if (!coursesList) return [];

  return Array.from(coursesList.querySelectorAll(".course-row")).map((row) => ({
    code: "",
    name: row.querySelector(".name-input")?.value.trim() || "",
    credits: CREDITS_PER_COURSE,
    grade: row.querySelector(".grade-input")?.value || "",
  }));
}

function serializePlannerCourseRow(row) {
  return {
    name: row.querySelector(".planner-course-name")?.value.trim() || "",
    credits: row.querySelector(".planner-course-credits")?.value || "",
    grade: row.querySelector(".planner-course-grade")?.value || "",
  };
}

function normalizeSemesterRecord(record, index) {
  if (!record || typeof record !== "object") return null;

  const gpa = safeNumber(record.semesterGPA ?? record.gpa);
  if (gpa === null || gpa < 0 || gpa > MAX_GPA_SCALE) return null;

  return {
    id: String(record.id || createSemesterId()),
    label: normalizeSemesterLabel(String(record.name || record.label || record.semester || ""), index + 1),
    courses: Array.isArray(record.courses)
      ? record.courses.map((course) => ({
          code: String(course?.code || "").trim(),
          name: String(course?.name || "").trim(),
          credits: safeNumber(course?.credits) ?? 0,
          grade: String(course?.grade || "").trim(),
        }))
      : [],
      semesterGPA: gpa,
      gpa,
    createdAt: safeNumber(record.createdAt) ? Number(record.createdAt) : Date.now() + index,
  };
}

function normalizeAcademicProfile(profile) {
  const fallback = createEmptyAcademicProfile();
  if (!profile || typeof profile !== "object") return fallback;

  const semestersSource = Array.isArray(profile.semesters)
    ? profile.semesters
    : Array.isArray(profile.records)
      ? profile.records
      : [];

  const semesters = semestersSource
    .map((record, index) => normalizeSemesterRecord(record, index))
    .filter(Boolean)
    .sort((left, right) => left.createdAt - right.createdAt);

  return {
    version: 1,
    lastSavedAt: typeof profile.lastSavedAt === "string" ? profile.lastSavedAt : null,
    draftCourses: Array.isArray(profile.draftCourses)
      ? profile.draftCourses.map((course) => ({
          name: String(course?.name || "").trim(),
          grade: String(course?.grade || "").trim(),
        }))
      : [],
    semesters,
    currentCGPA: safeNumber(profile.currentCGPA ?? profile.currentGpa),
    targetGPA: safeNumber(profile.targetGPA ?? profile.targetGpa),
    planner: {
      currentGpa: String(profile.planner?.currentGpa ?? profile.currentGpa ?? ""),
      completedCredits: String(profile.planner?.completedCredits ?? profile.completedCredits ?? ""),
      targetGpa: String(profile.planner?.targetGpa ?? profile.targetGpa ?? ""),
      totalCredits: String(profile.planner?.totalCredits ?? profile.totalCredits ?? ""),
      courses: Array.isArray(profile.planner?.courses)
        ? profile.planner.courses.map((course) => ({
            name: String(course?.name || "").trim(),
            credits: String(course?.credits || ""),
            grade: String(course?.grade || ""),
          }))
        : [],
    },
    existingGpa: {
      enabled: Boolean(profile.existingGpa?.enabled),
      gpa: String(profile.existingGpa?.gpa ?? profile.existingGpa?.value ?? ""),
      priorCourses: String(profile.existingGpa?.priorCourses ?? profile.existingGpa?.courses ?? ""),
    },
  };
}

function readLegacyPlannerStorage() {
  try {
    const saved = localStorage.getItem(PLANNER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn("Legacy planner data could not be loaded", error);
    return null;
  }
}

function readLegacySemesterStorage() {
  try {
    const saved = localStorage.getItem(SEMESTER_HISTORY_STORAGE_KEY);
    if (!saved) return { targetGpa: "", records: [] };
    const parsed = JSON.parse(saved);
    const records = Array.isArray(parsed.records) ? parsed.records : Array.isArray(parsed) ? parsed : [];
    return {
      targetGpa: parsed && typeof parsed.targetGpa !== "undefined" ? String(parsed.targetGpa) : "",
      records: records
        .map((record, index) => ({
          id: record.id || createSemesterId(),
          label: normalizeSemesterLabel(String(record.label || record.semester || ""), index + 1),
          gpa: getSemesterGpaValue(record),
          createdAt: Number.isFinite(safeNumber(record.createdAt)) ? Number(record.createdAt) : Date.now() + index,
        }))
        .filter((record) => Number.isFinite(record.gpa)),
    };
  } catch (error) {
    console.warn("Legacy semester data could not be loaded", error);
    return { targetGpa: "", records: [] };
  }
}

function readStoredAcademicProfile() {
  try {
    const saved = localStorage.getItem(ACADEMIC_PROFILE_STORAGE_KEY);
    if (saved) {
      return normalizeAcademicProfile(JSON.parse(saved));
    }
  } catch (error) {
    console.warn("Academic profile could not be loaded", error);
  }

  const legacySemesters = readLegacySemesterStorage();
  const legacyPlanner = readLegacyPlannerStorage();
  const profile = createEmptyAcademicProfile();
  profile.semesters = legacySemesters.records.map((record) => ({
    id: record.id,
    label: record.label,
    courses: [],
    semesterGPA: record.gpa,
    gpa: record.gpa,
    createdAt: record.createdAt,
  }));
  profile.targetGPA = safeNumber(legacySemesters.targetGpa);
  profile.planner = {
    currentGpa: legacyPlanner?.currentGpa || "",
    completedCredits: legacyPlanner?.completedCredits || "",
    targetGpa: legacyPlanner?.targetGpa || "",
    totalCredits: legacyPlanner?.totalCredits || "",
    courses: Array.isArray(legacyPlanner?.courses)
      ? legacyPlanner.courses.map((course) => ({
          name: String(course?.name || "").trim(),
          credits: String(course?.credits || ""),
          grade: String(course?.grade || ""),
        }))
      : [],
  };
  return profile;
}

function updateStorageStatusMessage(message, tone = "success") {
  if (saveStatusBadge) {
    saveStatusBadge.textContent = tone === "success" ? "Saved" : tone === "warning" ? "Needs attention" : "Offline";
    saveStatusBadge.dataset.state = tone;
  }
  if (saveStatusDetails) {
    saveStatusDetails.textContent = message;
  }
}

function refreshStorageStats() {
  if (!hasStorageControls || !academicProfile) return;

  const semesters = academicProfile.semesters.length;
  const courseCount = academicProfile.semesters.reduce((sum, semester) => sum + (Array.isArray(semester.courses) ? semester.courses.length : 0), 0);
  const draftCourses = academicProfile.draftCourses.length;
  const currentCgpa = Number.isFinite(academicProfile.currentCGPA) ? academicProfile.currentCGPA.toFixed(2) : "—";
  const targetGpa = Number.isFinite(academicProfile.targetGPA) ? academicProfile.targetGPA.toFixed(2) : "—";

  storageLastSaved.textContent = academicProfile.lastSavedAt ? formatRelativeTime(academicProfile.lastSavedAt) : "Never";
  storageSemesterCount.textContent = `${semesters}`;
  storageCourseCount.textContent = `${courseCount + draftCourses}`;
  storageCurrentCgpa.textContent = currentCgpa;
  storageTargetGpa.textContent = targetGpa;
}

function syncProfileFromCurrentUi() {
  if (!academicProfile) return;

  if (hasCalculatorPage && coursesList && hasExistingGpa) {
    academicProfile.draftCourses = Array.from(coursesList.querySelectorAll(".course-row")).map(serializeCourseRow);
    academicProfile.existingGpa = {
      enabled: hasExistingGpa.checked,
      gpa: existingGpaInput?.value || "",
      priorCourses: priorCoursesInput?.value || "",
    };
    academicProfile.currentCGPA = safeNumber(gpaValue?.textContent);
  }

  if (hasPlannerPage) {
    academicProfile.planner = {
      currentGpa: plannerCurrentGpaInput?.value || "",
      completedCredits: plannerCompletedCreditsInput?.value || "",
      targetGpa: plannerTargetGpaInput?.value || "",
      totalCredits: plannerTotalCreditsInput?.value || "",
      courses: Array.from(plannerCourseList.querySelectorAll(".planner-course-row")).map(serializePlannerCourseRow),
    };
    academicProfile.targetGPA = safeNumber(plannerTargetGpaInput?.value) ?? academicProfile.targetGPA;
  }

  if (hasTrendPage) {
    academicProfile.semesters = getSemesterRecordsSorted().map((record) => ({
      id: record.id,
      name: record.label,
      label: record.label,
      courses: Array.isArray(record.courses) ? record.courses : [],
      semesterGPA: record.gpa,
      gpa: record.gpa,
      createdAt: record.createdAt,
    }));
    academicProfile.targetGPA = safeNumber(semesterTargetInput?.value) ?? academicProfile.targetGPA;
  }
}

function persistAcademicProfile(options = {}) {
  if (!academicProfile) return;

  syncProfileFromCurrentUi();
  academicProfile.version = 1;
  academicProfile.lastSavedAt = new Date().toISOString();

  try {
    localStorage.setItem(ACADEMIC_PROFILE_STORAGE_KEY, JSON.stringify(academicProfile));
    updateStorageStatusMessage(options.message || "Progress saved", "success");
  } catch (error) {
    console.warn("Academic profile could not be saved", error);
    updateStorageStatusMessage("Could not save data", "warning");
  }

  refreshStorageStats();
}

function initializeAcademicProfile() {
  academicProfile = readStoredAcademicProfile();
  profileLoaded = true;
  refreshStorageStats();
}

function restoreAcademicUiFromProfile() {
  if (!academicProfile) return;

  if (hasCalculatorPage) {
    renderDraftCourses(academicProfile.draftCourses);
    if (hasExistingGpa) {
      hasExistingGpa.checked = Boolean(academicProfile.existingGpa.enabled);
      if (existingGpaFields) existingGpaFields.hidden = !hasExistingGpa.checked;
    }
    if (existingGpaInput) existingGpaInput.value = academicProfile.existingGpa.gpa || "";
    if (priorCoursesInput) priorCoursesInput.value = academicProfile.existingGpa.priorCourses || "";
    calculateGPA();
  }

  if (hasPlannerPage) {
    populatePlannerForm(academicProfile.planner);
    calculatePlanner();
  }

  if (hasTrendPage) {
    semesterHistory = academicProfile.semesters.map((semester, index) => ({
      id: semester.id || createSemesterId(),
      label: normalizeSemesterLabel(String(semester.label || semester.name || `Semester ${index + 1}`), index + 1),
      courses: Array.isArray(semester.courses) ? semester.courses : [],
      gpa: getSemesterGpaValue(semester),
      semesterGPA: getSemesterGpaValue(semester),
      createdAt: Number.isFinite(safeNumber(semester.createdAt)) ? Number(semester.createdAt) : Date.now() + index,
    })).filter((record) => Number.isFinite(record.gpa));
    if (semesterTargetInput && academicProfile.targetGPA !== null && academicProfile.targetGPA !== undefined) {
      semesterTargetInput.value = String(academicProfile.targetGPA);
    }
    syncSemesterTrend();
  }

  if (restoreNotice) {
    restoreNotice.hidden = false;
    restoreNotice.textContent = academicProfile.lastSavedAt ? `Welcome back! Your academic data has been restored. Last saved ${formatRelativeTime(academicProfile.lastSavedAt)}.` : "Welcome back! Your academic data has been restored.";
  }

  updateStorageStatusMessage(academicProfile.lastSavedAt ? `Last saved ${formatRelativeTime(academicProfile.lastSavedAt)}` : "Ready to save", academicProfile.lastSavedAt ? "success" : "warning");
}

function getGradeByLetter(letter) {
  if (!letter) return null;
  return GRADE_SCALE.find((entry) => entry.grade === letter) ?? null;
}

function gradeOptionsHtml(selectedGrade = "") {
  const options = GRADE_SCALE.map((entry) => {
    const selected = entry.grade === selectedGrade ? " selected" : "";
    return `<option value="${entry.grade}"${selected}>${entry.grade}</option>`;
  }).join("");
  return `<option value=""${selectedGrade ? "" : " selected"} disabled>Select grade</option>${options}`;
}

function formatRange(entry) {
  return `${entry.min}% - ${entry.max}%`;
}

function renderScaleTable() {
  scaleTableBody.innerHTML = GRADE_SCALE.map((entry) => {
    const note = entry.label ? ` (${entry.label})` : "";
    const failClass = entry.points <= 1 ? " fail" : "";
    return `
      <tr>
        <td><span class="grade-badge${failClass}">${entry.grade}</span></td>
        <td>${formatRange(entry)}</td>
        <td>${entry.points.toFixed(1)}${note}</td>
      </tr>
    `;
  }).join("");
}

function getCurrentCourseReportData() {
  if (!coursesList) return [];
  return Array.from(coursesList.querySelectorAll(".course-row")).map((row) => {
    const name = row.querySelector(".name-input").value.trim() || "Untitled course";
    const gradeInput = row.querySelector(".grade-input");
    const gradeInfo = getGradeByLetter(gradeInput.value);

    return {
      name,
      grade: gradeInfo ? gradeInfo.grade : "Not selected",
      points: gradeInfo ? gradeInfo.points.toFixed(1) : "—",
    };
  });
}

function exportToPdf() {
  if (!coursesList || !gpaValue) return;
  const existing = getExistingGpaData();
  const currentCourses = getCurrentCourseReportData();
  const gpaSummary = gpaValue.textContent === "—" ? "Not calculated yet" : gpaValue.textContent;

  const summaryItems = [];
  if (existing) {
    summaryItems.push(`<li><strong>Prior GPA:</strong> ${existing.gpa.toFixed(2)} across ${existing.courses} course${existing.courses !== 1 ? "s" : ""}</li>`);
  }
  summaryItems.push(`<li><strong>Current GPA:</strong> ${gpaSummary}</li>`);

  const courseRowsHtml = currentCourses.length === 0
    ? '<p class="report-empty">No course entries added yet.</p>'
    : currentCourses.map((course) => `
        <tr>
          <td>${course.name}</td>
          <td>${course.grade}</td>
          <td>${course.points}</td>
        </tr>
      `).join("");

  const reportWindow = window.open("", "_blank", "width=900,height=700");
  if (!reportWindow) {
    alert("Please allow pop-ups to export the GPA report.");
    return;
  }

  reportWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>GPA Report</title>
      <style>
        body {
          font-family: "Segoe UI", sans-serif;
          margin: 0;
          padding: 24px;
          color: #14213d;
          background: #fff;
        }
        h1 {
          margin: 0 0 8px;
          font-size: 24px;
        }
        .meta {
          color: #5b6472;
          margin-bottom: 20px;
        }
        .summary {
          background: #f5f7fb;
          border: 1px solid #d9e2ef;
          border-radius: 8px;
          padding: 12px 14px;
          margin-bottom: 20px;
        }
        .summary ul {
          padding-left: 18px;
          margin: 0;
        }
        table {
          width: 100%;
          border-collapse: collapse;
        }
        th,
        td {
          border-bottom: 1px solid #d9e2ef;
          padding: 8px 6px;
          text-align: left;
        }
        th {
          background: #f5f7fb;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
        .report-empty {
          color: #5b6472;
          font-style: italic;
        }
      </style>
    </head>
    <body>
      <h1>GPA Report</h1>
      <div class="meta">Generated from the GPA Calculator</div>
      <div class="summary">
        <ul>${summaryItems.join("")}</ul>
      </div>
      <table>
        <thead>
          <tr>
            <th>Course</th>
            <th>Grade</th>
            <th>Points</th>
          </tr>
        </thead>
        <tbody>${courseRowsHtml}</tbody>
      </table>
    </body>
    </html>
  `);

  reportWindow.document.close();
  reportWindow.focus();
  setTimeout(() => {
    reportWindow.print();
  }, 250);
}

function buildAcademicProfileSnapshot() {
  syncProfileFromCurrentUi();
  return clonePlainObject(academicProfile || createEmptyAcademicProfile());
}

function downloadTextFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportAcademicProfileJson() {
  const snapshot = buildAcademicProfileSnapshot();
  downloadTextFile(
    `gpa-academic-profile-${new Date().toISOString().slice(0, 10)}.json`,
    `${JSON.stringify(snapshot, null, 2)}\n`,
    "application/json"
  );
  updateStorageStatusMessage("JSON backup downloaded", "success");
}

function exportAcademicProfileCsv() {
  const snapshot = buildAcademicProfileSnapshot();
  const rows = [
    ["type", "semester", "course_code", "course_name", "credits", "grade", "semester_gpa", "current_cgpa", "target_gpa"],
  ];

  snapshot.semesters.forEach((semester) => {
    const semesterName = semester.label || semester.name || "Semester";
    const semesterGpa = getSemesterGpaValue(semester);
    if (Array.isArray(semester.courses) && semester.courses.length > 0) {
      semester.courses.forEach((course) => {
        rows.push([
          "semester_course",
          semesterName,
          String(course.code || ""),
          String(course.name || ""),
          String(course.credits || ""),
          String(course.grade || ""),
          String(semesterGpa ?? ""),
          String(snapshot.currentCGPA ?? ""),
          String(snapshot.targetGPA ?? ""),
        ]);
      });
    } else {
      rows.push([
        "semester",
        semesterName,
        "",
        "",
        "",
        "",
        String(semesterGpa ?? ""),
        String(snapshot.currentCGPA ?? ""),
        String(snapshot.targetGPA ?? ""),
      ]);
    }
  });

  if (rows.length === 1) {
    rows.push(["empty", "", "", "", "", "", "", String(snapshot.currentCGPA ?? ""), String(snapshot.targetGPA ?? "")]);
  }

  const csv = rows
    .map((cells) => cells.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  downloadTextFile(
    `gpa-academic-profile-${new Date().toISOString().slice(0, 10)}.csv`,
    `${csv}\n`,
    "text/csv"
  );
  updateStorageStatusMessage("CSV report downloaded", "success");
}

function clearAcademicProfile() {
  const confirmed = window.confirm("Delete all academic records?");
  if (!confirmed) return;

  academicProfile = createEmptyAcademicProfile();
  semesterHistory = [];
  semesterEditingId = null;

  try {
    localStorage.removeItem(ACADEMIC_PROFILE_STORAGE_KEY);
    localStorage.removeItem(PLANNER_STORAGE_KEY);
    localStorage.removeItem(SEMESTER_HISTORY_STORAGE_KEY);
  } catch (error) {
    console.warn("Academic profile could not be cleared", error);
  }

  if (hasCalculatorPage) {
    renderDraftCourses([]);
    if (hasExistingGpa) {
      hasExistingGpa.checked = false;
    }
    if (existingGpaFields) existingGpaFields.hidden = true;
    if (existingGpaInput) existingGpaInput.value = "";
    if (priorCoursesInput) priorCoursesInput.value = "";
    calculateGPA();
  }

  if (hasPlannerPage) {
    resetPlanner();
  }

  if (hasTrendPage) {
    semesterTargetInput.value = "";
    syncSemesterTrend();
    resetSemesterForm();
  }

  refreshStorageStats();
  updateStorageStatusMessage("All academic records removed", "warning");
}

function applyImportedAcademicProfile(profile) {
  academicProfile = normalizeAcademicProfile(profile);

  if (hasCalculatorPage) {
    renderDraftCourses(academicProfile.draftCourses);
    if (hasExistingGpa) {
      hasExistingGpa.checked = Boolean(academicProfile.existingGpa.enabled);
      if (existingGpaFields) existingGpaFields.hidden = !hasExistingGpa.checked;
    }
    if (existingGpaInput) existingGpaInput.value = academicProfile.existingGpa.gpa || "";
    if (priorCoursesInput) priorCoursesInput.value = academicProfile.existingGpa.priorCourses || "";
    calculateGPA();
  }

  if (hasPlannerPage) {
    populatePlannerForm(academicProfile.planner);
    calculatePlanner();
  }

  if (hasTrendPage) {
    semesterHistory = academicProfile.semesters.map((semester, index) => ({
      id: semester.id || createSemesterId(),
      label: normalizeSemesterLabel(String(semester.label || semester.name || `Semester ${index + 1}`), index + 1),
      courses: Array.isArray(semester.courses) ? semester.courses : [],
      gpa: getSemesterGpaValue(semester),
      semesterGPA: getSemesterGpaValue(semester),
      createdAt: Number.isFinite(safeNumber(semester.createdAt)) ? Number(semester.createdAt) : Date.now() + index,
    })).filter((record) => Number.isFinite(record.gpa));
    if (semesterTargetInput) {
      semesterTargetInput.value = academicProfile.targetGPA !== null && academicProfile.targetGPA !== undefined ? String(academicProfile.targetGPA) : "";
    }
    syncSemesterTrend();
    resetSemesterForm();
  }

  persistAcademicProfile({ message: "Progress saved" });
}

function handleImportAcademicProfile() {
  if (!importDataInput) return;
  importDataInput.click();
}

function readImportedAcademicProfile(file) {
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const text = String(reader.result || "").trim();
      if (!text) {
        updateStorageStatusMessage("Imported file was empty", "warning");
        return;
      }

      if (file.name.toLowerCase().endsWith(".csv")) {
        updateStorageStatusMessage("CSV import is not supported. Export CSV is for reporting.", "warning");
        return;
      }

      applyImportedAcademicProfile(JSON.parse(text));
      updateStorageStatusMessage("Academic data imported", "success");
    } catch (error) {
      console.warn("Imported academic data could not be read", error);
      updateStorageStatusMessage("Imported file could not be loaded", "warning");
    }
  };
  reader.readAsText(file);
}

function createCourseRow() {
  if (!coursesList) return document.createElement("div");
  const id = ++courseIdCounter;
  const row = document.createElement("div");
  row.className = "course-row";
  row.dataset.id = id;
  row.innerHTML = `
    <input type="text" class="name-input" placeholder="Course name" aria-label="Course name">
    <select class="grade-input" aria-label="Letter grade">
      ${gradeOptionsHtml()}
    </select>
    <button type="button" class="btn btn-remove" aria-label="Remove course">x</button>
  `;

  const nameInput = row.querySelector(".name-input");
  const gradeInput = row.querySelector(".grade-input");
  const removeBtn = row.querySelector(".btn-remove");

  nameInput.addEventListener("input", () => {
    calculateGPA();
    persistAcademicProfile({ message: "Progress saved" });
  });
  gradeInput.addEventListener("change", () => {
    calculateGPA();
    persistAcademicProfile({ message: "Progress saved" });
  });

  removeBtn.addEventListener("click", () => {
    row.remove();
    updateEmptyState();
    calculateGPA();
    persistAcademicProfile({ message: "Progress saved" });
  });

  return row;
}

function createCourseRowFromData(course = {}) {
  const row = createCourseRow();
  const nameInput = row.querySelector(".name-input");
  const gradeInput = row.querySelector(".grade-input");
  if (nameInput) nameInput.value = course.name || "";
  if (gradeInput) gradeInput.value = course.grade || "";
  return row;
}

function updateEmptyState() {
  if (!coursesList) return;
  const rows = coursesList.querySelectorAll(".course-row");
  const existing = coursesList.querySelector(".empty-state");
  if (rows.length === 0 && !existing) {
    coursesList.innerHTML = `<div class="empty-state">No courses yet. Click "Add Course" to begin.</div>`;
  } else if (rows.length > 0 && existing) {
    existing.remove();
  }
}

function renderDraftCourses(courses = []) {
  if (!coursesList) return;
  coursesList.innerHTML = "";
  if (!courses.length) {
    updateEmptyState();
    return;
  }

  courses.forEach((course) => {
    coursesList.appendChild(createCourseRowFromData(course));
  });

  updateEmptyState();
}

function getExistingGpaData() {
  if (!hasExistingGpa || !existingGpaInput || !priorCoursesInput) return null;
  if (!hasExistingGpa.checked) return null;

  const gpa = parseFloat(existingGpaInput.value);
  const priorCourses = parseInt(priorCoursesInput.value, 10);

  if (Number.isNaN(gpa) || gpa < 0 || gpa > 4.5) return null;
  if (Number.isNaN(priorCourses) || priorCourses < 1) return null;

  return {
    gpa,
    credits: priorCourses * CREDITS_PER_COURSE,
    courses: priorCourses,
  };
}

function loadSemesterHistoryState() {
  const semesters = Array.isArray(academicProfile?.semesters) ? academicProfile.semesters : [];
  return {
    targetGpa: academicProfile?.targetGPA !== null && academicProfile?.targetGPA !== undefined ? String(academicProfile.targetGPA) : "",
    records: semesters
      .map((record, index) => ({
        id: record.id || createSemesterId(),
        label: normalizeSemesterLabel(String(record.label || record.name || record.semester || ""), index + 1),
        courses: Array.isArray(record.courses) ? record.courses : [],
        gpa: getSemesterGpaValue(record),
        createdAt: Number.isFinite(safeNumber(record.createdAt)) ? Number(record.createdAt) : Date.now() + index,
      }))
      .filter((record) => Number.isFinite(record.gpa)),
  };
}

function saveSemesterHistoryState() {
  if (!academicProfile) return;
  academicProfile.semesters = semesterHistory.map((record) => ({
    id: record.id,
    name: record.label,
    label: record.label,
    courses: Array.isArray(record.courses) ? record.courses : [],
    semesterGPA: getSemesterGpaValue(record),
    createdAt: record.createdAt,
  }));
  academicProfile.targetGPA = safeNumber(semesterTargetInput?.value) ?? academicProfile.targetGPA;
  persistAcademicProfile({ message: "Progress saved" });
}

function getSemesterRecordsSorted() {
  return [...semesterHistory].sort((left, right) => left.createdAt - right.createdAt);
}

function getTrendStats(records) {
  if (records.length === 0) {
    return {
      best: null,
      growth: null,
      trend: "No semester data available",
      projection: null,
      comparison: null,
      bestImprovement: null,
    };
  }

  const best = records.reduce((highest, record) => (record.gpa > highest.gpa ? record : highest), records[0]);
  const first = records[0];
  const latest = records[records.length - 1];
  const growth = getSemesterGpaValue(latest) - getSemesterGpaValue(first);

  const recentWindow = records.slice(-3);
  let trend = "Stable";
  if (recentWindow.length >= 2) {
    const diffs = recentWindow.slice(1).map((record, index) => getSemesterGpaValue(record) - getSemesterGpaValue(recentWindow[index]));
    const improving = diffs.every((delta) => delta > 0.02);
    const declining = diffs.every((delta) => delta < -0.02);
    if (improving) trend = "Improving";
    if (declining) trend = "Declining";
  }

  let bestImprovement = null;
  let comparison = null;
  if (records.length >= 2) {
    let strongestDelta = Number.NEGATIVE_INFINITY;
    for (let index = 1; index < records.length; index += 1) {
      const previous = records[index - 1];
      const current = records[index];
      const delta = current.gpa - previous.gpa;
      if (delta > strongestDelta) {
        strongestDelta = delta;
        bestImprovement = { from: previous, to: current, delta };
      }
    }
    comparison = { from: records[records.length - 2], to: latest, delta: latest.gpa - records[records.length - 2].gpa };
  }

  let projection = null;
  if (records.length >= 2) {
    const deltas = records.slice(1).map((record, index) => record.gpa - records[index].gpa);
    const recentDeltas = deltas.slice(-3);
    const averageDelta = recentDeltas.reduce((sum, value) => sum + value, 0) / recentDeltas.length;
    projection = clampGpa(latest.gpa + averageDelta);
  }

  return {
    best,
    growth,
    trend,
    projection,
    comparison,
    bestImprovement,
  };
}

function buildTrendChartColors() {
  const styles = getComputedStyle(document.documentElement);
  return {
    text: styles.getPropertyValue("--text").trim() || "#f3efe6",
    muted: styles.getPropertyValue("--text-muted").trim() || "#a8a39a",
    primary: styles.getPropertyValue("--primary").trim() || "#54c1ff",
    success: styles.getPropertyValue("--success").trim() || "#7ebf9b",
    warning: styles.getPropertyValue("--warning").trim() || "#54c1ff",
    border: styles.getPropertyValue("--border").trim() || "rgba(84, 193, 255, 0.18)",
    surface: styles.getPropertyValue("--surface").trim() || "#0f0f10",
    surfaceSoft: styles.getPropertyValue("--surface-soft").trim() || "#161617",
  };
}

function updateTrendEmptyState(records) {
  if (!semesterTrendEmptyState || !semesterTrendChartCanvas) return;
  const hasData = records.length > 0;
  semesterTrendEmptyState.hidden = hasData;
  semesterTrendChartCanvas.hidden = !hasData;
}

function renderSemesterHistoryList(records) {
  if (!semesterHistoryList) return;

  if (records.length === 0) {
    semesterHistoryList.innerHTML = '<div class="semester-empty-state">No semester data available. Add your first semester to view your GPA trend.</div>';
    return;
  }

  semesterHistoryList.innerHTML = records.map((record) => `
    <article class="semester-history-item" data-id="${record.id}">
      <div class="semester-history-copy">
        <strong>${record.label}</strong>
        <span>${record.gpa.toFixed(2)} GPA</span>
      </div>
      <div class="semester-history-actions">
        <button type="button" class="btn btn-secondary semester-edit-btn" data-action="edit" data-id="${record.id}">Edit</button>
        <button type="button" class="btn btn-remove semester-delete-btn" data-action="delete" data-id="${record.id}" aria-label="Delete ${record.label}">×</button>
      </div>
    </article>
  `).join("");
}

function renderTrendSummaryCards(records) {
  if (!hasTrendPage) return;

  const stats = getTrendStats(records);

  if (semesterBestCard) {
    semesterBestCard.innerHTML = stats.best
      ? `<strong>Best Semester</strong><span>${stats.best.label}</span><span>${stats.best.gpa.toFixed(2)} GPA</span>`
      : `<strong>Best Semester</strong><span>No semester data yet</span><span>Add a record to begin</span>`;
  }

  if (semesterGrowthCard) {
    semesterGrowthCard.innerHTML = stats.growth !== null
      ? `<strong>Overall Growth</strong><span>${stats.growth >= 0 ? "+" : ""}${stats.growth.toFixed(2)}</span><span>Since ${records[0].label}</span>`
      : `<strong>Overall Growth</strong><span>—</span><span>Add at least one semester</span>`;
  }

  if (semesterTrendCard) {
    semesterTrendCard.innerHTML = `<strong>Current Trend</strong><span>${stats.trend}</span><span>${stats.trend === "Improving" ? "Your GPA has increased over the last 3 semesters." : stats.trend === "Declining" ? "Your GPA has decreased recently." : records.length > 1 ? "Your GPA has remained consistent." : "Add more semester records to detect a trend."}</span>`;
  }

  if (semesterProjectionCard) {
    semesterProjectionCard.innerHTML = stats.projection !== null
      ? `<strong>Trend Projection</strong><span>${stats.projection.toFixed(2)} GPA</span><span>Projected next semester</span>`
      : `<strong>Trend Projection</strong><span>—</span><span>Add at least 2 semesters</span>`;
  }

  if (semesterComparisonCard) {
    semesterComparisonCard.innerHTML = stats.bestImprovement
      ? `<strong>Best Improvement</strong><span>${stats.bestImprovement.from.label} → ${stats.bestImprovement.to.label}</span><span>${stats.bestImprovement.delta >= 0 ? "+" : ""}${stats.bestImprovement.delta.toFixed(2)} GPA change</span>`
      : `<strong>Best Improvement</strong><span>—</span><span>Add at least 2 semesters</span>`;
  }

  if (semesterTargetCard) {
    const targetValue = parseFloat(semesterTargetInput?.value || "");
    if (Number.isFinite(targetValue)) {
      const targetGap = stats.best ? targetValue - stats.best.gpa : targetValue;
      semesterTargetCard.innerHTML = `<strong>Target GPA</strong><span>${targetValue.toFixed(2)}</span><span>${targetGap >= 0 ? `${targetGap.toFixed(2)} above your best semester` : `${Math.abs(targetGap).toFixed(2)} below your best semester`}</span>`;
    } else {
      semesterTargetCard.innerHTML = `<strong>Target GPA</strong><span>—</span><span>Set a goal to show the target line</span>`;
    }
  }

  if (semesterChartLegend) {
    semesterChartLegend.textContent = stats.best ? `Highest semester: ${stats.best.label}` : "Add records to see your trend";
  }
}

function renderTrendChart(records) {
  if (!hasTrendPage || !semesterTrendChartCanvas) return;

  updateTrendEmptyState(records);

  if (!records.length) {
    if (semesterTrendChart) {
      semesterTrendChart.destroy();
      semesterTrendChart = null;
    }
    renderTrendSummaryCards(records);
    return;
  }

  const labels = records.map((record) => record.label);
  const values = records.map((record) => getSemesterGpaValue(record));
  const targetGpa = parseFloat(semesterTargetInput?.value || "");
  const targetLine = Number.isFinite(targetGpa) ? labels.map(() => clampGpa(targetGpa)) : null;
  const colors = buildTrendChartColors();

  const chartData = {
    labels,
    datasets: [
      {
        label: "Semester GPA",
        data: values,
        borderColor: colors.primary,
        backgroundColor: colors.primary,
        borderWidth: 3,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: colors.primary,
        pointBorderColor: colors.surface,
        pointBorderWidth: 2,
        fill: true,
        tension: 0.32,
        order: 1,
      },
    ],
  };

  if (targetLine) {
    chartData.datasets.push({
      label: "Target GPA",
      data: targetLine,
      borderColor: colors.warning,
      borderDash: [8, 6],
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 0,
      fill: false,
      tension: 0,
      order: 0,
    });
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 900,
      easing: "easeOutQuart",
    },
    interaction: {
      mode: "index",
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: colors.surfaceSoft,
        borderColor: colors.border,
        borderWidth: 1,
        titleColor: colors.text,
        bodyColor: colors.text,
        padding: 12,
        displayColors: false,
        callbacks: {
          title(items) {
            const item = items[0];
            const record = records[item.dataIndex];
            return record ? record.label : "Semester";
          },
          label(context) {
            if (context.datasetIndex !== 0) {
              return null;
            }

            const current = context.parsed.y;
            const previous = context.dataIndex > 0 ? values[context.dataIndex - 1] : null;
            const change = previous !== null ? current - previous : null;
            const lines = [`GPA: ${formatGpa(current)}`];

            if (change !== null) {
              lines.push(`Change: ${change >= 0 ? "+" : ""}${formatGpa(change)}`);
            } else {
              lines.push("Change: First semester in the record");
            }

            return lines;
          },
          afterBody(items) {
            const item = items.find((entry) => entry.datasetIndex === 0);
            if (!item || item.datasetIndex !== 0 || item.dataIndex === 0) {
              return "";
            }

            const current = values[item.dataIndex];
            const previous = values[item.dataIndex - 1];
            const change = current - previous;
            return change >= 0
              ? `Improved by ${change.toFixed(2)} from previous semester.`
              : `Declined by ${Math.abs(change).toFixed(2)} from previous semester.`;
          },
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: colors.border,
        },
        ticks: {
          color: colors.muted,
          font: {
            size: 12,
          },
        },
      },
      y: {
        beginAtZero: true,
        suggestedMax: MAX_GPA_SCALE,
        max: MAX_GPA_SCALE,
        grid: {
          color: colors.border,
        },
        ticks: {
          color: colors.muted,
          stepSize: 0.5,
          callback(value) {
            return Number(value).toFixed(1);
          },
        },
      },
    },
  };

  if (!semesterTrendChart) {
    const context = semesterTrendChartCanvas.getContext("2d");
    if (!context || typeof Chart === "undefined") {
      semesterTrendEmptyState.hidden = false;
      semesterTrendEmptyState.textContent = "Chart rendering is unavailable in this browser session.";
      semesterTrendChartCanvas.hidden = true;
      return;
    }

    semesterTrendChart = new Chart(context, {
      type: "line",
      data: chartData,
      options: chartOptions,
    });
  } else {
    semesterTrendChart.data = chartData;
    semesterTrendChart.options = chartOptions;
    semesterTrendChart.update();
  }

  renderTrendSummaryCards(records);
}

function syncSemesterTrend() {
  if (!hasTrendPage) return;
  const records = getSemesterRecordsSorted();
  semesterHistory = records;
  renderSemesterHistoryList(records);
  renderTrendChart(records);
  saveSemesterHistoryState();
}

function resetSemesterForm() {
  if (!hasTrendPage || !semesterTrendForm) return;
  const targetValue = semesterTargetInput.value;
  semesterEditingId = null;
  semesterTrendForm.reset();
  semesterTargetInput.value = targetValue;
  if (semesterAddBtn) {
    semesterAddBtn.textContent = "Add semester";
  }
  if (semesterCancelBtn) {
    semesterCancelBtn.hidden = true;
  }
}

function loadSemesterForm(record) {
  if (!hasTrendPage || !record) return;
  semesterEditingId = record.id;
  semesterLabelInput.value = record.label;
  semesterGpaInput.value = record.gpa.toFixed(2);
  if (semesterAddBtn) {
    semesterAddBtn.textContent = "Update semester";
  }
  if (semesterCancelBtn) {
    semesterCancelBtn.hidden = false;
  }
  semesterLabelInput.focus();
}

function removeSemesterRecord(recordId) {
  semesterHistory = semesterHistory.filter((record) => record.id !== recordId);
  if (semesterEditingId === recordId) {
    resetSemesterForm();
  }
  syncSemesterTrend();
}

function upsertSemesterRecord(event) {
  event.preventDefault();
  if (!hasTrendPage) return;

  const label = semesterLabelInput.value.trim();
  const gpa = parseFloat(semesterGpaInput.value);

  if (!Number.isFinite(gpa) || gpa < 0 || gpa > MAX_GPA_SCALE) {
    semesterGpaInput.focus();
    return;
  }

  const nextRecord = {
    id: semesterEditingId || createSemesterId(),
    label: normalizeSemesterLabel(label, semesterHistory.length + 1),
    courses: semesterEditingId ? (semesterHistory.find((record) => record.id === semesterEditingId)?.courses || []) : captureSemesterCourses(),
    gpa: clampGpa(gpa),
    createdAt: semesterEditingId ? semesterHistory.find((record) => record.id === semesterEditingId)?.createdAt || Date.now() : Date.now(),
  };

  if (semesterEditingId) {
    semesterHistory = semesterHistory.map((record) => (record.id === semesterEditingId ? nextRecord : record));
  } else {
    semesterHistory = [...semesterHistory, nextRecord];
  }

  resetSemesterForm();
  syncSemesterTrend();
}

function handleTrendListClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  const action = target.dataset.action;
  const recordId = target.dataset.id;
  if (!action || !recordId) return;

  const record = semesterHistory.find((item) => item.id === recordId);
  if (!record) return;

  if (action === "edit") {
    loadSemesterForm(record);
  } else if (action === "delete") {
    removeSemesterRecord(recordId);
  }
}

function loadSemesterHistoryFromStorage() {
  if (!hasTrendPage) return;
  const saved = loadSemesterHistoryState();
  semesterHistory = saved.records;
  if (semesterTargetInput && saved.targetGpa !== "") {
    semesterTargetInput.value = saved.targetGpa;
  }
}

function calculateGPA() {
  if (!coursesList || !gpaValue || !gpaMeta) return;
  const rows = coursesList.querySelectorAll(".course-row");
  let totalPoints = 0;
  let totalCredits = 0;
  let validCourses = 0;

  const existing = getExistingGpaData();
  if (existing) {
    totalPoints += existing.gpa * existing.credits;
    totalCredits += existing.credits;
  }

  rows.forEach((row) => {
    const grade = getGradeByLetter(row.querySelector(".grade-input").value);

    if (!grade) return;

    totalPoints += grade.points * CREDITS_PER_COURSE;
    totalCredits += CREDITS_PER_COURSE;
    validCourses++;
  });

  if (totalCredits === 0) {
    gpaValue.textContent = "-";
    if (hasExistingGpa.checked) {
      gpaMeta.textContent = existing
        ? `${existing.courses} prior course${existing.courses !== 1 ? "s" : ""}`
        : "Enter your current GPA and prior course count";
    } else {
      gpaMeta.textContent = rows.length === 0
        ? "Add courses to get started"
        : "Select a letter grade for each course";
    }
    return;
  }

  const gpa = totalPoints / totalCredits;
  gpaValue.textContent = gpa.toFixed(2);

  if (existing && validCourses > 0) {
    gpaMeta.textContent = `${existing.courses} prior + ${validCourses} new course${validCourses !== 1 ? "s" : ""}`;
  } else if (existing) {
    gpaMeta.textContent = `${existing.courses} prior course${existing.courses !== 1 ? "s" : ""}`;
  } else {
    gpaMeta.textContent = `${validCourses} course${validCourses !== 1 ? "s" : ""}`;
  }
}

function addCourse() {
  if (!coursesList) return;
  const empty = coursesList.querySelector(".empty-state");
  if (empty) empty.remove();
  const row = createCourseRow();
  coursesList.appendChild(row);
  row.querySelector(".name-input").focus();
  persistAcademicProfile({ message: "Progress saved" });
}

function getPlannerCoursesFromDom() {
  if (!plannerCourseList) return [];
  return Array.from(plannerCourseList.querySelectorAll(".planner-course-row")).map((row) => ({
    name: row.querySelector(".planner-course-name").value.trim(),
    credits: row.querySelector(".planner-course-credits").value,
    grade: row.querySelector(".planner-course-grade").value,
  }));
}

function savePlannerState() {
  if (!academicProfile || !hasPlannerPage) return;
  academicProfile.planner = {
    currentGpa: plannerCurrentGpaInput.value,
    completedCredits: plannerCompletedCreditsInput.value,
    targetGpa: plannerTargetGpaInput.value,
    totalCredits: plannerTotalCreditsInput.value,
    courses: getPlannerCoursesFromDom(),
  };
  academicProfile.targetGPA = safeNumber(plannerTargetGpaInput.value) ?? academicProfile.targetGPA;
  persistAcademicProfile({ message: "Progress saved" });
}

function loadPlannerState() {
  if (!academicProfile || !hasPlannerPage) return null;
  return academicProfile.planner;
}

function describeNeededGpa(gpa) {
  if (gpa >= 4.25) return "an A+ average";
  if (gpa >= 4.0) return "an A average";
  if (gpa >= 3.85) return "an A- average";
  if (gpa >= 3.5) return "a B+ average";
  if (gpa >= 3.0) return "a B average";
  if (gpa >= 2.5) return "a C+ average";
  return "a steady average";
}

function createPlannerCourseRow(course = {}) {
  if (!plannerCourseList) return document.createElement("div");
  const row = document.createElement("div");
  row.className = "planner-course-row";
  row.dataset.id = ++plannerCourseIdCounter;

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "planner-course-name";
  nameInput.placeholder = "Course name";
  nameInput.value = course.name || "";
  nameInput.setAttribute("aria-label", "Course name");

  const creditsInput = document.createElement("input");
  creditsInput.type = "number";
  creditsInput.className = "planner-course-credits";
  creditsInput.placeholder = "Credits";
  creditsInput.min = "0.5";
  creditsInput.step = "0.5";
  creditsInput.value = course.credits || "";
  creditsInput.setAttribute("aria-label", "Credit hours");

  const gradeSelect = document.createElement("select");
  gradeSelect.className = "planner-course-grade";
  gradeSelect.setAttribute("aria-label", "Expected grade");
  gradeSelect.innerHTML = gradeOptionsHtml(course.grade || "");

  const removeBtn = document.createElement("button");
  removeBtn.type = "button";
  removeBtn.className = "btn btn-remove planner-course-remove";
  removeBtn.setAttribute("aria-label", "Remove course");
  removeBtn.textContent = "×";

  row.append(nameInput, creditsInput, gradeSelect, removeBtn);

  const syncPlanner = () => {
    savePlannerState();
    calculatePlanner();
  };

  nameInput.addEventListener("input", syncPlanner);
  creditsInput.addEventListener("input", syncPlanner);
  gradeSelect.addEventListener("change", syncPlanner);
  removeBtn.addEventListener("click", () => {
    row.remove();
    if (plannerCourseList.children.length === 0) {
      plannerCourseList.innerHTML = '<div class="planner-empty-state">Add a semester plan to see your projected GPA.</div>';
    }
    savePlannerState();
    calculatePlanner();
  });

  return row;
}

function addPlannerCourse(course = {}) {
  if (!plannerCourseList) return;
  const emptyState = plannerCourseList.querySelector(".planner-empty-state");
  if (emptyState) {
    emptyState.remove();
  }
  plannerCourseList.appendChild(createPlannerCourseRow(course));
  savePlannerState();
  calculatePlanner();
}

function populatePlannerForm(state) {
  if (!plannerCourseList || !plannerCurrentGpaInput || !plannerCompletedCreditsInput || !plannerTargetGpaInput || !plannerTotalCreditsInput) return;
  plannerCurrentGpaInput.value = state.currentGpa || "";
  plannerCompletedCreditsInput.value = state.completedCredits || "";
  plannerTargetGpaInput.value = state.targetGpa || "";
  plannerTotalCreditsInput.value = state.totalCredits || "";

  plannerCourseList.innerHTML = "";
  const courses = Array.isArray(state.courses) ? state.courses : [];

  if (courses.length > 0) {
    courses.forEach((course) => addPlannerCourse(course));
  } else {
    plannerCourseList.innerHTML = '<div class="planner-empty-state">Add a semester plan to see your projected GPA.</div>';
  }
}

function calculatePlanner() {
  if (!hasPlannerPage) return;
  const currentGpa = parseFloat(plannerCurrentGpaInput.value);
  const completedCredits = parseFloat(plannerCompletedCreditsInput.value);
  const targetGpa = parseFloat(plannerTargetGpaInput.value);
  const totalCredits = parseFloat(plannerTotalCreditsInput.value);
  const plannedCourses = getPlannerCoursesFromDom();

  plannerCurrentStat.textContent = Number.isFinite(currentGpa) ? currentGpa.toFixed(2) : "—";
  plannerTargetStat.textContent = Number.isFinite(targetGpa) ? targetGpa.toFixed(2) : "—";
  plannerCompletedStat.textContent = Number.isFinite(completedCredits) && Number.isFinite(totalCredits)
    ? `${Math.round(completedCredits)} / ${Math.round(totalCredits)}`
    : "—";

  const remainingCredits = Number.isFinite(completedCredits) && Number.isFinite(totalCredits)
    ? Math.round(totalCredits - completedCredits)
    : null;
  plannerRemainingStat.textContent = remainingCredits !== null ? `${remainingCredits}` : "—";

  if (!Number.isFinite(currentGpa) || !Number.isFinite(completedCredits) || !Number.isFinite(targetGpa) || !Number.isFinite(totalCredits)) {
    plannerRequiredStat.textContent = "—";
    plannerProjectedStat.textContent = "—";
    plannerSemesterStat.textContent = "—";
    plannerStatusBadge.textContent = "Needs input";
    plannerStatusBadge.dataset.state = "neutral";
    plannerFeedback.textContent = "Enter your current standing and a target to see what you need next.";
    plannerProgressFill.style.width = "0%";
    plannerMarkerCurrent.style.left = "0%";
    plannerMarkerTarget.style.left = "0%";
    plannerMarkerProjected.style.left = "0%";
    plannerProgressCurrentLabel.textContent = "Current —";
    plannerProgressTargetLabel.textContent = "Target —";
    plannerProgressProjectedLabel.textContent = "Projected —";
    plannerResultsCard.classList.remove("celebrate", "warning", "danger");
    return;
  }

  if (completedCredits < 0 || totalCredits <= 0 || completedCredits > totalCredits || currentGpa < 0 || currentGpa > MAX_GPA_SCALE || targetGpa < 0 || targetGpa > MAX_GPA_SCALE) {
    plannerRequiredStat.textContent = "—";
    plannerProjectedStat.textContent = "—";
    plannerSemesterStat.textContent = "—";
    plannerStatusBadge.textContent = "Check inputs";
    plannerStatusBadge.dataset.state = "warning";
    plannerFeedback.textContent = "Please enter valid GPA and credit values before comparing scenarios.";
    plannerProgressFill.style.width = "0%";
    plannerMarkerCurrent.style.left = "0%";
    plannerMarkerTarget.style.left = "0%";
    plannerMarkerProjected.style.left = "0%";
    plannerProgressCurrentLabel.textContent = `Current ${currentGpa.toFixed(2)}`;
    plannerProgressTargetLabel.textContent = `Target ${targetGpa.toFixed(2)}`;
    plannerProgressProjectedLabel.textContent = "Projected —";
    plannerResultsCard.classList.remove("celebrate", "warning", "danger");
    plannerResultsCard.classList.add("warning");
    return;
  }

  let requiredAverage = null;
  let projectedCgpa = null;
  let semesterGpa = null;

  if (remainingCredits > 0) {
    requiredAverage = ((targetGpa * totalCredits) - (currentGpa * completedCredits)) / remainingCredits;
  }

  let semesterCredits = 0;
  let semesterPoints = 0;

  plannedCourses.forEach((course) => {
    const credits = parseFloat(course.credits);
    const grade = getGradeByLetter(course.grade);

    if (!Number.isFinite(credits) || credits <= 0 || !grade) return;

    semesterCredits += credits;
    semesterPoints += grade.points * credits;
  });

  if (semesterCredits > 0) {
    semesterGpa = semesterPoints / semesterCredits;
    projectedCgpa = ((currentGpa * completedCredits) + semesterPoints) / (completedCredits + semesterCredits);
  }

  plannerRequiredStat.textContent = requiredAverage !== null ? requiredAverage.toFixed(2) : "—";
  plannerProjectedStat.textContent = projectedCgpa !== null ? projectedCgpa.toFixed(2) : "—";
  plannerSemesterStat.textContent = semesterGpa !== null ? semesterGpa.toFixed(2) : "—";

  let statusText = "Needs input";
  let statusState = "neutral";
  let feedbackText = "";

  if (requiredAverage !== null && requiredAverage > MAX_GPA_SCALE) {
    statusText = "Impossible";
    statusState = "danger";
    feedbackText = "Your goal is mathematically impossible with the remaining credits.";
  } else if (currentGpa >= targetGpa) {
    statusText = "On Track";
    statusState = "success";
    feedbackText = "Excellent! You are already meeting your target GPA.";
  } else if (projectedCgpa !== null && projectedCgpa >= targetGpa) {
    statusText = "On Track";
    statusState = "success";
    feedbackText = `Excellent! Your projected GPA is ${projectedCgpa.toFixed(2)} and clears your target.`;
  } else if (requiredAverage !== null) {
    statusText = "Target Difficult";
    statusState = "warning";
    const gap = Math.abs(targetGpa - currentGpa).toFixed(2);
    if (parseFloat(gap) <= 0.12) {
      feedbackText = `You are only ${gap} GPA points away from your target.`;
    } else {
      feedbackText = `You need about ${requiredAverage.toFixed(2)} GPA over your remaining credits, roughly ${describeNeededGpa(requiredAverage)}.`;
    }
  } else {
    statusText = "On Track";
    statusState = "success";
    feedbackText = "You have already completed enough credits to meet your goal.";
  }

  plannerStatusBadge.textContent = statusText;
  plannerStatusBadge.dataset.state = statusState;
  plannerFeedback.textContent = feedbackText || "Enter your current standing and a target to see what you need next.";

  const maxTrackValue = Math.max(MAX_GPA_SCALE, currentGpa || 0, targetGpa || 0, projectedCgpa || 0, 0.1);
  const currentPosition = Number.isFinite(currentGpa) ? (currentGpa / maxTrackValue) * 100 : 0;
  const targetPosition = Number.isFinite(targetGpa) ? (targetGpa / maxTrackValue) * 100 : 0;
  const projectedPosition = Number.isFinite(projectedCgpa) ? (projectedCgpa / maxTrackValue) * 100 : 0;

  plannerProgressFill.style.width = `${Math.min(100, Math.max(0, currentPosition))}%`;
  plannerMarkerCurrent.style.left = `${Math.min(100, Math.max(0, currentPosition))}%`;
  plannerMarkerTarget.style.left = `${Math.min(100, Math.max(0, targetPosition))}%`;
  plannerMarkerProjected.style.left = `${Math.min(100, Math.max(0, projectedPosition))}%`;
  plannerMarkerProjected.style.display = Number.isFinite(projectedCgpa) ? "block" : "none";

  plannerProgressCurrentLabel.textContent = `Current ${Number.isFinite(currentGpa) ? currentGpa.toFixed(2) : "—"}`;
  plannerProgressTargetLabel.textContent = `Target ${Number.isFinite(targetGpa) ? targetGpa.toFixed(2) : "—"}`;
  plannerProgressProjectedLabel.textContent = `Projected ${Number.isFinite(projectedCgpa) ? projectedCgpa.toFixed(2) : "—"}`;

  plannerResultsCard.classList.remove("celebrate", "warning", "danger");
  if (statusState === "warning") {
    plannerResultsCard.classList.add("warning");
  } else if (statusState === "danger") {
    plannerResultsCard.classList.add("danger");
  } else if (projectedCgpa !== null && projectedCgpa >= targetGpa) {
    plannerResultsCard.classList.add("celebrate");
  }
}

function resetPlanner() {
  if (!hasPlannerPage) return;
  plannerCurrentGpaInput.value = "";
  plannerCompletedCreditsInput.value = "";
  plannerTargetGpaInput.value = "";
  plannerTotalCreditsInput.value = "";
  plannerCourseList.innerHTML = '<div class="planner-empty-state">Add a semester plan to see your projected GPA.</div>';
  savePlannerState();
  calculatePlanner();
}

if (hasCalculatorPage) {
  addCourseBtn.addEventListener("click", addCourse);
  exportPdfBtn.addEventListener("click", exportToPdf);
  if (exportJsonBtn) {
    exportJsonBtn.addEventListener("click", exportAcademicProfileJson);
  }
  if (exportCsvBtn) {
    exportCsvBtn.addEventListener("click", exportAcademicProfileCsv);
  }
  if (clearDataBtn) {
    clearDataBtn.addEventListener("click", clearAcademicProfile);
  }
  if (importDataBtn) {
    importDataBtn.addEventListener("click", handleImportAcademicProfile);
  }
  if (importDataInput) {
    importDataInput.addEventListener("change", () => {
      const [file] = importDataInput.files || [];
      readImportedAcademicProfile(file);
      importDataInput.value = "";
    });
  }
}

if (hasPlannerPage) {
  plannerAddCourseBtn.addEventListener("click", () => addPlannerCourse());
  plannerResetBtn.addEventListener("click", resetPlanner);
}

if (hasExistingGpa && existingGpaFields && existingGpaInput && priorCoursesInput) {
  hasExistingGpa.addEventListener("change", () => {
    existingGpaFields.hidden = !hasExistingGpa.checked;
    if (!hasExistingGpa.checked) {
      existingGpaInput.value = "";
      priorCoursesInput.value = "";
    }
    calculateGPA();
    persistAcademicProfile({ message: "Progress saved" });
  });
}

if (existingGpaInput && priorCoursesInput) {
  [existingGpaInput, priorCoursesInput].forEach((input) => {
    input.addEventListener("input", () => {
      calculateGPA();
      persistAcademicProfile({ message: "Progress saved" });
    });
  });
}

if (hasPlannerPage) {
  [
    plannerCurrentGpaInput,
    plannerCompletedCreditsInput,
    plannerTargetGpaInput,
    plannerTotalCreditsInput,
  ].forEach((input) => {
    input.addEventListener("input", () => {
      calculatePlanner();
      savePlannerState();
    });
  });
}

if (hasCalculatorPage) {
  initializeAcademicProfile();
  renderScaleTable();
  restoreAcademicUiFromProfile();
}

if (hasTrendPage) {
  if (!profileLoaded) {
    initializeAcademicProfile();
  }
  loadSemesterHistoryFromStorage();
  syncSemesterTrend();

  semesterTrendForm.addEventListener("submit", upsertSemesterRecord);
  semesterHistoryList.addEventListener("click", handleTrendListClick);

  if (semesterCancelBtn) {
    semesterCancelBtn.addEventListener("click", resetSemesterForm);
  }

  if (semesterUseCurrentBtn) {
    semesterUseCurrentBtn.addEventListener("click", () => {
      const currentGpa = parseFloat(gpaValue?.textContent || "");
      if (!Number.isFinite(currentGpa)) return;
      semesterGpaInput.value = currentGpa.toFixed(2);
      semesterLabelInput.value = semesterLabelInput.value || `Semester ${semesterHistory.length + 1}`;
      semesterGpaInput.focus();
    });
  }

  if (semesterTargetInput) {
    semesterTargetInput.addEventListener("input", () => {
      renderTrendChart(getSemesterRecordsSorted());
      saveSemesterHistoryState();
    });
  }

  if (window.matchMedia) {
    const themeQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const syncTheme = () => renderTrendChart(getSemesterRecordsSorted());
    if (typeof themeQuery.addEventListener === "function") {
      themeQuery.addEventListener("change", syncTheme);
    } else if (typeof themeQuery.addListener === "function") {
      themeQuery.addListener(syncTheme);
    }
  }
}

if (hasPlannerPage) {
  if (academicProfile?.planner) {
    populatePlannerForm(academicProfile.planner);
  } else {
    plannerCourseList.innerHTML = '<div class="planner-empty-state">Add a semester plan to see your projected GPA.</div>';
  }
  calculatePlanner();
}
