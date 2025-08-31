import ssl
import smtplib
import logging
from django.utils import timezone
from email.message import EmailMessage
from django.conf import settings
from Message.email_producer import EmailProducer
from User.models import OtpCode

logger = logging.getLogger(__name__)


class EmailServiceError(Exception):
    """Raised when email sending fails due to configuration or SMTP errors."""
    pass


import smtplib
from email.mime.text import MIMEText
from email.utils import formatdate
import ssl


class EmailSender:
    def __init__(self):
        self.smtp_server = settings.EMAIL_HOST
        self.smtp_port = int(settings.EMAIL_PORT)  # مطمئن شوید عدد است
        self.timeout = 30
        self.ssl_context = ssl.create_default_context()

    def send_email(self, recipient, subject, body):
        msg = MIMEText(body)
        msg['From'] = settings.DEFAULT_FROM_EMAIL
        msg['To'] = recipient
        msg['Date'] = formatdate(localtime=True)
        msg['Subject'] = subject

        try:
            # اتصال بدون SSL اولیه (برای STARTTLS)
            with smtplib.SMTP(self.smtp_server, self.smtp_port, timeout=self.timeout) as server:
                server.ehlo()
                if settings.EMAIL_USE_TLS:
                    server.starttls(context=self.ssl_context)
                    server.ehlo()
                server.login(settings.EMAIL_HOST_USER, settings.EMAIL_HOST_PASSWORD)
                server.send_message(msg)
            return True
        except Exception as e:
            print(f"SMTP Exception: {type(e).__name__}: {e}")
            raise


# utils/email_service.py
class EmailService:
    @staticmethod
    def send_email(recipient, subject, body):
        producer = EmailProducer()
        email_data = {
            'recipient': recipient,
            'subject': subject,
            'body': body,
        }
        producer.publish_email_request(email_data)


def send_otp_code(phone_number, code):
    pass


def delete_code(object_id):
    expire_at = timezone.timedelta(minutes=1)
    print(expire_at)
    if expire_at > timezone.now():
        try:
            OtpCode.objects.get(id=object_id).delete()
            raise f"Deleted OTP code {object_id}"
        except Exception as e:
            raise f"Failed to delete OTP code {object_id}: {str(e)}"
