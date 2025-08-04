// userLists.js - Client-side JavaScript for managing user favorites and watchlist

class UserListManager {
  constructor() {
    this.authToken = localStorage.getItem('authToken');
  }

  async makeRequest(url, method = 'GET', data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.authToken}`
      }
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(url, options);
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Request failed');
      }
      
      return result;
    } catch (error) {
      console.error('Request error:', error);
      throw error;
    }
  }

  async addToFavorites(contentId, contentType) {
    return await this.makeRequest('/api/users/favorites/add', 'POST', {
      contentId,
      contentType
    });
  }

  async removeFromFavorites(contentId, contentType) {
    return await this.makeRequest('/api/users/favorites/remove', 'POST', {
      contentId,
      contentType
    });
  }

  async addToWatchlist(contentId, contentType) {
    return await this.makeRequest('/api/users/watchlist/add', 'POST', {
      contentId,
      contentType
    });
  }

  async removeFromWatchlist(contentId, contentType) {
    return await this.makeRequest('/api/users/watchlist/remove', 'POST', {
      contentId,
      contentType
    });
  }

  async getListsStatus(contentId, contentType) {
    return await this.makeRequest(`/api/users/lists/status/${contentType}/${contentId}`);
  }
}

class FavoriteButton {
  constructor(buttonElement, contentId, contentType) {
    this.button = buttonElement;
    this.contentId = contentId;
    this.contentType = contentType;
    this.listManager = new UserListManager();
    this.inFavorites = false;
    
    this.init();
  }

  async init() {
    try {
      // Check current status
      const response = await this.listManager.getListsStatus(this.contentId, this.contentType);
      this.inFavorites = response.data.inFavorites;
      this.updateButtonState();
      
      // Add click event listener
      this.button.addEventListener('click', () => this.handleClick());
    } catch (error) {
      console.error('Error initializing favorite button:', error);
    }
  }

  updateButtonState() {
    if (this.inFavorites) {
      this.button.textContent = '❤️ Remove from Favorites';
      this.button.classList.add('in-favorites');
      this.button.classList.remove('btn-secondary');
    } else {
      this.button.textContent = '🤍 Add to Favorites';
      this.button.classList.remove('in-favorites');
      this.button.classList.add('btn-secondary');
    }
  }

  async handleClick() {
    try {
      this.button.disabled = true;
      this.button.textContent = 'Loading...';

      if (this.inFavorites) {
        await this.listManager.removeFromFavorites(this.contentId, this.contentType);
        this.inFavorites = false;
      } else {
        await this.listManager.addToFavorites(this.contentId, this.contentType);
        this.inFavorites = true;
      }

      this.updateButtonState();
    } catch (error) {
      console.error('Error handling favorite button click:', error);
      alert('Failed to update favorites. Please try again.');
      this.updateButtonState();
    } finally {
      this.button.disabled = false;
    }
  }
}

class WatchlistButton {
  constructor(buttonElement, contentId, contentType) {
    this.button = buttonElement;
    this.contentId = contentId;
    this.contentType = contentType;
    this.listManager = new UserListManager();
    this.inWatchlist = false;
    
    this.init();
  }

  async init() {
    try {
      // Check current status
      const response = await this.listManager.getListsStatus(this.contentId, this.contentType);
      this.inWatchlist = response.data.inWatchlist;
      this.updateButtonState();
      
      // Add click event listener
      this.button.addEventListener('click', () => this.handleClick());
    } catch (error) {
      console.error('Error initializing watchlist button:', error);
    }
  }

  updateButtonState() {
    if (this.inWatchlist) {
      this.button.textContent = '✓ Remove from My List';
      this.button.classList.add('in-watchlist');
      this.button.classList.remove('btn-secondary');
    } else {
      this.button.textContent = '+ My List';
      this.button.classList.remove('in-watchlist');
      this.button.classList.add('btn-secondary');
    }
  }

  async handleClick() {
    try {
      this.button.disabled = true;
      this.button.textContent = 'Loading...';

      if (this.inWatchlist) {
        await this.listManager.removeFromWatchlist(this.contentId, this.contentType);
        this.inWatchlist = false;
      } else {
        await this.listManager.addToWatchlist(this.contentId, this.contentType);
        this.inWatchlist = true;
      }

      this.updateButtonState();
    } catch (error) {
      console.error('Error handling watchlist button click:', error);
      alert('Failed to update watchlist. Please try again.');
      this.updateButtonState();
    } finally {
      this.button.disabled = false;
    }
  }
}

// API class for the My Lists page
class UserListsAPI {
  constructor() {
    this.listManager = new UserListManager();
  }

  static isAuthenticated() {
    return !!localStorage.getItem('authToken');
  }

  static showNotification(message, type = 'success') {
    // Simple notification system
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 12px 24px;
      border-radius: 4px;
      color: white;
      font-weight: 500;
      z-index: 10000;
      transform: translateX(400px);
      transition: transform 0.3s ease;
      ${type === 'success' ? 'background: #4CAF50;' : 'background: #e50914;'}
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.transform = 'translateX(400px)';
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 300);
    }, 3000);
  }

  async getUserLists() {
    try {
      const [favoritesResponse, watchlistResponse] = await Promise.all([
        this.listManager.makeRequest('/api/users/favorites'),
        this.listManager.makeRequest('/api/users/watchlist')
      ]);

      return {
        success: true,
        data: {
          favorites: favoritesResponse.data,
          watchlist: watchlistResponse.data
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  async addToFavorites(contentId, contentType) {
    try {
      const response = await this.listManager.addToFavorites(contentId, contentType);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async removeFromFavorites(contentId, contentType) {
    try {
      const response = await this.listManager.removeFromFavorites(contentId, contentType);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async addToWatchlist(contentId, contentType) {
    try {
      const response = await this.listManager.addToWatchlist(contentId, contentType);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  async removeFromWatchlist(contentId, contentType) {
    try {
      const response = await this.listManager.removeFromWatchlist(contentId, contentType);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }
}

// Utility functions for other parts of the application
const UserLists = {
  async getFavorites() {
    const listManager = new UserListManager();
    return await listManager.makeRequest('/api/users/favorites');
  },

  async getWatchlist() {
    const listManager = new UserListManager();
    return await listManager.makeRequest('/api/users/watchlist');
  },

  async isInFavorites(contentId, contentType) {
    const listManager = new UserListManager();
    const response = await listManager.getListsStatus(contentId, contentType);
    return response.data.inFavorites;
  },

  async isInWatchlist(contentId, contentType) {
    const listManager = new UserListManager();
    const response = await listManager.getListsStatus(contentId, contentType);
    return response.data.inWatchlist;
  }
};

// Make classes available globally
window.FavoriteButton = FavoriteButton;
window.WatchlistButton = WatchlistButton;
window.UserLists = UserLists;
window.UserListsAPI = UserListsAPI;