document.addEventListener('DOMContentLoaded', function () {
    const loginForm = document.querySelector('.login-form');
    const verificationInputs = document.querySelectorAll('.verification-digit');
    const hiddenCodeInput = document.getElementById('verificate_code');

    // اگر فرم تأیید از ابتدا نمایش داده شده باشد
    if (!document.getElementById('verificate-form-container').classList.contains('d-none')) {
        startCountdown();
    }

    // مدیریت ورود کد تأیید (بدون تغییر)
    verificationInputs.forEach((input, index) => {
        input.addEventListener('input', function () {
            if (this.value.length === 1) {
                if (index < verificationInputs.length - 1) {
                    verificationInputs[index + 1].focus();
                }
                updateHiddenCode();
            }
        });

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Backspace' && this.value.length === 0 && index > 0) {
                verificationInputs[index - 1].focus();
            }
        });
    });

    function updateHiddenCode() {
        hiddenCodeInput.value = Array.from(verificationInputs).map(input => input.value).join('');
    }

    // ================= تغییرات اصلی اینجا =================
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const submitBtn = this.querySelector('button[type="submit"]');
            const spinner = submitBtn.querySelector('.spinner-border');
            const btnText = submitBtn.querySelector('.btn-text');

            // حالت Loading
            submitBtn.disabled = true;
            spinner.classList.remove('d-none');
            btnText.textContent = 'Sending...';

            try {
                const response = await fetch(this.action, {
                    method: 'POST',
                    body: new FormData(this),
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRFToken': this.querySelector('[name=csrfmiddlewaretoken]').value
                    }
                });

                const data = await response.json();

                if (data.success) {
                    // نمایش پیام موفقیت مانند Register
                    showAlertMessage(data.notification || 'Verification code sent!', 'success');

                    // انتقال به فرم تأیید
                    document.getElementById('login-form-container').classList.add('d-none');
                    document.getElementById('verificate-form-container').classList.remove('d-none');
                    document.getElementById('user-phone_number').textContent = data.phone_number;
                    startCountdown();
                } else {
                    // نمایش خطاها به سبک Register
                    if (data.errors) {
                        for (const field in data.errors) {
                            showAlertMessage(data.errors[field][0], 'danger');
                        }
                    } else {
                        showAlertMessage(data.error || 'Login failed!', 'danger');
                    }
                }


            } catch (error) {
                showAlertMessage('Server connection error!', 'danger');
                console.error('Error:', error);
            } finally {
                submitBtn.disabled = false;
                spinner.classList.add('d-none');
                btnText.textContent = 'Send Verification Code';
            }
        });
    }
    if (verifyForm) {
        verifyForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const submitBtn = this.querySelector('button[type="submit"]');
            const spinner = submitBtn.querySelector('.spinner-border');
            const btnText = submitBtn.querySelector('.btn-text');

            // حالت Loading
            submitBtn.disabled = false;


            try {
                const response = await fetch(this.action, {
                    method: 'POST',
                    body: new FormData(this),
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest',
                        'X-CSRFToken': this.querySelector('[name=csrfmiddlewaretoken]').value
                    }
                });

                const data = await response.json();

                if (data.success) {
                    // نمایش پیام موفقیت مانند Register
                    window.location.href = data.redirect_url;
                    showAlertMessage(data.notification || 'Login successful!', 'success');


                } else {
                    // نمایش خطاها به سبک Register
                    if (data.errors) {
                        for (const field in data.errors) {
                            showAlertMessage(data.errors[field][0], 'danger');
                        }
                    } else {
                        showAlertMessage(data.error || 'Login failed!', 'danger');
                    }
                }


            } catch (error) {
                showAlertMessage('Server connection error!', 'danger');
                console.error('Error:', error);
            } finally {
                submitBtn.disabled = false;
                spinner.classList.add('d-none');
                btnText.textContent = 'Send Verification Code';
            }
        });
    }

    // ================= توابع بدون تغییر =================
    function startCountdown() {
        let seconds = 60;
        const countdownElement = document.getElementById('countdown');
        const resendLink = document.getElementById('resend-code');

        if (window.countdownTimer) {
            clearInterval(window.countdownTimer);
        }

        resendLink.classList.add('d-none');
        countdownElement.classList.remove('d-none');

        window.countdownTimer = setInterval(() => {
            seconds--;
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            countdownElement.textContent = `Code expires in ${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;

            if (seconds <= 0) {
                clearInterval(window.countdownTimer);
                resendLink.classList.remove('d-none');
                countdownElement.classList.add('d-none');
            }
        }, 1000);
    }

    function showPhoneForm() {
        document.getElementById('login-form-container').classList.remove('d-none');
        document.getElementById('verificate-form-container').classList.add('d-none');
    }

    // تابع نمایش پیام (مشابه Register)
    function showAlertMessage(message, type) {
        const oldAlerts = document.querySelectorAll('.custom-alert');
        oldAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `custom-alert alert alert-${type} alert-dismissible fade show`;
        alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999;';
        alertDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi ${type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill'} me-2"></i>
                <span>${message}</span>
                <button type="button" class="btn-close ms-auto" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        document.body.appendChild(alertDiv);

        setTimeout(() => {
            alertDiv.classList.add('show');
        }, 10);

        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }
});