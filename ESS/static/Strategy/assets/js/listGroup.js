document.addEventListener('DOMContentLoaded', function() {
    // Initialize elements
    const tableBody = document.getElementById('groups-table-body');
    const searchInput = document.getElementById('group-search');
    const refreshBtn = document.getElementById('refresh-groups');
    const detailModal = new bootstrap.Modal('#groupDetailModal');
    let allGroups = []; // Store all groups for filtering

    // Load initial data
    loadGroups();

    // Event listeners
    searchInput.addEventListener('input', debounce(filterGroups, 300));
    refreshBtn.addEventListener('click', loadGroups);

    // Load groups from server
    function loadGroups() {
        showLoading(true);

        fetch('/contact/group-list/')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    allGroups = data.groups;
                    renderGroups(allGroups);
                } else {
                    throw new Error(data.message || 'Failed to load groups');
                }
            })
            .catch(error => {
                console.error('Error loading groups:', error);
                showAlert('Failed to load groups. Please try again.', 'danger');
            })
            .finally(() => {
                showLoading(false);
            });
    }

    // Show loading state
    function showLoading(show) {
        if (show) {
            tableBody.innerHTML = `
                <tr id="loading-row">
                    <td colspan="4" class="text-center py-4">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Loading...</span>
                        </div>
                    </td>
                </tr>
            `;
            refreshBtn.disabled = true;
            refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Loading...';
        } else {
            const loadingEl = document.getElementById('loading-row');
            if (loadingEl) loadingEl.remove();
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
        }
    }

    // Render groups in table
    function renderGroups(groups) {
        tableBody.innerHTML = '';

        if (!groups || groups.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="4" class="text-center py-4 text-muted">
                        No groups found. <a href="#" data-content="create-group" class="text-primary">Create your first group</a>.
                    </td>
                </tr>
            `;
            return;
        }

        groups.forEach(group => {
            const row = document.createElement('tr');
            row.dataset.groupId = group.id;
            row.innerHTML = `
                <td>${escapeHtml(group.name)}</td>
                <td>${escapeHtml(group.description) || '-'}</td>
                <td>${group.members_count}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary view-btn me-2" 
                            data-id="${group.id}">
                        <i class="bi bi-eye"></i> View
                    </button>
                    <button class="btn btn-sm btn-outline-secondary edit-btn me-2" 
                            data-id="${group.id}">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" 
                            data-id="${group.id}">
                        <i class="bi bi-trash"></i> Delete
                    </button>
                </td>
            `;
            tableBody.appendChild(row);
        });

        // Add event listeners to action buttons
        addButtonEventListeners();
    }

    // Add event listeners to buttons
    function addButtonEventListeners() {
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', () => openDetailModal(btn.dataset.id));
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id));
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', () => confirmDeleteGroup(btn.dataset.id));
        });
    }

    // Filter groups with debounce
    function filterGroups() {
        const term = this.value.toLowerCase().trim();
        const filtered = allGroups.filter(group =>
            group.name.toLowerCase().includes(term) ||
            (group.description && group.description.toLowerCase().includes(term))
        );
        renderGroups(filtered);
    }

    // Open detail modal
    function openDetailModal(groupId) {
        const modalElements = {
            title: document.getElementById('group-detail-title'),
            description: document.getElementById('group-detail-description'),
            created: document.getElementById('group-detail-created'),
            membersCount: document.getElementById('members-count'),
            membersList: document.getElementById('group-members-list')
        };

        // Show loading state
        modalElements.membersList.innerHTML = `
            <div class="text-center py-3">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;

        detailModal.show();

        fetch(`/contact/group-detail/${groupId}/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    // Update modal content
                    modalElements.title.textContent = data.group.name;
                    modalElements.description.textContent = data.group.description || 'No description';
                    modalElements.created.textContent = formatDate(data.group.created_at);
                    modalElements.membersCount.textContent = data.members.length;

                    // Render members list
                    modalElements.membersList.innerHTML = '';
                    if (data.members.length === 0) {
                        modalElements.membersList.innerHTML = '<p class="text-muted">No members in this group</p>';
                    } else {
                        data.members.forEach(member => {
                            const memberItem = document.createElement('div');
                            memberItem.className = 'mb-2';
                            memberItem.innerHTML = `
                                <strong>${escapeHtml(member.first_name)} ${escapeHtml(member.last_name || '')}</strong>
                                <div class="text-muted small">${escapeHtml(member.email)}</div>
                            `;
                            modalElements.membersList.appendChild(memberItem);
                        });
                    }
                } else {
                    throw new Error(data.message || 'Failed to load group details');
                }
            })
            .catch(error => {
                console.error('Error loading group details:', error);
                modalElements.membersList.innerHTML = `
                    <div class="alert alert-danger">
                        Failed to load group details. Please try again.
                    </div>
                `;
            });
    }

    // Open edit modal
    function openEditModal(groupId) {
        const modalId = 'editGroupModal';
        let modal = document.getElementById(modalId);

        if (!modal) {
            const modalHTML = `
                <div class="modal fade" id="${modalId}" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header bg-primary text-white">
                                <h5 class="modal-title">Edit Group</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <form id="edit-group-form">
                                    <input type="hidden" id="edit-group-id">
                                    <div class="mb-3">
                                        <label for="edit-group-name" class="form-label">Group Name</label>
                                        <input type="text" class="form-control" id="edit-group-name" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="edit-group-description" class="form-label">Description</label>
                                        <textarea class="form-control" id="edit-group-description" rows="3"></textarea>
                                    </div>
                                </form>
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-primary" id="save-group-btn">
                                    <span class="spinner-border spinner-border-sm d-none" id="save-spinner"></span>
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            modal = document.getElementById(modalId);
        }

        const editModal = new bootstrap.Modal(modal);
        const saveBtn = document.getElementById('save-group-btn');
        const spinner = document.getElementById('save-spinner');

        // Load group data
        fetch(`/contact/group-detail/${groupId}/`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    document.getElementById('edit-group-id').value = groupId;
                    document.getElementById('edit-group-name').value = data.group.name;
                    document.getElementById('edit-group-description').value = data.group.description || '';

                    // Set up save button
                    saveBtn.onclick = () => {
                        const formData = {
                            name: document.getElementById('edit-group-name').value.trim(),
                            description: document.getElementById('edit-group-description').value.trim()
                        };

                        if (!formData.name) {
                            showAlert('Group name is required', 'danger');
                            return;
                        }

                        // Show loading state
                        spinner.classList.remove('d-none');
                        saveBtn.disabled = true;

                        updateGroup(groupId, formData, editModal);
                    };

                    editModal.show();
                } else {
                    throw new Error(data.message || 'Failed to load group details');
                }
            })
            .catch(error => {
                console.error('Error loading group details:', error);
                showAlert('Failed to load group details. Please try again.', 'danger');
            });
    }

    // Update group
    function updateGroup(groupId, data, modal) {
        fetch(`/contact/group-detail/${groupId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                showAlert('Group updated successfully', 'success');
                loadGroups();
                modal.hide();
            } else {
                throw new Error(data.message || 'Failed to update group');
            }
        })
        .catch(error => {
            console.error('Error updating group:', error);
            showAlert('Failed to update group. Please try again.', 'danger');
        })
        .finally(() => {
            const spinner = document.getElementById('save-spinner');
            const saveBtn = document.getElementById('save-group-btn');
            if (spinner && saveBtn) {
                spinner.classList.add('d-none');
                saveBtn.disabled = false;
            }
        });
    }

    // Confirm before deleting group
    function confirmDeleteGroup(groupId) {
        const modal = setupDeleteModal();
        document.getElementById('delete-group-id').value = groupId;

        // Set up confirm button
        const confirmBtn = document.getElementById('confirm-delete-btn');
        confirmBtn.onclick = () => {
            deleteGroup(groupId);
            bootstrap.Modal.getInstance(modal).hide();
        };

        modal.show();
    }

    // Setup delete confirmation modal
    function setupDeleteModal() {
        const modalId = 'deleteGroupModal';
        let modal = document.getElementById(modalId);

        if (!modal) {
            const modalHTML = `
                <div class="modal fade" id="${modalId}" tabindex="-1">
                    <div class="modal-dialog">
                        <div class="modal-content">
                            <div class="modal-header bg-danger text-white">
                                <h5 class="modal-title">Confirm Delete</h5>
                                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body">
                                <p>Are you sure you want to delete this group? This action cannot be undone.</p>
                                <input type="hidden" id="delete-group-id">
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                                <button type="button" class="btn btn-danger" id="confirm-delete-btn">
                                    <span class="spinner-border spinner-border-sm d-none" id="delete-spinner"></span>
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            modal = document.getElementById(modalId);
        }

        return new bootstrap.Modal(modal);
    }

    // Delete group
    function deleteGroup(groupId) {
        const deleteBtn = document.querySelector(`.delete-btn[data-id="${groupId}"]`);
        const spinner = document.getElementById('delete-spinner');
        const confirmBtn = document.getElementById('confirm-delete-btn');

        // Show loading state
        if (deleteBtn) {
            deleteBtn.disabled = true;
            deleteBtn.innerHTML = '<i class="bi bi-trash"></i> Deleting...';
        }
        if (spinner && confirmBtn) {
            spinner.classList.remove('d-none');
            confirmBtn.disabled = true;
        }

        fetch(`/contact/delete-group/${groupId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                showAlert('Group deleted successfully', 'success');
                loadGroups();
            } else {
                throw new Error(data.message || 'Failed to delete group');
            }
        })
        .catch(error => {
            console.error('Error deleting group:', error);
            showAlert('Failed to delete group. Please try again.', 'danger');
        })
        .finally(() => {
            if (deleteBtn) {
                deleteBtn.disabled = false;
                deleteBtn.innerHTML = '<i class="bi bi-trash"></i> Delete';
            }
            if (spinner && confirmBtn) {
                spinner.classList.add('d-none');
                confirmBtn.disabled = false;
            }
        });
    }

    // Helper function to show alerts
    function showAlert(message, type) {
        // Remove existing alerts
        document.querySelectorAll('.alert-dismissible').forEach(alert => {
            alert.remove();
        });

        const alert = document.createElement('div');
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        const container = document.getElementById('group-list-content') || document.body;
        container.prepend(alert);

        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    // Helper function to escape HTML
    function escapeHtml(unsafe) {
        if (!unsafe) return unsafe;
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Helper function to format date
    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    // Helper function to debounce
    function debounce(func, wait) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                func.apply(context, args);
            }, wait);
        };
    }

    // Helper function to get CSRF token
    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
});