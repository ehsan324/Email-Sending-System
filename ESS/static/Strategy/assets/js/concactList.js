document.addEventListener('DOMContentLoaded', function() {
    // تابع برای لود و نمایش لیست مخاطبین
    function loadContactList() {
        fetch('/contact/contact-list/')
            .then(response => response.json())
            .then(data => {
                renderContactList(data.contacts);
            })
            .catch(error => console.error('Error loading contacts:', error));
    }

    // تابع برای رندر لیست مخاطبین
    function renderContactList(contacts) {
        const contactListContainer = document.getElementById('contact-list-container');

        if (!contactListContainer) {
            console.error('Contact list container not found');
            return;
        }

        if (contacts.length === 0) {
            contactListContainer.innerHTML = `
                <div class="alert alert-info">No contacts found</div>
            `;
            return;
        }

        let html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Phone</th>
                    </tr>
                </thead>
                <tbody>
        `;

        contacts.forEach(contact => {
            html += `
                <tr>
                    <td>${contact.first_name} ${contact.last_name}</td>
                    <td>${contact.email}</td>
                    <td>${contact.phone || '-'}</td>
                </tr>
            `;
        });

        html += `
                </tbody>
            </table>
        </div>
        `;

        contactListContainer.innerHTML = html;
    }

    // مدیریت کلیک روی منوی Contact List
    const contactListLink = document.querySelector('.nav-link[data-content="contact-list"]');
    if (contactListLink) {
        contactListLink.addEventListener('click', function(e) {
            e.preventDefault();

            // مخفی کردن تمام بخش‌ها
            document.querySelectorAll('.dashboard-content').forEach(content => {
                content.classList.remove('active');
                content.classList.add('d-none');
            });

            // نمایش بخش contact-list
            const contactListContent = document.getElementById('contact-list-content');
            if (contactListContent) {
                contactListContent.classList.remove('d-none');
                contactListContent.classList.add('active');
                loadContactList();
            }
        });
    }
});