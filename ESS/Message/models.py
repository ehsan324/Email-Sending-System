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