from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView



urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('home.urls', namespace='Home')),
    path('user/', include('User.urls', namespace='User')),
    path('message/', include('Message.urls', namespace='Message')),
    path('contact/', include('Contacts.urls', namespace='Contact')),
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('swagger/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),


]
