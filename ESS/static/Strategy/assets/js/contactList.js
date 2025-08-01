document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements
    const tableBody = document.getElementById('contacts-table-body');
    const searchInput = document.getElementById('contact-search');
    const refreshBtn = document.getElementById('refresh-contacts');
    const editModal = new bootstrap.Modal('#editContactModal');
    const deleteModal = new bootstrap.Modal('#deleteContactModal');

    // Load initial data
    loadContacts();

    // Event listeners
    searchInput.addEventListener('input', filterContacts);
    refreshBtn.addEventListener('click', loadContacts);

    // Load contacts from server
    function loadContacts() {
        fetch('/contact/contact-list/')
            .then(response => response.json())
            .then(data => {
                renderContacts(data.contacts);
            })
            .catch(error => {
                console.error('Error loading contacts:', error);
                showAlert('Failed to load contacts', 'danger');
            });
    }

    // Render contacts in table
    function renderContacts(contacts) {
        tableBody.innerHTML = '';

        if (!contacts || contacts.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4 text-muted">
                        No contacts found. <a href="#" data-content="add-contact">Add your first contact</a>.
                    </td>
                </tr>
            `;
            return;
        }

        contacts.forEach(contact => {
            const row = `
                <tr data-contact-id="${contact.id}">
                    <td>${contact.first_name} ${contact.last_name || ''}</td>
                    <td>${contact.email}</td>
                    <td>${contact.phone || '-'}</td>
                    <td>
                        <button class="btn btn-sm btn-outline-primary edit-btn me-2" 
                                data-id="${contact.id}">
                            <i class="bi bi-pencil"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-outline-danger delete-btn" 
                                data-id="${contact.id}">
                            <i class="bi bi-trash"></i> Delete
                        </button>
                    </td>
                </tr>
            `;
            tableBody.insertAdjacentHTML('beforeend', row);
        });

        // Add event listeners to action buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => openDeleteModal(btn.dataset.id));
        });
    }

    // Filter contacts
    function filterContacts() {
        const term = this.value.toLowerCase();
        const rows = tableBody.querySelectorAll('tr');

        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            row.style.display = text.includes(term) ? '' : 'none';
        });
    }

    // Open edit modal
    function openEditModal(contactId) {
        fetch(`/contact/get-contact/${contactId}/`)
            .then(response => response.json())
            .then(data => {
                document.getElementById('edit-contact-id').value = contactId;
                document.getElementById('edit-first-name').value = data.first_name;
                document.getElementById('edit-last-name').value = data.last_name || '';
                document.getElementById('edit-email').value = data.email;
                document.getElementById('edit-phone').value = data.phone || '';
                editModal.show();
            })
            .catch(error => {
                console.error('Error loading contact:', error);
                showAlert('Failed to load contact details', 'danger');
            });
    }

    // Open delete modal
    function openDeleteModal(contactId) {
        document.getElementById('delete-contact-id').value = contactId;
        deleteModal.show();
    }

    // Save contact changes
    document.getElementById('save-contact-btn').addEventListener('click', function() {
        const contactId = document.getElementById('edit-contact-id').value;
        const formData = {
            first_name: document.getElementById('edit-first-name').value,
            last_name: document.getElementById('edit-last-name').value,
            email: document.getElementById('edit-email').value,
            phone: document.getElementById('edit-phone').value
        };

        // Validate
        if (!formData.first_name || !formData.email) {
            showAlert('First name and email are required', 'warning');
            return;
        }

        toggleSpinner('save', true);

        fetch(`/contact/update-contact/${contactId}/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCookie('csrftoken')
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                editModal.hide();
                loadContacts();
                showAlert('Contact updated successfully', 'success');
            }
        })
        .catch(error => {
            console.error('Error updating contact:', error);
            showAlert('Failed to update contact', 'danger');
        })
        .finally(() => {
            toggleSpinner('save', false);
        });
    });

    // Confirm delete contact
    document.getElementById('confirm-delete-btn').addEventListener('click', function() {
        const contactId = document.getElementById('delete-contact-id').value;

        toggleSpinner('delete', true);

        fetch(`/contact/delete-contact/${contactId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken')
            }
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                deleteModal.hide();
                loadContacts();
                showAlert('Contact deleted successfully', 'success');
            }
        })
        .catch(error => {
            console.error('Error deleting contact:', error);
            showAlert('Failed to delete contact', 'danger');
        })
        .finally(() => {
            toggleSpinner('delete', false);
        });
    });

    // Helper functions
    function showAlert(message, type) {
        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const container = document.getElementById('contact-list-content');
        container.prepend(alert);

        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    function toggleSpinner(type, show) {
        const spinner = document.getElementById(`${type}-spinner`);
        const button = document.getElementById(
            type === 'save' ? 'save-contact-btn' : 'confirm-delete-btn'
        );

        if (show) {
            spinner.classList.remove('d-none');
            button.disabled = true;
        } else {
            spinner.classList.add('d-none');
            button.disabled = false;
        }
    }

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
});