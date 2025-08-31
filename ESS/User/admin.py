from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as UserBaseAdmin
from User.models import User, OtpCode


class UserAdmin(UserBaseAdmin):
    model = User
    list_display = ('email', 'first_name', 'last_name', 'phone_number', 'is_active', 'is_admin')

    search_fields = ('email', 'first_name', 'last_name', 'phone_number')

    list_filter = ('is_active', 'is_admin')

    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'phone_number',)}),
        ('Permissions', {'fields': ('is_active', 'is_admin', 'groups', 'user_permissions')}),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('email', 'phone_number', 'first_name', 'last_name', 'password1', 'password2'),
        }),
    )

    ordering = ('email',)
    filter_horizontal = ('groups', 'user_permissions',)


admin.site.register(User, UserAdmin)

admin.site.register(OtpCode)
