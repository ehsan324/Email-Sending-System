from django.urls import path
from . import views


app_name = 'Contact'
urlpatterns = [
    path('create/', views.ContactCreateView.as_view(), name='add-contact'),
    path('contact-list/', views.ContactListView.as_view(), name='contact-list'),

]