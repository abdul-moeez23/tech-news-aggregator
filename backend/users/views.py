from django.contrib.auth.models import User
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.conf import settings
from .serializers import RegisterSerializer
from core.email import send_email

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer

    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        user = User.objects.get(username=response.data['username'])
        
        # Generate token
        signer = TimestampSigner()
        token = signer.sign(user.username)
        
        # Send email
        if user.email:
            verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
            html_content = f'<p>Please verify your email by clicking <a href="{verify_url}">here</a>.</p>'
            send_email(user.email, "Verify Your Email", html_content)
        
        return response

class VerifyEmailView(APIView):
    permission_classes = (AllowAny,)
    
    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        signer = TimestampSigner()
        try:
            # Token valid for 24 hours (86400 seconds)
            username = signer.unsign(token, max_age=86400)
            user = User.objects.get(username=username)
            user.profile.is_email_verified = True
            user.profile.save()
            return Response({'message': 'Email verified successfully'})
        except SignatureExpired:
            return Response({'error': 'Token has expired'}, status=status.HTTP_400_BAD_REQUEST)
        except (BadSignature, User.DoesNotExist):
            return Response({'error': 'Invalid token'}, status=status.HTTP_400_BAD_REQUEST)

class ForgotPasswordView(APIView):
    permission_classes = (AllowAny,)
    
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.get(email=email)
            signer = TimestampSigner(salt='password-reset')
            token = signer.sign(user.username)
            
            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
            html_content = f'<p>You requested a password reset. Click <a href="{reset_url}">here</a> to reset your password.</p>'
            send_email(user.email, "Password Reset Request", html_content)
            
        except User.DoesNotExist:
            # We shouldn't reveal if a user exists or not for security reasons, so just do nothing
            pass
            
        return Response({'message': 'If an account with that email exists, a password reset link has been sent.'})

class ResetPasswordView(APIView):
    permission_classes = (AllowAny,)
    
    def post(self, request):
        token = request.data.get('token')
        new_password = request.data.get('new_password')
        
        if not token or not new_password:
            return Response({'error': 'Token and new password are required'}, status=status.HTTP_400_BAD_REQUEST)
            
        signer = TimestampSigner(salt='password-reset')
        try:
            username = signer.unsign(token, max_age=86400) # Valid for 24 hours
            user = User.objects.get(username=username)
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Password has been reset successfully.'})
        except SignatureExpired:
            return Response({'error': 'Reset token has expired'}, status=status.HTTP_400_BAD_REQUEST)
        except (BadSignature, User.DoesNotExist):
            return Response({'error': 'Invalid reset token'}, status=status.HTTP_400_BAD_REQUEST)
