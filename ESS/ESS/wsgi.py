import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ESS.settings')
application = get_wsgi_application()  # This line must exist