from django.db.models import Count
from django.views import View
from django.views.generic import CreateView
from django.urls import reverse_lazy
from .forms import ContactForm
from django.http import JsonResponse
from django.contrib.auth.mixins import LoginRequiredMixin
from django.shortcuts import get_object_or_404
import json
from django.contrib import messages
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from .models import Contact, Group


class ContactCreateView(LoginRequiredMixin, CreateView):
    model = Contact
    form_class = ContactForm
    template_name = 'home/profile.html'
    success_url = reverse_lazy('Contact:add-contact')

    def form_valid(self, form):
        form.instance.user = self.request.user
        self.object = form.save()
        if self.request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'message': 'Contact added successfully!'
            })
        messages.success(self.request, 'Contact added successfully!', 'success')
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


class GetContactView(LoginRequiredMixin, View):
    def get(self, request, contact_id):
        contact = get_object_or_404(Contact, id=contact_id, user=request.user)
        return JsonResponse({
            'first_name': contact.first_name,
            'last_name': contact.last_name,
            'email': contact.email,
            'phone': contact.phone
        })


class UpdateContactView(LoginRequiredMixin, View):
    def post(self, request, contact_id):
        contact = get_object_or_404(Contact, id=contact_id, user=request.user)

        data = json.loads(request.body)

        contact.first_name = data.get('first_name')
        contact.last_name = data.get('last_name')
        contact.email = data.get('email')
        contact.phone = data.get('phone')
        contact.save()

        return JsonResponse({'status': 'success'})


class DeleteContactView(LoginRequiredMixin, View):
    def post(self, request, contact_id):
        contact = get_object_or_404(Contact, id=contact_id, user=request.user)
        contact.delete()
        return JsonResponse({'status': 'success'})


class CreateGroupView(LoginRequiredMixin, View):
    def post(self, request):
        try:
            data = request.POST
            group = Group.objects.create(
                user=request.user,
                name=data.get('group_name'),
                description=data.get('description'),
            )

            contact_ids = request.POST.getlist('contacts')
            contacts = Contact.objects.filter(id__in=contact_ids, user=request.user)
            group.members.add(*contacts)

            return JsonResponse({
                'status': 'success',
                'message': 'Group created successfully',
                'group_id': group.id
            })

        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=400)


class GroupListView(LoginRequiredMixin, View):
    def get(self, request):
        groups = Group.objects.filter(user=request.user).annotate(
            members_count=Count('members')
        ).order_by('-created_at')

        groups_data = []
        for group in groups:
            groups_data.append({
                'id': group.id,
                'name': group.name,
                'description': group.description,
                'created_at': group.created_at.strftime('%Y-%m-%d %H:%M'),
                'members_count': group.members_count
            })

        return JsonResponse({
            'status': 'success',
            'groups': groups_data
        })


class GroupDetailView(LoginRequiredMixin, View):
    def get(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id, user=request.user)
            members = group.members.all().values('id', 'first_name', 'last_name', 'email')

            return JsonResponse({
                'status': 'success',
                'group': {
                    'id': group.id,
                    'name': group.name,
                    'description': group.description,
                    'created_at': group.created_at.strftime('%Y-%m-%d %H:%M'),
                },
                'members': list(members)
            })
        except Group.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'Group not found'
            }, status=404)

    def post(self, request, group_id):
        try:
            data = json.loads(request.body)
            group = Group.objects.get(id=group_id, user=request.user)

            group.name = data.get('name', group.name)
            group.description = data.get('description', group.description)
            group.save()

            return JsonResponse({
                'status': 'success',
                'message': 'Group updated successfully',
                'group': {
                    'id': group.id,
                    'name': group.name,
                    'description': group.description,
                    'created_at': group.created_at.strftime('%Y-%m-%d %H:%M'),
                }
            })
        except Group.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'Group not found'
            }, status=404)
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': str(e)
            }, status=400)


class DeleteGroupView(LoginRequiredMixin, View):
    def post(self, request, group_id):
        try:
            group = Group.objects.get(id=group_id, user=request.user)
            group.delete()

            return JsonResponse({
                'status': 'success',
                'message': 'Group deleted successfully'
            })
        except Group.DoesNotExist:
            return JsonResponse({
                'status': 'error',
                'message': 'Group not found'
            }, status=404)



User = get_user_model()


@api_view(['GET'])
def total_contacts(request):
    user = request.user
    count = Contact.objects.filter(user=user, is_active=True).count()
    return Response({'count': count})


@api_view(['GET'])
def total_groups(request):
    user = request.user
    count = Group.objects.filter(user=user, is_active=True).count()
    return Response({'count': count})

