from django.test import TestCase, override_settings
from unittest.mock import patch
from core.email import send_email

class EmailUtilityTests(TestCase):
    @patch('core.email.resend.Emails.send')
    @override_settings(RESEND_API_KEY='test_key', FROM_EMAIL='test@test.com')
    def test_send_email_success(self, mock_send):
        mock_send.return_value = {'id': 'test_id'}
        
        result = send_email(
            to='user@example.com',
            subject='Test Subject',
            html_content='<p>Test</p>'
        )
        
        self.assertEqual(result, {'id': 'test_id'})
        mock_send.assert_called_once_with({
            'from': 'test@test.com',
            'to': ['user@example.com'],
            'subject': 'Test Subject',
            'html': '<p>Test</p>'
        })

    @override_settings(RESEND_API_KEY='')
    def test_send_email_no_api_key(self):
        # When no API key is set, it should simulate sending
        result = send_email(
            to='user@example.com',
            subject='Test Subject',
            html_content='<p>Test</p>'
        )
        self.assertEqual(result, {'id': 'simulated_id', 'status': 'simulated'})

from rest_framework.test import APITestCase
from django.urls import reverse
from django.contrib.auth.models import User
from django.core.signing import TimestampSigner

class EmailVerificationTests(APITestCase):
    @patch('users.views.send_email')
    def test_registration_sends_email(self, mock_send_email):
        url = reverse('auth_register')
        data = {
            'username': 'testuser',
            'email': 'testuser@example.com',
            'password': 'testpassword123'
        }
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, 201)
        self.assertTrue(User.objects.filter(username='testuser').exists())
        mock_send_email.assert_called_once()
        args, _ = mock_send_email.call_args
        self.assertEqual(args[0], 'testuser@example.com')
        self.assertIn('Verify Your Email', args[1])

    def test_verify_email_success(self):
        user = User.objects.create_user(username='verifyuser', password='pw')
        # Create profile since signals might not trigger correctly in all test setups, but let's assume it did
        # from our signal.
        if not hasattr(user, 'profile'):
            from preferences.models import UserProfile
            UserProfile.objects.create(user=user)
            
        self.assertFalse(user.profile.is_email_verified)
        
        signer = TimestampSigner()
        token = signer.sign(user.username)
        
        url = reverse('verify_email')
        response = self.client.post(url, {'token': token})
        
        self.assertEqual(response.status_code, 200)
        user.profile.refresh_from_db()
        self.assertTrue(user.profile.is_email_verified)

class PasswordResetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='resetuser', email='reset@example.com', password='oldpassword')

    @patch('users.views.send_email')
    def test_forgot_password_sends_email(self, mock_send_email):
        url = reverse('forgot_password')
        response = self.client.post(url, {'email': 'reset@example.com'})
        
        self.assertEqual(response.status_code, 200)
        mock_send_email.assert_called_once()
        args, _ = mock_send_email.call_args
        self.assertEqual(args[0], 'reset@example.com')
        self.assertIn('Password Reset Request', args[1])

    def test_reset_password_success(self):
        signer = TimestampSigner(salt='password-reset')
        token = signer.sign(self.user.username)
        
        url = reverse('reset_password')
        response = self.client.post(url, {
            'token': token,
            'new_password': 'newpassword123'
        })
        
        self.assertEqual(response.status_code, 200)
        
        # Verify the password was actually changed
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password('newpassword123'))

