document.addEventListener('DOMContentLoaded', function() {
    // مخفی کردن تمام بخش‌های محتوا به جز دشبورد
    function hideAllContents() {
        document.querySelectorAll('.dashboard-content').forEach(content => {
            content.classList.add('d-none');
            content.classList.remove('active');
        });
    }

    // نمایش محتوای انتخاب شده
    function showContent(contentId) {
        hideAllContents();
        const content = document.getElementById(contentId);
        if (content) {
            content.classList.remove('d-none');
            content.classList.add('active');
        }
    }

    // مدیریت کلیک روی لینک‌های منو
    document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const contentId = this.getAttribute('data-content') + '-content';
            showContent(contentId);
        });
    });

    // مدیریت کلیک روی دکمه‌های Quick Actions
    document.querySelectorAll('.quick-actions .action-item').forEach(action => {
        action.addEventListener('click', function(e) {
            e.preventDefault();
            const contentId = this.getAttribute('data-content') + '-content';
            showContent(contentId);
        });
    });
});