from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as UserBaseAdmin
from User.models import User, OtpCode


class UserAdmin(UserBaseAdmin):

    list_display = ('email', 'phone_number', 'is_admin')
    list_filter = ('is_admin',)
    readonly_fields = ('last_login',)
    ordering = ('email',)


    fieldsets = (
        ('essential', {'fields': ('email', 'phone_number')}),
        ('permissions', {'fields': ('is_admin', 'is_active', 'is_superuser','last_login', 'groups', 'user_permissions')}),
    )

    add_fieldsets = (
        (None, {'fields': ('email', 'phone_number')}),
    )

    search_fields = ('email',)
    filter_horizontal = ('groups', 'user_permissions')

    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        is_superuser = request.user.is_superuser
        if not is_superuser:
            form.base_fields['is_superuser'].disabled = True
        return form

admin.site.register(User, UserAdmin)
admin.site.register(OtpCode)