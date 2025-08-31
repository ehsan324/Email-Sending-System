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

        if (!groupRecipient && individualRecipients.selectedOptions.length === 0) {
            showAlert('لطفاً حداقل یک گروه یا گیرنده انتخاب کنید.', 'danger');
            return;
        }

        showAlert('در حال ارسال پیام...', 'info');
        console.log('Sending request to:', '/send-group-email/');
        fetch('/message/send-group/', {
            method: 'POST',
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network Error');
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
            showAlert('Error in sending, try it again.', 'danger');
        });
    }

    function saveAsDraft() {

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
        showAlert('Default message saved.', 'success');
    }

    function loadDraft() {
        const draft = localStorage.getItem('groupMessageDraft');
        if (draft) {
            const formData = JSON.parse(draft);
            document.getElementById('group-recipient').value = formData.recipient;

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

    function showAlert(message, type) {
        const existingAlert = document.querySelector('.alert');
        if (existingAlert) {
            existingAlert.remove();
        }

        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;

        const cardBody = document.querySelector('.card-body');
        cardBody.insertBefore(alertDiv, cardBody.firstChild);

        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, 5000);
    }


});