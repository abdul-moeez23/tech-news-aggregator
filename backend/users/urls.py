from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView,
    ResendVerificationEmailView,
    VerifyEmailView,
    LoginView,
    ForgotPasswordView,
    ResetPasswordView,
)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth_register'),
    path('resend-verification/', ResendVerificationEmailView.as_view(), name='resend_verification'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify_email'),
    path('login/', LoginView.as_view(), name='token_obtain_pair'),
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot_password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
]
