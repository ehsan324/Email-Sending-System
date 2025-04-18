from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render, redirect
from django.views import View
from .forms import UserRegistrationForm, UserLoginForm, UserVerifyForm
from django.contrib import messages
from .models import User, OtpCode
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from django.contrib.auth import login, logout
import random
from utils import send_otp_code
from ESS.settings import LOGIN_REDIRECT_URL
from django.core.exceptions import ObjectDoesNotExist


class BaseVerifyView(View):
    form_class = UserVerifyForm
    template_name = 'User/verify.html'
    success_message = None
    session_key = None
    failure_redirect = None

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
            messages.error(request, 'Session expired, StartOver', 'error')
            return redirect(self.failure_redirect)
        form = self.form_class()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        try:
            session_data = self.get_session_data(request)
            if not session_data:
                messages.error(request, 'Session expired, StartOver', 'error')
                return redirect(self.failure_redirect)

            form = self.form_class(request.POST)
            if not form.is_valid():
                messages.error(request, 'Incorrect One', 'error')
                return render(request, self.template_name, {'form': form})

            code_instance = OtpCode.objects.get(phone_number=session_data['phone_number'])
            if code_instance.is_expired():
                messages.error(request, 'Otp code has expired', 'error')
                code_instance.delete()
                return redirect(self.failure_redirect)

            if form.cleaned_data['code'] != code_instance.code:
                messages.error(request, 'Invalid verification code')
                return render(request, self.template_name, {'form': form})

            self.handle_success(request, session_data)
            code_instance.delete()
            messages.success(request, self.success_message, 'success')
            return redirect(LOGIN_REDIRECT_URL)

        except ObjectDoesNotExist:
            messages.error(request, 'Invalid session, please try again')
            return redirect(self.failure_redirect)


class UserRegistrationVerifyView(BaseVerifyView):
    session_key = 'user_registration_info'
    success_message = 'Registered Successful'
    failure_redirect = 'User:user-login'

    def handle_success(self, request, session_data):
        User.objects.create_user(**session_data)
        if self.session_key in request.session:
            del request.session[self.session_key]


class UserLoginVerifyView(BaseVerifyView):
    session_key = ('login_info')
    success_message = 'Login Successful'
    failure_redirect = 'User:user-login'

    def handle_success(self, request, session_data):
        user = User.objects.get(email=session_data['email'])
        login(request, user)

        if self.session_key in request.session:
            del request.session[self.session_key]


class UserRegistrationView(View):
    form_class = UserRegistrationForm
    template_name = 'User/register.html'
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
            return render(request, self.template_name, {'form': form})

        cd = form.cleaned_data
        request.session['user_registration_info'] = {
            'phone_number': cd['phone_number'],
            'email': cd['email'],
            'first_name': cd['first_name'],
            'last_name': cd['last_name'],
        }

        random_number = random.randint(1000, 9999)
        send_otp_code(cd['phone_number'], random_number)
        OtpCode.objects.create(phone_number=cd['phone_number'], code=random_number)

        messages.success(request, 'OTP code sent successfully')
        return redirect(self.success_redirect)


class UserLoginView(View):
    form_class = UserLoginForm
    template_name = 'User/login.html'
    success_redirect = 'User:user-login-verify'

    @method_decorator(csrf_protect)
    def dispatch(self, request, *args, **kwargs):
        if request.user.is_authenticated:
            return redirect('home:home')
        return super().dispatch(request, *args, **kwargs)

    def get(self, request):
        form = self.form_class()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        form = self.form_class(request.POST)
        if not form.is_valid():
            return render(request, self.template_name, {'form': form})

        cd = form.cleaned_data
        request.session['login_info'] = {
            'phone_number': cd['phone_number'],
            'email': cd['email'],
        }

        random_number = random.randint(1000, 9999)
        send_otp_code(cd['phone_number'], random_number)
        OtpCode.objects.create(phone_number=cd['phone_number'], code=random_number)

        messages.success(request, 'OTP code sent successfully')
        return redirect(self.success_redirect)


class UserLogoutView(LoginRequiredMixin, View):
    def get(self, request):
        logout(request)
        messages.success(request, 'you logout successfully!!', 'success')
        return redirect('home:home')
