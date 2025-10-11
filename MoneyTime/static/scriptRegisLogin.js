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
});