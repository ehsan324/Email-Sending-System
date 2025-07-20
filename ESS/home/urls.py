from django.urls import path
from . import views


app_name = 'Home'
urlpatterns = [
    path('home/', views.HomeView.as_view(), name='homes'),
]