from django.shortcuts import render, redirect
from django.views import View
from .forms import TicketForm
from django.contrib import messages
from utils import EmailService

class HomeView(View):
    def get(self, request):
        return render(request, 'home/index.html')

class TestView(View):
    def get(self, request):
        return render(request, 'home/profile.html')


class TicketView(View):
    def get(self, request):
        form = TicketForm()
        return render(request, 'home/index.html', {'form': form})

    def post(self, request):
        if request.method == 'POST':
            form = TicketForm(request.POST)
            if form.is_valid():
                ticket = form.save()

                EmailService.send_email(
                    recipient=ticket.email,
                    subject=ticket.subject,
                    body=f'Hi {ticket.name} \n your ticket is created and snet to admin. Be patient until response'
                )
                messages.success(request, 'Your ticket has been created!', 'success')
                return redirect('home:homes')
            else:
                messages.error(request, 'Please correct the error below.', 'error')
        else:
            form = TicketForm()

        return render(request, 'home/index.html', {'form': form})