document.addEventListener('DOMContentLoaded', function() {
    const contactsPerPage = 5;
    let contacts = [];
    let currentPage = 1;

    const contactsList = document.getElementById('contacts-list');
    const pagination = document.getElementById('pagination');
    const dashboardContent = document.getElementById('dashboard-content');
    const singleMessageContent = document.getElementById('single-message-content');
    const recipientSelect = document.getElementById('single-recipient');

    if (!contactsList || !pagination || !dashboardContent || !singleMessageContent || !recipientSelect) {
        console.error('Contacts: Required elements missing!');
        return;
    }

    function fetchContacts() {
        fetch('http://127.0.0.1:8000/contact/contact-list/')
            .then(res => res.json())
            .then(data => {
                contacts = data.contacts;
                renderContacts();
            })
            .catch(err => console.error("Contacts fetch error:", err));
    }

    function renderContacts() {
        contactsList.innerHTML = '';
        const start = (currentPage - 1) * contactsPerPage;
        const end = start + contactsPerPage;
        const pageContacts = contacts.slice(start, end);

        if (pageContacts.length === 0) {
            contactsList.innerHTML = '<p style="color:white;">No contacts found.</p>';
            return;
        }

        pageContacts.forEach(contact => {
            const div = document.createElement('div');
            div.classList.add('list-item', 'd-flex', 'justify-content-between', 'align-items-center');
            div.innerHTML = `
                <div>
                    <strong>${contact.first_name} ${contact.last_name}</strong>
                    <small>${contact.email}</small>
                </div>
                <a href="#" class="btn btn-sm message-btn" data-contact-id="${contact.id}">Message</a>
            `;
            contactsList.appendChild(div);
        });

        renderPagination();
    }

    contactsList.addEventListener('click', function(e) {
        if (e.target && e.target.classList.contains('message-btn')) {
            e.preventDefault();
            const contactId = e.target.getAttribute('data-contact-id');
            dashboardContent.style.display = 'none';
            singleMessageContent.style.display = 'block';
            recipientSelect.value = contactId;
        }
    });

    function renderPagination() {
        pagination.innerHTML = '';
        const totalPages = Math.ceil(contacts.length / contactsPerPage);
        if (totalPages <= 1) return;

        const prevLi = document.createElement('li');
        prevLi.className = 'page-item ' + (currentPage === 1 ? 'disabled' : '');
        prevLi.innerHTML = `<a class="page-link" href="#">Previous</a>`;
        prevLi.onclick = e => { e.preventDefault(); if(currentPage>1){currentPage--; renderContacts();} };
        pagination.appendChild(prevLi);

        for(let i=1;i<=totalPages;i++){
            const li = document.createElement('li');
            li.className = 'page-item ' + (i===currentPage?'active':'');
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.onclick = e => { e.preventDefault(); currentPage=i; renderContacts(); };
            pagination.appendChild(li);
        }

        const nextLi = document.createElement('li');
        nextLi.className = 'page-item ' + (currentPage === totalPages ? 'disabled' : '');
        nextLi.innerHTML = `<a class="page-link" href="#">Next</a>`;
        nextLi.onclick = e => { e.preventDefault(); if(currentPage<totalPages){currentPage++; renderContacts();} };
        pagination.appendChild(nextLi);
    }

    fetchContacts();
});
