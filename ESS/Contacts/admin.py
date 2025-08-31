from django.contrib import admin
from .models import Contact, Group


class ContactInline(admin.TabularInline):
    model = Group.members.through
    extra = 1


@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    inlines = [ContactInline]
    exclude = ('members',)


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'email', 'is_active']
