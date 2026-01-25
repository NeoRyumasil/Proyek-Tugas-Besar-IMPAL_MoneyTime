document.addEventListener('DOMContentLoaded', () => {

    // --- DOM ELEMENTS ---
    const formVerify = document.getElementById('form-verify-otp');
    const otpError = document.getElementById('otp-error');
    const toastContainer = document.getElementById('toast-container');
    const resendLink = document.getElementById('resend-link');
    const otpInputs = document.querySelectorAll('.otp-inputs input');

    // --- VARIABLES ---
    let resendTimer = null;
    const COOLDOWN_SECONDS = 30; 

    // --- 1. TOAST FUNCTION (Sama dengan scriptForgotPassword.js) ---
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 100);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toastContainer.contains(toast)) {
                    toastContainer.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }

    // --- 2. RESEND TIMER FUNCTION (Sama dengan scriptForgotPassword.js) ---
    function startResendTimer(initialTime) {
        if (!resendLink) return;
        if (resendTimer) clearInterval(resendTimer);
        
        let timeLeft = initialTime;

        // Tampilan Awal (Disabled)
        resendLink.style.pointerEvents = 'none';
        resendLink.style.color = '#999999';
        resendLink.style.cursor = 'default';
        resendLink.style.textDecoration = 'none';
        resendLink.textContent = `Resend in ${timeLeft}s`;

        resendTimer = setInterval(() => {
            timeLeft--;
            resendLink.textContent = `Resend in ${timeLeft}s`;

            if (timeLeft <= 0) {
                clearInterval(resendTimer);
                
                // Tampilan Aktif (Clickable)
                resendLink.textContent = 'Resend';
                resendLink.style.pointerEvents = 'auto';
                resendLink.style.color = '#1A3E7F';
                resendLink.style.cursor = 'pointer';
                resendLink.style.fontWeight = '600';
                
                // Hapus timestamp storage agar bisa kirim ulang nanti
                sessionStorage.removeItem('otp_next_allowed_time');
            }
        }, 1000);
    }

    // --- 3. AUTO SEND & REFRESH LOGIC ---
    async function sendOtpAutomatic() {
        // UI Loading State pada Link Resend
        resendLink.textContent = "Sending...";
        resendLink.style.pointerEvents = 'none';
        
        try {
            const response = await fetch('/send-validation-otp', { method: 'POST' });
            const result = await response.json();

            if (result.success) {
                showToast('Verification code sent!', 'success');
                
                // Set cooldown
                const nextAllowedTime = Date.now() + (COOLDOWN_SECONDS * 1000);
                sessionStorage.setItem('otp_next_allowed_time', nextAllowedTime);
                
                startResendTimer(COOLDOWN_SECONDS);
            } else {
                showToast(result.message, 'error');
                // Jika error (misal session habis), kembalikan ke Auth
                if(result.message.toLowerCase().includes('email')) {
                    setTimeout(() => window.location.href = '/auth', 2000);
                }
            }
        } catch (err) {
            console.error(err);
            showToast('Network error.', 'error');
        }
    }

    function checkAutoSendStatus() {
        const nextAllowed = sessionStorage.getItem('otp_next_allowed_time');
        
        if (nextAllowed) {
            const now = Date.now();
            const remainingTime = Math.ceil((parseInt(nextAllowed) - now) / 1000);

            if (remainingTime > 0) {
                // Masih cooldown: Jangan kirim ulang, lanjutkan timer
                startResendTimer(remainingTime);
            } else {
                // Cooldown habis: Kirim baru
                sendOtpAutomatic();
            }
        } else {
            // Belum pernah kirim: Kirim baru
            sendOtpAutomatic();
        }
    }

    // --- 4. RESEND CLICK EVENT ---
    if (resendLink) {
        resendLink.addEventListener('click', async (e) => {
            e.preventDefault();
            // Cek manual (double check)
            if (resendLink.textContent === 'Resend') {
                await sendOtpAutomatic();
            }
        });
    }

    // --- 5. HANDLING INPUT OTP (Sama dengan scriptForgotPassword.js) ---
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, ''); // Hanya angka
            
            // Auto Focus Next
            if (e.target.value && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }
            // Sembunyikan error saat user mengetik
            otpError.style.display = 'none';
        });

        input.addEventListener('keydown', (e) => {
            // Backspace Logic
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });
    });

    // --- 6. VERIFY SUBMIT ---
    formVerify.addEventListener('submit', async (e) => {
        e.preventDefault();
        otpError.style.display = 'none'; // Reset error display

        let otpValue = '';
        otpInputs.forEach(input => otpValue += input.value);

        if (otpValue.length < 4) {
            otpError.textContent = 'Please enter complete 4-digit code.';
            otpError.style.display = 'block';
            return;
        }

        const btn = formVerify.querySelector('button');
        const originalText = btn.innerText;
        btn.innerText = 'Verifying...';
        btn.disabled = true;

        const formData = new FormData();
        formData.append('otp', otpValue);

        try {
            const response = await fetch('/verify-validation-otp', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                // Clear storage
                sessionStorage.removeItem('otp_next_allowed_time');
                if (resendTimer) clearInterval(resendTimer);
                
                showToast('Account verified successfully!', 'success');
                
                // Redirect ke Login
                setTimeout(() => {
                    window.location.href = '/auth';
                }, 1500);
            } else {
                // Tampilkan Error Persis Forgot Password Style
                otpError.textContent = result.message; // "Invalid verification code."
                otpError.style.display = 'block';
            }
        } catch (err) {
            otpError.textContent = 'An error occurred. Please try again.';
            otpError.style.display = 'block';
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    });

    // Jalankan logika timer saat load
    checkAutoSendStatus();
});