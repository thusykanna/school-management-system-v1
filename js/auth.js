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

// Global logout function with custom modal confirmation
function logout() {
  // If modal already exists, don't create another
  if (document.getElementById('logoutModal')) return;

  // Blur background
  document.body.classList.add('modal-blur');

  // Create modal overlay
  const overlay = document.createElement('div');
  overlay.id = 'logoutModal';
  overlay.style.position = 'fixed';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.35)';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';
  overlay.style.zIndex = 9999;

  // Modal box
  const modal = document.createElement('div');
  modal.style.background = 'var(--white)';
  modal.style.padding = '2rem 2.5rem';
  modal.style.borderRadius = '14px';
  modal.style.boxShadow = '0 8px 32px rgba(0,0,0,0.25)';
  modal.style.textAlign = 'center';
  modal.style.maxWidth = '90vw';
  modal.style.minWidth = '280px';

  const msg = document.createElement('div');
  msg.textContent = 'Are you sure you want to logout?';
  msg.style.fontSize = '1.15rem';
  msg.style.marginBottom = '2rem';
  msg.style.color = 'rgba(0, 0, 0, 1)';
  modal.appendChild(msg);

  // Buttons
  const btnYes = document.createElement('button');
  btnYes.textContent = 'Logout';
  btnYes.className = 'btn btn-danger';
  btnYes.style.marginRight = '1rem';
  btnYes.onclick = function() {
    overlay.remove();
    document.body.classList.remove('modal-blur');
    authManager.logout();
  };

  const btnNo = document.createElement('button');
  btnNo.textContent = 'Cancel';
  btnNo.className = 'btn btn-secondary';
  btnNo.onclick = function() {
    overlay.remove();
    document.body.classList.remove('modal-blur');
  };

  modal.appendChild(btnYes);
  modal.appendChild(btnNo);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}
