import unittest
from unittest.mock import patch, MagicMock
from django.conf import settings
from Message.views import EmailSender, EmailServiceError


class TestEmailSender(unittest.TestCase):
    def setUp(self):
        # Setup test settings
        settings.EMAIL_SMTP_SERVER = 'smtp.gmail.com'
        settings.EMAIL_SMTP_PORT = 465
        settings.DEFAULT_FROM_EMAIL = 'cjkhudacj@gmail.com'
        settings.EMAIL_HOST_PASSWORD = 'zxtq pxxf gcjq brvf'
        settings.EMAIL_TIMEOUT = 30

        self.sender = EmailSender()
        self.recipient = 'e.aalami324@gmail.com'
        self.subject = 'Test Subject'
        self.body = 'Test Body'

    @patch('Message.views.smtplib.SMTP_SSL')
    @patch('Message.views.ssl.create_default_context')
    def test_send_email_success(self, mock_create_context, mock_smtp_ssl):
        mock_server = MagicMock()
        mock_smtp_ssl.return_value.__enter__.return_value = mock_server
        mock_context = MagicMock()
        mock_create_context.return_value = mock_context

        result = self.sender.send_email(
            recipient=self.recipient,
            subject=self.subject,
            body=self.body
        )

        self.assertTrue(result)

        # This is the correct assert for SMTP_SSL
        mock_smtp_ssl.assert_called_once_with(
            'smtp.gmail.com',
            port=465,
            context=mock_context,
            timeout=30
        )

        mock_server.login.assert_called_once_with('cjkhudacj@gmail.com', 'zxtq pxxf gcjq brvf')
        mock_server.sendmail.assert_called_once()
