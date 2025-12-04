document.addEventListener('DOMContentLoaded', () => {

    // --- 1. INISIALISASI ELEMEN DOM ---
    const step1 = document.getElementById('step-1-email');
    const step2 = document.getElementById('step-2-otp');
    // step3 dihapus karena tidak digunakan lagi

    const form1 = document.getElementById('form-send-otp');
    const form2 = document.getElementById('form-verify-otp');

    const error1 = document.getElementById('step-1-error');
    const error2 = document.getElementById('step-2-error');

    const toastContainer = document.getElementById('toast-container');
    const resendLink = document.getElementById('resend-link');

    // --- 2. VARIABEL GLOBAL ---
    let currentEmail = ''; 
    let resendTimer = null;
    let timeLeft = 30;

    // --- 3. FUNGSI TOAST ---
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

    // --- 4. TIMER RESEND ---
    function startResendTimer() {
        if (!resendLink) return;
        if (resendTimer) clearInterval(resendTimer);
        timeLeft = 30;

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
                resendLink.textContent = 'Resend';
                resendLink.style.pointerEvents = 'auto';
                resendLink.style.color = '#1A3E7F';
                resendLink.style.cursor = 'pointer';
                resendLink.style.fontWeight = '600';
            }
        }, 1000);
    }

    // --- 5. KIRIM OTP (STEP 1 - AUTO/MANUAL) ---
    form1.addEventListener('submit', async (e) => {
        e.preventDefault();
        error1.style.display = 'none';
        const formData = new FormData(form1);
        currentEmail = formData.get('email');

        const btn = form1.querySelector('button');
        const originalText = btn.innerText;
        btn.innerText = 'Sending...';
        btn.disabled = true;

        try {
            const response = await fetch('/send-validation-otp', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                step1.style.display = 'none';
                step2.style.display = 'block';
                startResendTimer();
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

    // --- 6. AUTO-FOCUS OTP INPUT ---
    const otpInputs = document.querySelectorAll('.otp-inputs input');
    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            e.target.value = e.target.value.replace(/[^0-9]/g, '');
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

    // --- 7. VERIFIKASI OTP (STEP 2) - UPDATED ---
    form2.addEventListener('submit', async (e) => {
        e.preventDefault();
        error2.style.display = 'none';

        let otpValue = '';
        otpInputs.forEach(input => otpValue += input.value);

        if (otpValue.length < 4) {
            error2.textContent = 'Please enter complete code.';
            error2.style.display = 'block';
            return;
        }

        const formData = new FormData();
        formData.append('otp', otpValue);

        try {
            const response = await fetch('/verify-validation-otp', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                // Hentikan timer jika ada
                if (resendTimer) clearInterval(resendTimer);
                
                // LANGSUNG REDIRECT KE LOGIN TANPA TAMPILAN LAIN
                window.location.href = '/auth';
                
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

    // --- 8. KLIK RESEND ---
    if (resendLink) {
        resendLink.addEventListener('click', async (e) => {
            e.preventDefault();
            
            if (timeLeft <= 0) {
                resendLink.style.pointerEvents = 'none';
                resendLink.textContent = 'Sending...';

                const formData = new FormData();
                if(currentEmail) formData.append('email', currentEmail);

                try {
                    const response = await fetch('/send-validation-otp', {
                        method: 'POST',
                        body: formData
                    });
                    const result = await response.json();

                    if (result.success) {
                        showToast('OTP resent successfully!', 'success');
                        startResendTimer();
                    } else {
                        showToast('Failed: ' + result.message, 'error');
                        resendLink.textContent = 'Resend';
                        resendLink.style.pointerEvents = 'auto';
                    }
                } catch (err) {
                    showToast('Network error.', 'error');
                    resendLink.textContent = 'Resend';
                    resendLink.style.pointerEvents = 'auto';
                }
            }
        });
    }
    
    // Auto trigger send otp logic (jika ada function terpisah)
    const statusText = document.getElementById('otp-status-text');
    const otpError = document.getElementById('otp-error');
    
    // --- AUTO SEND OTP FUNCTION (Jika mode auto-send aktif di HTML) ---
    if(statusText) {
        async function sendOtpAutomatic() {
            statusText.textContent = "Sending verification code...";
            statusText.style.color = "#1a3e7f";
            if(resendLink) resendLink.style.pointerEvents = 'none'; 
            
            try {
                const response = await fetch('/send-validation-otp', { method: 'POST' });
                const result = await response.json();

                if (result.success) {
                    statusText.textContent = "Verification code sent!";
                    statusText.style.color = "#15803d"; 
                    showToast('Code sent to your email!', 'success');
                    startResendTimer();
                } else {
                    statusText.textContent = "Failed to send code.";
                    statusText.style.color = "#c90004";
                    if(otpError) {
                        otpError.textContent = result.message;
                        otpError.style.display = 'block';
                    }
                    if(result.message.includes('tidak ditemukan')) {
                        setTimeout(() => window.location.href = '/auth', 3000);
                    }
                }
            } catch (err) {
                console.error(err);
                statusText.textContent = "Network error.";
                statusText.style.color = "#c90004";
            }
        }
        sendOtpAutomatic();
    }
});