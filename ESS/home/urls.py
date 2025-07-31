from django.urls import path
from . import views


app_name = 'home'
urlpatterns = [
    path('home/contact/', views.TicketView.as_view(), name='ticket'),
    path('home/', views.HomeView.as_view(), name='homes'),
    path('test/', views.TestView.as_view(), name='test'),

]