// Student Management JavaScript
class StudentManager {
  constructor() {
    this.baseURL = "php/"
    this.students = []
    this.currentEditingId = null
    this.loadStudents()
  }

  async loadStudents() {
    try {
      const response = await fetch(this.baseURL + "students.php")
      const result = await response.json()

      if (result.success) {
        this.students = result.students
        this.renderStudentsTable()
      } else {
        console.error("Failed to load students:", result.message)
      }
    } catch (error) {
      console.error("Error loading students:", error)
    }
  }

  renderStudentsTable() {
    const tbody = document.getElementById("studentsTableBody")

    if (this.students.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No students found</td></tr>'
      return
    }

    tbody.innerHTML = this.students
      .map(
        (student) => `
        <tr>
          <td>${student.student_id}</td>
          <td>${student.first_name} ${student.last_name}</td>
          <td>${student.email || "N/A"}</td>
          <td>${student.phone || "N/A"}</td>
          <td>Grade ${student.grade_level}</td>
          <td>
            <div class="flex gap-1">
              <button class="btn btn-secondary" onclick="studentManager.viewStudent(${student.id})" style="padding: 0.5rem;">View</button>
              <button class="btn btn-primary" onclick="studentManager.editStudent(${student.id})" style="padding: 0.5rem;">Edit</button>
              <button class="btn btn-danger" onclick="studentManager.deleteStudent(${student.id})" style="padding: 0.5rem;">Delete</button>
            </div>
          </td>
        </tr>
      `,
      )
      .join("")
  }

  async saveStudent(formData) {
    try {
      const url = this.currentEditingId
        ? this.baseURL + "students.php?action=update&id=" + this.currentEditingId
        : this.baseURL + "students.php?action=create"

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        this.loadStudents()
        this.closeStudentModal()
        alert(this.currentEditingId ? "Student updated successfully!" : "Student added successfully!")
      } else {
        alert("Error: " + result.message)
      }
    } catch (error) {
      console.error("Error saving student:", error)
      alert("Error saving student. Please try again.")
    }
  }

  async deleteStudent(id) {
    if (!confirm("Are you sure you want to delete this student?")) {
      return
    }

    try {
      const response = await fetch(this.baseURL + "students.php?action=delete&id=" + id, {
        method: "DELETE",
      })

      const result = await response.json()

      if (result.success) {
        this.loadStudents()
        alert("Student deleted successfully!")
      } else {
        alert("Error: " + result.message)
      }
    } catch (error) {
      console.error("Error deleting student:", error)
      alert("Error deleting student. Please try again.")
    }
  }

  async viewStudent(id) {
    try {
      const response = await fetch(this.baseURL + "students.php?action=view&id=" + id)
      const result = await response.json()

      if (result.success) {
        const student = result.student
        const detailsContent = document.getElementById("studentDetailsContent")

        detailsContent.innerHTML = `
          <div class="form-group">
            <strong>Student ID:</strong> ${student.student_id}
          </div>
          <div class="form-group">
            <strong>Full Name:</strong> ${student.first_name} ${student.last_name}
          </div>
          <div class="form-group">
            <strong>Email:</strong> ${student.email || "N/A"}
          </div>
          <div class="form-group">
            <strong>Phone:</strong> ${student.phone || "N/A"}
          </div>
          <div class="form-group">
            <strong>Address:</strong> ${student.address || "N/A"}
          </div>
          <div class="form-group">
            <strong>Date of Birth:</strong> ${student.date_of_birth || "N/A"}
          </div>
          <div class="form-group">
            <strong>Grade Level:</strong> Grade ${student.grade_level}
          </div>
          <div class="form-group">
            <strong>Enrolled Subjects:</strong> ${result.subjects ? result.subjects.join(", ") : "None"}
          </div>
        `

        document.getElementById("studentDetailsModal").classList.add("active")
      } else {
        alert("Error: " + result.message)
      }
    } catch (error) {
      console.error("Error viewing student:", error)
      alert("Error loading student details.")
    }
  }

  editStudent(id) {
    const student = this.students.find((s) => s.id == id)
    if (!student) return

    this.currentEditingId = id
    document.getElementById("modalTitle").textContent = "Edit Student"

    // Fill form with student data
    document.getElementById("studentId").value = student.id
    document.getElementById("studentIdInput").value = student.student_id
    document.getElementById("firstName").value = student.first_name
    document.getElementById("lastName").value = student.last_name
    document.getElementById("email").value = student.email || ""
    document.getElementById("phone").value = student.phone || ""
    document.getElementById("address").value = student.address || ""
    document.getElementById("dateOfBirth").value = student.date_of_birth || ""
    document.getElementById("gradeLevel").value = student.grade_level

    document.getElementById("studentModal").classList.add("active")
  }

  openAddStudentModal() {
    this.currentEditingId = null
    document.getElementById("modalTitle").textContent = "Add New Student"
    document.getElementById("studentForm").reset()
    document.getElementById("studentModal").classList.add("active")
  }

  closeStudentModal() {
    document.getElementById("studentModal").classList.remove("active")
    document.getElementById("studentForm").reset()
    this.currentEditingId = null
  }

  closeStudentDetailsModal() {
    document.getElementById("studentDetailsModal").classList.remove("active")
  }

  searchStudents() {
    const searchTerm = document.getElementById("searchInput").value.toLowerCase()
    const filteredStudents = this.students.filter(
      (student) =>
        student.student_id.toLowerCase().includes(searchTerm) ||
        student.first_name.toLowerCase().includes(searchTerm) ||
        student.last_name.toLowerCase().includes(searchTerm) ||
        (student.email && student.email.toLowerCase().includes(searchTerm)),
    )

    const tbody = document.getElementById("studentsTableBody")

    if (filteredStudents.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No students found matching your search</td></tr>'
      return
    }

    tbody.innerHTML = filteredStudents
      .map(
        (student) => `
        <tr>
          <td>${student.student_id}</td>
          <td>${student.first_name} ${student.last_name}</td>
          <td>${student.email || "N/A"}</td>
          <td>${student.phone || "N/A"}</td>
          <td>Grade ${student.grade_level}</td>
          <td>
            <div class="flex gap-1">
              <button class="btn btn-secondary" onclick="studentManager.viewStudent(${student.id})" style="padding: 0.5rem;">View</button>
              <button class="btn btn-primary" onclick="studentManager.editStudent(${student.id})" style="padding: 0.5rem;">Edit</button>
              <button class="btn btn-danger" onclick="studentManager.deleteStudent(${student.id})" style="padding: 0.5rem;">Delete</button>
            </div>
          </td>
        </tr>
      `,
      )
      .join("")
  }
}

// Initialize student manager
const studentManager = new StudentManager()

// Global functions for HTML onclick events
function openAddStudentModal() {
  studentManager.openAddStudentModal()
}

function closeStudentModal() {
  studentManager.closeStudentModal()
}

function closeStudentDetailsModal() {
  studentManager.closeStudentDetailsModal()
}

function searchStudents() {
  studentManager.searchStudents()
}

// Form submission handler
document.addEventListener("DOMContentLoaded", () => {
  const studentForm = document.getElementById("studentForm")
  if (studentForm) {
    studentForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const formData = new FormData(studentForm)
      await studentManager.saveStudent(formData)
    })
  }
})
