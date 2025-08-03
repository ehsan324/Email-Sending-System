document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('create-group-form');
    const contactsContainer = document.getElementById('contacts-selection');

    // بارگذاری مخاطبین هنگام نمایش فرم
    document.querySelector('[data-content="create-group"]').addEventListener('click', loadContacts);

    // ارسال فرم
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        createGroup();
    });

    // تابع بارگذاری مخاطبین
    function loadContacts() {
        fetch('/contact/contact-list/')
            .then(response => response.json())
            .then(data => {
                renderContacts(data.contacts);
            })
            .catch(error => {
                console.error('Error:', error);
                contactsContainer.innerHTML = `
                    <div class="alert alert-danger">
                        Failed to load contacts. Please try again.
                    </div>
                `;
            });
    }

    // نمایش لیست مخاطبین
    function renderContacts(contacts) {
        if (!contacts || contacts.length === 0) {
            contactsContainer.innerHTML = `
                <div class="alert alert-info">
                    No contacts found. <a href="#" data-content="add-contact">Add contacts first</a>.
                </div>
            `;
            return;
        }

        let html = '';
        contacts.forEach(contact => {
            html += `
                <div class="form-check mb-2">
                    <input class="form-check-input" type="checkbox" 
                           id="contact-${contact.id}" name="contacts" value="${contact.id}">
                    <label class="form-check-label" for="contact-${contact.id}">
                        ${contact.first_name} ${contact.last_name || ''} (${contact.email})
                    </label>
                </div>
            `;
        });

        contactsContainer.innerHTML = html;
    }

    // تابع ایجاد گروه
    function createGroup() {
        const formData = new FormData(form);
        const submitBtn = document.getElementById('submit-group');
        const spinner = document.getElementById('group-spinner');

        // اعتبارسنجی
        if (!formData.get('group_name') || !formData.getAll('contacts').length) {
            form.classList.add('was-validated');
            return;
        }

        // نمایش اسپینر
        submitBtn.disabled = true;
        spinner.classList.remove('d-none');

        // ارسال درخواست
        fetch('/contact/create-group/', {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                showAlert('Group created successfully!', 'success');
                // ریست فرم
                form.reset();
                form.classList.remove('was-validated');
                // رفتن به لیست گروه‌ها یا انجام عملیات دیگر
            } else {
                throw new Error(data.message || 'Failed to create group');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            showAlert(error.message, 'danger');
        })
        .finally(() => {
            submitBtn.disabled = false;
            spinner.classList.add('d-none');
        });
    }

    // توابع کمکی
    function showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        document.getElementById('create-group-content').prepend(alert);

        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    function getCookie(name) {
        // تابع موجود برای دریافت CSRF Token
    }
});