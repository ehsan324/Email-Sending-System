document.addEventListener('DOMContentLoaded', function() {
    // اضافه کردن رویداد کلیک برای دکمه‌های مشاهده
    document.querySelectorAll('.view-email-btn').forEach(button => {
        button.addEventListener('click', function() {
            const logId = this.getAttribute('data-log-id');
            loadEmailDetail(logId);
        });
    });

    // اضافه کردن رویداد برای دکمه بستن جزئیات
    document.getElementById('closeEmailDetail').addEventListener('click', function() {
        document.getElementById('emailDetailContainer').classList.add('d-none');
    });

    // تابع برای بارگذاری جزئیات ایمیل
    function loadEmailDetail(logId) {
        fetch(`/message/email-detail/${logId}/`)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // نمایش جزئیات ایمیل
                    const detailContent = document.getElementById('emailDetailContent');
                    detailContent.innerHTML = `
                        <div class="row">
                            <div class="col-md-6">
                                <p><strong>فرستنده:</strong> ${data.email_log.sender_email}</p>
                                <p><strong>گیرنده:</strong> ${data.email_log.recipient_email}</p>
                                <p><strong>تاریخ و زمان:</strong> ${new Date(data.email_log.timestamp).toLocaleString('fa-IR')}</p>
                            </div>
                            <div class="col-md-6">
                                <p><strong>وضعیت:</strong> <span class="badge ${getStatusBadgeClass(data.email_log.status)}">${getStatusText(data.email_log.status)}</span></p>
                                ${data.email_log.error_message ? `<p><strong>پیغام خطا:</strong> ${data.email_log.error_message}</p>` : ''}
                            </div>
                        </div>
                        <div class="row mt-3">
                            <div class="col-12">
                                <p><strong>موضوع:</strong> ${data.email_log.subject}</p>
                                <div class="card">
                                    <div class="card-header">
                                        <strong>محتوا:</strong>
                                    </div>
                                    <div class="card-body">
                                        ${data.email_log.body || 'بدون محتوا'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    `;
                    document.getElementById('emailDetailContainer').classList.remove('d-none');
                } else {
                    alert('خطا در بارگذاری جزئیات ایمیل');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                alert('خطا در ارتباط با سرور');
            });
    }

    // توابع کمکی برای نمایش وضعیت
    function getStatusText(status) {
        const statusMap = {
            'SENT': 'ارسال شده',
            'DELIVERED': 'تحویل شده',
            'FAILED': 'ناموفق'
        };
        return statusMap[status] || status;
    }

    function getStatusBadgeClass(status) {
        const classMap = {
            'SENT': 'bg-info',
            'DELIVERED': 'bg-success',
            'FAILED': 'bg-danger'
        };
        return classMap[status] || 'bg-secondary';
    }
});
