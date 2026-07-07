const CREDITS_PER_COURSE = 15;

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

let courseIdCounter = 0;

function getGradeByLetter(letter) {
  if (!letter) return null;
  return GRADE_SCALE.find((entry) => entry.grade === letter) ?? null;
}

function gradeOptionsHtml() {
  const options = GRADE_SCALE.map(
    (entry) => `<option value="${entry.grade}">${entry.grade}</option>`
  ).join("");
  return `<option value="" selected disabled>Select grade</option>${options}`;
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

document.getElementById("addCourseBtn").addEventListener("click", addCourse);
exportPdfBtn.addEventListener("click", exportToPdf);

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

renderScaleTable();
updateEmptyState();
calculateGPA();
