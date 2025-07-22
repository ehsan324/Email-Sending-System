import ssl
import smtplib
import logging
from email.message import EmailMessage
from django.conf import settings
from Message.email_producer import EmailProducer

logger = logging.getLogger(__name__)

class EmailServiceError(Exception):
    """Raised when email sending fails due to configuration or SMTP errors."""
    pass


class EmailSender:
    def __init__(self):
        self.smtp_server = getattr(settings, 'EMAIL_SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = getattr(settings, 'EMAIL_SMTP_PORT', 465)
        self.timeout = getattr(settings, 'EMAIL_TIMEOUT', 30)
        self.default_sender = getattr(settings, 'DEFAULT_FROM_EMAIL')

    def _create_secure_context(self):
        """Create and configure SSL context"""
        context = ssl.create_default_context()
        context.minimum_version = ssl.TLSVersion.TLSv1_2
        context.verify_mode = ssl.CERT_REQUIRED
        return context

    def send_email(
            self,
            recipient: str,
            subject: str,
            body: str,
            sender: str = None,
            password: str = None
    ) -> bool:
        """
        Send email with Django integration

        Args:
            recipient: Email address of recipient
            subject: Email subject
            body: Email body content
            sender: From address (defaults to DEFAULT_FROM_EMAIL)
            password: SMTP password (defaults to EMAIL_HOST_PASSWORD from settings)

        Returns:
            bool: True if email sent successfully

        Raises:
            EmailServiceError: If email sending fails
        """
        sender = sender or self.default_sender
        password = password or getattr(settings, 'EMAIL_HOST_PASSWORD', None)

        if not password:
            raise EmailServiceError("SMTP password not configured")

        try:
            em = EmailMessage()
            em['From'] = sender
            em['To'] = recipient
            em['Subject'] = subject
            em.set_content(body)

            context = self._create_secure_context()

            with smtplib.SMTP_SSL(
                    self.smtp_server,
                    port=self.smtp_port,
                    context=context,
                    timeout=self.timeout
            ) as smtp:
                smtp.login(sender, password)
                smtp.sendmail(sender, recipient, em.as_string())
                logger.info(f"Email sent to {recipient}")
                return True

        except Exception as e:
            logger.error(f"Failed to send email to {recipient}: {str(e)}")
            raise EmailServiceError(f"Email sending failed: {str(e)}")

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




