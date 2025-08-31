from .email_producer import EmailProducer
from django.views import View
from django.shortcuts import render, redirect
from django.views import View
from django.shortcuts import redirect, render
from django.contrib import messages
from .models import Message, MessageStatus
from Contacts.models import Contact, Group
from User.models import User
import datetime
import json
from django.http import JsonResponse
from django.views import View
from django.shortcuts import render
from django.contrib.auth.mixins import LoginRequiredMixin
from django.core.paginator import Paginator
from .models import EmailLog, Message
from Contacts.models import Contact


class SendEmailView(View):
    def get(self, request):
        contacts = request.user.contacts.all()
        return render(request, 'home/profile.html', {'contacts': contacts})

    def post(self, request):
        try:
            recipient_id = request.POST.get('recipient')
            subject = request.POST.get('subject')
            body = request.POST.get('message')
            attachment = request.FILES.get('attachment')
            schedule = request.POST.get('schedule') == 'on'
            schedule_date = request.POST.get('schedule_date')
            schedule_time = request.POST.get('schedule_time')

            try:
                recipient = Contact.objects.get(id=recipient_id, user=request.user)
            except Contact.DoesNotExist:
                messages.error(request, 'Recipient not found')
                return redirect('send_email')

            message = Message(
                sender=request.user,
                receiver=recipient,
                subject=subject,
                body=body,
                status=MessageStatus.SENT
            )

            if schedule and schedule_date and schedule_time:
                try:
                    scheduled_datetime = datetime.datetime.strptime(
                        f"{schedule_date} {schedule_time}",
                        "%Y-%m-%d %H:%M"
                    )
                    message.scheduled_at = scheduled_datetime
                    message.status = MessageStatus.PENDING
                    messages.success(request, 'Email scheduled successfully')
                except ValueError:
                    messages.error(request, 'Invalid date or time format')
                    return redirect('send_email')
            else:
                messages.success(request, 'Email sent successfully')

            message.save()

            if attachment:
                message.attachment.save(attachment.name, attachment)

            EmailLog.objects.create(
                sender=request.user,
                recipient=recipient,
                subject=subject,
                status=EmailLog.Status.SENT
            )

            if not schedule:
                producer = EmailProducer()
                email_data = {
                    'message_id': message.id,
                    'recipient': recipient.email,
                    'subject': subject,
                    'body': body,
                }
                producer.publish_email_request(email_data)
            return redirect('home:test')

        except Exception as e:
            if 'recipient' in locals():
                EmailLog.objects.create(
                    sender=request.user,
                    recipient=recipient,
                    subject=subject,
                    status=EmailLog.Status.FAILED,
                    error_message=str(e)
                )
            messages.error(request, f'An error occurred: {str(e)}')
            return redirect('home:homes')


class SendGroupEmailView(View):
    def get(self, request):
        groups = Group.objects.all()
        if not groups.exists():
            messages.warning(request, "No Group Created", 'danger')
        return render(request, 'Message/group_email.html', {'groups': groups})

    def post(self, request):
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

        group_ids = request.POST.getlist('recipient')
        subject = request.POST.get('subject')
        body = request.POST.get('message')

        if not group_ids:
            individual_recipients = request.POST.getlist('recipients')
            if not individual_recipients:
                if is_ajax:
                    return JsonResponse({'success': False, 'message': 'select one group at least'})
                messages.error(request, "Select one group at least", 'danger')
                return redirect('home:test')

        try:
            if group_ids:
                contacts = Contact.objects.filter(
                    members__id__in=group_ids,
                    is_active=True
                ).distinct()
            else:
                contacts = Contact.objects.filter(
                    id__in=individual_recipients,
                    is_active=True
                ).distinct()

            for contact in contacts:
                EmailLog.objects.create(
                    sender=request.user,
                    recipient=contact,
                    subject=subject,
                    status=EmailLog.Status.SENT
                )

            if not contacts.exists():
                if is_ajax:
                    return JsonResponse(
                        {'success': False, 'message': 'No active contacts found'})
                messages.warning(request, "No active contacts found", 'danger')
                return redirect('message:send_group_email')

            personalize = request.POST.get('personalize') == 'on'

            producer = EmailProducer()
            for contact in contacts:
                if personalize:
                    email_body = f'Hello {contact.first_name},\n\n{body}'
                else:
                    email_body = body

                email_data = {
                    'recipient': contact.email,
                    'subject': subject,
                    'body': email_body,
                }
                producer.publish_email_request(email_data)

            success_message = f"email Sent to contact is  {contacts.count()} "

            if is_ajax:
                return JsonResponse({'success': True, 'message': success_message})

            messages.success(request, success_message)
            return redirect('home:home')

        except Exception as e:

            error_message = str(e)
            if is_ajax:
                return JsonResponse({'success': False, 'message': error_message})
            messages.error(request, error_message)
            return redirect('message:send_group_email')


class EmailDetailView(LoginRequiredMixin, View):
    def get(self, request, log_id):
        try:
            email_log = EmailLog.objects.get(id=log_id, sender=request.user)
            data = {
                'success': True,
                'email_log': {
                    'sender_email': email_log.sender.email,
                    'recipient_email': email_log.recipient.email,
                    'subject': email_log.subject,
                    'timestamp': email_log.timestamp.isoformat(),
                    'status': email_log.status,
                    'error_message': email_log.error_message}
            }
            return JsonResponse(data)
        except EmailLog.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Email log not found'})
