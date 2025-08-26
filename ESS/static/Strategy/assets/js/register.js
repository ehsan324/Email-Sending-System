document.addEventListener('DOMContentLoaded', function () {
    // ثبت‌نام فرم
    const registerForm = document.querySelector('.register-form');
    // فرم تأیید
    const verifyForm = document.getElementById('verify-form');
    // لینک ارسال مجدد کد
    const resendCodeLink = document.getElementById('resend-code');
    // تایمر شمارش معکوس
    const countdownElement = document.getElementById('countdown');

    // مدیریت فرم ثبت‌نام
    if (registerForm) {
        registerForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            await handleFormSubmission(this, 'CREATE ACCOUNT');
        });
    }

    // مدیریت فرم تأیید
    if (verifyForm) {
        verifyForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            await handleFormSubmission(this, 'VERIFY ACCOUNT');
        });
    }

    // مدیریت ارسال مجدد کد
    if (resendCodeLink) {
        resendCodeLink.addEventListener('click', function (e) {
            e.preventDefault();
            resendVerificationCode();
        });
    }

    // شروع تایمر شمارش معکوس اگر وجود دارد
    if (countdownElement && countdownElement.textContent.includes('60s')) {
        startCountdown(60);
    }

    // تابع اصلی برای ارسال فرم‌ها
    async function handleFormSubmission(form, defaultButtonText) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        const phoneInput = form.querySelector('input[name="phone_number"]');
        if (phoneInput) {
            const phonePattern = /^09[0-9]{9}$/;
            if (!phonePattern.test(phoneInput.value)) {
                showAlertMessage('لطفاً یک شماره تلفن معتبر وارد کنید (مانند: 09123456789)', 'danger');

                // هایلایت کردن فیلد مشکل‌دار
                phoneInput.classList.add('is-invalid');

                // تمرکز روی فیلد مشکل‌دار
                phoneInput.focus();
                return;


        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Processing... <i class="bi bi-arrow-repeat spin"></i>';

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                body: new FormData(form),
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': getCSRFToken()
                }
            });

            const data = await response.json();

            if (data.success) {
                showAlertMessage(data.message || data.notification || 'Operation successful!', 'success');

                // پردازش پاسخ موفق
                if (data.phone) {
                    // نمایش فرم تأیید و مخفی کردن فرم ثبت‌نام
                    document.getElementById('registration-form-container').classList.add('d-none');
                    document.getElementById('verification-form-container').classList.remove('d-none');
                    document.getElementById('user-phone').textContent = data.phone;

                    // شروع شمارش معکوس برای ارسال مجدد کد
                    startCountdown(60);
                }

                // ریدایرکت در صورت وجود
                if (data.redirect) {
                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 1500);
                }

                // ریدایرکت در صورت موفقیت‌آمیز بودن تأیید
                if (form.id === 'verify-form' && !data.redirect) {
                    setTimeout(() => {
                        window.location.href = "{% url 'home:index' %}";
                    }, 1500);
                }
            } else {
                // نمایش خطاها
                if (data.errors) {
                    showFormErrors(data.errors, form);
                }
                showAlertMessage(data.error || 'Operation failed!', 'danger');

                // ریدایرکت در صورت منقضی شدن سشن
                if (data.redirect) {
                    setTimeout(() => {
                        window.location.href = data.redirect;
                    }, 1500);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            showAlertMessage('Network error! Please try again.', 'danger');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
        }
    }

    // تابع ارسال مجدد کد تأیید
    async function resendVerificationCode() {
        if (resendCodeLink.classList.contains('disabled')) {
            return;
        }

        try {
            const response = await fetch("{% url 'User:user-resend-code' %}", {
                method: 'POST',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': getCSRFToken(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone: document.getElementById('user-phone').textContent
                })
            });

            const data = await response.json();

            if (data.success) {
                showAlertMessage(data.message || 'Verification code sent successfully!', 'success');
                startCountdown(60);
            } else {
                showAlertMessage(data.error || 'Failed to resend code!', 'danger');
            }
        } catch (error) {
            console.error('Error:', error);
            showAlertMessage('Network error! Please try again.', 'danger');
        }
    }

    // تابع شروع شمارش معکوس
    function startCountdown(seconds) {
        if (resendCodeLink && countdownElement) {
            resendCodeLink.classList.add('disabled');
            resendCodeLink.style.pointerEvents = 'none';
            resendCodeLink.style.opacity = '0.5';

            let remaining = seconds;

            const countdownInterval = setInterval(() => {
                countdownElement.textContent = `(${remaining}s)`;
                remaining--;

                if (remaining < 0) {
                    clearInterval(countdownInterval);
                    resendCodeLink.classList.remove('disabled');
                    resendCodeLink.style.pointerEvents = 'auto';
                    resendCodeLink.style.opacity = '1';
                    countdownElement.textContent = '';
                }
            }, 1000);
        }
    }

    // تابع دریافت توکن CSRF
    function getCSRFToken() {
        const csrfInput = document.querySelector('[name=csrfmiddlewaretoken]');
        return csrfInput ? csrfInput.value : '';
    }

    // تابع نمایش پیام
    function showAlertMessage(message, type) {
        // پاک کردن پیام‌های قبلی
        const oldAlerts = document.querySelectorAll('.custom-alert');
        oldAlerts.forEach(alert => alert.remove());

        const alertDiv = document.createElement('div');
        alertDiv.className = `custom-alert alert alert-${type} alert-dismissible fade show`;
        alertDiv.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 9999; min-width: 300px;';

        const icon = type === 'success' ? 'bi-check-circle-fill' : 'bi-exclamation-circle-fill';

        alertDiv.innerHTML = `
            <div class="d-flex align-items-center">
                <i class="bi ${icon} me-2"></i>
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
            if (alertDiv.parentNode) {
                alertDiv.classList.remove('show');
                setTimeout(() => alertDiv.remove(), 300);
            }
        }, 5000);
    }

    // تابع نمایش خطاهای فرم
    function showFormErrors(errors, form) {
        // پاک کردن پیام‌های خطای قبلی
        const oldErrorAlerts = form.querySelectorAll('.alert.alert-danger');
        oldErrorAlerts.forEach(alert => alert.remove());

        // ایجاد یک پیام خطای جدید
        const errorAlert = document.createElement('div');
        errorAlert.className = 'alert alert-danger';
        errorAlert.innerHTML = '<strong>Please fix the following errors:</strong><ul></ul>';

        const errorList = errorAlert.querySelector('ul');

        // اضافه کردن هر خطا به لیست
        for (const [field, message] of Object.entries(errors)) {
            const listItem = document.createElement('li');

            // ترجمه نام فیلدها به انگلیسی برای نمایش بهتر
            const fieldNameMap = {
                'first_name': 'First Name',
                'last_name': 'Last Name',
                'email': 'Email',
                'phone_number': 'Phone Number',
                'code': 'Verification Code',
                'terms': 'Terms and Conditions'
            };

            const displayField = fieldNameMap[field] || field;
            listItem.textContent = `${displayField}: ${Array.isArray(message) ? message[0] : message}`;
            errorList.appendChild(listItem);

            // هایلایت کردن فیلد دارای خطا
            const inputField = form.querySelector(`[name="${field}"]`);
            if (inputField) {
                inputField.classList.add('is-invalid');

                // حذف هایلایت پس از 5 ثانیه
                setTimeout(() => {
                    inputField.classList.remove('is-invalid');
                }, 5000);
            }
        }

        // قرار دادن پیام خطا در بالای فرم
        form.insertBefore(errorAlert, form.firstChild);
    }

    // استایل برای آیکون چرخشی
    const style = document.createElement('style');
    style.innerHTML = `
        .spin { 
            animation: spin 1s linear infinite; 
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .custom-alert {
            transition: opacity 0.3s ease-in-out;
            opacity: 0;
        }
        .custom-alert.show {
            opacity: 1;
        }
        .is-invalid {
            border-color: #dc3545 !important;
        }
        #resend-code.disabled {
            pointer-events: none;
            opacity: 0.5;
        }
    `;
    document.head.appendChild(style);
});
