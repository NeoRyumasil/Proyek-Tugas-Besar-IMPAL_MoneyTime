window.addEventListener('DOMContentLoaded', function () {
    const discardIcon = document.querySelector('.discard-anim');
    if (discardIcon) {
        discardIcon.style.transform = 'scale(0.2)';
        discardIcon.style.transition = 'transform 0.6s cubic-bezier(0.4, 0.8, 0.4, 1)';
        setTimeout(() => {
            discardIcon.style.transform = 'scale(1)';
        }, 100);
    }
    const registrationBefore = document.querySelector('.registration-before');
    const registrationAfter = document.querySelector('.registration-after');
    if (registrationBefore && registrationAfter) {
        registrationBefore.style.opacity = '1';
        registrationAfter.style.opacity = '0';
        registrationBefore.style.transition = 'opacity 0.6s';
        registrationAfter.style.transition = 'opacity 0.6s';
        setTimeout(() => {
            registrationBefore.style.opacity = '0';
            registrationAfter.style.opacity = '1';
        }, 1000);
    }
});

document.addEventListener('DOMContentLoaded', function () {
    // --- LOGIKA LOGOUT MODAL ---
    const logoutBtn = document.getElementById('logoutBtn'); // Tombol di Dropdown Profile
    const logoutOverlay = document.getElementById('logout-modal-overlay');
    const logoutModal = document.getElementById('logout-modal');
    const logoutYes = document.getElementById('logoutYesBtn');
    const logoutNo = document.getElementById('logoutNoBtn');

    // Fungsi Buka Modal
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault(); // Mencegah redirect langsung
            if (logoutOverlay) {
                logoutOverlay.style.display = 'flex';
                // Sedikit delay agar transisi CSS opacity/scale berjalan mulus
                setTimeout(() => {
                    if (logoutModal) logoutModal.classList.add('show');
                }, 10);
            }
        });
    }

    // Fungsi Tutup Modal (Tombol No)
    if (logoutNo) {
        logoutNo.addEventListener('click', () => {
            if (logoutModal) logoutModal.classList.remove('show');
            setTimeout(() => {
                if (logoutOverlay) logoutOverlay.style.display = 'none';
            }, 300); // Sesuaikan dengan durasi transisi CSS
        });
    }

    // Fungsi Logout (Tombol Yes)
    if (logoutYes) {
        logoutYes.addEventListener('click', () => {
            // Redirect ke route logout Flask
            window.location.href = '/logout';
        });
    }

    // Tutup jika klik area gelap (Overlay)
    if (logoutOverlay) {
        logoutOverlay.addEventListener('click', (e) => {
            if (e.target === logoutOverlay) {
                if (logoutModal) logoutModal.classList.remove('show');
                setTimeout(() => {
                    logoutOverlay.style.display = 'none';
                }, 300);
            }
        });
    }

    // --- SUCCESS MODAL LOGIC ---
    const successOverlay = document.getElementById('success-modal-overlay');
    const successModal = successOverlay ? successOverlay.querySelector('.modal') : null;

    window.showSuccessModal = function() {
        if (successOverlay) {
            successOverlay.style.display = 'flex';
            setTimeout(() => {
                if (successModal) successModal.classList.add('show');
            }, 10);
            // Auto-close after 2 seconds
            setTimeout(() => {
                if (successModal) successModal.classList.remove('show');
                setTimeout(() => {
                    successOverlay.style.display = 'none';
                }, 300);
            }, 2000);
        }
    };

    // Close on click
    if (successOverlay) {
        successOverlay.addEventListener('click', (e) => {
            if (e.target === successOverlay) {
                if (successModal) successModal.classList.remove('show');
                setTimeout(() => {
                    successOverlay.style.display = 'none';
                }, 300);
            }
        });
    }
});
