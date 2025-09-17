// Authentication and session management
class AuthManager {
  constructor() {
    this.baseURL = "php/"
    this.checkAuthOnLoad()
  }

  checkAuthOnLoad() {
    // Check if user is authenticated when page loads
    const currentPage = window.location.pathname.split("/").pop()
    const isLoginPage = currentPage === "index.html" || currentPage === ""

    if (!isLoginPage) {
      this.checkSession()
    }
  }

  async login(username, password) {
    try {
      const formData = new FormData()
      formData.append("username", username)
      formData.append("password", password)

      const response = await fetch(this.baseURL + "auth.php", {
        method: "POST",
        body: formData,
      })

      const result = await response.json()

      if (result.success) {
        localStorage.setItem("teacher_session", JSON.stringify(result.teacher))
        window.location.href = "dashboard.html"
        return { success: true }
      } else {
        return { success: false, message: result.message }
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, message: "Connection error. Please try again." }
    }
  }

  async checkSession() {
    const session = localStorage.getItem("teacher_session")
    if (!session) {
      window.location.href = "index.html"
      return false
    }

    try {
      const response = await fetch(this.baseURL + "check_session.php")
      const result = await response.json()

      if (!result.valid) {
        this.logout()
        return false
      }
      return true
    } catch (error) {
      console.error("Session check error:", error)
      this.logout()
      return false
    }
  }

  logout() {
    localStorage.removeItem("teacher_session")
    window.location.href = "index.html"
  }

  getTeacherInfo() {
    const session = localStorage.getItem("teacher_session")
    return session ? JSON.parse(session) : null
  }
}

// Initialize auth manager
const authManager = new AuthManager()

// Login form handler
document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("loginForm")
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault()

      const username = document.getElementById("username").value
      const password = document.getElementById("password").value
      const messageDiv = document.getElementById("loginMessage")

      // Show loading state
      const submitBtn = loginForm.querySelector('button[type="submit"]')
      const originalText = submitBtn.textContent
      submitBtn.textContent = "Logging in..."
      submitBtn.disabled = true

      const result = await authManager.login(username, password)

      if (!result.success) {
        messageDiv.textContent = result.message
        messageDiv.style.display = "block"

        // Reset button
        submitBtn.textContent = originalText
        submitBtn.disabled = false
      }
    })
  }
})

// Global logout function
function logout() {
  authManager.logout()
}
