document.getElementById('single-schedule').addEventListener('change', function() {
    const scheduleFields = document.getElementById('schedule-fields');
    if (this.checked) {
        scheduleFields.style.display = 'block';
    } else {
        scheduleFields.style.display = 'none';
    }
});
