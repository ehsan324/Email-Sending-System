from django.db import models

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Contact(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='contacts')
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField()
    phone = models.CharField(max_length=11)
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ('user', 'email')

    def __str__(self):
        return f'{self.last_name} - {self.email}'


class Group(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_groups')
    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    members = models.ManyToManyField(Contact, related_name='members', blank=True)

    class Meta:
        unique_together = ('user', 'name')

    def active_members_counts(self):
        return self.members.filter(is_active=True).count()

    def __str__(self):
        return f"{self.name} by {self.user}"
