from django.contrib.auth.models import User
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.conf import settings
import logging

from django.core.exceptions import ObjectDoesNotExist

from .serializers import RegisterSerializer
from preferences.models import UserProfile   # single UserProfile — lives in preferences
from core.email import send_email

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _build_verify_email_html(username: str, verify_url: str) -> str:
    return f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #e2e8f0; border-radius: 10px; overflow: hidden;">
        <!-- Header -->
        <div style="text-align: center; padding: 32px 24px 24px; border-bottom: 1px solid #1e293b;">
            <h1 style="color: #38bdf8; font-size: 26px; margin: 0; letter-spacing: 0.5px;">📰 Tech News</h1>
            <p style="color: #64748b; margin: 6px 0 0; font-size: 13px;">Your daily dose of tech updates</p>
        </div>
        <!-- Body -->
        <div style="padding: 32px 24px;">
            <h2 style="color: #f1f5f9; font-size: 20px; margin: 0 0 16px;">Verify your email address</h2>
            <p style="color: #cbd5e1; line-height: 1.7; margin: 0 0 28px;">
                Hi <strong style="color: #f1f5f9;">{username}</strong>, welcome to Tech News!<br>
                Please verify your email address by clicking the button below.
                This link will expire in <strong>24 hours</strong>.
            </p>
            <div style="text-align: center; margin-bottom: 28px;">
                <a href="{verify_url}"
                   style="background-color: #38bdf8; color: #0f172a; text-decoration: none;
                          padding: 14px 36px; border-radius: 6px; font-weight: bold;
                          font-size: 15px; display: inline-block; letter-spacing: 0.3px;">
                    Verify Email Address
                </a>
            </div>
            <p style="color: #475569; font-size: 13px; line-height: 1.7; margin: 0;">
                If you didn't create an account, you can safely ignore this email.<br>
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="{verify_url}" style="color: #38bdf8; word-break: break-all; font-size: 12px;">{verify_url}</a>
            </p>
        </div>
        <!-- Footer -->
        <div style="border-top: 1px solid #1e293b; padding: 16px 24px; text-align: center;">
            <p style="color: #334155; font-size: 12px; margin: 0;">
                © 2026 Tech News &nbsp;·&nbsp;
                <a href="mailto:updates@news.amiftikhar.me" style="color: #334155; text-decoration: none;">updates@news.amiftikhar.me</a>
            </p>
        </div>
    </div>
    """


def _send_verification_email(user: User, profile: UserProfile) -> None:
    """
    Generate a fresh token, store it on the profile (invalidating the old one),
    update rate-limit counters, and dispatch the email.
    """
    signer = TimestampSigner(salt='email-verification')
    token = signer.sign(user.username)

    # Persist the new token so we can invalidate stale ones on verify
    profile.verification_token = token

    # Rate-limit bookkeeping
    now = timezone.now()
    if (
        profile.resend_last_requested_at is None
        or (now - profile.resend_last_requested_at).total_seconds() > 3600
    ):
        # New hour window — reset counter
        profile.resend_count = 1
    else:
        profile.resend_count += 1
    profile.resend_last_requested_at = now
    profile.save(update_fields=['verification_token', 'resend_count', 'resend_last_requested_at'])

    verify_url = f"{settings.FRONTEND_URL}/verify-email?token={token}"
    html_content = _build_verify_email_html(user.username, verify_url)
    result = send_email(user.email, "Verify Your Email — Tech News", html_content)
    logger.info(
        f"[email] Verification email sent to '{user.email}' "
        f"(id: {result.get('id', 'N/A') if result else 'ERROR'})"
    )


# ---------------------------------------------------------------------------
# Register
# ---------------------------------------------------------------------------

class RegisterView(APIView):
    """
    POST /auth/register/

    Flow:
    1. If email is brand new → create account + send verification email.
    2. If email exists but NOT verified → resend verification email (rate-limited).
    3. If email exists AND already verified → reject with a clear login prompt.

    Username conflicts are caught by the serializer.
    """
    permission_classes = (AllowAny,)

    def post(self, request, *args, **kwargs):
        email = request.data.get('email', '').strip().lower()

        # ── Case: email already in use ──────────────────────────────────────
        existing_user = User.objects.filter(email__iexact=email).first()
        if existing_user:
            try:
                profile = existing_user.profile
            except ObjectDoesNotExist:
                profile = UserProfile.objects.create(user=existing_user)

            if profile.is_email_verified:
                # Already verified — tell user to log in
                return Response(
                    {'error': 'Email already registered. Please log in.'},
                    status=status.HTTP_409_CONFLICT,
                )

            # Not verified — check cooldown / hourly cap before resending
            allowed, reason = profile.can_resend_email()
            if not allowed:
                return Response(
                    {
                        'error': reason,
                        'retry_after_seconds': profile.seconds_until_cooldown_ends(),
                    },
                    status=status.HTTP_429_TOO_MANY_REQUESTS,
                )

            try:
                _send_verification_email(existing_user, profile)
            except Exception as e:
                logger.exception(f"[RegisterView] Failed to resend verification email to '{email}': {e}")
                return Response(
                    {'error': 'Failed to send verification email. Please try again later.'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

            return Response(
                {
                    'message': (
                        'This email is already registered but not yet verified. '
                        'A new verification email has been sent.'
                    )
                },
                status=status.HTTP_200_OK,
            )

        # ── Case: brand-new email → create account ──────────────────────────
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()

        # Ensure profile exists (signal should have created it, but be safe)
        profile, _ = UserProfile.objects.get_or_create(user=user)

        try:
            _send_verification_email(user, profile)
        except Exception as e:
            logger.exception(f"[RegisterView] Failed to send verification email to new user '{user.username}': {e}")
            # Account is created but email failed — inform the user
            return Response(
                {
                    'message': (
                        'Account created successfully, but we could not send the verification email. '
                        'Please use the resend option.'
                    ),
                    'username': user.username,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            {
                'message': 'Account created successfully. Please check your email to verify your account.',
                'username': user.username,
            },
            status=status.HTTP_201_CREATED,
        )


# ---------------------------------------------------------------------------
# Resend Verification Email (standalone endpoint)
# ---------------------------------------------------------------------------

class ResendVerificationEmailView(APIView):
    """
    POST /auth/resend-verification/
    Body: { "email": "user@example.com" }

    Allows the user to request a fresh verification email independently
    (e.g. from the login page "didn't get the email?" link).

    Rate limit (two-layer):
      - 60-second cooldown between each request.
      - Max 5 requests per hour.
    """
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email', '').strip().lower()
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email__iexact=email).first()

        # Always return a generic success to avoid user-enumeration attacks
        generic_ok = Response(
            {'message': 'If that email is registered and unverified, a new verification email has been sent.'},
            status=status.HTTP_200_OK,
        )

        if not user:
            return generic_ok

        try:
            profile = user.profile
        except ObjectDoesNotExist:
            profile = UserProfile.objects.create(user=user)

        if profile.is_email_verified:
            return generic_ok  # silently do nothing — don't reveal verified status

        allowed, reason = profile.can_resend_email()
        if not allowed:
            return Response(
                {
                    'error': reason,
                    'retry_after_seconds': profile.seconds_until_cooldown_ends(),
                },
                status=status.HTTP_429_TOO_MANY_REQUESTS,
            )

        try:
            _send_verification_email(user, profile)
        except Exception as e:
            logger.exception(f"[ResendVerificationEmailView] Failed for '{email}': {e}")

        return generic_ok


# ---------------------------------------------------------------------------
# Verify Email
# ---------------------------------------------------------------------------

class VerifyEmailView(APIView):
    """
    POST /auth/verify-email/
    Body: { "token": "<signed token from email>" }

    Validates the token, checks it matches the stored active token
    (so old/invalidated tokens are rejected), marks email as verified.
    """
    permission_classes = (AllowAny,)

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({'error': 'Token is required.'}, status=status.HTTP_400_BAD_REQUEST)

        signer = TimestampSigner(salt='email-verification')
        try:
            # Token valid for 24 hours (86400 seconds)
            username = signer.unsign(token, max_age=86400)
            user = User.objects.get(username=username)

            try:
                profile = user.profile
            except UserProfile.DoesNotExist:
                profile = UserProfile.objects.create(user=user)

            # Check the token matches the latest issued one (invalidates old tokens)
            if profile.verification_token != token:
                return Response(
                    {'error': 'This verification link has been superseded. Please use the latest email.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if profile.is_email_verified:
                return Response(
                    {'message': 'Email is already verified. You can log in.'},
                    status=status.HTTP_200_OK,
                )

            profile.is_email_verified = True
            profile.email_verified_at = timezone.now()
            profile.verification_token = ''   # invalidate — cannot be reused
            profile.save(update_fields=['is_email_verified', 'email_verified_at', 'verification_token'])

            logger.info(f"[VerifyEmailView] Email verified for user '{username}'")
            return Response({'message': 'Email verified successfully. You can now log in.'})

        except SignatureExpired:
            return Response({'error': 'Verification link has expired. Please request a new one.'}, status=status.HTTP_400_BAD_REQUEST)
        except (BadSignature, User.DoesNotExist):
            return Response({'error': 'Invalid verification token.'}, status=status.HTTP_400_BAD_REQUEST)


# ---------------------------------------------------------------------------
# Login — blocks unverified users
# ---------------------------------------------------------------------------

class LoginView(TokenObtainPairView):
    """
    POST /auth/login/

    Extends simplejwt's TokenObtainPairView to block login for users
    whose email has not yet been verified.
    """
    serializer_class = TokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        # Run standard JWT auth first
        response = super().post(request, *args, **kwargs)

        if response.status_code == 200:
            # JWT was issued — now check email verification
            username = request.data.get('username', '')
            try:
                user = User.objects.get(username=username)
                profile = user.profile
                if not profile.is_email_verified:
                    return Response(
                        {
                            'error': 'Email not verified. Please check your inbox and verify your email before logging in.',
                            'email_verified': False,
                        },
                        status=status.HTTP_403_FORBIDDEN,
                    )
            except (User.DoesNotExist, UserProfile.DoesNotExist):
                pass  # Let it through; something unexpected — JWT already validated credentials

        return response


# ---------------------------------------------------------------------------
# Forgot Password
# ---------------------------------------------------------------------------

class ForgotPasswordView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({'error': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = User.objects.get(email=email)
            signer = TimestampSigner(salt='password-reset')
            token = signer.sign(user.username)

            reset_url = f"{settings.FRONTEND_URL}/reset-password?token={token}"
            html_content = f"""
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0f172a; color: #e2e8f0; border-radius: 10px; overflow: hidden;">
                <!-- Header -->
                <div style="text-align: center; padding: 32px 24px 24px; border-bottom: 1px solid #1e293b;">
                    <h1 style="color: #38bdf8; font-size: 26px; margin: 0; letter-spacing: 0.5px;">📰 Tech News</h1>
                    <p style="color: #64748b; margin: 6px 0 0; font-size: 13px;">Your daily dose of tech updates</p>
                </div>
                <!-- Body -->
                <div style="padding: 32px 24px;">
                    <h2 style="color: #f1f5f9; font-size: 20px; margin: 0 0 16px;">Reset your password</h2>
                    <p style="color: #cbd5e1; line-height: 1.7; margin: 0 0 28px;">
                        Hi <strong style="color: #f1f5f9;">{user.username}</strong>, we received a request to reset your password.<br>
                        Click the button below to choose a new one. This link will expire in <strong>24 hours</strong>.
                    </p>
                    <div style="text-align: center; margin-bottom: 28px;">
                        <a href="{reset_url}"
                           style="background-color: #f59e0b; color: #0f172a; text-decoration: none;
                                  padding: 14px 36px; border-radius: 6px; font-weight: bold;
                                  font-size: 15px; display: inline-block; letter-spacing: 0.3px;">
                            Reset Password
                        </a>
                    </div>
                    <p style="color: #475569; font-size: 13px; line-height: 1.7; margin: 0;">
                        If you didn't request a password reset, you can safely ignore this email — your password won't change.<br>
                        If the button doesn't work, copy and paste this link into your browser:<br>
                        <a href="{reset_url}" style="color: #38bdf8; word-break: break-all; font-size: 12px;">{reset_url}</a>
                    </p>
                </div>
                <!-- Footer -->
                <div style="border-top: 1px solid #1e293b; padding: 16px 24px; text-align: center;">
                    <p style="color: #334155; font-size: 12px; margin: 0;">
                        © 2026 Tech News &nbsp;·&nbsp;
                        <a href="mailto:updates@news.amiftikhar.me" style="color: #334155; text-decoration: none;">updates@news.amiftikhar.me</a>
                    </p>
                </div>
            </div>
            """
            send_email(user.email, "Password Reset Request — Tech News", html_content)
            logger.info(f"[ForgotPasswordView] Password reset email sent to '{user.email}'")

        except User.DoesNotExist:
            pass  # Don't reveal whether this email is registered
        except Exception as e:
            logger.exception(f"[ForgotPasswordView] Failed to send reset email to '{email}': {e}")

        return Response({'message': 'If an account with that email exists, a password reset link has been sent.'})


# ---------------------------------------------------------------------------
# Reset Password
# ---------------------------------------------------------------------------

class ResetPasswordView(APIView):
    permission_classes = (AllowAny,)

    def post(self, request):
        token = request.data.get('token')
        new_password = request.data.get('new_password')

        if not token or not new_password:
            return Response({'error': 'Token and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        signer = TimestampSigner(salt='password-reset')
        try:
            username = signer.unsign(token, max_age=86400)  # Valid for 24 hours
            user = User.objects.get(username=username)
            user.set_password(new_password)
            user.save()
            logger.info(f"[ResetPasswordView] Password reset successfully for '{username}'")
            return Response({'message': 'Password has been reset successfully.'})
        except SignatureExpired:
            return Response({'error': 'Reset link has expired.'}, status=status.HTTP_400_BAD_REQUEST)
        except (BadSignature, User.DoesNotExist):
            return Response({'error': 'Invalid reset token.'}, status=status.HTTP_400_BAD_REQUEST)
