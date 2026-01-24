document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('main-container');
    const showRegisterBtn = document.getElementById('show-register-btn');
    const showLoginBtn = document.getElementById('show-login-btn');

    // Panel Switching
    if (showRegisterBtn && showLoginBtn && container){
        showRegisterBtn.addEventListener('click', () => {
            container.classList.add('right-panel-active');
        });

        showLoginBtn.addEventListener('click', () => {
            container.classList.remove('right-panel-active');
        });
    }
    
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

    // Show Error
    const showError = (elementId, message) => {
        const errorDiv = document.getElementById(elementId);
        if (errorDiv){
            errorDiv.textContent =  message;
            errorDiv.style.display = 'block';
        }
    }

    const hideError = (elementId) => {
        const errorDiv = document.getElementById(elementId);
        if (errorDiv) {
            errorDiv.style.display = 'none';
        }
    }

    // --- HANDLE REGISTER FORM (UPDATED: NO POPUP, DIRECT REDIRECT) ---
    const registerForm = document.querySelector('.sign-up-container form');
    if (registerForm){
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError('register-error');

            const password = document.getElementById('register-password').value;
            const confirm = document.getElementById('confirm-password').value;

            // Validasi
            if (password.length < 8){
                return showError('register-error', 'Password minimal memiliki 8 karakter')
            }

            if (!/\d/.test(password) || !/[a-zA-Z]/.test(password)){
                return showError('register-error', "Password harus huruf dan angka")
            }

            if (!/[!@#$%^&(),.?":{}|<>]/.test(password)){
                return showError('register-error', "Password harus memiliki special character")
            }

            if (password !== confirm){
                return showError('register-error', "Password tidak sesuai")
            }

            // Kirim ke Backend
            const formData = new FormData(registerForm);

            try {
                const response =  await fetch('/register', {method: 'POST', body: formData});
                const result = await response.json();

                if (result.success){
                    if (result.redirect){
                        window.location.href = result.redirect;
                    } 
                } else {
                    showError('register-error', result.message)
                }
            } catch (error) {
                console.error(error);
                showError('register-error', 'Connection error. Coba lagi nanti.');
            }
        });
    }

    // --- HANDLE LOGIN FORM (TETAP ADA POPUP) ---
    const loginForm = document.querySelector('.sign-in-container form');
    const loginSuccessPopup = document.getElementById('login-success-popup');

    if (loginForm){
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            hideError('login-error');

            const formData = new FormData(loginForm);

            if (!formData.has('remember_me')){
                formData.append('remember_me', 'off');

                try {
                    const response = await fetch('/login', {method: 'POST', body: formData});
                    const result = await response.json();

                    if (result.success) {
                        if (loginSuccessPopup) {
                            loginSuccessPopup.style.display = 'flex';

                            setTimeout(() => {
                                loginSuccessPopup.style.opacity = '1';
                                loginSuccessPopup.style.transform = 'scale(1)';
                            }, 10);

                            setTimeout(() => {
                                window.location.href = '/dashboard';
                            }, 1500);
                        } else {
                            window.location.href = '/dashboard';
                        }
                    } else {
                        showError('login-error', result.message);
                    }
                } catch (error) {
                    showError('login-error', 'Connection error. Coba lagi nanti.')
                }
            }
        });
    }
});