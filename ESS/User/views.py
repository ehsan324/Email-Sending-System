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


class UserRegistrationView(View):
    form_class = UserRegistrationForm
    template_name = 'User/register.html'

    @method_decorator(csrf_protect)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def get(self, request):
        form = self.form_class()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        form = self.form_class(request.POST)
        if form.is_valid():
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
            messages.success(request, 'OTP code sent successfully', 'success')
            return redirect('User:user-register-verify')

class UserRegistrationVerifyView(View):
    form_class = UserVerifyForm
    template_name = 'User/verify.html'

    @method_decorator(csrf_protect)
    def dispatch(self, request, *args, **kwargs):
        return super().dispatch(request, *args, **kwargs)

    def get(self, request):
        form = self.form_class()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        user_session = request.session['user_registration_info']
        code_instance = OtpCode.objects.get(phone_number=user_session['phone_number'])
        form = self.form_class(request.POST)
        if form.is_valid():
            if form.cleaned_data['code'] == code_instance.code:
                User.objects.create_user(**user_session)
                messages.success(request, 'registered successfully', 'success')
                code_instance.delete()
                return redirect('home:home')
            else:
                messages.error(request, 'code is wrong', 'error')
                return redirect('home:user-login-verify')
        return redirect('home:home')

class UserLoginView(View):
    form_class = UserLoginForm
    template_name = 'User/login.html'

    @method_decorator(csrf_protect)
    def dispatch(self, request):
        if request.user.is_authenticated:
            return redirect('home:home')
        return super().dispatch(request)

    def get(self, request):
        form = self.form_class()
        return render(request, self.template_name, {'form': form})

    def post(self, request):
        form = self.form_class(request.POST)
        if form.is_valid():
            cd = form.cleaned_data
            request.session['login_info'] = {
                'phone_number': cd['phone_number'],
                'email': cd['email'],
            }
            random_number = random.randint(1000, 9999)
            send_otp_code(cd['phone_number'], random_number)
            OtpCode.objects.create(phone_number=cd['phone_number'], code=random_number)
            messages.success(request, 'OTP code sent successfully', 'success')
            return redirect('User:user-login-verify')
        return redirect('User:login')


class UserLogoutView(LoginRequiredMixin, View):
    def get(self, request):
        logout(request)
        messages.success(request, 'you logout successfully!!', 'success')
        return redirect('home:home')

