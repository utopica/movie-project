// Authentication utility functions for use across the application

class AuthManager {
  constructor() {
    this.baseURL = '/api';
    this.token = localStorage.getItem('token');
    this.user = this.getUserFromStorage();
  }

  getUserFromStorage() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  setUser(user) {
    this.user = user;
    localStorage.setItem('user', JSON.stringify(user));
  }

  getToken() {
    return this.token;
  }

  getUser() {
    return this.user;
  }

  isAuthenticated() {
    return !!this.token;
  }

  logout() {
    this.token = null;
    this.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
  }

  // Make authenticated API requests
  async authenticatedRequest(url, options = {}) {
    if (!this.token) {
      throw new Error('No authentication token');
    }

    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`
      }
    };

    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (response.status === 401) {
      // Token expired or invalid
      this.logout();
      return null;
    }

    return response;
  }

  // Get user profile
  async getProfile() {
    try {
      const response = await this.authenticatedRequest(`${this.baseURL}/auth/profile`);
      if (response && response.ok) {
        const data = await response.json();
        if (data.success) {
          this.setUser(data.user);
          return data.user;
        }
      }
      return null;
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  // Check if token is still valid
  async validateToken() {
    try {
      const response = await this.authenticatedRequest(`${this.baseURL}/auth/profile`);
      return response && response.ok;
    } catch (error) {
      return false;
    }
  }
}

// Create global auth manager instance
window.authManager = new AuthManager();

// Auto-check authentication status on page load
document.addEventListener('DOMContentLoaded', async () => {
  if (window.authManager.isAuthenticated()) {
    // Validate token on page load
    const isValid = await window.authManager.validateToken();
    if (!isValid) {
      window.authManager.logout();
    }
  }
});

// Add logout functionality to any element with data-logout attribute
document.addEventListener('click', (e) => {
  if (e.target.hasAttribute('data-logout')) {
    e.preventDefault();
    window.authManager.logout();
  }
}); 