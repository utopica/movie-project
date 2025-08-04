class AuthManager {
    constructor() {
        this.baseURL = '/api/users'; 
        this.init();
    }

    init() {
        // Register form handler
        const registerForm = document.getElementById('registerForm');
        if (registerForm) {
            registerForm.addEventListener('submit', this.handleRegister.bind(this));
        }

        // Login form handler
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', this.handleLogin.bind(this));
        }
    }

    // Kayıt işlemi
    async handleRegister(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const data = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            language: 'tr' // Türkçe dil desteği
        };

        try {
            this.setLoading(true);
            this.hideMessages();

            // Form validasyonu
            this.validateRegisterForm(data);

            const response = await fetch(`${this.baseURL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                this.showSuccess('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
                form.reset();
                
                // 2 saniye sonra login sayfasına yönlendir
                setTimeout(() => {
                    window.location.href = '/login.html';
                }, 2000);
            } else {
                throw new Error(result.message || 'Kayıt işlemi başarısız');
            }

        } catch (error) {
            this.showError(this.getErrorMessage(error));
        } finally {
            this.setLoading(false);
        }
    }

    // Giriş işlemi
    async handleLogin(event) {
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        const data = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            this.setLoading(true);
            this.hideMessages();

            // Form validasyonu
            this.validateLoginForm(data);

            const response = await fetch(`${this.baseURL}/auth`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            const result = await response.json();

            if (response.ok) {
                // Token'ı localStorage'a kaydet
                localStorage.setItem('authToken', result.data.token);
                localStorage.setItem('user', JSON.stringify(result.data.user));
                
                this.showSuccess('Giriş başarılı! Ana sayfaya yönlendiriliyorsunuz...');
                
                // 1 saniye sonra ana sayfaya yönlendir
                setTimeout(() => {
                    window.location.href = '/profile.html'; // veya ana sayfa URL'niz
                }, 1000);
            } else {
                throw new Error(result.message || 'Giriş işlemi başarısız');
            }

        } catch (error) {
            this.showError(this.getErrorMessage(error));
        } finally {
            this.setLoading(false);
        }
    }

    // Kayıt formu validasyonu
    validateRegisterForm(data) {
        if (!data.username || data.username.trim().length < 3) {
            throw new Error('Kullanıcı adı en az 3 karakter olmalıdır');
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            throw new Error('Geçerli bir email adresi giriniz');
        }

        if (!data.password || data.password.length < 6) {
            throw new Error('Şifre en az 6 karakter olmalıdır');
        }
    }

    // Giriş formu validasyonu
    validateLoginForm(data) {
        if (!data.email || !this.isValidEmail(data.email)) {
            throw new Error('Geçerli bir email adresi giriniz');
        }

        if (!data.password || data.password.length < 6) {
            throw new Error('Şifre en az 6 karakter olmalıdır');
        }
    }

    // Email validasyonu
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Loading durumunu ayarla
    setLoading(isLoading) {
        const submitBtn = document.querySelector('button[type="submit"]');
        const container = document.querySelector('.auth-container');
        
        if (isLoading) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'İşlem yapılıyor...';
            container.classList.add('loading');
        } else {
            submitBtn.disabled = false;
            // Orijinal buton textini geri yükle
            if (submitBtn.id === 'registerBtn') {
                submitBtn.textContent = 'Kayıt Ol';
            } else if (submitBtn.id === 'loginBtn') {
                submitBtn.textContent = 'Giriş Yap';
            }
            container.classList.remove('loading');
        }
    }

    // Hata mesajını göster
    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
        }
    }

    // Başarı mesajını göster
    showSuccess(message) {
        const successDiv = document.getElementById('successMessage');
        if (successDiv) {
            successDiv.textContent = message;
            successDiv.style.display = 'block';
        }
    }

    // Mesajları gizle
    hideMessages() {
        const errorDiv = document.getElementById('errorMessage');
        const successDiv = document.getElementById('successMessage');
        
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
        if (successDiv) {
            successDiv.style.display = 'none';
        }
    }

    // Hata mesajını formatla
    getErrorMessage(error) {
        if (error.message) {
            return error.message;
        }
        
        // Backend'den gelen hata mesajlarını handle et
        if (typeof error === 'string') {
            return error;
        }
        
        return 'Bir hata oluştu. Lütfen tekrar deneyin.';
    }

    // Token kontrolü
    static isAuthenticated() {
        const token = localStorage.getItem('authToken');
        return !!token;
    }

    // Çıkış işlemi
    static logout() {
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        window.location.href = '/login.html';
    }

    // Kullanıcı bilgilerini al
    static getCurrentUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }

    // API istekleri için token header'ı ekle
    static getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }
}

// AuthManager'ı başlat
document.addEventListener('DOMContentLoaded', () => {
    new AuthManager();
});

// Global kullanım için
window.AuthManager = AuthManager;