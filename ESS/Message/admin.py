from django.contrib import admin
from Message.models import Message
from .models import EmailLog


admin.site.register(Message)


@admin.register(EmailLog)
class EmailLogAdmin(admin.ModelAdmin):
    list_display = ['sender', 'recipient_email', 'subject', 'status', 'timestamp']
    list_filter = ['status', 'timestamp', 'sender']
    search_fields = ['recipient__email', 'subject', 'sender__email']
    readonly_fields = ['timestamp']
    list_per_page = 20

    def recipient_email(self, obj):
        return obj.recipient.email

    recipient_email.short_description = 'ایمیل گیرنده'

    fieldsets = (
        ('اطلاعات اصلی', {
            'fields': ('sender', 'recipient', 'subject', 'status')
        }),
        ('جزئیات فنی', {
            'fields': ('timestamp', 'error_message'),
            'classes': ('collapse',)
        }),
    )
