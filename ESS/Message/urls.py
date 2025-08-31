# myproject/urls.py
from django.urls import path
from . import views

app_name = 'Message'

urlpatterns = [
    path('send/', views.SendEmailView.as_view(), name='send_email'),
    path('send-group/', views.SendGroupEmailView.as_view(), name='send_group_email'),
    path('email-detail/<int:log_id>/', views.EmailDetailView.as_view(), name='email_detail'),
]
