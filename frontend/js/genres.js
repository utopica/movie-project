// genres.js - Genre Management
class GenreManager {
    constructor() {
        this.currentPage = 0;
        this.genresPerPage = 5;
        this.genres = [];
        this.init();
    }

    async init() {
        await this.loadGenres();
        this.setupEventListeners();
        this.renderGenres();
    }

    async loadGenres() {
        try {
            const response = await fetch('/api/genres/items');
            if (!response.ok) throw new Error('Failed to load genres');
            this.genres = await response.json();
        } catch (error) {
            console.error('Error loading genres:', error);
            this.showError('Failed to load genres');
        }
    }

    setupEventListeners() {
        const prevBtn = document.getElementById('genrePrevBtn');
        const nextBtn = document.getElementById('genreNextBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousPage());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextPage());
        }
    }

    renderGenres() {
        const grid = document.getElementById('genreGrid');
        if (!grid) return;

        if (this.genres.length === 0) {
            grid.innerHTML = '<div class="loading-placeholder">No genres available</div>';
            return;
        }

        const startIndex = this.currentPage * this.genresPerPage;
        const endIndex = startIndex + this.genresPerPage;
        const currentGenres = this.genres.slice(startIndex, endIndex);

        grid.innerHTML = currentGenres.map(genre => this.createGenreCard(genre)).join('');
        this.updateNavigation();
        this.addGenreEventListeners();
    }

    createGenreCard(genre) {
        // Get sample movies for preview (first 4 if available)
        const previewMovies = genre.sampleMovies?.slice(0, 4) || [];
        const imgBase = 'https://image.tmdb.org/t/p/w200/';
        return `
            <div class="genre-card" data-genre-id="${genre._id}" data-genre-name="${genre.name}">
                <div class="genre-preview">
                    ${previewMovies.map(movie => `
                        <img src="${movie.posterPath ? imgBase + movie.posterPath : 'https://via.placeholder.com/200x300?text=No+Image'}" 
                             alt="${movie.title}" 
                             onerror="this.src='/../images/header_logo.png'" />
                    `).join('')}
                    ${Array(4 - previewMovies.length).fill().map(() => `
                        <div style="background: linear-gradient(45deg, #333, #555);"></div>
                    `).join('')}
                </div>
                <div class="genre-card-content">
                    <h3>${genre.name}</h3>
                    <div class="genre-arrow">
                        <i class="fas fa-arrow-right"></i>
                    </div>
                </div>
            </div>
        `;
    }

    addGenreEventListeners() {
        const genreCards = document.querySelectorAll('.genre-card');
        genreCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const genreId = e.currentTarget.dataset.genreId;
                const genreName = e.currentTarget.dataset.genreName;
                this.navigateToGenre(genreId, genreName);
            });
        });
    }

    navigateToGenre(genreId, genreName) {
    // Detay sayfasına yönlendir (genreId route parametresi, name query parametresi)
    const url = `/genres_details.html?genre=${genreId}&name=${encodeURIComponent(genreName)}`;
    window.location.href = url;
    }

    updateNavigation() {
        const prevBtn = document.getElementById('genrePrevBtn');
        const nextBtn = document.getElementById('genreNextBtn');
        const navDots = document.getElementById('genreNavDots');

        const totalPages = Math.ceil(this.genres.length / this.genresPerPage);

        // Update buttons
        if (prevBtn) {
            prevBtn.disabled = this.currentPage === 0;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= totalPages - 1;
        }

        // Update dots
        if (navDots) {
            navDots.innerHTML = Array(totalPages).fill().map((_, index) => `
                <div class="nav-dot ${index === this.currentPage ? 'active' : ''}" 
                     data-page="${index}"></div>
            `).join('');

            // Add dot click events
            navDots.querySelectorAll('.nav-dot').forEach(dot => {
                dot.addEventListener('click', (e) => {
                    this.currentPage = parseInt(e.target.dataset.page);
                    this.renderGenres();
                });
            });
        }
    }

    previousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
            this.renderGenres();
        }
    }

    nextPage() {
        const totalPages = Math.ceil(this.genres.length / this.genresPerPage);
        if (this.currentPage < totalPages - 1) {
            this.currentPage++;
            this.renderGenres();
        }
    }

    showError(message) {
        const grid = document.getElementById('genreGrid');
        if (grid) {
            grid.innerHTML = `<div class="loading-placeholder error">${message}</div>`;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new GenreManager();
});