# myproject/urls.py
from django.urls import path
from . import views

app_name = 'Message'
urlpatterns = [
    path('hello/', views.SendEmailView.as_view(), name='send-email'),
    path('send-group/', views.SendGroupEmailView.as_view(), name='send_group_email'),
]
