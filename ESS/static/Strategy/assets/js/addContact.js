document.addEventListener('DOMContentLoaded', function() {
    function hideAllContents() {
        document.querySelectorAll('.dashboard-content').forEach(content => {
            content.classList.add('d-none');
            content.classList.remove('active');
        });
    }

    function showContent(contentId) {
        hideAllContents();
        const content = document.getElementById(contentId);
        if (content) {
            content.classList.remove('d-none');
            content.classList.add('active');
        }
    }

    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const contentId = this.getAttribute('data-content') + '-content';
            showContent(contentId);
        });
    });

    document.querySelectorAll('.quick-actions .action-item').forEach(action => {
        action.addEventListener('click', function(e) {
            e.preventDefault();
            const contentId = this.getAttribute('data-content') + '-content';
            showContent(contentId);
        });
    });
});