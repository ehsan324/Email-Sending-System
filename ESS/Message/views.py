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
            messages.error(request, f'An error occurred: {str(e)}')
            return redirect('home:homes')


class EmailSentConfirmationView(View):
    def get(self, request):
        return render(request, 'home/index.html')


class SendGroupEmailView(View):
    def get(self, request):
        groups = Group.objects.all()
        if not groups.exists():  # اگر گروهی وجود ندارد
            messages.warning(request, "هیچ گروهی ایجاد نشده است. لطفاً ابتدا گروه‌ها را تعریف کنید.")
        return render(request, 'Message/group_email.html', {'groups': groups})

    def post(self, request):
        group_ids = request.POST.getlist('groups')  # لیست ID گروه‌های انتخاب‌شده
        subject = request.POST.get('subject')
        body = request.POST.get('body')

        if not group_ids:
            messages.error(request, "لطفاً حداقل یک گروه انتخاب کنید.")
            return redirect('message:send_group_email')

        try:
            # دریافت تمام مخاطبین گروه‌های انتخاب‌شده (بدون تکرار)
            contacts = Contact.objects.filter(
                members__id__in=group_ids,
                is_active=True
            ).distinct()

            if not contacts.exists():
                messages.warning(request, "هیچ مخاطب فعالی در گروه‌های انتخاب‌شده وجود ندارد.")
                return redirect('message:send_group_email')

            producer = EmailProducer()
            for contact in contacts:
                email_data = {
                    'recipient': contact.email,
                    'subject': subject,
                    'body': f'سلام {contact.first_name},\n\n{body}',
                }
                producer.publish_email_request(email_data)

            messages.success(request, f"ایمیل با موفقیت به {contacts.count()} مخاطب ارسال شد.")
            return redirect('home:home')

        except Group.DoesNotExist:
            messages.error(request, "یکی از گروه‌های انتخاب‌شده معتبر نیست.")
            return redirect('message:send_group_email')