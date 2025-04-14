from django.urls import path
from . import views


app_name = 'User'
urlpatterns = [
    path('register/', views.UserRegistrationView.as_view(), name='user-register'),
    path('register/verify/', views.UserRegistrationVerifyView.as_view(), name='user-register-verify'),
    path('login/', views.UserLoginView.as_view(), name='user-login'),
    path('login/verify/', views.UserLoginVerifyView.as_view(), name='user-login-verify'),
    path('logout/', views.UserLogoutView.as_view(), name='user-logout'),
]