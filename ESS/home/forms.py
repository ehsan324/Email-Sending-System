from django import forms
from .models import Ticket

class TicketForm(forms.ModelForm):
    class Meta:
        model = Ticket
        fields = ['name', 'email', 'subject', 'message']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control',
                                           'placeholder': 'Name',
                                           'required': True}),

            'email': forms.EmailInput(attrs={'class': 'form-control',
                                             'placeholder': 'Email Address',
                                             'required': True}),

            'subject': forms.TextInput(attrs={'class': 'form-control',
                                              'placeholder': 'Subject',
                                              'required': True}),

            'message': forms.Textarea(attrs={'class': 'form-control',
                                             'placeholder': 'Message...',
                                             'rows': 6,
                                             'required': True}),
        }