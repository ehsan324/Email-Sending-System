document.addEventListener('DOMContentLoaded', function() {
    // انتخاب دکمه New Message
    const newMessageBtn = document.querySelector('[data-content="single-message"]');

    // افزودن Event Listener
    newMessageBtn.addEventListener('click', function() {
        // پنهان کردن سایر بخش‌ها (اختیاری)
        document.querySelectorAll('.dashboard-content').forEach(section => {
            section.classList.add('d-none');
        });

        // نمایش بخش single-message
        const singleMessageSection = document.getElementById('single-message');
        if (singleMessageSection) {
            singleMessageSection.classList.remove('d-none');
        } else {
            console.error('بخش single-message یافت نشد!');
        }
    });
});