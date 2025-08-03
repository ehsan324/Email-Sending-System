const LOG_LEVELS = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};

const CURRENT_LOG_LEVEL = LOG_LEVELS.DEBUG;

function logger(level, message, data = null) {
    if (level >= CURRENT_LOG_LEVEL) {
        const timestamp = new Date().toISOString();
        const levelNames = ['DEBUG', 'INFO', 'WARN', 'ERROR'];
        const levelName = levelNames[level];

        console.log(`[${timestamp}] [${levelName}] ${message}`);
        if (data) {
            console.log('Data:', JSON.parse(JSON.stringify(data)));
        }
    }
}

const log = {
    debug: (msg, data) => logger(LOG_LEVELS.DEBUG, msg, data),
    info: (msg, data) => logger(LOG_LEVELS.INFO, msg, data),
    warn: (msg, data) => logger(LOG_LEVELS.WARN, msg, data),
    error: (msg, data) => logger(LOG_LEVELS.ERROR, msg, data)
};

console.log("Logger system initialized"); // این باید در هر صورت نمایش داده شود
log.info("Testing logger"); // این هم باید نمایش داده شود

document.addEventListener('DOMContentLoaded', function() {
    log.info('Application initialized');

    const tableBody = document.getElementById('groups-table-body');
    const searchInput = document.getElementById('group-search');
    const refreshBtn = document.getElementById('refresh-groups');
    const detailModal = new bootstrap.Modal('#groupDetailModal');
    let allGroups = [];

    // Load initial data
    loadGroups();

    // Event listeners
    searchInput.addEventListener('input', debounce(filterGroups, 300));
    refreshBtn.addEventListener('click', loadGroups);

    function loadGroups() {
        log.info('Loading groups from server');
        showLoading(true);

        fetch('/contact/group-list/')
            .then(response => {
                log.debug('Received groups response', {status: response.status});
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    log.info('Groups loaded successfully', {count: data.groups.length});
                    allGroups = data.groups;
                    renderGroups(allGroups);
                } else {
                    log.error('Failed to load groups', data);
                    throw new Error(data.message || 'Failed to load groups');
                }
            })
            .catch(error => {
                log.error('Error loading groups:', error);
                showAlert('Failed to load groups. Please try again.', 'danger');
            })
            .finally(() => {
                log.debug('Finished loading groups');
                showLoading(false);
            });
    }

    function showLoading(show) {
        if (show) {
            log.debug('Showing loading state');
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
            log.debug('Hiding loading state');
            const loadingEl = document.getElementById('loading-row');
            if (loadingEl) loadingEl.remove();
            refreshBtn.disabled = false;
            refreshBtn.innerHTML = '<i class="bi bi-arrow-clockwise"></i> Refresh';
        }
    }

    function renderGroups(groups) {
        log.info('Rendering groups', {count: groups.length});
        tableBody.innerHTML = '';

        if (!groups || groups.length === 0) {
            log.debug('No groups to render');
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

        addButtonEventListeners();
    }

    function addButtonEventListeners() {
        log.debug('Adding button event listeners');

        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                log.info('View button clicked', {groupId: this.dataset.id});
                openDetailModal(this.dataset.id);
            });
        });

        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                log.info('Edit button clicked', {groupId: this.dataset.id});
                openEditModal(this.dataset.id);
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                log.info('Delete button clicked', {groupId: this.dataset.id});
                confirmDeleteGroup(this.dataset.id);
            });
        });
    }

    function filterGroups() {
        const term = searchInput.value.toLowerCase().trim();
        log.info('Filtering groups', {searchTerm: term});

        const filtered = allGroups.filter(group =>
            group.name.toLowerCase().includes(term) ||
            (group.description && group.description.toLowerCase().includes(term))
        );

        log.debug('Filtered groups', {count: filtered.length});
        renderGroups(filtered);
    }

    function openDetailModal(groupId) {
        log.info('Opening group detail modal', {groupId});

        const modalElements = {
            title: document.getElementById('group-detail-title'),
            description: document.getElementById('group-detail-description'),
            created: document.getElementById('group-detail-created'),
            membersCount: document.getElementById('members-count'),
            membersList: document.getElementById('group-members-list')
        };

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
                log.debug('Received group detail response', {status: response.status});
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    log.info('Group details loaded', data.group);

                    modalElements.title.textContent = data.group.name;
                    modalElements.description.textContent = data.group.description || 'No description';
                    modalElements.created.textContent = formatDate(data.group.created_at);
                    modalElements.membersCount.textContent = data.members.length;

                    modalElements.membersList.innerHTML = '';
                    if (data.members.length === 0) {
                        log.debug('Group has no members');
                        modalElements.membersList.innerHTML = '<p class="text-muted">No members in this group</p>';
                    } else {
                        log.debug('Rendering group members', {count: data.members.length});
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
                    log.error('Failed to load group details', data);
                    throw new Error(data.message || 'Failed to load group details');
                }
            })
            .catch(error => {
                log.error('Error loading group details:', error);
                modalElements.membersList.innerHTML = `
                    <div class="alert alert-danger">
                        Failed to load group details. Please try again.
                    </div>
                `;
            });
    }

    function openEditModal(groupId) {
        log.info('Opening edit modal', {groupId});

        const modalId = 'editGroupModal';
        let modal = document.getElementById(modalId);

        if (!modal) {
            log.debug('Creating edit modal');
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

        fetch(`/contact/group-detail/${groupId}/`)
            .then(response => {
                log.debug('Received group detail for edit', {status: response.status});
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    log.info('Loaded group data for edit', data.group);

                    document.getElementById('edit-group-id').value = groupId;
                    document.getElementById('edit-group-name').value = data.group.name;
                    document.getElementById('edit-group-description').value = data.group.description || '';

                    saveBtn.onclick = () => {
                        const formData = {
                            name: document.getElementById('edit-group-name').value.trim(),
                            description: document.getElementById('edit-group-description').value.trim()
                        };

                        if (!formData.name) {
                            log.warn('Group name is required');
                            showAlert('Group name is required', 'danger');
                            return;
                        }

                        log.info('Saving group changes', formData);
                        spinner.classList.remove('d-none');
                        saveBtn.disabled = true;

                        updateGroup(groupId, formData, editModal);
                    };

                    editModal.show();
                } else {
                    log.error('Failed to load group for edit', data);
                    throw new Error(data.message || 'Failed to load group details');
                }
            })
            .catch(error => {
                log.error('Error loading group for edit:', error);
                showAlert('Failed to load group details. Please try again.', 'danger');
            });
    }

    function updateGroup(groupId, data, modal) {
        log.info('Updating group', {groupId, data});

        fetch(`/contact/group-detail/${groupId}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            log.debug('Received update response', {status: response.status});
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                log.info('Group updated successfully', data);
                showAlert('Group updated successfully', 'success');
                loadGroups();
                modal.hide();
            } else {
                log.error('Failed to update group', data);
                throw new Error(data.message || 'Failed to update group');
            }
        })
        .catch(error => {
            log.error('Error updating group:', error);
            showAlert('Failed to update group. Please try again.', 'danger');
        })
        .finally(() => {
            log.debug('Finished update operation');
            const spinner = document.getElementById('save-spinner');
            const saveBtn = document.getElementById('save-group-btn');
            if (spinner && saveBtn) {
                spinner.classList.add('d-none');
                saveBtn.disabled = false;
            }
        });
    }

    function confirmDeleteGroup(groupId) {
        log.info('Confirming group deletion', {groupId});

        const modal = setupDeleteModal();
        document.getElementById('delete-group-id').value = groupId;

        const confirmBtn = document.getElementById('confirm-delete-btn');
        const newConfirmBtn = confirmBtn.cloneNode(true);
        confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

        document.getElementById('confirm-delete-btn').addEventListener('click', function() {
            const groupIdToDelete = document.getElementById('delete-group-id').value;
            log.info('User confirmed deletion', {groupId: groupIdToDelete});
            deleteGroup(groupIdToDelete, modal);
        });

        modal.show();
    }

    function setupDeleteModal() {
        log.debug('Setting up delete modal');

        const modalId = 'deleteGroupModal';
        let modal = document.getElementById(modalId);

        if (!modal) {
            log.debug('Creating delete confirmation modal');
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

    function deleteGroup(groupId, modal) {
        log.info('Deleting group', {groupId});

        const confirmBtn = document.getElementById('confirm-delete-btn');
        const spinner = document.getElementById('delete-spinner');
        const deleteIcon = confirmBtn.querySelector('i.bi-trash');

        log.debug('Showing delete loading state');
        spinner.classList.remove('d-none');
        deleteIcon.classList.add('d-none');
        confirmBtn.disabled = true;

        fetch(`/contact/delete-group/${groupId}/`, {
            method: 'DELETE',
            headers: {
                'X-CSRFToken': getCookie('csrftoken'),
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            log.debug('Received delete response', {status: response.status});
            if (!response.ok) {
                return response.json().then(err => {
                    log.error('Delete failed with server error', err);
                    throw err;
                });
            }
            return response.json();
        })
        .then(data => {
            if (data.status === 'success') {
                log.info('Group deleted successfully', data);
                showAlert('Group deleted successfully', 'success');

                const row = document.querySelector(`tr[data-group-id="${groupId}"]`);
                if (row) {
                    log.debug('Removing group row from table');
                    row.remove();
                }

                log.debug('Updating local groups array');
                allGroups = allGroups.filter(g => g.id != groupId);

                if (modal) {
                    log.debug('Closing delete modal');
                    modal.hide();
                }
            } else {
                log.error('Delete operation failed', data);
                throw new Error(data.message || 'Failed to delete group');
            }
        })
        .catch(error => {
            log.error('Error deleting group:', error);
            showAlert('Failed to delete group. Please try again.', 'danger');
        })
        .finally(() => {
            log.debug('Resetting delete UI state');
            spinner.classList.add('d-none');
            deleteIcon.classList.remove('d-none');
            confirmBtn.disabled = false;
        });
    }

    function showAlert(message, type) {
        log.debug('Showing alert', {message, type});

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

    function escapeHtml(unsafe) {
        if (!unsafe) return unsafe;
        return unsafe.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function formatDate(dateString) {
        if (!dateString) return 'N/A';
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

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

    function getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    }
});