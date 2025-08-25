document.addEventListener('DOMContentLoaded', function() {
    // عناصر فرم
    const groupMessageForm = document.getElementById('group-message-form');
    const groupRecipients = document.getElementById('group-recipients');
    const individualRecipients = document.getElementById('individual-recipients');
    const groupSubject = document.getElementById('group-subject');
    const groupMessage = document.getElementById('group-message');
    const groupSchedule = document.getElementById('group-schedule');
    const scheduleFields = document.getElementById('group-schedule-fields');

    // مدیریت نمایش فیلدهای زمانبندی
    if (groupSchedule && scheduleFields) {
        groupSchedule.addEventListener('change', function() {
            scheduleFields.style.display = this.checked ? 'block' : 'none';
        });
    }

    // اعتبارسنجی فرم قبل از ارسال
    if (groupMessageForm) {
        groupMessageForm.addEventListener('submit', function(e) {
            e.preventDefault();

            // بررسی انتخاب گیرندگان
            const selectedGroups = Array.from(groupRecipients.selectedOptions).map(opt => opt.value);
            const selectedContacts = Array.from(individualRecipients.selectedOptions).map(opt => opt.value);

            if (selectedGroups.length === 0 && selectedContacts.length === 0) {
                showAlert('لطفاً حداقل یک گروه یا مخاطب انتخاب کنید', 'error');
                return;
            }

            // بررسی موضوع و متن پیام
            if (!groupSubject.value.trim()) {
                showAlert('لطفاً موضوع ایمیل را وارد کنید', 'error');
                groupSubject.focus();
                return;
            }

            if (!groupMessage.value.trim()) {
                showAlert('لطفاً متن ایمیل را وارد کنید', 'error');
                groupMessage.focus();
                return;
            }

            // اگر زمانبندی فعال است، بررسی تاریخ و زمان
            if (groupSchedule.checked) {
                const scheduleDate = document.getElementById('group-schedule-date').value;
                const scheduleTime = document.getElementById('group-schedule-time').value;

                if (!scheduleDate || !scheduleTime) {
                    showAlert('لطفاً تاریخ و زمان ارسال را مشخص کنید', 'error');
                    return;
                }

                const scheduleDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
                const now = new Date();

                if (scheduleDateTime <= now) {
                    showAlert('زمان ارسال باید در آینده باشد', 'error');
                    return;
                }
            }

            // جمع‌آوری داده‌های فرم
            const formData = new FormData(groupMessageForm);
            formData.append('selected_groups', JSON.stringify(selectedGroups));
            formData.append('selected_contacts', JSON.stringify(selectedContacts));

            // نمایش اسپینر و غیرفعال کردن دکمه ارسال
            const submitBtn = groupMessageForm.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> در حال ارسال...';
            submitBtn.disabled = true;

            // ارسال درخواست AJAX
            fetch(groupMessageForm.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRFToken': getCookie('csrftoken'),
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    showAlert(data.message, 'success');
                    groupMessageForm.reset();

                    // اگر زمانبندی شده، پیام مناسب نمایش داده شود
                    if (groupSchedule.checked) {
                        showAlert('ایمیل‌ها با موفقیت زمانبندی شدند', 'info');
                    }
                } else {
                    showAlert(data.message || 'خطا در ارسال ایمیل', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert('خطا در ارتباط با سرور', 'error');
            })
            .finally(() => {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            });
        });
    }

    // تابع نمایش پیام‌ها
    function showAlert(message, type) {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        const container = groupMessageForm.querySelector('.card-body');
        container.insertBefore(alertDiv, container.firstChild);

        // حذف خودکار پیام بعد از 5 ثانیه
        setTimeout(() => {
            alertDiv.remove();
        }, 5000);
    }

    // تابع دریافت کوکی
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

    // بهبود انتخاب گروه‌ها و مخاطبین با Select2 (اگر کتابخانه موجود باشد)
    if (typeof $.fn.select2 !== 'undefined') {
        $(groupRecipients).select2({
            placeholder: "گروه‌ها را انتخاب کنید",
            allowClear: true
        });

        $(individualRecipients).select2({
            placeholder: "مخاطبین را انتخاب کنید",
            allowClear: true
        });
    }

    // نمایش تعداد مخاطبین انتخاب شده
    function updateRecipientCount() {
        const groupCount = groupRecipients.selectedOptions.length;
        const contactCount = individualRecipients.selectedOptions.length;
        const total = groupCount + contactCount;

        let countElement = document.getElementById('recipient-count');
        if (!countElement) {
            countElement = document.createElement('small');
            countElement.id = 'recipient-count';
            countElement.className = 'text-muted d-block mt-1';
            groupRecipients.parentNode.appendChild(countElement);
        }

        if (total > 0) {
            countElement.textContent = `${total} مخاطب انتخاب شده است (${groupCount} گروه، ${contactCount} مخاطب تکی)`;
        } else {
            countElement.textContent = 'هیچ مخاطبی انتخاب نشده است';
        }
    }

    groupRecipients.addEventListener('change', updateRecipientCount);
    individualRecipients.addEventListener('change', updateRecipientCount);
    updateRecipientCount();
});