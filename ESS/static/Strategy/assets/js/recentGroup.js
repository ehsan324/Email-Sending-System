document.addEventListener('DOMContentLoaded', function() {
    const groupsPerPage = 5;
    let groups = [];
    let currentGroupPage = 1;

    const groupsList = document.getElementById('groups-list');
    const groupsPagination = document.getElementById('groups-pagination');
    const dashboardContent = document.getElementById('dashboard-content');
    const singleMessageContent = document.getElementById('single-message-content');

    if (!groupsList || !groupsPagination || !dashboardContent || !singleMessageContent) {
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
            div.classList.add('list-item', 'd-flex', 'justify-content-between', 'align-items-center');
            div.innerHTML = `
                <div>
                    <strong>${group.name}</strong>
                    <small>${group.description || ''}</small>
                    <small>${group.members_count} members</small>
                    <small>Created: ${group.created_at}</small>
                </div>
                <a href="#" class="btn btn-sm group-msg-btn" data-group-id="${group.id}">Message</a>
            `;
            groupsList.appendChild(div);
        });

        renderGroupPagination();
    }

    groupsList.addEventListener('click', function(e){
        if(e.target && e.target.classList.contains('group-msg-btn')){
            e.preventDefault();
            const groupId = e.target.getAttribute('data-group-id');
            dashboardContent.style.display = 'none';
            singleMessageContent.style.display = 'block';
        }
    });

    function renderGroupPagination() {
        groupsPagination.innerHTML = '';
        const totalPages = Math.ceil(groups.length / groupsPerPage);
        if(totalPages<=1) return;

        const prevLi = document.createElement('li');
        prevLi.className = 'page-item ' + (currentGroupPage===1?'disabled':'');
        prevLi.innerHTML = `<a class="page-link" href="#">Previous</a>`;
        prevLi.onclick = e=>{e.preventDefault(); if(currentGroupPage>1){currentGroupPage--; renderGroups();}};
        groupsPagination.appendChild(prevLi);

        for(let i=1;i<=totalPages;i++){
            const li = document.createElement('li');
            li.className = 'page-item '+(i===currentGroupPage?'active':'');
            li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
            li.onclick = e=>{e.preventDefault(); currentGroupPage=i; renderGroups();};
            groupsPagination.appendChild(li);
        }

        const nextLi = document.createElement('li');
        nextLi.className = 'page-item ' + (currentGroupPage===totalPages?'disabled':'');
        nextLi.innerHTML = `<a class="page-link" href="#">Next</a>`;
        nextLi.onclick = e=>{e.preventDefault(); if(currentGroupPage<totalPages){currentGroupPage++; renderGroups();}};
        groupsPagination.appendChild(nextLi);
    }

    fetchGroups();
});
