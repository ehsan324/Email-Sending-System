document.addEventListener('DOMContentLoaded', function() {
    const groupMessageForm = document.getElementById('group-message-form');
    const groupScheduleCheckbox = document.getElementById('group-schedule');
    const groupScheduleFields = document.getElementById('group-schedule-fields');
    const saveDraftButton = document.querySelector('.btn-outline-secondary');

    // نمایش/پنهان کردن فیلدهای زمان‌بندی
    if (groupScheduleCheckbox && groupScheduleFields) {
        groupScheduleCheckbox.addEventListener('change', function() {
            groupScheduleFields.style.display = this.checked ? 'block' : 'none';
        });
    }

    // مدیریت ذخیره پیش‌نویس
    if (saveDraftButton) {
        saveDraftButton.addEventListener('click', function() {
            saveAsDraft();
        });
    }

    // مدیریت ارسال فرم
    if (groupMessageForm) {
        groupMessageForm.addEventListener('submit', function(e) {
            e.preventDefault();
            sendGroupMessage();
        });
    }

    // تابع ارسال پیام گروهی
    function sendGroupMessage() {
        const formData = new FormData(groupMessageForm);

        // اعتبارسنجی اولیه
        const groupRecipient = document.getElementById('group-recipient').value;
        const individualRecipients = document.getElementById('individual-recipients');
        const subject = document.getElementById('group-subject').value;
        const message = document.getElementById('group-message').value;

        // بررسی اینکه حداقل یک گیرنده انتخاب شده باشد
        if (!groupRecipient && individualRecipients.selectedOptions.length === 0) {
            showAlert('لطفاً حداقل یک گروه یا گیرنده انتخاب کنید.', 'danger');
            return;
        }

        // نمایش وضعیت در حال ارسال
        showAlert('در حال ارسال پیام...', 'info');
        console.log('Sending request to:', '/send-group-email/');
        // ارسال درخواست به سرور
        fetch('/message/send-group/', {  // مطمئن شوید این URL با URL ویو شما مطابقت دارد
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('خطای شبکه');
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showAlert(data.message, 'success');
                groupMessageForm.reset();
                groupScheduleFields.style.display = 'none';
            } else {
                showAlert(data.message, 'danger');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert('خطا در ارسال پیام. لطفاً دوباره تلاش کنید.', 'danger');
        });
    }

    // تابع ذخیره به عنوان پیش‌نویس
    function saveAsDraft() {
        // این تابع می‌تواند پیام را در localStorage ذخیره کند
        // یا یک درخواست به سرور برای ذخیره پیش‌نویس ارسال کند
        const formData = {
            recipient: document.getElementById('group-recipient').value,
            recipients: Array.from(document.getElementById('individual-recipients').selectedOptions).map(opt => opt.value),
            subject: document.getElementById('group-subject').value,
            message: document.getElementById('group-message').value,
            personalize: document.getElementById('group-personalize').checked,
            schedule: document.getElementById('group-schedule').checked,
            schedule_date: document.getElementById('group-schedule-date').value,
            schedule_time: document.getElementById('group-schedule-time').value
        };

        localStorage.setItem('groupMessageDraft', JSON.stringify(formData));
        showAlert('پیام به عنوان پیش‌نویس ذخیره شد.', 'success');
    }

    // تابع برای بازیابی پیش‌نویس (در صورت نیاز)
    function loadDraft() {
        const draft = localStorage.getItem('groupMessageDraft');
        if (draft) {
            const formData = JSON.parse(draft);
            // پر کردن فرم با داده‌های پیش‌نویس
            document.getElementById('group-recipient').value = formData.recipient;

            // انتخاب گیرندگان فردی
            const individualSelect = document.getElementById('individual-recipients');
            Array.from(individualSelect.options).forEach(option => {
                option.selected = formData.recipients.includes(option.value);
            });

            document.getElementById('group-subject').value = formData.subject;
            document.getElementById('group-message').value = formData.message;
            document.getElementById('group-personalize').checked = formData.personalize;
            document.getElementById('group-schedule').checked = formData.schedule;

            if (formData.schedule) {
                document.getElementById('group-schedule-date').value = formData.schedule_date;
                document.getElementById('group-schedule-time').value = formData.schedule_time;
                groupScheduleFields.style.display = 'block';
            }

            showAlert('پیش‌نویس بازیابی شد.', 'info');
        }
    }

    // تابع کمکی برای دریافت کوکی
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }

    // تابع نمایش اعلان
    function showAlert(message, type) {
        // حذف اعلان‌های قبلی
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        // ایجاد اعلان جدید
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        // قرار دادن اعلان در بالای فرم
        const cardBody = document.querySelector('.card-body');
        cardBody.insertBefore(alertDiv, cardBody.firstChild);

        // حذف خودکار اعلان پس از 5 ثانیه
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }

    // بارگذاری خودکار پیش‌نویس هنگام بارگذاری صفحه
    // loadDraft(); // در صورت نیاز می‌توانید این خط را فعال کنید
});