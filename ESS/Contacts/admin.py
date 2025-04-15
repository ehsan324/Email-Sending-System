from django.contrib import admin
from Contacts.models import Contact, Group

from django.contrib import admin
from .models import Contact, Group

@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    pass

@admin.register(Group)
class GroupAdmin(admin.ModelAdmin):
    filter_horizontal = ('members',)  # Makes selecting contacts easier
