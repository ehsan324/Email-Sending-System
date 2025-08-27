from django.urls import reverse

from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render, redirect
from django.views import View
from .forms import UserRegistrationForm, UserLoginForm, UserVerifyForm
from django.contrib import messages
from .models import User, OtpCode
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect, csrf_exempt
from django.contrib.auth import login, logout
import random
from utils import send_otp_code, delete_code
from ESS.settings import LOGIN_REDIRECT_URL
from django.core.exceptions import ObjectDoesNotExist
from django.http import JsonResponse
import json


class BaseVerifyView(View):
    form_class = UserVerifyForm
    template_name = 'home/index.html'
    success_message = None
    session_key = None
    failure_redirect = 'home/index.html'
    error_message = None

    @method_decorator(csrf_protect)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def get_session_data(self, request):
        """Get session data. Or None if not exist"""
        return request.session.get(self.session_key)

    def handle_success(self, request, session_data):
        """implement by child"""
        raise NotImplementedError

    def get(self, request):
        if not self.get_session_data(request):
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'error': 'Session expired, please start over',
                    'redirect': reverse(self.failure_redirect)
                }, status=400)
            else:
                messages.error(request, 'Session expired, please start over', 'error')
                return redirect(self.failure_redirect)

        form = self.form_class()
        return render(request, self.template_name, {
            'form': form,
            'show_verification': True,
            'phone': self.get_session_data(request)['phone_number']
        })

    def post(self, request):
        # حذف کدهای منقضی شده قبل از پردازش
        OtpCode.delete_expired_codes()

        try:
            session_data = self.get_session_data(request)
            if not session_data:
                return self.handle_session_expired(request)

            form = self.form_class(request.POST)
            if not form.is_valid():
                return self.handle_invalid_form(request, form, session_data)

            try:
                code_instance = OtpCode.objects.get(
                    phone_number=session_data['phone_number'],
                    code=form.cleaned_data['code']
                )
            except OtpCode.DoesNotExist:
                return self.handle_invalid_code(request, session_data)

            if code_instance.is_expired():
                code_instance.delete()
                return self.handle_expired_code(request, session_data)

            # اگر کد معتبر بود
            result = self.handle_success(request, session_data)
            # بعد از استفاده موفق، کد را حذف کنید
            code_instance.delete()
            return result

        except Exception as e:
            return self.handle_unexpected_error(request, e)

    def handle_expired_code(self, request, session_data):
        error_msg = 'OTP code has expired. Please request a new one.'
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': False,
                'error': error_msg,
                'redirect': reverse(self.failure_redirect)
            }, status=400)
        else:
            messages.error(request, error_msg, 'error')
            return redirect(self.failure_redirect)

    def handle_invalid_code(self, request, session_data):
        error_msg = 'Invalid verification code'
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': False,
                'error': error_msg
            }, status=400)
        else:
            messages.error(request, error_msg, 'error')
            return render(request, self.template_name, {
                'form': self.form_class(),
                'show_verification': True,
                'phone': session_data['phone_number']
            })

    def handle_session_expired(self, request):
        error_msg = 'Session expired, please start over'
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': False,
                'error': error_msg,
                'redirect': reverse(self.failure_redirect)
            }, status=400)
        else:
            messages.error(request, error_msg, 'error')
            return redirect(self.failure_redirect)

    def handle_invalid_form(self, request, form, session_data):
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': False,
                'error': 'Invalid form data',
                'errors': {f: e[0] for f, e in form.errors.items()}
            }, status=400)
        else:
            return render(request, self.template_name, {
                'form': form,
                'show_verification': True,
                'phone': session_data['phone_number']
            })

    def handle_unexpected_error(self, request, e):
        error_msg = f'An unexpected error occurred: {str(e)}'
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': False,
                'error': error_msg
            }, status=500)
        else:
            messages.error(request, error_msg, 'error')
            return redirect(self.failure_redirect)


class UserRegistrationVerifyView(BaseVerifyView):
    session_key = 'user_registration_info'
    success_message = 'Registered Successful'
    failure_redirect = 'User:user-login'

    def handle_success(self, request, session_data):
        User.objects.create_user(**session_data)
        if self.session_key in request.session:
            del request.session[self.session_key]

        messages.success(request, self.success_message, 'success')
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'message': self.success_message,
                'redirect': reverse('home:homes')
            })
        else:
            return redirect('home:homes')


class UserLoginVerifyView(BaseVerifyView):
    session_key = ('login_info')
    success_message = 'Login Successful'
    failure_redirect = 'User:user-login'

    def handle_success(self, request, session_data):
        user = User.objects.get(phone_number=session_data['phone_number'])
        login(request, user)

        if self.session_key in request.session:
            del request.session[self.session_key]

        messages.success(request, self.success_message, 'success')
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'message': self.success_message,
                'redirect': reverse('home:test')

            })
        else:
            return redirect('home:test')

class UserRegistrationView(View):
    form_class = UserRegistrationForm
    template_name = 'home/index.html'
    success_redirect = 'User:user-register-verify'

    @method_decorator(csrf_protect)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def get(self, request):
        form = self.form_class()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        form = self.form_class(request.POST)

        if not form.is_valid():
            return JsonResponse({
                'success': False,
                'error': 'مشکل در اعتبارسنجی فرم',
                'errors': {f: e[0] for f, e in form.errors.items()},
            }, status=400)

        try:
            cd = form.cleaned_data
            OtpCode.objects.filter(phone_number=cd['phone_number']).delete()  # delete old otpcode before sending
            request.session['user_registration_info'] = {
                'phone_number': cd['phone_number'],
                'email': cd['email'],
                'first_name': cd['first_name'],
                'last_name': cd['last_name'],
            }

            random_number = random.randint(1000, 9999)
            send_otp_code(cd['phone_number'], random_number)
            OtpCode.objects.create(phone_number=cd['phone_number'], code=random_number)

            OtpCode.delete_expired_codes()

            # اگر درخواست AJAX است، پاسخ JSON برگردان
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'phone': cd['phone_number'],
                    'notification': f'We sent OTP code to {cd["phone_number"]}'
                })
            else:
                return render(request, self.template_name, {
                    'show_verification': True,
                    'phone': cd['phone_number']
                })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e),
            }, status=500)


class UserLoginView(View):
    form_class = UserLoginForm
    template_name = 'home/index.html'
    success_redirect = 'User:user-login-verify'

    @method_decorator(csrf_protect)
    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return JsonResponse({'success': False,
                                 'error': 'You are already logged in'},
                                )
        return super().dispatch(request, *args, **kwargs)

    def get(self, request):
        form = self.form_class()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        form = self.form_class(request.POST)

        if not form.is_valid():
            return JsonResponse({
                'success': False,
                'error': 'Invalid form data',
                'errors': form.errors.get_json_data()
            }, status=400)

        try:
            cd = form.cleaned_data

            random_number = random.randint(1000, 9999)
            send_otp_code(cd['phone_number'], random_number)
            obotpcode = OtpCode.objects.create(phone_number=cd['phone_number'], code=random_number)

            request.session['login_info'] = {
                'phone_number': cd['phone_number'],
            }
            request.session.modified = True

            # برای درخواست‌های AJAX
            return JsonResponse({
                'success': True,
                'message': 'OTP code sent successfully',
                'phone': cd['phone_number']

            })

        except Exception as e:
            return JsonResponse({
                'success': False,
                'error': str(e)
            }, status=500)


class UserLogoutView(LoginRequiredMixin, View):
    def get(self, request):
        logout(request)
        messages.success(request, 'you logout successfully!!', 'success')
        return redirect('home:homes')
