document.addEventListener('DOMContentLoaded', function() {
    const groupsPerPage = 5;
    let groups = [];
    let currentGroupPage = 1;

    const groupsList = document.getElementById('groups-list');
    const groupsPagination = document.getElementById('groups-pagination');

    if (!groupsList || !groupsPagination) {
        console.error('Groups: Required elements missing!');
        return;
    }

    function fetchGroups() {
        fetch('http://127.0.0.1:8000/contact/group-list/')
            .then(res => res.json())
            .then(data => {
                groups = data.groups;
                renderGroups();
            })
            .catch(err => console.error("Groups fetch error:", err));
    }

    function renderGroups() {
        groupsList.innerHTML = '';
        const start = (currentGroupPage - 1) * groupsPerPage;
        const end = start + groupsPerPage;
        const pageGroups = groups.slice(start, end);

        if (pageGroups.length === 0) {
            groupsList.innerHTML = '<p style="color:white;">No groups found.</p>';
            return;
        }

        pageGroups.forEach(group => {
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
                    <strong>${group.name}</strong><br>
                    <small>${group.members_count} members</small>
                </div>
                <a href="#" class="btn" style="border:1px solid white; color:white; border-radius:8px; padding:4px 10px;">Message</a>
            `;
            groupsList.appendChild(div);
        });

        renderGroupPagination();
    }

    function renderGroupPagination() {
        groupsPagination.innerHTML = '';
        const totalPages = Math.ceil(groups.length / groupsPerPage);
        if(totalPages <= 1) return;

        const prevLi = document.createElement('li');
        prevLi.className = 'page-item ' + (currentGroupPage===1?'disabled':'');
        prevLi.innerHTML = `<a class="page-link" href="#">Previous</a>`;
        prevLi.onclick = e => { e.preventDefault(); if(currentGroupPage>1){currentGroupPage--; renderGroups();} };
        groupsPagination.appendChild(prevLi);

        for(let i=1; i<=totalPages; i++){
            const li = document.createElement('li');
            li.className = 'page-item ' + (i===currentGroupPage?'active':'');
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.onclick = e => { e.preventDefault(); currentGroupPage=i; renderGroups(); };
            groupsPagination.appendChild(li);
        }

        const nextLi = document.createElement('li');
        nextLi.className = 'page-item ' + (currentGroupPage===totalPages?'disabled':'');
        nextLi.innerHTML = `<a class="page-link" href="#">Next</a>`;
        nextLi.onclick = e => { e.preventDefault(); if(currentGroupPage<totalPages){currentGroupPage++; renderGroups();} };
        groupsPagination.appendChild(nextLi);
    }

    fetchGroups();
});
