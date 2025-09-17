// Grades Management JavaScript
class GradesManager {
  constructor() {
    this.baseURL = "php/"
    this.students = []
    this.subjects = []
    this.grades = []
    this.summary = []
    this.loadInitialData()
  }

  async loadInitialData() {
    await this.loadStudents()
    await this.loadSubjects()
    await this.loadGrades()
    await this.loadSummary()
  }

  async loadStudents() {
    try {
      const response = await fetch(this.baseURL + "students.php")
      const result = await response.json()

      if (result.success) {
        this.students = result.students
        this.populateStudentSelects()
      }
    } catch (error) {
      console.error("Error loading students:", error)
    }
  }

  async loadSubjects() {
    try {
      const response = await fetch(this.baseURL + "subjects.php")
      const result = await response.json()

      if (result.success) {
        this.subjects = result.subjects
        this.populateSubjectFilter()
      }
    } catch (error) {
      console.error("Error loading subjects:", error)
    }
  }

  async loadGrades() {
    try {
      const response = await fetch(this.baseURL + "grades.php")
      const result = await response.json()

      if (result.success) {
        this.grades = result.grades
        this.renderGradesTable()
      }
    } catch (error) {
      console.error("Error loading grades:", error)
    }
  }

  async loadSummary() {
    try {
      const response = await fetch(this.baseURL + "grades.php?action=summary")
      const result = await response.json()

      if (result.success) {
        this.summary = result.summary
        this.renderSummaryTable()
      }
    } catch (error) {
      console.error("Error loading summary:", error)
    }
  }

  populateStudentSelects() {
    const marksSelect = document.getElementById("marksStudent")
    const filterSelect = document.getElementById("gradeFilterStudent")

    const options =
      '<option value="">Select a student</option>' +
      this.students
        .map(
          (student) =>
            `<option value="${student.id}">${student.first_name} ${student.last_name} (${student.student_id})</option>`,
        )
        .join("")

    marksSelect.innerHTML = options
    filterSelect.innerHTML = '<option value="">All Students</option>' + options.replace("Select a student", "")
  }

  populateSubjectFilter() {
    const filterSelect = document.getElementById("gradeFilterSubject")
    filterSelect.innerHTML =
      '<option value="">All Subjects</option>' +
      this.subjects.map((subject) => `<option value="${subject.id}">${subject.subject_name}</option>`).join("")
  }

  async loadStudentSubjects(studentId) {
    if (!studentId) {
      document.getElementById("marksSubject").innerHTML = '<option value="">Select a student first</option>'
      return
    }

    try {
      const response = await fetch(this.baseURL + "grades.php?action=student_subjects&student_id=" + studentId)
      const result = await response.json()

      if (result.success) {
        const subjectSelect = document.getElementById("marksSubject")
        subjectSelect.innerHTML =
          '<option value="">Select a subject</option>' +
          result.subjects.map((subject) => `<option value="${subject.id}">${subject.subject_name}</option>`).join("")
      }
    } catch (error) {
      console.error("Error loading student subjects:", error)
    }
  }

  renderGradesTable() {
    const tbody = document.getElementById("gradesTableBody")

    if (this.grades.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No grades found</td></tr>'
      return
    }

    tbody.innerHTML = this.grades
      .map(
        (grade) => `
        <tr>
          <td>${grade.student_name}</td>
          <td>${grade.subject_name}</td>
          <td>${grade.marks}</td>
          <td><span class="grade-${grade.letter_grade.toLowerCase()}">${grade.letter_grade}</span></td>
          <td>${grade.exam_type}</td>
          <td>${new Date(grade.exam_date).toLocaleDateString()}</td>
          <td>
            <div class="flex gap-1">
              <button class="btn btn-primary" onclick="gradesManager.editGrade(${grade.id})" style="padding: 0.5rem;">Edit</button>
              <button class="btn btn-danger" onclick="gradesManager.deleteGrade(${grade.id})" style="padding: 0.5rem;">Delete</button>
            </div>
          </td>
        </tr>
      `,
      )
      .join("")
  }

  renderSummaryTable() {
    const tbody = document.getElementById("summaryTableBody")

    if (this.summary.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No data available</td></tr>'
      return
    }

    tbody.innerHTML = this.summary
      .map(
        (student, index) => `
        <tr>
          <td>${student.student_name}</td>
          <td>Grade ${student.grade_level}</td>
          <td>${student.subject_count}</td>
          <td>${student.average_marks ? Number.parseFloat(student.average_marks).toFixed(2) : "N/A"}</td>
          <td><span class="grade-${student.overall_grade ? student.overall_grade.toLowerCase() : "f"}">${student.overall_grade || "N/A"}</span></td>
          <td>${index + 1}</td>
          <td>
            <button class="btn btn-secondary" onclick="gradesManager.viewStudentReport(${student.student_id})" style="padding: 0.5rem;">View Report</button>
          </td>
        </tr>
      `,
      )
      .join("")
  }

  async saveMarks(formData) {
    try {
      const response = await fetch(this.baseURL + "grades.php?action=create", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        alert("Marks saved successfully!")
        document.getElementById("marksForm").reset()
        document.getElementById("marksSubject").innerHTML = '<option value="">Select a student first</option>'
        this.loadGrades()
        this.loadSummary()
      } else {
        alert("Error: " + result.message)
      }
    } catch (error) {
      console.error("Error saving marks:", error)
      alert("Error saving marks. Please try again.")
    }
  }

  async editGrade(id) {
    const grade = this.grades.find((g) => g.id == id)
    if (!grade) return

    document.getElementById("editMarksId").value = grade.id
    document.getElementById("editStudentName").value = grade.student_name
    document.getElementById("editSubjectName").value = grade.subject_name
    document.getElementById("editMarks").value = grade.marks
    document.getElementById("editExamType").value = grade.exam_type
    document.getElementById("editExamDate").value = grade.exam_date

    document.getElementById("editMarksModal").classList.add("active")
  }

  async updateMarks(formData) {
    try {
      const marksId = formData.get("marks_id")
      const response = await fetch(this.baseURL + "grades.php?action=update&id=" + marksId, {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        alert("Marks updated successfully!")
        this.closeEditMarksModal()
        this.loadGrades()
        this.loadSummary()
      } else {
        alert("Error: " + result.message)
      }
    } catch (error) {
      console.error("Error updating marks:", error)
      alert("Error updating marks. Please try again.")
    }
  }

  async deleteGrade(id) {
    if (!confirm("Are you sure you want to delete this grade entry?")) {
      return
    }

    try {
      const response = await fetch(this.baseURL + "grades.php?action=delete&id=" + id, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        alert("Grade deleted successfully!")
        this.loadGrades()
        this.loadSummary()
      } else {
        alert("Error: " + result.message)
      }
    } catch (error) {
      console.error("Error deleting grade:", error)
      alert("Error deleting grade. Please try again.")
    }
  }

  async viewStudentReport(studentId) {
    try {
      const response = await fetch(this.baseURL + "grades.php?action=student_report&student_id=" + studentId)
      const result = await response.json()

      if (result.success) {
        const student = result.student
        const grades = result.grades
        const stats = result.stats

        const content = document.getElementById("studentReportContent")
        content.innerHTML = `
          <div class="form-group">
            <h4>${student.first_name} ${student.last_name} (${student.student_id})</h4>
            <p><strong>Grade Level:</strong> ${student.grade_level}</p>
            <p><strong>Email:</strong> ${student.email || "N/A"}</p>
          </div>
          
          <div class="form-group">
            <h5>Performance Statistics</h5>
            <p><strong>Total Subjects:</strong> ${stats.total_subjects}</p>
            <p><strong>Average Marks:</strong> ${stats.average_marks ? Number.parseFloat(stats.average_marks).toFixed(2) : "N/A"}</p>
            <p><strong>Overall Grade:</strong> <span class="grade-${stats.overall_grade ? stats.overall_grade.toLowerCase() : "f"}">${stats.overall_grade || "N/A"}</span></p>
            <p><strong>Highest Mark:</strong> ${stats.highest_mark || "N/A"}</p>
            <p><strong>Lowest Mark:</strong> ${stats.lowest_mark || "N/A"}</p>
          </div>
          
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Marks</th>
                  <th>Grade</th>
                  <th>Exam Type</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${
                  grades.length === 0
                    ? '<tr><td colspan="5" class="text-center">No grades recorded</td></tr>'
                    : grades
                        .map(
                          (grade) => `
                    <tr>
                      <td>${grade.subject_name}</td>
                      <td>${grade.marks}</td>
                      <td><span class="grade-${grade.letter_grade.toLowerCase()}">${grade.letter_grade}</span></td>
                      <td>${grade.exam_type}</td>
                      <td>${new Date(grade.exam_date).toLocaleDateString()}</td>
                    </tr>
                  `,
                        )
                        .join("")
                }
              </tbody>
            </table>
          </div>
        `

        document.getElementById("studentReportModal").classList.add("active")
      } else {
        alert("Error: " + result.message)
      }
    } catch (error) {
      console.error("Error loading student report:", error)
      alert("Error loading student report.")
    }
  }

  filterGrades() {
    const studentFilter = document.getElementById("gradeFilterStudent").value
    const subjectFilter = document.getElementById("gradeFilterSubject").value

    let filteredGrades = this.grades

    if (studentFilter) {
      filteredGrades = filteredGrades.filter((grade) => grade.student_id == studentFilter)
    }

    if (subjectFilter) {
      filteredGrades = filteredGrades.filter((grade) => grade.subject_id == subjectFilter)
    }

    const tbody = document.getElementById("gradesTableBody")

    if (filteredGrades.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No grades found matching filters</td></tr>'
      return
    }

    tbody.innerHTML = filteredGrades
      .map(
        (grade) => `
        <tr>
          <td>${grade.student_name}</td>
          <td>${grade.subject_name}</td>
          <td>${grade.marks}</td>
          <td><span class="grade-${grade.letter_grade.toLowerCase()}">${grade.letter_grade}</span></td>
          <td>${grade.exam_type}</td>
          <td>${new Date(grade.exam_date).toLocaleDateString()}</td>
          <td>
            <div class="flex gap-1">
              <button class="btn btn-primary" onclick="gradesManager.editGrade(${grade.id})" style="padding: 0.5rem;">Edit</button>
              <button class="btn btn-danger" onclick="gradesManager.deleteGrade(${grade.id})" style="padding: 0.5rem;">Delete</button>
            </div>
          </td>
        </tr>
      `,
      )
      .join("")
  }

  closeEditMarksModal() {
    document.getElementById("editMarksModal").classList.remove("active")
  }

  closeStudentReportModal() {
    document.getElementById("studentReportModal").classList.remove("active")
  }
}

// Initialize grades manager
const gradesManager = new GradesManager()

// Global functions
function filterGrades() {
  gradesManager.filterGrades()
}

function closeEditMarksModal() {
  gradesManager.closeEditMarksModal()
}

function closeStudentReportModal() {
  gradesManager.closeStudentReportModal()
}

// Event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Student selection change handler
  document.getElementById("marksStudent").addEventListener("change", (e) => {
    gradesManager.loadStudentSubjects(e.target.value)
  })

  // Marks form submission
  document.getElementById("marksForm").addEventListener("submit", async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    await gradesManager.saveMarks(formData)
  })

  // Edit marks form submission
  document.getElementById("editMarksForm").addEventListener("submit", async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    await gradesManager.updateMarks(formData)
  })
})
