import json
import pika
from django.conf import settings

class EmailProducer:
    def __init__(self):
        self.connection_params = pika.ConnectionParameters(
            host=getattr(settings, 'RABBITMQ_HOST', 'localhost'),
            port=getattr(settings, 'RABBITMQ_PORT', 5672),
            credentials=pika.PlainCredentials(
                username=getattr(settings, 'RABBITMQ_USER', 'guest'),
                password=getattr(settings, 'RABBITMQ_PASS', 'guest')
            )
        )
        self.exchange_name = 'email_exchange'
        self.routing_key = 'email_request'

    def publish_email_request(self, email_data):
        """Publish email request to RabbitMQ"""
        connection = pika.BlockingConnection(self.connection_params)
        channel = connection.channel()

        # Declare durable exchange
        channel.exchange_declare(
            exchange=self.exchange_name,
            exchange_type='direct',
            durable=True
        )

        # Publish message
        channel.basic_publish(
            exchange=self.exchange_name,
            routing_key=self.routing_key,
            body=json.dumps(email_data),
            properties=pika.BasicProperties(
                delivery_mode=2,  # Make message persistent
            )
        )

        connection.close()