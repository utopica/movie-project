// movies.js - Movie Management
class MovieManager {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.moviesPerPage = 12;
        this.currentFilter = 'popular';
        this.currentCategory = 'all';
        this.currentSort = 'latest';
        this.movies = [];
        this.loading = false;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadMovies();
    }

    setupEventListeners() {
        // Tab buttons
        const tabButtons = document.querySelectorAll('#movies-section .tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.changeFilter(filter);
            });
        });

        // Category filters
        const filterButtons = document.querySelectorAll('#movies-section .filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.changeCategory(category);
            });
        });

        // Sort dropdown
        const sortSelect = document.getElementById('movieSortBy');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.currentPage = 1;
                this.loadMovies();
            });
        }

        // Pagination buttons
        const prevBtn = document.getElementById('moviePrevBtn');
        const nextBtn = document.getElementById('movieNextBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousPage());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextPage());
        }
    }

    async loadMovies() {
        if (this.loading) return;
        
        this.loading = true;
        this.showLoading();

        try {

            const params = new URLSearchParams();

params.set('page', this.currentPage);
params.set('limit', this.moviesPerPage);

if (this.currentFilter) params.set('filter', this.currentFilter);
if (this.currentCategory && this.currentCategory !== 'all') params.set('category', this.currentCategory);
if (this.currentSort) params.set('sort', this.currentSort);

            

            const response = await fetch(`/api/movies?${params}`);
            if (!response.ok) throw new Error('Failed to load movies');
            
            const data = await response.json();
            this.movies = data.movies || [];
            this.totalPages = data.totalPages || 1;
            this.currentPage = data.currentPage || 1;

            this.renderMovies();
            this.updatePagination();
        } catch (error) {
            console.error('Error loading movies:', error);
            this.showError('Failed to load movies');
        } finally {
            this.loading = false;
        }
    }

    changeFilter(filter) {
        // Update active tab
        const tabButtons = document.querySelectorAll('#movies-section .tab-btn');
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.currentFilter = filter;
        this.currentPage = 1;
        this.loadMovies();
    }

    changeCategory(category) {
        // Update active filter
        const filterButtons = document.querySelectorAll('#movies-section .filter-btn');
        filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        this.currentCategory = category;
        this.currentPage = 1;
        this.loadMovies();
    }

    renderMovies() {
        const grid = document.getElementById('movieGrid');
        if (!grid) return;

        if (this.movies.length === 0) {
            grid.innerHTML = '<div class="loading-placeholder">No movies found</div>';
            return;
        }

        grid.innerHTML = this.movies.map(movie => this.createMovieCard(movie)).join('');
        this.addMovieEventListeners();
    }

    createMovieCard(movie) {
    const year = movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A';
    const rating = movie.voteAverage ? parseFloat(movie.voteAverage).toFixed(1) : 'N/A';

    // TMDB base path
    const tmdbBasePath = 'https://image.tmdb.org/t/p/w500'; // or 'original' for higher quality

    // full image path fallback
    const posterUrl = movie.posterPath 
        ? `${tmdbBasePath}${movie.posterPath}` 
        : '/images/placeholder-poster.jpg';

    return `
        <div class="content-card" data-movie-id="${movie._id}">
            <img src="${posterUrl}" 
                 alt="${movie.title}" 
                 onerror="this.src='/images/placeholder-poster.jpg'" />
            <div class="content-card-overlay">
                <h3>${movie.title}</h3>
                <div class="meta">
                    <span>${year}</span>
                    ${rating !== 'N/A' ? `
                        <div class="rating">
                            <i class="fas fa-star"></i>
                            <span>${rating}</span>
                        </div>
                    ` : ''}
                    ${movie.genre ? `<span>${movie.genre}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}


    addMovieEventListeners() {
        const movieCards = document.querySelectorAll('#movieGrid .content-card');
        movieCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const movieId = e.currentTarget.dataset.movieId;
                this.navigateToMovie(movieId);
            });
        });
    }

    navigateToMovie(movieId) {
        window.location.href = `/movies/${movieId}`;
    }

    updatePagination() {
        const prevBtn = document.getElementById('moviePrevBtn');
        const nextBtn = document.getElementById('movieNextBtn');
        const pageInfo = document.getElementById('moviePageInfo');

        if (prevBtn) {
            prevBtn.disabled = this.currentPage <= 1;
        }
        
        if (nextBtn) {
            nextBtn.disabled = this.currentPage >= this.totalPages;
        }

        if (pageInfo) {
            pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        }
    }

    previousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.loadMovies();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadMovies();
        }
    }

    showLoading() {
        const grid = document.getElementById('movieGrid');
        if (grid) {
            grid.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div> Loading movies...</div>';
        }
    }

    showError(message) {
        const grid = document.getElementById('movieGrid');
        if (grid) {
            grid.innerHTML = `<div class="loading-placeholder error">${message}</div>`;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MovieManager();
});