const movieContainer = document.getElementById('movie-container');
const seriesContainer = document.getElementById('series-list');
const genreContainer = document.getElementById('genre-list');
const trendingContainer = document.getElementById('trending-content');

const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageIndicator = document.getElementById('page-indicator');

let currentPage = 1;
const pageSize = 12;

function updatePagination(movieCount) {
  if (pageIndicator) {
    pageIndicator.textContent = `Page ${currentPage}`;
  }
  if (prevBtn) {
    prevBtn.disabled = currentPage === 1;
  }
  if (nextBtn) {
    nextBtn.disabled = movieCount < pageSize;
  }
}

if (prevBtn) {
  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      loadMovies(currentPage);
    }
  });
}

if (nextBtn) {
  nextBtn.addEventListener('click', () => {
    currentPage++;
    loadMovies(currentPage);
  });
}

// Authentication check function
const checkAuthentication = () => {
  const token = localStorage.getItem('token');
  const currentPath = window.location.pathname;
  
  // Pages that require authentication
  const protectedPages = ['/movies.html', '/series.html'];
  
  // If on a protected page and not authenticated, redirect to login
  if (protectedPages.includes(currentPath) && !token) {
    window.location.href = '/login.html';
    return false;
  }
  
  // If on login/register page and already authenticated, redirect to home
  if ((currentPath === '/login.html' || currentPath === '/register.html') && token) {
    window.location.href = '/';
    return false;
  }
  
  return true;
};

// Update UI based on authentication status
const updateUIForAuth = () => {
  const token = localStorage.getItem('token');
  const user = localStorage.getItem('user');
  
  const userControls = document.querySelector('.user-controls');
  
  if (userControls) {
    if (token && user) {
      const userData = JSON.parse(user);
      userControls.innerHTML = `
        <span class="user-welcome">Hoş geldin, ${userData.username}</span>
        <a href="#" data-logout><span class="icon"><i class="fa-solid fa-sign-out-alt"></i></span></a>
      `;
    } else {
      userControls.innerHTML = `
        <a href="/login.html"><span class="icon"><i class="fa-solid fa-sign-in-alt"></i></span></a>
        <a href="/register.html"><span class="icon"><i class="fa-solid fa-user-plus"></i></span></a>
      `;
    }
  }
};

// Logout functionality
const handleLogout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/login.html';
};

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
  // Check authentication first
  if (!checkAuthentication()) {
    return;
  }
  
  // Update UI based on auth status
  updateUIForAuth();
  
  // Add logout event listener
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-logout]')) {
      e.preventDefault();
      handleLogout();
    }
  });
  
  // Validate token on page load if authenticated
  const token = localStorage.getItem('token');
  if (token) {
    fetch('/api/auth/profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
    .then(response => {
      if (!response.ok) {
        // Token is invalid, logout
        handleLogout();
      }
    })
    .catch(() => {
      // Network error, logout
      handleLogout();
    });
  }
});

// Export for use in other scripts
window.authCheck = {
  checkAuthentication,
  updateUIForAuth,
  handleLogout
};
