// Analytics Dashboard JavaScript
class AnalyticsManager {
  constructor() {
    this.baseURL = "php/"
    this.rankings = []
    this.subjectAnalysis = []
    this.classPerformance = []
    this.loadAnalyticsData()
  }

  async loadAnalyticsData() {
    await this.loadOverallStats()
    await this.loadRankings()
    await this.loadSubjectAnalysis()
    await this.loadGradeDistribution()
    await this.loadClassPerformance()
    await this.loadInsights()
  }

  async loadOverallStats() {
    try {
      const response = await fetch(this.baseURL + "analytics.php?action=overall_stats")
      const result = await response.json()

      if (result.success) {
        const stats = result.stats
        document.getElementById("totalStudentsAnalytics").textContent = stats.total_students || 0
        document.getElementById("totalSubjectsAnalytics").textContent = stats.total_subjects || 0
        document.getElementById("overallAverage").textContent = stats.overall_average
          ? Number.parseFloat(stats.overall_average).toFixed(1)
          : "N/A"
        document.getElementById("topPerformers").textContent = stats.a_grade_students || 0
      }
    } catch (error) {
      console.error("Error loading overall stats:", error)
    }
  }

  async loadRankings() {
    try {
      const response = await fetch(this.baseURL + "analytics.php?action=rankings")
      const result = await response.json()

      if (result.success) {
        this.rankings = result.rankings
        this.renderRankings()
      }
    } catch (error) {
      console.error("Error loading rankings:", error)
    }
  }

  async loadSubjectAnalysis() {
    try {
      const response = await fetch(this.baseURL + "analytics.php?action=subject_analysis")
      const result = await response.json()

      if (result.success) {
        this.subjectAnalysis = result.analysis
        this.renderSubjectAnalysis()
      }
    } catch (error) {
      console.error("Error loading subject analysis:", error)
    }
  }

  async loadGradeDistribution() {
    try {
      const response = await fetch(this.baseURL + "analytics.php?action=grade_distribution")
      const result = await response.json()

      if (result.success) {
        const dist = result.distribution
        document.getElementById("gradeACount").textContent = dist.A || 0
        document.getElementById("gradeBCount").textContent = dist.B || 0
        document.getElementById("gradeSCount").textContent = dist.S || 0
        document.getElementById("gradeFCount").textContent = dist.F || 0
      }
    } catch (error) {
      console.error("Error loading grade distribution:", error)
    }
  }

  async loadClassPerformance() {
    try {
      const response = await fetch(this.baseURL + "analytics.php?action=class_performance")
      const result = await response.json()

      if (result.success) {
        this.classPerformance = result.performance
        this.renderClassPerformance()
      }
    } catch (error) {
      console.error("Error loading class performance:", error)
    }
  }

  async loadInsights() {
    try {
      const response = await fetch(this.baseURL + "analytics.php?action=insights")
      const result = await response.json()

      if (result.success) {
        this.renderInsights(result.insights)
      }
    } catch (error) {
      console.error("Error loading insights:", error)
    }
  }

  renderRankings() {
    const tbody = document.getElementById("rankingsTableBody")

    if (this.rankings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No ranking data available</td></tr>'
      return
    }

    tbody.innerHTML = this.rankings
      .map(
        (student, index) => `
        <tr>
          <td><strong>${index + 1}</strong></td>
          <td>${student.student_name}</td>
          <td>Grade ${student.grade_level}</td>
          <td>${student.total_marks ? Number.parseFloat(student.total_marks).toFixed(1) : "N/A"}</td>
          <td>${student.average_marks ? Number.parseFloat(student.average_marks).toFixed(2) : "N/A"}</td>
          <td><span class="grade-${student.overall_grade ? student.overall_grade.toLowerCase() : "f"}">${student.overall_grade || "N/A"}</span></td>
          <td>${student.subject_count}</td>
        </tr>
      `,
      )
      .join("")
  }

  renderSubjectAnalysis() {
    const tbody = document.getElementById("subjectAnalysisBody")

    if (this.subjectAnalysis.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No subject analysis available</td></tr>'
      return
    }

    tbody.innerHTML = this.subjectAnalysis
      .map(
        (subject) => `
        <tr>
          <td>${subject.subject_name}</td>
          <td>${subject.student_count}</td>
          <td>${subject.average_marks ? Number.parseFloat(subject.average_marks).toFixed(2) : "N/A"}</td>
          <td>${subject.highest_mark || "N/A"}</td>
          <td>${subject.lowest_mark || "N/A"}</td>
          <td>${subject.a_grades || 0}</td>
          <td>${subject.pass_rate ? Number.parseFloat(subject.pass_rate).toFixed(1) + "%" : "N/A"}</td>
        </tr>
      `,
      )
      .join("")
  }

  renderClassPerformance() {
    const tbody = document.getElementById("classPerformanceBody")

    if (this.classPerformance.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center">No class performance data available</td></tr>'
      return
    }

    tbody.innerHTML = this.classPerformance
      .map(
        (grade) => `
        <tr>
          <td>Grade ${grade.grade_level}</td>
          <td>${grade.student_count}</td>
          <td>${grade.class_average ? Number.parseFloat(grade.class_average).toFixed(2) : "N/A"}</td>
          <td>${grade.highest_average ? Number.parseFloat(grade.highest_average).toFixed(2) : "N/A"}</td>
          <td>${grade.lowest_average ? Number.parseFloat(grade.lowest_average).toFixed(2) : "N/A"}</td>
          <td>${grade.top_student || "N/A"}</td>
        </tr>
      `,
      )
      .join("")
  }

  renderInsights(insights) {
    const list = document.getElementById("insightsList")

    if (!insights || insights.length === 0) {
      list.innerHTML = "<li>No insights available at this time.</li>"
      return
    }

    list.innerHTML = insights.map((insight) => `<li>${insight}</li>`).join("")
  }

  filterRankings() {
    const gradeFilter = document.getElementById("gradeFilter").value
    let filteredRankings = this.rankings

    if (gradeFilter) {
      filteredRankings = this.rankings.filter((student) => student.grade_level == gradeFilter)
    }

    const tbody = document.getElementById("rankingsTableBody")

    if (filteredRankings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="7" class="text-center">No students found for selected grade level</td></tr>'
      return
    }

    tbody.innerHTML = filteredRankings
      .map(
        (student, index) => `
        <tr>
          <td><strong>${index + 1}</strong></td>
          <td>${student.student_name}</td>
          <td>Grade ${student.grade_level}</td>
          <td>${student.total_marks ? Number.parseFloat(student.total_marks).toFixed(1) : "N/A"}</td>
          <td>${student.average_marks ? Number.parseFloat(student.average_marks).toFixed(2) : "N/A"}</td>
          <td><span class="grade-${student.overall_grade ? student.overall_grade.toLowerCase() : "f"}">${student.overall_grade || "N/A"}</span></td>
          <td>${student.subject_count}</td>
        </tr>
      `,
      )
      .join("")
  }
}

// Initialize analytics manager
const analyticsManager = new AnalyticsManager()

// Global functions
function filterRankings() {
  analyticsManager.filterRankings()
}
