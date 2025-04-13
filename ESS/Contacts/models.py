from django.db import models


class Contact(models.Model):
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=11)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f'{self.last_name} - {self.email}'
