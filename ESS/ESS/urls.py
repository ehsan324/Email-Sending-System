from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('user/', include('User.urls', namespace='User')),
    path('message/', include('Message.urls', namespace='Message')),
    path('contact/', include('Contacts.urls', namespace='Contact')),
]
