# myproject/urls.py
from django.urls import path
from . import views

app_name = 'Message'

urlpatterns = [
    path('send/', views.SendEmailView.as_view(), name='send_email'),
    path('sent/', views.EmailSentConfirmationView.as_view(), name='email_sent_confirmation'),
    path('send-group/', views.SendGroupEmailView.as_view(), name='send_group_email'),
]
