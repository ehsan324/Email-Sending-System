# from django.contrib import admin
# from Contacts.models import Contact, Group
#
# from django.contrib import admin
# from .models import Contact, Group
#
# @admin.register(Contact)
# class ContactAdmin(admin.ModelAdmin):
#     pass
#
# @admin.register(Group)
# class GroupAdmin(admin.ModelAdmin):
#     filter_horizontal = ('members',)  # Makes selecting contacts easier


from django.contrib import admin
from .models import Contact, Group

class ContactInline(admin.TabularInline):
    model = Group.members.through  # برای نمایش مخاطبین در صفحه گروه
    extra = 1

@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'description']
    inlines = [ContactInline]
    exclude = ('members',)  # برای جلوگیری از نمایش دوگانه

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ['first_name', 'last_name', 'email', 'is_active']
