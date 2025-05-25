from .email_producer import EmailProducer
from django.views import View
from django.shortcuts import redirect

class SendEmailView(View):
    def get(self,request):
        producer = EmailProducer()
        email_data = {
            'recipient': 'e.aalami324@gmail.com',
            'subject': 'Welcome to our platform',
            'body': 'Thank you for registering!',
            # sender and password can be omitted if using defaults
        }
        producer.publish_email_request(email_data)
        return redirect('home:home')