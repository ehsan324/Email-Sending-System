from django.db import models


class Contact(models.Model):
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=11)
    is_active = models.BooleanField(default=True)


    def __str__(self):
        return f'{self.last_name} - {self.email}'


class Group(models.Model):
    name = models.CharField(max_length=120, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)
    members = models.ManyToManyField(Contact, related_name='members', blank=True)

    def active_members_counts(self):
        return self.members.filter(is_active=True).count()

    def __str__(self):
        return self.name