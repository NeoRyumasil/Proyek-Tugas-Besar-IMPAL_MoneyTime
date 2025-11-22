document.addEventListener('DOMContentLoaded', () => {

    // --- 1. INISIALISASI ELEMEN DOM ---
    const step1 = document.getElementById('step-1-email');
    const step2 = document.getElementById('step-2-otp');
    const step3 = document.getElementById('step-3-password');

    const form1 = document.getElementById('form-send-otp');
    const form2 = document.getElementById('form-verify-otp');
    const form3 = document.getElementById('form-update-password');

    const error1 = document.getElementById('step-1-error');
    const error2 = document.getElementById('step-2-error');
    const error3 = document.getElementById('step-3-error');

    const toastContainer = document.getElementById('toast-container');
    const resendLink = document.getElementById('resend-link');

    // --- 2. VARIABEL GLOBAL ---
    let currentEmail = ''; // Menyimpan email untuk keperluan Resend
    let resendTimer = null;
    let timeLeft = 30;

    // --- 3. FUNGSI TOAST (NOTIFIKASI) ---
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        // Animasi masuk
        setTimeout(() => toast.classList.add('show'), 100);

        // Hapus otomatis
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // --- 4. FUNGSI TIMER RESEND (30 DETIK) ---
    function startResendTimer() {
        if (!resendLink) return;

        // Reset state
        if (resendTimer) clearInterval(resendTimer);
        timeLeft = 30;

        // TAMPILAN AWAL (MATI/DISABLED)
        resendLink.style.pointerEvents = 'none';
        resendLink.style.color = '#999999'; // Abu-abu
        resendLink.style.cursor = 'default';
        resendLink.style.textDecoration = 'none';
        resendLink.textContent = `Resend in ${timeLeft}s`;

        // MULAI HITUNG MUNDUR
        resendTimer = setInterval(() => {
            timeLeft--;
            resendLink.textContent = `Resend in ${timeLeft}s`;

            // JIKA WAKTU HABIS
            if (timeLeft <= 0) {
                clearInterval(resendTimer);
                
                // TAMPILAN AKTIF (BISA DIKLIK)
                resendLink.textContent = 'Resend';
                resendLink.style.pointerEvents = 'auto';
                resendLink.style.color = '#1A3E7F'; // Biru MoneyTime
                resendLink.style.cursor = 'pointer';
                resendLink.style.fontWeight = '600';
            }
        }, 1000);
    }

    // --- 5. PEMICU TIMER (OBSERVER) ---
    // Timer jalan otomatis saat Step 2 muncul
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                if (step2.style.display === 'block') {
                    startResendTimer();
                }
            }
        });
    });

    if (step2) {
        observer.observe(step2, { attributes: true, attributeFilter: ['style'] });
    }

    // --- 6. LOGIKA KLIK TOMBOL RESEND ---
    if (resendLink) {
        resendLink.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Double check: Pastikan timer habis & email ada
            if (timeLeft <= 0 && currentEmail) {
                
                showToast('Sending new code...', 'success');
                
                // Matikan tombol sementara proses fetch berjalan
                resendLink.style.pointerEvents = 'none';
                resendLink.textContent = 'Sending...';

                const formData = new FormData();
                formData.append('email', currentEmail);

                try {
                    const response = await fetch('/send-otp', {
                        method: 'POST',
                        body: formData
                    });
                    const result = await response.json();

                    if (result.success) {
                        showToast('OTP resent successfully!', 'success');
                        startResendTimer(); // Reset timer 30 detik
                    } else {
                        showToast('Failed: ' + result.message, 'error');
                        // Kembalikan tombol ke keadaan aktif jika gagal
                        resendLink.textContent = 'Resend';
                        resendLink.style.pointerEvents = 'auto';
                    }
                } catch (err) {
                    console.error(err);
                    showToast('Network error.', 'error');
                    resendLink.textContent = 'Resend';
                    resendLink.style.pointerEvents = 'auto';
                }
            }
        });
    }

    // --- 7. STEP 1: KIRIM OTP PERTAMA KALI ---
    form1.addEventListener('submit', async (e) => {
        e.preventDefault();
        error1.style.display = 'none';
        const formData = new FormData(form1);
        
        // Simpan email
        currentEmail = formData.get('email');

        // UX Loading
        const btn = form1.querySelector('button');
        const originalText = btn.innerText;
        btn.innerText = 'Sending...';
        btn.disabled = true;

        try {
            const response = await fetch('/send-otp', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                step1.style.display = 'none';
                step2.style.display = 'block'; // Ini akan memicu Observer -> startResendTimer
                showToast('OTP sent to your email!', 'success');
            } else {
                error1.textContent = result.message;
                error1.style.display = 'block';
                showToast(result.message, 'error');
            }
        } catch (err) {
            error1.textContent = 'An error occurred.';
            error1.style.display = 'block';
            showToast('Connection error.', 'error');
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });

    // --- 8. HANDLING INPUT OTP (AUTO-FOCUS) ---
    const otpInputs = document.querySelectorAll('.otp-inputs input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, ''); // Hanya angka

            if (e.target.value && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    // --- 9. STEP 2: VERIFIKASI OTP ---
    form2.addEventListener('submit', async (e) => {
        e.preventDefault();
        error2.style.display = 'none';

        let otpValue = '';
        otpInputs.forEach(input => otpValue += input.value);

        if (otpValue.length < 4) {
            error2.textContent = 'Please enter complete 4-digit code.';
            error2.style.display = 'block';
            return;
        }

        const formData = new FormData();
        formData.append('otp', otpValue);

        try {
            const response = await fetch('/verify-otp', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                step2.style.display = 'none';
                step3.style.display = 'block';
                if (resendTimer) clearInterval(resendTimer); // Stop timer jika sukses
                showToast('Email verified successfully!', 'success');
            } else {
                error2.textContent = result.message;
                error2.style.display = 'block';
                showToast(result.message, 'error');
            }
        } catch (err) {
            error2.textContent = 'An error occurred.';
            error2.style.display = 'block';
        }
    });

    // --- 10. STEP 3: UPDATE PASSWORD ---
    form3.addEventListener('submit', async (e) => {
        e.preventDefault();
        error3.style.display = 'none';

        const newPass = document.getElementById('new-password').value;
        const confirmPass = document.getElementById('confirm-password').value;

        if (newPass !== confirmPass) {
            error3.textContent = 'Passwords do not match.';
            error3.style.display = 'block';
            return;
        }

        const formData = new FormData(form3);
        try {
            const response = await fetch('/update-password', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                showToast('Password updated successfully!', 'success');
                
                // Redirect ke halaman Login setelah 2 detik
                setTimeout(() => {
                    window.location.href = '/auth'; 
                }, 2000);
            } else {
                error3.textContent = result.message;
                error3.style.display = 'block';
                showToast(result.message, 'error');
            }
        } catch (err) {
            error3.textContent = 'An error occurred.';
            error3.style.display = 'block';
        }
    });

    // --- 11. TOGGLE PASSWORD (LIHAT/SEMBUNYIKAN) ---
    document.querySelectorAll('.password-toggle').forEach(icon => {
        icon.addEventListener('click', function() {
            const input = this.previousElementSibling;
            const type = input.getAttribute('type') === 'password' ? 'text' : 'password';
            input.setAttribute('type', type);
            
            this.classList.toggle('fa-eye');
            this.classList.toggle('fa-eye-slash');
        });
    });

});