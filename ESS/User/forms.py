from django import forms

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
            'placeholder': 'Phone Number'
        })
    )


class UserVerifyForm(forms.Form):
    code = forms.IntegerField(
        required=True,
        widget=forms.NumberInput(attrs={
            'class': 'input100',
            'placeholder': 'Verification Code'
        })
    )