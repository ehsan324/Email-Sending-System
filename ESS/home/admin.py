from django.contrib import admin
from .models import Ticket


@admin.register(Ticket)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'subject', 'created_at', 'is_read')
    list_filter = ('is_read', 'created_at')
    search_fields = ('name', 'email', 'subject')
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

    actions = ['mark_as_read']

    def mark_as_read(self, request, queryset):
        queryset.update(is_read=True)

    mark_as_read.short_description = "Mark selected messages as read"
