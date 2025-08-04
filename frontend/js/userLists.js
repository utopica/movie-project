// Favorites and Watchlist API utilities
class UserListsAPI {
  static getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Check if user is authenticated
  static isAuthenticated() {
    return !!localStorage.getItem('token');
  }

  // Add to favorites
  static async addToFavorites(itemId, type) {
    if (!this.isAuthenticated()) {
      throw new Error('Giriş yapmanız gerekiyor');
    }

    const response = await fetch('/api/users/favorites/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({ itemId, type })
    });

    return await response.json();
  }

  // Remove from favorites
  static async removeFromFavorites(itemId, type) {
    if (!this.isAuthenticated()) {
      throw new Error('Giriş yapmanız gerekiyor');
    }

    const response = await fetch('/api/users/favorites/remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({ itemId, type })
    });

    return await response.json();
  }

  // Add to watchlist
  static async addToWatchlist(itemId, type) {
    if (!this.isAuthenticated()) {
      throw new Error('Giriş yapmanız gerekiyor');
    }

    const response = await fetch('/api/users/watchlist/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({ itemId, type })
    });

    return await response.json();
  }

  // Remove from watchlist
  static async removeFromWatchlist(itemId, type) {
    if (!this.isAuthenticated()) {
      throw new Error('Giriş yapmanız gerekiyor');
    }

    const response = await fetch('/api/users/watchlist/remove', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeaders()
      },
      body: JSON.stringify({ itemId, type })
    });

    return await response.json();
  }

  // Check item status (in favorites/watchlist)
  static async checkItemStatus(itemId, type) {
    if (!this.isAuthenticated()) {
      return { inFavorites: false, inWatchlist: false };
    }

    try {
      const response = await fetch(`/api/users/check-status/${type}/${itemId}`, {
        headers: this.getAuthHeaders()
      });

      if (response.ok) {
        const result = await response.json();
        return result.data;
      }
    } catch (error) {
      console.error('Error checking item status:', error);
    }

    return { inFavorites: false, inWatchlist: false };
  }

  // Get user's lists
  static async getUserLists() {
    if (!this.isAuthenticated()) {
      throw new Error('Giriş yapmanız gerekiyor');
    }

    const response = await fetch('/api/users/my-lists', {
      headers: this.getAuthHeaders()
    });

    return await response.json();
  }

  // Show notification
  static showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Add styles
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : '#f44336'};
      color: white;
      padding: 12px 24px;
      border-radius: 4px;
      z-index: 10000;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
      transform: translateX(100%);
      transition: transform 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Animate in
    setTimeout(() => {
      notification.style.transform = 'translateX(0)';
    }, 100);

    // Remove after delay
    setTimeout(() => {
      notification.style.transform = 'translateX(100%)';
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 3000);
  }
}

// Button state management
class FavoriteButton {
  constructor(buttonElement, itemId, type) {
    this.button = buttonElement;
    this.itemId = itemId;
    this.type = type;
    this.isInFavorites = false;
    this.isLoading = false;

    this.init();
  }

  async init() {
    await this.updateStatus();
    this.attachEventListener();
  }

  async updateStatus() {
    try {
      const status = await UserListsAPI.checkItemStatus(this.itemId, this.type);
      this.isInFavorites = status.inFavorites;
      this.updateUI();
    } catch (error) {
      console.error('Error updating favorite status:', error);
    }
  }

  updateUI() {
    if (this.isInFavorites) {
      this.button.innerHTML = '❤️ Favorilerde';
      this.button.classList.add('in-favorites');
    } else {
      this.button.innerHTML = '🤍 Favorilere Ekle';
      this.button.classList.remove('in-favorites');
    }

    this.button.disabled = this.isLoading;
  }

  attachEventListener() {
    this.button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!UserListsAPI.isAuthenticated()) {
        UserListsAPI.showNotification('Giriş yapmanız gerekiyor', 'error');
        return;
      }

      if (this.isLoading) return;

      this.isLoading = true;
      this.button.disabled = true;

      try {
        if (this.isInFavorites) {
          const result = await UserListsAPI.removeFromFavorites(this.itemId, this.type);
          if (result.success) {
            this.isInFavorites = false;
            UserListsAPI.showNotification('Favorilerden çıkarıldı');
          } else {
            throw new Error(result.message || 'Bir hata oluştu');
          }
        } else {
          const result = await UserListsAPI.addToFavorites(this.itemId, this.type);
          if (result.success) {
            this.isInFavorites = true;
            UserListsAPI.showNotification('Favorilere eklendi');
          } else {
            throw new Error(result.message || 'Bir hata oluştu');
          }
        }

        this.updateUI();
      } catch (error) {
        console.error('Error toggling favorite:', error);
        UserListsAPI.showNotification(error.message, 'error');
      } finally {
        this.isLoading = false;
        this.updateUI();
      }
    });
  }
}

class WatchlistButton {
  constructor(buttonElement, itemId, type) {
    this.button = buttonElement;
    this.itemId = itemId;
    this.type = type;
    this.isInWatchlist = false;
    this.isLoading = false;

    this.init();
  }

  async init() {
    await this.updateStatus();
    this.attachEventListener();
  }

  async updateStatus() {
    try {
      const status = await UserListsAPI.checkItemStatus(this.itemId, this.type);
      this.isInWatchlist = status.inWatchlist;
      this.updateUI();
    } catch (error) {
      console.error('Error updating watchlist status:', error);
    }
  }

  updateUI() {
    if (this.isInWatchlist) {
      this.button.innerHTML = '✓ Listemde';
      this.button.classList.add('in-watchlist');
    } else {
      this.button.innerHTML = '+ Listeme Ekle';
      this.button.classList.remove('in-watchlist');
    }

    this.button.disabled = this.isLoading;
  }

  attachEventListener() {
    this.button.addEventListener('click', async (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (!UserListsAPI.isAuthenticated()) {
        UserListsAPI.showNotification('Giriş yapmanız gerekiyor', 'error');
        return;
      }

      if (this.isLoading) return;

      this.isLoading = true;
      this.button.disabled = true;

      try {
        if (this.isInWatchlist) {
          const result = await UserListsAPI.removeFromWatchlist(this.itemId, this.type);
          if (result.success) {
            this.isInWatchlist = false;
            UserListsAPI.showNotification('Listeden çıkarıldı');
          } else {
            throw new Error(result.message || 'Bir hata oluştu');
          }
        } else {
          const result = await UserListsAPI.addToWatchlist(this.itemId, this.type);
          if (result.success) {
            this.isInWatchlist = true;
            UserListsAPI.showNotification('Listenize eklendi');
          } else {
            throw new Error(result.message || 'Bir hata oluştu');
          }
        }

        this.updateUI();
      } catch (error) {
        console.error('Error toggling watchlist:', error);
        UserListsAPI.showNotification(error.message, 'error');
      } finally {
        this.isLoading = false;
        this.updateUI();
      }
    });
  }
}

// Global function for backward compatibility
function addToWatchlist(itemId, type = 'movie') {
  if (!UserListsAPI.isAuthenticated()) {
    UserListsAPI.showNotification('Giriş yapmanız gerekiyor', 'error');
    return;
  }

  UserListsAPI.addToWatchlist(itemId, type)
    .then(result => {
      if (result.success) {
        UserListsAPI.showNotification('İzleme listesine eklendi');
      } else {
        UserListsAPI.showNotification(result.message || 'Bir hata oluştu', 'error');
      }
    })
    .catch(error => {
      console.error('Error adding to watchlist:', error);
      UserListsAPI.showNotification(error.message, 'error');
    });
}
