document.addEventListener('DOMContentLoaded', function() {
    const contactsPerPage = 5;
    let contacts = [];
    let currentContactPage = 1;

    const contactsList = document.getElementById('contacts-list');
    const contactsPagination = document.getElementById('pagination');

    if (!contactsList || !contactsPagination) {
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
        const start = (currentContactPage - 1) * contactsPerPage;
        const end = start + contactsPerPage;
        const pageContacts = contacts.slice(start, end);

        if (pageContacts.length === 0) {
            contactsList.innerHTML = '<p style="color:white;">No contacts found.</p>';
            return;
        }

        pageContacts.forEach(contact => {
            const div = document.createElement('div');
            div.style.background = '#1e1e2f';
            div.style.border = '1px solid #2e2e42';
            div.style.borderRadius = '12px';
            div.style.padding = '15px';
            div.style.marginBottom = '12px';
            div.style.color = 'white';
            div.style.display = 'flex';
            div.style.justifyContent = 'space-between';
            div.style.alignItems = 'center';
            div.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
            div.style.transition = 'all 0.3s ease-in-out';

            div.onmouseover = () => {
                div.style.background = '#2a2a3d';
                div.style.transform = 'translateY(-2px)';
                div.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
            };
            div.onmouseout = () => {
                div.style.background = '#1e1e2f';
                div.style.transform = 'translateY(0)';
                div.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
            };

            div.innerHTML = `
                <div>
                    <strong>${contact.first_name}</strong>
                    <strong>${contact.last_name}</strong><br>
                    <small>${contact.email || contact.phone || ''}</small>
                </div>
                <a href="#" class="btn" style="border:1px solid white; color:white; border-radius:8px; padding:4px 10px;">Message</a>
            `;
            contactsList.appendChild(div);
        });

        renderContactPagination();
    }

    function renderContactPagination() {
        contactsPagination.innerHTML = '';
        const totalPages = Math.ceil(contacts.length / contactsPerPage);
        if(totalPages <= 1) return;

        const prevLi = document.createElement('li');
        prevLi.className = 'page-item ' + (currentContactPage===1?'disabled':'');
        prevLi.innerHTML = `<a class="page-link" href="#">Previous</a>`;
        prevLi.onclick = e => { e.preventDefault(); if(currentContactPage>1){currentContactPage--; renderContacts();} };
        contactsPagination.appendChild(prevLi);

        for(let i=1; i<=totalPages; i++){
            const li = document.createElement('li');
            li.className = 'page-item ' + (i===currentContactPage?'active':'');
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.onclick = e => { e.preventDefault(); currentContactPage=i; renderContacts(); };
            contactsPagination.appendChild(li);
        }

        const nextLi = document.createElement('li');
        nextLi.className = 'page-item ' + (currentContactPage===totalPages?'disabled':'');
        nextLi.innerHTML = `<a class="page-link" href="#">Next</a>`;
        nextLi.onclick = e => { e.preventDefault(); if(currentContactPage<totalPages){currentContactPage++; renderContacts();} };
        contactsPagination.appendChild(nextLi);
    }

    fetchContacts();
});
