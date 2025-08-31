from django.urls import path
from . import views

app_name = 'Contact'
urlpatterns = [
    path('create/', views.ContactCreateView.as_view(), name='add-contact'),
    path('contact-list/', views.ContactListView.as_view(), name='contact-list'),
    path('get-contact/<int:contact_id>/', views.GetContactView.as_view(), name='get-contact'),
    path('update-contact/<int:contact_id>/', views.UpdateContactView.as_view(), name='update-contact'),
    path('delete-contact/<int:contact_id>/', views.DeleteContactView.as_view(), name='delete-contact'),
    path('create-group/', views.CreateGroupView.as_view(), name='create-group'),
    path('group-list/', views.GroupListView.as_view(), name='group-list'),
    path('group-detail/<int:group_id>/', views.GroupDetailView.as_view(), name='group-detail'),
    path('delete-group/<int:group_id>/', views.DeleteGroupView.as_view(), name='delete-group'),

    # api
    path('api/contacts/', views.total_contacts),
    path('api/groups/', views.total_groups),
]
