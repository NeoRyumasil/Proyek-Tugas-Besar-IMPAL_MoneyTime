document.addEventListener('DOMContentLoaded', () => {

    // Get the steps
    const step1 = document.getElementById('step-1-email');
    const step2 = document.getElementById('step-2-otp');
    const step3 = document.getElementById('step-3-password');

    // Get the forms
    const form1 = document.getElementById('form-send-otp');
    const form2 = document.getElementById('form-verify-otp');
    const form3 = document.getElementById('form-update-password');

    // Get error divs
    const error1 = document.getElementById('step-1-error');
    const error2 = document.getElementById('step-2-error');
    const error3 = document.getElementById('step-3-error');

    // Toast container
    const toastContainer = document.getElementById('toast-container');

    // Function to show toast
    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);

        // Trigger animation
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);

        // Remove toast after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                toastContainer.removeChild(toast);
            }, 300);
        }, 3000);
    }

    // Handle Form 1: Send OTP
    form1.addEventListener('submit', async (e) => {
        e.preventDefault();
        error1.style.display = 'none';
        const formData = new FormData(form1);

        try {
            const response = await fetch('/send-otp', {
                method: 'POST',
                body: formData
            });
            const result = await response.json();

            if (result.success) {
                step1.style.display = 'none'; // Hide step 1
                step2.style.display = 'block'; // Show step 2
                showToast('OTP sent to your email!', 'success');
            } else {
                error1.textContent = result.message;
                error1.style.display = 'block';
                showToast(result.message, 'error');
            }
        } catch (err) {
            error1.textContent = 'An error occurred. Please try again.';
            error1.style.display = 'block';
            showToast('An error occurred. Please try again.', 'error');
        }
    });

    // OTP Input Handling
    const otpInputs = document.querySelectorAll('.otp-inputs input');
    let otpValue = '';

    otpInputs.forEach((input, index) => {
        input.addEventListener('input', (e) => {
            // Allow only numbers
            e.target.value = e.target.value.replace(/[^0-9]/g, '');

            // Move to next input if current is filled
            if (e.target.value && index < otpInputs.length - 1) {
                otpInputs[index + 1].focus();
            }

            // Update OTP value
            updateOtpValue();
        });

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' && !e.target.value && index > 0) {
                otpInputs[index - 1].focus();
            }
        });

        input.addEventListener('paste', (e) => {
            e.preventDefault();
            const paste = e.clipboardData.getData('text');
            const pasteArray = paste.split('').slice(0, 4);

            pasteArray.forEach((char, i) => {
                if (otpInputs[index + i] && char.match(/[0-9]/)) {
                    otpInputs[index + i].value = char;
                }
            });

            updateOtpValue();
            // Focus next empty input or last input
            const nextEmpty = Array.from(otpInputs).find(inp => !inp.value);
            if (nextEmpty) {
                nextEmpty.focus();
            } else {
                otpInputs[otpInputs.length - 1].focus();
            }
        });
    });

    function updateOtpValue() {
        otpValue = Array.from(otpInputs).map(input => input.value).join('');
    }

    // Handle Form 2: Verify OTP
    form2.addEventListener('submit', async (e) => {
        e.preventDefault();
        error2.style.display = 'none';

        if (otpValue.length !== 4) {
            error2.textContent = 'Please enter the complete 4-digit code.';
            error2.style.display = 'block';
            showToast('Please enter the complete 4-digit code.', 'error');
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
                step2.style.display = 'none'; // Hide step 2
                step3.style.display = 'block'; // Show step 3
                showToast('Email verified successfully!', 'success');
            } else {
                error2.textContent = result.message;
                error2.style.display = 'block';
                showToast(result.message, 'error');
            }
        } catch (err) {
            error2.textContent = 'An error occurred. Please try again.';
            error2.style.display = 'block';
            showToast('An error occurred. Please try again.', 'error');
        }
    });

    // Timer for resend OTP
    let resendTimer = null;
    let timeLeft = 30;

    function startResendTimer() {
        const resendLink = document.querySelector('.resend-text a');
        resendLink.style.pointerEvents = 'none';
        resendLink.style.color = '#ccc';
        resendLink.textContent = `Resend in ${timeLeft}s`;

        resendTimer = setInterval(() => {
            timeLeft--;
            resendLink.textContent = `Resend in ${timeLeft}s`;

            if (timeLeft <= 0) {
                clearInterval(resendTimer);
                resendLink.style.pointerEvents = 'auto';
                resendLink.style.color = '#1A3E7F';
                resendLink.textContent = 'Resend';
                timeLeft = 30;
            }
        }, 1000);
    }

    // Start timer when step 2 is shown
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
                const target = mutation.target;
                if (target.id === 'step-2-otp' && target.style.display === 'block') {
                    startResendTimer();
                }
            }
        });
    });

    observer.observe(step2, { attributes: true, attributeFilter: ['style'] });

    // Handle resend link click
    document.querySelector('.resend-text a').addEventListener('click', (e) => {
        e.preventDefault();
        if (timeLeft === 30) {
            // Simulate resend OTP
            showToast('OTP resent to your email!', 'success');
            startResendTimer();
        }
    });

    // Handle Form 3: Update Password
    form3.addEventListener('submit', async (e) => {
        e.preventDefault();
        error3.style.display = 'none';

        const newPass = document.getElementById('new-password').value;
        const confirmPass = document.getElementById('confirm-password').value;

        if (newPass !== confirmPass) {
            error3.textContent = 'Passwords do not match.';
            error3.style.display = 'block';
            showToast('Passwords do not match.', 'error');
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
                // Redirect to login page after a short delay
                setTimeout(() => {
                    window.location.href = '/auth'; // Redirect to your login page
                }, 1500);
            } else {
                error3.textContent = result.message;
                error3.style.display = 'block';
                showToast(result.message, 'error');
            }
        } catch (err) {
            error3.textContent = 'An error occurred. Please try again.';
            error3.style.display = 'block';
            showToast('An error occurred. Please try again.', 'error');
        }
    });

    // --- Password Toggle Function (copied from your scriptRegisLogin.js) ---
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

    setupPasswordToggle('new-password', 'toggle-new-password');
    setupPasswordToggle('confirm-password', 'toggle-confirm-password');
});
