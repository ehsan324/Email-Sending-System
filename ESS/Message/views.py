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
        # نمایش فرم
        contacts = request.user.contacts.all()
        return render(request, 'home/profile.html', {'contacts': contacts})

    def post(self, request):
        try:
            # دریافت داده‌های فرم
            recipient_id = request.POST.get('recipient')
            subject = request.POST.get('subject')
            body = request.POST.get('message')
            attachment = request.FILES.get('attachment')
            schedule = request.POST.get('schedule') == 'on'
            schedule_date = request.POST.get('schedule_date')
            schedule_time = request.POST.get('schedule_time')

            # دریافت مخاطب
            try:
                recipient = Contact.objects.get(id=recipient_id, user=request.user)
            except Contact.DoesNotExist:
                messages.error(request, 'Recipient not found')
                return redirect('send_email')

            # ایجاد پیام
            message = Message(
                sender=request.user,
                receiver=recipient,
                subject=subject,
                body=body,
                status=MessageStatus.SENT
            )

            if schedule and schedule_date and schedule_time:
                # اگر زمانبندی شده است
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

            # اگر فایل ضمیمه وجود دارد
            if attachment:
                message.attachment.save(attachment.name, attachment)

            EmailLog.objects.create(
                sender=request.user,
                recipient=recipient,
                subject=subject,
                status=EmailLog.Status.SENT
            )

            # ارسال به صف RabbitMQ (اگر زمانبندی نشده است)
            if not schedule:
                producer = EmailProducer()
                email_data = {
                    'message_id': message.id,
                    'recipient': recipient.email,
                    'subject': subject,
                    'body': body,
                }
                producer.publish_email_request(email_data)
            return redirect('home:homes')

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


class EmailSentConfirmationView(View):
    def get(self, request):
        return render(request, 'home/index.html')


class SendGroupEmailView(View):
    def get(self, request):
        groups = Group.objects.all()
        if not groups.exists():
            messages.warning(request, "هیچ گروهی ایجاد نشده است. لطفاً ابتدا گروه‌ها را تعریف کنید.")
        return render(request, 'Message/group_email.html', {'groups': groups})

    def post(self, request):
        # بررسی آیا درخواست AJAX است
        is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

        # دریافت داده‌ها از فرم
        group_ids = request.POST.getlist('groups')
        subject = request.POST.get('subject')
        body = request.POST.get('message')  # توجه: در فرم HTML نام فیلد message است نه body

        # اگر گروه انتخاب نشده، بررسی گیرندگان فردی
        if not group_ids:
            individual_recipients = request.POST.getlist('recipients')
            if not individual_recipients:
                if is_ajax:
                    return JsonResponse({'success': False, 'message': 'لطفاً حداقل یک گروه یا گیرنده انتخاب کنید.'})
                messages.error(request, "لطفاً حداقل یک گروه یا گیرنده انتخاب کنید.")
                return redirect('message:send_group_email')

        try:
            # اگر گروه انتخاب شده
            if group_ids:
                contacts = Contact.objects.filter(
                    members__id__in=group_ids,
                    is_active=True
                ).distinct()
            else:
                # اگر گیرندگان فردی انتخاب شده‌اند
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
                        {'success': False, 'message': 'هیچ مخاطب فعالی در گروه‌های انتخاب‌شده وجود ندارد.'})
                messages.warning(request, "هیچ مخاطب فعالی در گروه‌های انتخاب‌شده وجود ندارد.")
                return redirect('message:send_group_email')

            # بررسی آیا شخصی‌سازی فعال است
            personalize = request.POST.get('personalize') == 'on'

            producer = EmailProducer()
            for contact in contacts:
                if personalize:
                    email_body = f'سلام {contact.first_name},\n\n{body}'
                else:
                    email_body = body

                email_data = {
                    'recipient': contact.email,
                    'subject': subject,
                    'body': email_body,
                }
                producer.publish_email_request(email_data)

            success_message = f"ایمیل با موفقیت به {contacts.count()} مخاطب ارسال شد."

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


class EmailHistoryView(LoginRequiredMixin, View):
    def get(self, request):
        status_filter = request.GET.get('status', '')
        recipient_filter = request.GET.get('recipient', '')

        email_logs = EmailLog.objects.filter(sender=request.user)

        if status_filter:
            email_logs = email_logs.filter(status=status_filter)

        if recipient_filter:
            email_logs = email_logs.filter(recipient__email__icontains=recipient_filter)

        paginator = Paginator(email_logs, 20)  # 20 آیتم در هر صفحه
        page_number = request.GET.get('page')
        page_obj = paginator.get_page(page_number)

        contacts = Contact.objects.filter(user=request.user)

        context = {
            'email_logs': page_obj,
            'status_choices': EmailLog.Status.choices,
            'contacts': contacts,
            'current_status': status_filter,
            'current_recipient': recipient_filter,
        }

        return render(request, 'home/profile.html', context)


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
                    'error_message': email_log.error_message                }
            }
            return JsonResponse(data)
        except EmailLog.DoesNotExist:
            return JsonResponse({'success': False, 'error': 'Email log not found'})