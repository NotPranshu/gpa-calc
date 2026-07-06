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
  return `${entry.min}% – ${entry.max}%`;
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
    <button type="button" class="btn btn-remove" aria-label="Remove course">×</button>
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
    gpaValue.textContent = "—";
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
