from .email_producer import EmailProducer
from django.views import View
from django.shortcuts import render, redirect
from Contacts.models import Contact, Group
from django.contrib import messages


class SendEmailView(View):
    def get(self,request):
        recipient = request.POST.get('recipient', '')
        subject = request.POST.get('subject', '')
        message = request.POST.get('message', '')
        producer = EmailProducer()
        email_data = {
            'recipient': recipient,
            'subject': subject,
            'body': message,
            # sender and password can be omitted if using defaults
        }
        producer.publish_email_request(email_data)
        return redirect('home:home')



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