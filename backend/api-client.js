/* ============================================
   HabitSync API Client
   Frontend helper for backend API calls
   ============================================ */

const API_BASE_URL = 'http://localhost:5000/api';

// ============================================
// API Client Manager
// ============================================
const APIClient = {
  /**
   * Make authenticated API request
   */
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include' // Include cookies for session
    };

    const finalOptions = { ...defaultOptions, ...options };

    try {
      const response = await fetch(url, finalOptions);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'API request failed');
      }

      return await response.json();
    } catch (err) {
      console.error(`API Error (${endpoint}):`, err);
      throw err;
    }
  },

  /**
   * Verify user session with backend
   */
  async verifySession() {
    try {
      const response = await this.request('/auth/verify');
      return response;
    } catch (err) {
      console.error('Session verification failed:', err);
      return { authenticated: false };
    }
  },

  /**
   * Send login to backend (after Firebase auth)
   */
  async loginUser(userId, email) {
    try {
      const response = await this.request('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ userId, email })
      });
      console.log('Backend login successful:', response);
      return response;
    } catch (err) {
      console.error('Backend login failed:', err);
      throw err;
    }
  },

  /**
   * Logout from backend
   */
  async logoutUser() {
    try {
      const response = await this.request('/auth/logout', {
        method: 'POST'
      });
      console.log('Backend logout successful:', response);
      return response;
    } catch (err) {
      console.error('Backend logout failed:', err);
      throw err;
    }
  },

  /**
   * Get user stats from backend
   */
  async getUserStats(userId) {
    try {
      const response = await this.request(`/stats/${userId}`);
      return response;
    } catch (err) {
      console.error('Failed to get stats:', err);
      throw err;
    }
  },

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const response = await this.request('/health');
      return response;
    } catch (err) {
      console.error('Health check failed:', err);
      return { status: 'error' };
    }
  }
};

// ============================================
// Initialize on page load
// ============================================
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Checking backend health...');
  const health = await APIClient.healthCheck();
  console.log('Backend status:', health.status);
});
