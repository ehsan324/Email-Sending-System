from django.db import models
from User.models import User
from Contacts.models import Contact


class MessageStatus(models.TextChoices):
    SENT = 'SENT', 'sent'
    DELIVERED = 'DELIVERED', 'delivered'
    FAILED = 'FAILED', 'failed'

class Message(models.Model):
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='senders')
    receiver = models.ForeignKey(Contact, on_delete=models.CASCADE, related_name='receivers')
    subject = models.CharField(max_length=150)
    body = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=10,
        choices=MessageStatus.choices,
        default=MessageStatus.SENT.value
    )

    def __str__(self):
        return f'{self.sender}'