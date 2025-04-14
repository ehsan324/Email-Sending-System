from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import render, redirect
from django.views import View
from .forms import UserRegistrationForm, UserLoginForm
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
            return redirect('home:home')



            user = User.objects.create_user(email=cd['email'], first_name=cd['first_name'], last_name=cd['last_name'], phone_number=cd['phone_number'])
            messages.success(request, 'User created successfully')
            return render(request, self.template_name, {'form': form})
        return render(request, self.template_name, {'form': form})

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
            user = User.objects.get(email=cd['email'])
            if user:
                login(request, user)
                messages.success(request, 'User logged in', 'success')
                return redirect('home:home')
            else:
                messages.error(request, 'User with this email not exist', 'error')
                return redirect('home:home')
        return render(request, self.template_name, {'form': form})

class UserLogoutView(LoginRequiredMixin, View):
    def get(self, request):
        logout(request)
        messages.success(request, 'you logout successfully!!', 'success')
        return redirect('home:home')

