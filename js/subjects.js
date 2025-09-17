// Subject Management JavaScript
class SubjectManager {
  constructor() {
    this.baseURL = "php/"
    this.subjects = []
    this.students = []
    this.currentEditingId = null
    this.loadSubjects()
    this.loadStudentsForEnrollment()
  }

  async loadSubjects() {
    try {
      const response = await fetch(this.baseURL + "subjects.php")
      const result = await response.json()

      if (result.success) {
        this.subjects = result.subjects
        this.renderSubjectsTable()
        this.populateSubjectSelect()
      } else {
        console.error("Failed to load subjects:", result.message)
      }
    } catch (error) {
      console.error("Error loading subjects:", error)
    }
  }

  async loadStudentsForEnrollment() {
    try {
      const response = await fetch(this.baseURL + "students.php")
      const result = await response.json()

      if (result.success) {
        this.students = result.students
        this.populateStudentSelect()
      }
    } catch (error) {
      console.error("Error loading students:", error)
    }
  }

  renderSubjectsTable() {
    const tbody = document.getElementById("subjectsTableBody")

    if (this.subjects.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No subjects found</td></tr>'
      return
    }

    tbody.innerHTML = this.subjects
      .map(
        (subject) => `
        <tr>
          <td>${subject.subject_code}</td>
          <td>${subject.subject_name}</td>
          <td>${subject.description || "N/A"}</td>
          <td>${subject.credits}</td>
          <td>${subject.enrolled_count || 0}</td>
          <td>
            <div class="flex gap-1">
              <button class="btn btn-secondary" onclick="subjectManager.viewEnrollments(${subject.id})" style="padding: 0.5rem;">View</button>
              <button class="btn btn-primary" onclick="subjectManager.editSubject(${subject.id})" style="padding: 0.5rem;">Edit</button>
              <button class="btn btn-danger" onclick="subjectManager.deleteSubject(${subject.id})" style="padding: 0.5rem;">Delete</button>
            </div>
          </td>
        </tr>
      `,
      )
      .join("")
  }

  populateStudentSelect() {
    const select = document.getElementById("enrollStudent")
    select.innerHTML =
      '<option value="">Select a student</option>' +
      this.students
        .map(
          (student) =>
            `<option value="${student.id}">${student.first_name} ${student.last_name} (${student.student_id})</option>`,
        )
        .join("")
  }

  populateSubjectSelect() {
    const select = document.getElementById("enrollSubject")
    select.innerHTML =
      '<option value="">Select a subject</option>' +
      this.subjects
        .map((subject) => `<option value="${subject.id}">${subject.subject_name} (${subject.subject_code})</option>`)
        .join("")
  }

  async saveSubject(formData) {
    try {
      const url = this.currentEditingId
        ? this.baseURL + "subjects.php?action=update&id=" + this.currentEditingId
        : this.baseURL + "subjects.php?action=create"

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        this.loadSubjects()
        this.closeSubjectModal()
        alert(this.currentEditingId ? "Subject updated successfully!" : "Subject added successfully!")
      } else {
        alert("Error: " + result.message)
      }
    } catch (error) {
      console.error("Error saving subject:", error)
      alert("Error saving subject. Please try again.")
    }
  }

  async deleteSubject(id) {
    if (
      !confirm(
        "Are you sure you want to delete this subject? This will also remove all enrollments and marks for this subject.",
      )
    ) {
      return
    }

    try {
      const response = await fetch(this.baseURL + "subjects.php?action=delete&id=" + id, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        this.loadSubjects()
        alert("Subject deleted successfully!")
      } else {
        alert("Error: " + result.message)
      }
    } catch (error) {
      console.error("Error deleting subject:", error)
      alert("Error deleting subject. Please try again.")
    }
  }

  async viewEnrollments(subjectId) {
    try {
      const response = await fetch(this.baseURL + "subjects.php?action=enrollments&id=" + subjectId)
      const result = await response.json()

      if (result.success) {
        const subject = result.subject
        const enrollments = result.enrollments
        const content = document.getElementById("enrollmentsContent")

        content.innerHTML = `
          <div class="form-group">
            <h4>${subject.subject_name} (${subject.subject_code})</h4>
            <p><strong>Total Enrolled:</strong> ${enrollments.length} students</p>
          </div>
          <div class="table-container">
            <table class="table">
              <thead>
                <tr>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Grade Level</th>
                  <th>Enrollment Date</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                ${
                  enrollments.length === 0
                    ? '<tr><td colspan="5" class="text-center">No students enrolled</td></tr>'
                    : enrollments
                        .map(
                          (enrollment) => `
                    <tr>
                      <td>${enrollment.student_id}</td>
                      <td>${enrollment.first_name} ${enrollment.last_name}</td>
                      <td>Grade ${enrollment.grade_level}</td>
                      <td>${new Date(enrollment.enrollment_date).toLocaleDateString()}</td>
                      <td>
                        <button class="btn btn-danger" onclick="subjectManager.unenrollStudent(${enrollment.enrollment_id})" style="padding: 0.5rem;">Remove</button>
                      </td>
                    </tr>
                  `,
                        )
                        .join("")
                }
              </tbody>
            </table>
          </div>
        `

        document.getElementById("enrollmentsModal").classList.add("active")
      } else {
        alert("Error: " + result.message)
      }
    } catch (error) {
      console.error("Error viewing enrollments:", error)
      alert("Error loading enrollments.")
    }
  }

  async enrollStudent() {
    const studentId = document.getElementById("enrollStudent").value
    const subjectId = document.getElementById("enrollSubject").value

    if (!studentId || !subjectId) {
      alert("Please select both a student and a subject.")
      return
    }

    try {
      const formData = new FormData()
      formData.append("student_id", studentId)
      formData.append("subject_id", subjectId)

      const response = await fetch(this.baseURL + "subjects.php?action=enroll", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        alert("Student enrolled successfully!")
        document.getElementById("enrollStudent").value = ""
        document.getElementById("enrollSubject").value = ""
        this.loadSubjects() // Refresh to update enrollment counts
      } else {
        alert("Error: " + result.message)
      }
    } catch (error) {
      console.error("Error enrolling student:", error)
      alert("Error enrolling student. Please try again.")
    }
  }

  async unenrollStudent(enrollmentId) {
    if (!confirm("Are you sure you want to remove this student from the subject?")) {
      return
    }

    try {
      const response = await fetch(this.baseURL + "subjects.php?action=unenroll&id=" + enrollmentId, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        alert("Student removed from subject successfully!")
        // Refresh the enrollments modal
        const modal = document.getElementById("enrollmentsModal")
        if (modal.classList.contains("active")) {
          // Find the subject ID from the current modal and refresh it
          this.loadSubjects()
          modal.classList.remove("active")
        }
      } else {
        alert("Error: " + result.message)
      }
    } catch (error) {
      console.error("Error removing student:", error)
      alert("Error removing student. Please try again.")
    }
  }

  editSubject(id) {
    const subject = this.subjects.find((s) => s.id == id)
    if (!subject) return

    this.currentEditingId = id
    document.getElementById("subjectModalTitle").textContent = "Edit Subject"

    // Fill form with subject data
    document.getElementById("subjectId").value = subject.id
    document.getElementById("subjectCode").value = subject.subject_code
    document.getElementById("subjectName").value = subject.subject_name
    document.getElementById("subjectDescription").value = subject.description || ""
    document.getElementById("subjectCredits").value = subject.credits

    document.getElementById("subjectModal").classList.add("active")
  }

  openAddSubjectModal() {
    this.currentEditingId = null
    document.getElementById("subjectModalTitle").textContent = "Add New Subject"
    document.getElementById("subjectForm").reset()
    document.getElementById("subjectModal").classList.add("active")
  }

  closeSubjectModal() {
    document.getElementById("subjectModal").classList.remove("active")
    document.getElementById("subjectForm").reset()
    this.currentEditingId = null
  }

  closeEnrollmentsModal() {
    document.getElementById("enrollmentsModal").classList.remove("active")
  }
}

// Initialize subject manager
const subjectManager = new SubjectManager()

// Global functions for HTML onclick events
function openAddSubjectModal() {
  subjectManager.openAddSubjectModal()
}

function closeSubjectModal() {
  subjectManager.closeSubjectModal()
}

function closeEnrollmentsModal() {
  subjectManager.closeEnrollmentsModal()
}

function enrollStudent() {
  subjectManager.enrollStudent()
}

// Form submission handler
document.addEventListener("DOMContentLoaded", () => {
  const subjectForm = document.getElementById("subjectForm")
  if (subjectForm) {
    subjectForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const formData = new FormData(subjectForm)
      await subjectManager.saveSubject(formData)
    })
  }
})
