// Dashboard functionality
class Dashboard {
  constructor() {
    this.baseURL = "php/"
    this.loadDashboardData()
  }

  async loadDashboardData() {
    try {
      const response = await fetch(this.baseURL + "dashboard.php")
      const result = await response.json()

      if (result.success) {
        this.updateStatistics(result.stats)
        this.loadRecentActivities()
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error)
    }
  }

  updateStatistics(stats) {
    document.getElementById("totalStudents").textContent = stats.total_students || 0
    document.getElementById("totalSubjects").textContent = stats.total_subjects || 0
    document.getElementById("totalEnrollments").textContent = stats.total_enrollments || 0
    document.getElementById("averageGrade").textContent = stats.average_grade || "N/A"
  }

  loadRecentActivities() {
    const activitiesDiv = document.getElementById("recentActivities")
    activitiesDiv.innerHTML = `
      <div class="form-group">
        <p>• New student John Doe added to Grade 10</p>
        <p>• Mathematics marks updated for Grade 11</p>
        <p>• 5 students enrolled in Science subject</p>
        <p>• Grade reports generated for all classes</p>
      </div>
    `
  }
}

// Initialize dashboard
const dashboard = new Dashboard()
