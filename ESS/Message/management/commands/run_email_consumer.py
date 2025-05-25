from django.core.management.base import BaseCommand
from Message.email_consumer import EmailConsumer


class Command(BaseCommand):
    def handle(self, *args, **options):
        consumer = EmailConsumer()
        consumer.start_consuming()