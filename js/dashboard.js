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
        this.loadRecentActivities(result.activities)
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

  loadRecentActivities(activities) {
    const activitiesDiv = document.getElementById("recentActivities")
    if (activities && activities.length > 0) {
      activitiesDiv.innerHTML = `<div class="form-group">` +
        activities.map(a => `<p>• ${a.description} <span style='color:#aaa;font-size:0.9em;'>(${new Date(a.created_at).toLocaleString()})</span></p>`).join('') +
        `</div>`
    } else {
      activitiesDiv.innerHTML = `<div class="form-group"><p>No recent activities.</p></div>`
    }
  }
}

// Initialize dashboard
const dashboard = new Dashboard()
