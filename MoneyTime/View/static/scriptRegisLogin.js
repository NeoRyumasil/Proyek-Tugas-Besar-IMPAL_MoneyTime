document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('main-container');
    const showRegisterBtn = document.getElementById('show-register-btn');
    const showLoginBtn = document.getElementById('show-login-btn');

    showRegisterBtn.addEventListener('click', () => {
        container.classList.add('right-panel-active');
    });

    showLoginBtn.addEventListener('click', () => {
        container.classList.remove('right-panel-active');
    });

    // Fungsi Password Toggle
    function setupPasswordToggle(inputId, toggleId) {
        const passwordInput = document.getElementById(inputId);
        const toggleIcon = document.getElementById(toggleId);

        if (passwordInput && toggleIcon) {
            toggleIcon.addEventListener('click', () => {
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                toggleIcon.classList.toggle('fa-eye');
                toggleIcon.classList.toggle('fa-eye-slash');
            });
        }
    }

    setupPasswordToggle('login-password', 'toggle-login-password');
    setupPasswordToggle('register-password', 'toggle-register-password');
    setupPasswordToggle('confirm-password', 'toggle-confirm-password');

    // Popup handling (Hanya untuk Login sekarang)
    const loginSuccessPopup = document.getElementById('login-success-popup');

    // --- HANDLE REGISTER FORM (UPDATED: NO POPUP, DIRECT REDIRECT) ---
    const registerForm = document.querySelector('.sign-up-container form');
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('confirm-password').value;
        const errorDiv = document.getElementById('register-error');

        // Validasi Password
        if (password.length < 8) {
            errorDiv.textContent = 'Password must be at least 8 characters long';
            errorDiv.style.display = 'block';
            return;
        }
        
        const hasNumber = /\d/.test(password);
        const hasLetter = /[a-zA-Z]/.test(password);
        if (!hasNumber || !hasLetter) {
            errorDiv.textContent = 'Password must contain both letters and numbers';
            errorDiv.style.display = 'block';
            return;
        }

        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
        if (!hasSymbol) {
            errorDiv.textContent = 'Password must contain at least one special character';
            errorDiv.style.display = 'block';
            return;
        }

        if (password !== confirm) {
            errorDiv.textContent = 'Passwords do not match';
            errorDiv.style.display = 'block';
            return;
        }

        errorDiv.style.display = 'none';

        const formData = new FormData(registerForm);
        try {
            const response = await fetch('/register', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            
            if (result.success) {
                // LANGSUNG REDIRECT KE VALIDASI AKUN
                if (result.redirect) {
                    window.location.href = result.redirect;
                }
            } else {
                errorDiv.textContent = result.message;
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            errorDiv.textContent = 'An error occurred. Please try again.';
            errorDiv.style.display = 'block';
        }
    });

    // --- HANDLE LOGIN FORM (TETAP ADA POPUP) ---
    const loginForm = document.querySelector('.sign-in-container form');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorDiv = document.getElementById('login-error');
        errorDiv.style.display = 'none';
        const formData = new FormData(loginForm);

        if (!formData.has('remember_me')) {
            formData.append('remember_me', 'off');
        }

        try {
            const response = await fetch('/login', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            
            if (result.success) {
                loginSuccessPopup.style.display = 'flex';
                setTimeout(() => {
                    loginSuccessPopup.style.opacity = '1';
                    loginSuccessPopup.style.transform = 'scale(1)';
                }, 10);
                setTimeout(() => {
                    loginSuccessPopup.style.opacity = '0';
                    loginSuccessPopup.style.transform = 'scale(0.5)';
                    setTimeout(() => {
                        loginSuccessPopup.style.display = 'none';
                        window.location.href = '/dashboard';
                    }, 500);
                }, 1000);
            } else {
                errorDiv.textContent = result.message;
                errorDiv.style.display = 'block';
            }
        } catch (error) {
            errorDiv.textContent = 'An error occurred. Please try again.';
            errorDiv.style.display = 'block';
        }
    });
});