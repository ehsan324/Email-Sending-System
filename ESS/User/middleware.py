from django.http import HttpResponse
from django.utils import timezone
import random
from .models import OtpCode


class CleanExpiredOtpMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        deleted_count = OtpCode.delete_expired_codes()
        if deleted_count > 0:
            print(f"Deleted {deleted_count} expired OTP codes")

        response = self.get_response(request)
        if response is None:
            response = HttpResponse("Server Error", status=500)
        return response
