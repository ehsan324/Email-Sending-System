from django.db import models


class Ticket(models.Model):
    name = models.CharField(max_length=100, verbose_name='Name')
    email = models.EmailField(verbose_name='Email Address')
    subject = models.CharField(max_length=100, verbose_name='Subject')
    message = models.TextField(verbose_name='Message')
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Created at')

    is_read = models.BooleanField(default=False, verbose_name='Is read')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.name} - {self.email} - {self.subject}'
