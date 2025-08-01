from django.http import JsonResponse
from django.views import View
from django.views.generic import CreateView
from django.urls import reverse_lazy
from .models import Contact
from .forms import ContactForm
from django.views.generic import ListView, UpdateView, DeleteView
from django.http import JsonResponse
from django.contrib.auth.mixins import LoginRequiredMixin


class ContactCreateView(LoginRequiredMixin, CreateView):
    model = Contact
    form_class = ContactForm
    template_name = 'home/profile.html'
    success_url = reverse_lazy('Contact:contact-list')

    def form_valid(self, form):
        form.instance.user = self.request.user  # اختصاص کاربر فعلی به مخاطب
        self.object = form.save()
        if self.request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'message': 'Contact added successfully!'
            })
        return super().form_valid(form)

    def form_invalid(self, form):
        if self.request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': False,
                'errors': form.errors.get_json_data()
            }, status=400)
        return super().form_invalid(form)


class ContactListView(LoginRequiredMixin, View):
    def get(self, request):
        contacts = Contact.objects.filter(user=request.user, is_active=True).values(
            'id', 'first_name', 'last_name', 'email', 'phone'
        )
        return JsonResponse({'contacts': list(contacts)})