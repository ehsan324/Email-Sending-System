from django import forms

class EmailForm(forms.Form):
    EmailRecipient = forms.EmailField()