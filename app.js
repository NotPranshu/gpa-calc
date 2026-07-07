const CREDITS_PER_COURSE = 15;
const PLANNER_STORAGE_KEY = "gpa-planner-state";
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
const themeToggle = document.getElementById("themeToggle");

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

let courseIdCounter = 0;
let plannerCourseIdCounter = 0;

function setTheme(theme) {
  const resolvedTheme = theme === "light" ? "light" : "dark";
  document.documentElement.dataset.theme = resolvedTheme;
  const icon = themeToggle?.querySelector(".theme-toggle-icon");
  const label = themeToggle?.querySelector(".theme-toggle-label");

  if (icon) {
    icon.textContent = resolvedTheme === "light" ? "☀️" : "🌙";
  }

  if (label) {
    label.textContent = resolvedTheme === "light" ? "Light" : "Dark";
  }

  try {
    localStorage.setItem("gpa-theme", resolvedTheme);
  } catch (error) {
    console.warn("Theme preference could not be saved", error);
  }
}

function initializeTheme() {
  let savedTheme = "dark";

  try {
    savedTheme = localStorage.getItem("gpa-theme") || "dark";
  } catch (error) {
    console.warn("Theme preference could not be loaded", error);
  }

  setTheme(savedTheme);
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

function createCourseRow() {
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

  nameInput.addEventListener("input", calculateGPA);
  gradeInput.addEventListener("change", calculateGPA);

  removeBtn.addEventListener("click", () => {
    row.remove();
    updateEmptyState();
    calculateGPA();
  });

  return row;
}

function updateEmptyState() {
  const rows = coursesList.querySelectorAll(".course-row");
  const existing = coursesList.querySelector(".empty-state");
  if (rows.length === 0 && !existing) {
    coursesList.innerHTML = `<div class="empty-state">No courses yet. Click "Add Course" to begin.</div>`;
  } else if (rows.length > 0 && existing) {
    existing.remove();
  }
}

function getExistingGpaData() {
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

function calculateGPA() {
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
  const empty = coursesList.querySelector(".empty-state");
  if (empty) empty.remove();
  const row = createCourseRow();
  coursesList.appendChild(row);
  row.querySelector(".name-input").focus();
}

function getPlannerCoursesFromDom() {
  return Array.from(plannerCourseList.querySelectorAll(".planner-course-row")).map((row) => ({
    name: row.querySelector(".planner-course-name").value.trim(),
    credits: row.querySelector(".planner-course-credits").value,
    grade: row.querySelector(".planner-course-grade").value,
  }));
}

function savePlannerState() {
  const state = {
    currentGpa: plannerCurrentGpaInput.value,
    completedCredits: plannerCompletedCreditsInput.value,
    targetGpa: plannerTargetGpaInput.value,
    totalCredits: plannerTotalCreditsInput.value,
    courses: getPlannerCoursesFromDom(),
  };

  try {
    localStorage.setItem(PLANNER_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Planner data could not be saved", error);
  }
}

function loadPlannerState() {
  try {
    const saved = localStorage.getItem(PLANNER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch (error) {
    console.warn("Planner data could not be loaded", error);
    return null;
  }
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
  const emptyState = plannerCourseList.querySelector(".planner-empty-state");
  if (emptyState) {
    emptyState.remove();
  }
  plannerCourseList.appendChild(createPlannerCourseRow(course));
  savePlannerState();
  calculatePlanner();
}

function populatePlannerForm(state) {
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
  plannerCurrentGpaInput.value = "";
  plannerCompletedCreditsInput.value = "";
  plannerTargetGpaInput.value = "";
  plannerTotalCreditsInput.value = "";
  plannerCourseList.innerHTML = '<div class="planner-empty-state">Add a semester plan to see your projected GPA.</div>';
  savePlannerState();
  calculatePlanner();
}

document.getElementById("addCourseBtn").addEventListener("click", addCourse);
exportPdfBtn.addEventListener("click", exportToPdf);
plannerAddCourseBtn.addEventListener("click", () => addPlannerCourse());
plannerResetBtn.addEventListener("click", resetPlanner);

themeToggle?.addEventListener("click", () => {
  const currentTheme = document.documentElement.dataset.theme === "light" ? "light" : "dark";
  setTheme(currentTheme === "light" ? "dark" : "light");
});

hasExistingGpa.addEventListener("change", () => {
  existingGpaFields.hidden = !hasExistingGpa.checked;
  if (!hasExistingGpa.checked) {
    existingGpaInput.value = "";
    priorCoursesInput.value = "";
  }
  calculateGPA();
});

[existingGpaInput, priorCoursesInput].forEach((input) => {
  input.addEventListener("input", calculateGPA);
});

[
  plannerCurrentGpaInput,
  plannerCompletedCreditsInput,
  plannerTargetGpaInput,
  plannerTotalCreditsInput,
].forEach((input) => {
  input.addEventListener("input", () => {
    savePlannerState();
    calculatePlanner();
  });
});

initializeTheme();
renderScaleTable();
updateEmptyState();
calculateGPA();

const savedPlannerState = loadPlannerState();
if (savedPlannerState) {
  populatePlannerForm(savedPlannerState);
} else {
  plannerCourseList.innerHTML = '<div class="planner-empty-state">Add a semester plan to see your projected GPA.</div>';
}
calculatePlanner();
