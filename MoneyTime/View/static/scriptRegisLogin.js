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

    // Fungsi untuk mengatur fungsionalitas lihat/sembunyikan password
    function setupPasswordToggle(inputId, toggleId) {
        const passwordInput = document.getElementById(inputId);
        const toggleIcon = document.getElementById(toggleId);

        if (passwordInput && toggleIcon) {
            toggleIcon.addEventListener('click', () => {
                // Cek tipe input saat ini
                const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
                passwordInput.setAttribute('type', type);
                
                // Ganti ikon mata
                toggleIcon.classList.toggle('fa-eye');
                toggleIcon.classList.toggle('fa-eye-slash');
            });
        }
    }

    // Terapkan fungsi pada setiap pasang input dan ikon
    setupPasswordToggle('login-password', 'toggle-login-password');
    setupPasswordToggle('register-password', 'toggle-register-password');
    setupPasswordToggle('confirm-password', 'toggle-confirm-password');

    // Popup handling
    const registerSuccessPopup = document.getElementById('register-success-popup');
    const loginSuccessPopup = document.getElementById('login-success-popup');

    // Handle register form submission
    const registerForm = document.querySelector('.sign-up-container form');
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('register-password').value;
        const confirm = document.getElementById('confirm-password').value;
        const errorDiv = document.getElementById('register-error');

        if (password !== confirm) {
            errorDiv.textContent = 'Passwords do not match';
            errorDiv.style.display = 'block';
            return;
        }

        // Hide error if previously shown
        errorDiv.style.display = 'none';

        // Send data to backend
        const formData = new FormData(registerForm);
        try {
            const response = await fetch('/register', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();
            if (result.success) {
                registerSuccessPopup.style.display = 'flex';
                setTimeout(() => {
                    registerSuccessPopup.style.opacity = '1';
                    registerSuccessPopup.style.transform = 'scale(1)';
                }, 10);
                setTimeout(() => {
                    registerSuccessPopup.style.opacity = '0';
                    registerSuccessPopup.style.transform = 'scale(0.5)';
                    setTimeout(() => {
                        registerSuccessPopup.style.display = 'none';
                        container.classList.remove('right-panel-active'); // Switch to login
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

    // Handle login form submission (optional, but for completeness)
    const loginForm = document.querySelector('.sign-in-container form');
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorDiv = document.getElementById('login-error');
        errorDiv.style.display = 'none'; // Hide previous errors
        const formData = new FormData(loginForm);

        // Log the form data for debugging (optional)
        for (let [key, value] of formData.entries()) {
            console.log(key, value);
        }

        // Ensure remember_me is included in form data even if unchecked
        if (!formData.has('remember_me')) {
            formData.append('remember_me', 'off');
        }

        try {
            const response = await fetch('/login', {
                method: 'POST',
                body: formData
            });
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);
            const result = await response.json();
            console.log('Response result:', result);
            if (result.success) {
                // Handle remember me: store in localStorage if checked
                const rememberMe = document.getElementById('remember-me').checked;
                if (rememberMe) {
                    localStorage.setItem('rememberMe', 'true');
                    // Optionally store email or other data
                    const email = document.getElementById('login_email').value;
                    localStorage.setItem('email', email);
                } else {
                    localStorage.removeItem('rememberMe');
                    localStorage.removeItem('email');
                }

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
                        // Setelah popup sukses login hilang, redirect ke dashboard
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
