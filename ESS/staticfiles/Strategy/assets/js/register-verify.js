document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const registrationFormContainer = document.getElementById('registration-form-container');
    const verificationFormContainer = document.getElementById('verification-form-container');
    const resendBtn = document.getElementById('resend-code');
    const countdownEl = document.getElementById('countdown');
    const userPhoneEl = document.getElementById('user-phone');

    // Initialize countdown if elements exist
    if (resendBtn && countdownEl) {
        let timeLeft = 60;

        // Disable resend button initially
        resendBtn.style.pointerEvents = 'none';
        resendBtn.style.opacity = '0.5';

        // Start countdown timer
        const timer = setInterval(() => {
            timeLeft--;
            countdownEl.textContent = `(${timeLeft}s)`;

            if (timeLeft <= 0) {
                clearInterval(timer);
                enableResendButton();
            }
        }, 1000);

        // Resend code handler
        resendBtn.addEventListener('click', function(e) {
            e.preventDefault();
            resendVerificationCode();
        });
    }

    // Enable resend button
    function enableResendButton() {
        resendBtn.style.pointerEvents = 'auto';
        resendBtn.style.opacity = '1';
        countdownEl.style.display = 'none';
    }

    // Resend verification code
    function resendVerificationCode() {
        // Show loading state
        resendBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Sending...';

        // Simulate API call (replace with actual fetch/AJAX)
        setTimeout(() => {
            // Reset countdown
            let timeLeft = 60;
            countdownEl.style.display = 'inline';
            countdownEl.textContent = `(${timeLeft}s)`;

            // Disable button again
            resendBtn.innerHTML = 'Resend code';
            resendBtn.style.pointerEvents = 'none';
            resendBtn.style.opacity = '0.5';

            // Start new countdown
            const newTimer = setInterval(() => {
                timeLeft--;
                countdownEl.textContent = `(${timeLeft}s)`;

                if (timeLeft <= 0) {
                    clearInterval(newTimer);
                    enableResendButton();
                }
            }, 1000);

            // Show success message
            showToast('New verification code sent to ' + userPhoneEl.textContent);
        }, 1500);
    }

    // Helper function to show toast messages
    function showToast(message) {
        // You can replace this with your preferred toast/notification system
        const toast = document.createElement('div');
        toast.className = 'toast-notification bg-success text-white';
        toast.innerHTML = `
            <div class="toast-body">
                <i class="bi bi-check-circle me-2"></i>
                ${message}
            </div>
        `;

        document.body.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(toast);
                }, 300);
            }, 3000);
        }, 100);
    }
});