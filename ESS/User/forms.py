from django import forms
from .models import User

class UserRegistrationForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ('first_name', 'last_name', 'phone_number', 'email')
        widgets = {
            'phone_number': forms.TextInput(attrs={'placeholder': '09123456789'}),
            'email': forms.EmailInput(attrs={'placeholder': 'example@domin.com'}),
        }

    def clean_email(self):
        email = self.cleaned_data['email']
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError('this email is already in use')
        return email

    def clean_phone_number(self):
        phone_number = self.cleaned_data['phone_number']
        if User.objects.filter(phone_number=phone_number).exists():
            raise forms.ValidationError('this phone number is already in use')
        if not phone_number.startswith('09'):
            raise forms.ValidationError('Enter a valid Iranian phone number (09xxxxxxxxx)')
        return phone_number

class UserLoginForm(forms.Form):
    email = forms.EmailField()
    phone_number = forms.CharField(max_length=11, widget=forms.NumberInput)

class UserVerifyForm(forms.Form):
    code = forms.IntegerField(min_value=1000, max_value=9999)
