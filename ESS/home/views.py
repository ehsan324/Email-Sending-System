from django.shortcuts import render, redirect
from django.views import View
from .forms import TicketForm
from django.contrib import messages

class HomeView(View):
    def get(self, request):
        return render(request, 'home/index.html')


class TicketView(View):
    def get(self, request):
        form = TicketForm()
        return render(request, 'home/index.html', {'form': form})

    def post(self, request):
        if request.method == 'POST':
            form = TicketForm(request.POST)
            if form.is_valid():
                form.save()
                messages.success(request, 'Your ticket has been created!', 'success')
                return redirect('home:homes')
            else:
                messages.error(request, 'Please correct the error below.', 'error')
        else:
            form = TicketForm()

        return render(request, 'home/index.html', {'form': form})