document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.querySelector('.register-form');

    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();

            const submitBtn = this.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Sending... <i class="bi bi-arrow-repeat spin"></i>';

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
                    // نمایش پیام موفقیت
                    showAlertMessage(data.notification || 'OTP code sent successfully!', 'success');

                    // اگر نیاز به نمایش فرم تأیید است
                    if (data.phone) {
                        document.getElementById('registration-form-container').classList.add('d-none');
                        document.getElementById('verification-form-container').classList.remove('d-none');
                        document.getElementById('user-phone').textContent = data.phone;
                    }
                } else {
                    // نمایش خطاها
                    if (data.errors) {
                        showFormErrors(data.errors);
                    }
                    showAlertMessage(data.error || 'Registration failed!', 'danger');
                }
            } catch (error) {
                showAlertMessage('Network error! Please try again.', 'danger');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'CREATE ACCOUNT <i class="bi bi-arrow-right"></i>';
            }
        });
    }

    function showAlertMessage(message, type) {
        // پاک کردن پیام‌های قبلی
        const oldAlerts = document.querySelectorAll('.custom-alert');
        oldAlerts.forEach(alert => alert.remove());

        const heroSection = document.querySelector('#home .container');
        if (!heroSection) return;

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

        // نمایش انیمیشن
        setTimeout(() => {
            alertDiv.classList.add('show');
        }, 10);

        // خودکار بسته شدن پس از 5 ثانیه
        setTimeout(() => {
            alertDiv.classList.remove('show');
            setTimeout(() => alertDiv.remove(), 300);
        }, 5000);
    }

    function showFormErrors(errors) {
        // پیاده‌سازی نمایش خطاهای فرم (اختیاری)
        console.log('Form errors:', errors);
    }
});

// برای آیکون چرخشی (اگر نیاز دارید)
const style = document.createElement('style');
style.innerHTML = `
    .spin { animation: spin 1s linear infinite; }
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
