import re
from django import forms
from django.core.exceptions import ValidationError
from .models import User


class UserLoginForm(forms.Form):
    phone_number = forms.CharField(
        widget=forms.TextInput(attrs={
            'class': 'input100',
            'placeholder': 'Phone Number'
        })
    )




class UserRegistrationForm(forms.Form):
    first_name = forms.CharField(
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'input100',
            'placeholder': 'First Name'
        })
    )
    last_name = forms.CharField(
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'input100',
            'placeholder': 'Last Name'
        })
    )
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'input100',
            'placeholder': 'Email'
        })
    )
    phone_number = forms.CharField(
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'input100',
            'placeholder': 'Phone Number',
            'pattern': '09[0-9]{9}',
            'title': 'لطفاً یک شماره تلفن معتبر وارد کنید (مانند: 09123456789)'
        })
    )

    def clean_phone_number(self):
        phone_number = self.cleaned_data['phone_number']

        # الگوی شماره تلفن ایرانی
        pattern = r'^09[0-9]{9}$'

        if not re.match(pattern, phone_number):
            raise ValidationError('لطفاً یک شماره تلفن معتبر وارد کنید (مانند: 09123456789)')

        # بررسی اینکه شماره تلفن قبلاً استفاده نشده باشد
        if User.objects.filter(phone_number=phone_number).exists():
            raise ValidationError('این شماره تلفن قبلاً ثبت شده است')

        return phone_number

    # همچنین می‌توانید clean_email را نیز اضافه کنید برای بررسی یکتایی ایمیل
    def clean_email(self):
        email = self.cleaned_data['email']

        if User.objects.filter(email=email).exists():
            raise ValidationError('این ایمیل قبلاً ثبت شده است')

        return email




class UserVerifyForm(forms.Form):
    code = forms.IntegerField(
        required=True,
        widget=forms.NumberInput(attrs={
            'class': 'input100',
            'placeholder': 'Verification Code'
        })
    )