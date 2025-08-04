// series.js - Series Management
class SeriesManager {
    constructor() {
        this.currentPage = 1;
        this.totalPages = 1;
        this.seriesPerPage = 12;
        this.currentFilter = 'popular';
        this.currentCategory = 'all';
        this.currentSort = 'latest';
        this.series = [];
        this.loading = false;
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadSeries();
    }

    navigateToSeries(seriesId) {
    window.location.href = `api/series/${seriesId}`;
}

    setupEventListeners() {
        // Tab buttons
        const tabButtons = document.querySelectorAll('#series-section .tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.changeFilter(filter);
            });
        });

        // Category filters
        const filterButtons = document.querySelectorAll('#series-section .filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const category = e.currentTarget.dataset.category;
                this.changeCategory(category);
            });
        });

        // Sort dropdown
        const sortSelect = document.getElementById('seriesSortBy');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.currentPage = 1;
                this.loadSeries();
            });
        }

        // Pagination buttons
        const prevBtn = document.getElementById('seriesPrevBtn');
        const nextBtn = document.getElementById('seriesNextBtn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.previousPage());
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.nextPage());
        }
    }

    async loadSeries() {
        if (this.loading) return;
        
        this.loading = true;
        this.showLoading();

        try {
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.seriesPerPage,
                filter: this.currentFilter,
                category: this.currentCategory,
                sort: this.currentSort
            });

            const response = await fetch(`/api/series?${params}`);
            if (!response.ok) throw new Error('Failed to load series');
            
            const data = await response.json();
            this.series = data.series || [];
            this.totalPages = data.totalPages || 1;
            this.currentPage = data.currentPage || 1;

            this.renderSeries();
            this.updatePagination();
        } catch (error) {
            console.error('Error loading series:', error);
            this.showError('Failed to load series');
        } finally {
            this.loading = false;
        }
    }

    changeFilter(filter) {
        // Update active tab
        const tabButtons = document.querySelectorAll('#series-section .tab-btn');
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });

        this.currentFilter = filter;
        this.currentPage = 1;
        this.loadSeries();
    }

    changeCategory(category) {
        // Update active filter
        const filterButtons = document.querySelectorAll('#series-section .filter-btn');
        filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });

        this.currentCategory = category;
        this.currentPage = 1;
        this.loadSeries();
    }

    renderSeries() {
        const grid = document.getElementById('seriesGrid');
        if (!grid) return;

        if (this.series.length === 0) {
            grid.innerHTML = '<div class="loading-placeholder">No series found</div>';
            return;
        }

        grid.innerHTML = this.series.map(series => this.createSeriesCard(series)).join('');
        this.addSeriesEventListeners();
    }

 createSeriesCard(series) {
    const year = series.firstAirDate ? new Date(series.firstAirDate).getFullYear() : 'N/A';
    const rating = series.voteAverage ? parseFloat(series.voteAverage).toFixed(1) : 'N/A';
    const seasons = series.numberOfSeasons ? `${series.numberOfSeasons} Season${series.numberOfSeasons > 1 ? 's' : ''}` : '';
    const tmdbBasePath = 'https://image.tmdb.org/t/p/w500';
    const posterUrl = series.posterPath 
        ? `${tmdbBasePath}${series.posterPath}` 
        : '/images/placeholder-poster.jpg';

    return `
        <div class="content-card" data-series-id="${series._id}">
            <img src="${posterUrl}" 
                 alt="${series.title}" 
                 onerror="this.src='/images/placeholder-poster.jpg'" />
            <div class="content-card-overlay">
                <h3>${series.title}</h3>
                <div class="meta">
                    <span>${year}</span>
                    ${rating !== 'N/A' ? `
                        <div class="rating">
                            <i class="fas fa-star"></i>
                            <span>${rating}</span>
                        </div>
                    ` : ''}
                    ${seasons ? `<span>${seasons}</span>` : ''}
                    ${series.genre ? `<span>${series.genre}</span>` : ''}
                </div>
            </div>
        </div>
    `;
}


    addSeriesEventListeners() {
        const seriesCards = document.querySelectorAll('#seriesGrid .content-card');
        seriesCards.forEach(card => {
            card.addEventListener('click', (e) => {
                const seriesId = e.currentTarget.dataset.seriesId;
                this.navigateToSeries(seriesId);
            });
        });
    }

    navigateToSeries(seriesId) {
        window.location.href = `/series/${seriesId}`;
    }

    updatePagination() {
        const prevBtn = document.getElementById('seriesPrevBtn');
        const nextBtn = document.getElementById('seriesNextBtn');
        const pageInfo = document.getElementById('seriesPageInfo');

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
            this.loadSeries();
        }
    }

    nextPage() {
        if (this.currentPage < this.totalPages) {
            this.currentPage++;
            this.loadSeries();
        }
    }

    showLoading() {
        const grid = document.getElementById('seriesGrid');
        if (grid) {
            grid.innerHTML = '<div class="loading-placeholder"><div class="loading-spinner"></div> Loading series...</div>';
        }
    }

    showError(message) {
        const grid = document.getElementById('seriesGrid');
        if (grid) {
            grid.innerHTML = `<div class="loading-placeholder error">${message}</div>`;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SeriesManager();
});