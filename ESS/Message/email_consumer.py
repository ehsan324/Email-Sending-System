import json
import pika
from utils import EmailSender
from django.conf import settings

class EmailConsumer:
    def __init__(self):
        self.email_sender = EmailSender()
        self.connection_params = pika.ConnectionParameters(
            host=getattr(settings, 'RABBITMQ_HOST', 'localhost'),
            port=getattr(settings, 'RABBITMQ_PORT', 5672),
            credentials=pika.PlainCredentials(
                username=getattr(settings, 'RABBITMQ_USER', 'guest'),
                password=getattr(settings, 'RABBITMQ_PASS', 'guest')
            )
        )
        self.queue_name = 'email_queue'

    def start_consuming(self):
        """Start consuming email messages from RabbitMQ"""
        connection = pika.BlockingConnection(self.connection_params)
        channel = connection.channel()

        # Declare exchange and queue
        channel.exchange_declare(
            exchange='email_exchange',
            exchange_type='direct',
            durable=True
        )

        channel.queue_declare(
            queue=self.queue_name,
            durable=True
        )

        channel.queue_bind(
            exchange='email_exchange',
            queue=self.queue_name,
            routing_key='email_request'
        )

        channel.basic_qos(prefetch_count=1)

        def callback(ch, method, properties, body):
            try:
                email_data = json.loads(body)
                self.email_sender.send_email(
                    recipient=email_data['recipient'],
                    subject=email_data['subject'],
                    body=email_data['body'],
                    sender=email_data.get('sender'),
                    password=email_data.get('password')
                )
                ch.basic_ack(delivery_tag=method.delivery_tag)
                print('email sent!')
            except Exception as e:
                logger.error(f"Failed to process email: {str(e)}")
                # You might want to implement dead letter queue here

        channel.basic_consume(
            queue=self.queue_name,
            on_message_callback=callback
        )

        print(' [*] Waiting for email messages. To exit press CTRL+C')
        channel.start_consuming()