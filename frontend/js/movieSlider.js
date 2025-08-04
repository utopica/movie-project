class MovieSlider {
            constructor() {
                this.currentSlide = 0;
                this.movies = [];
                this.slider = document.getElementById('trendingSlider');
                this.loading = document.getElementById('loading');
                this.sliderNav = document.getElementById('sliderNav');
                this.autoSlideInterval = null;
                
                this.init();
            }

            async init() {
                try {
                    await this.fetchMovies();
                    this.renderSlides();
                    this.setupNavigation();
                    this.startAutoSlide();
                    this.showSlider();
                } catch (error) {
                    console.error('Slider initialization error:', error);
                    this.showError();
                }
            }

            async fetchMovies() {
                const response = await fetch('/api/movies/top-movies');
                if (!response.ok) {
                    throw new Error('API request failed');
                }
                const data = await response.json();
                if (data.success) {
                    this.movies = data.data;
                } else {
                    throw new Error(data.message);
                }
            }

            renderSlides() {
                this.slider.innerHTML = `
                    <button class="slider-arrow prev" id="prevBtn">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                    <button class="slider-arrow next" id="nextBtn">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                    <div class="slider-nav" id="sliderNav"></div>
                `;

                this.movies.forEach((movie, index) => {
                    const slide = this.createSlide(movie, index);
                    this.slider.appendChild(slide);
                });

                this.createNavDots();
                this.setActiveSlide(0);
            }

            createSlide(movie, index) {
                const slide = document.createElement('div');
                slide.className = 'slide';
                slide.style.backgroundImage = `url(https://image.tmdb.org/t/p/original${movie.backdropPath || movie.posterPath})`;
                
                const genres = movie.genres && movie.genres.length > 0 
                    ? movie.genres.map(g => g.name).join(' | ') 
                    : 'Drama | Action';

                slide.innerHTML = `
                    <div class="overlay">
                        <div class="content">
                            <div class="info">
                                <div class="rating">⭐ ${movie.voteAverage ? movie.voteAverage.toFixed(1) : 'N/A'}</div>
                                <div class="genres">${genres}</div>
                            </div>
                            <h2>${movie.originalTitle || movie.title}</h2>
                            <p>${movie.overview || 'Bu film için açıklama bulunmamaktadır.'}</p>
                            <div class="actions">
                                <button class="add" onclick="addToWatchlist(${movie.tmdbId})" title="Add to Watchlist">
                                    <i class="fa fa-plus"></i>
                                </button>
                                <button class="like" onclick="likeMovie(${movie.tmdbId})" title="Add to Favorites">
                                    <i class="fa fa-thumbs-up"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                return slide;
            }

            createNavDots() {
                const navContainer = document.getElementById('sliderNav');
                navContainer.innerHTML = '';
                
                this.movies.forEach((_, index) => {
                    const dot = document.createElement('div');
                    dot.className = 'nav-dot';
                    dot.addEventListener('click', () => this.goToSlide(index));
                    navContainer.appendChild(dot);
                });
            }

            setupNavigation() {
                const prevBtn = document.getElementById('prevBtn');
                const nextBtn = document.getElementById('nextBtn');

                prevBtn.addEventListener('click', () => {
                    this.stopAutoSlide();
                    this.prevSlide();
                    this.startAutoSlide();
                });

                nextBtn.addEventListener('click', () => {
                    this.stopAutoSlide();
                    this.nextSlide();
                    this.startAutoSlide();
                });

                // Keyboard navigation
                document.addEventListener('keydown', (e) => {
                    if (e.key === 'ArrowLeft') {
                        this.stopAutoSlide();
                        this.prevSlide();
                        this.startAutoSlide();
                    } else if (e.key === 'ArrowRight') {
                        this.stopAutoSlide();
                        this.nextSlide();
                        this.startAutoSlide();
                    }
                });
            }

            setActiveSlide(index) {
                const slides = this.slider.querySelectorAll('.slide');
                const dots = this.slider.querySelectorAll('.nav-dot');

                slides.forEach((slide, i) => {
                    slide.classList.toggle('active', i === index);
                });

                dots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === index);
                });

                this.currentSlide = index;
            }

            nextSlide() {
                const nextIndex = (this.currentSlide + 1) % this.movies.length;
                this.setActiveSlide(nextIndex);
            }

            prevSlide() {
                const prevIndex = this.currentSlide === 0 ? this.movies.length - 1 : this.currentSlide - 1;
                this.setActiveSlide(prevIndex);
            }

            goToSlide(index) {
                this.stopAutoSlide();
                this.setActiveSlide(index);
                this.startAutoSlide();
            }

            startAutoSlide() {
                this.autoSlideInterval = setInterval(() => {
                    this.nextSlide();
                }, 5000); // 5 saniyede bir otomatik geçiş
            }

            stopAutoSlide() {
                if (this.autoSlideInterval) {
                    clearInterval(this.autoSlideInterval);
                    this.autoSlideInterval = null;
                }
            }

            showSlider() {
                this.loading.style.display = 'none';
                this.slider.style.display = 'block';
            }

            showError() {
                this.loading.innerHTML = `
                    <i class="fas fa-exclamation-triangle" style="margin-right: 10px; color: #ff6b6b;"></i>
                    Filmler yüklenirken bir hata oluştu
                `;
            }
        }

        // Movie action functions
        function playMovie(tmdbId) {
            console.log('Playing movie trailer:', tmdbId);
            // Film oynatma fonksiyonunu buraya ekleyin
            alert(`Fragman oynatılıyor: ${tmdbId}`);
        }

        function addToWatchlist(tmdbId) {
            // Use the global function from userLists.js
            if (typeof window.addToWatchlist === 'function') {
                window.addToWatchlist(tmdbId, 'movie');
            } else {
                console.error('UserLists.js not loaded');
                alert('Lütfen sayfayı yenileyin');
            }
        }

        // Initialize slider when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
            new MovieSlider();
        });

        // Pause auto-slide when user hovers over slider
        document.addEventListener('DOMContentLoaded', () => {
            const slider = document.getElementById('trendingSlider');
            let sliderInstance;

            // Wait for slider to be initialized
            setTimeout(() => {
                sliderInstance = new MovieSlider();
                
                slider.addEventListener('mouseenter', () => {
                    if (sliderInstance) sliderInstance.stopAutoSlide();
                });

                slider.addEventListener('mouseleave', () => {
                    if (sliderInstance) sliderInstance.startAutoSlide();
                });
            }, 100);
        });
    