from django.db import models
from User.models import User
from Contacts.models import Contact

class MessageStatus(models.TextChoices):
    SENT = 'SENT', 'sent'
    DELIVERED = 'DELIVERED', 'delivered'
    FAILED = 'FAILED', 'failed'
    PENDING = 'PENDING', 'pending'  # برای ایمیل‌های زمانبندی شده

class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='received_messages')
    subject = models.CharField(max_length=150)
    body = models.TextField()
    attachment = models.FileField(upload_to='email_attachments/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    scheduled_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(
        max_length=10,
        choices=MessageStatus.choices,
        default=MessageStatus.PENDING.value
    )

    def __str__(self):
        return f'Message from {self.sender.email} to {self.receiver.email} - {self.subject}'



class EmailLog(models.Model):
    class Status(models.TextChoices):
        SENT = 'SENT', 'sent'
        DELIVERED = 'DELIVERED', 'delivered'
        FAILED = 'FAILED', 'failed'

    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='email_logs')
    recipient = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='received_email_logs')
    subject = models.CharField(max_length=150)
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=10, choices=Status.choices)
    error_message = models.TextField(null=True, blank=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['sender', 'timestamp']),
            models.Index(fields=['status', 'timestamp']),
        ]

    def __str__(self):
        return f'{self.recipient.email} - {self.status} - {self.timestamp}'