import resend
from django.conf import settings

def send_email(to, subject, html_content):
    """
    Utility function to send an email using the Resend API.
    """
    if not settings.RESEND_API_KEY:
        print(f"Warning: RESEND_API_KEY is not set. Simulating email to {to}")
        print(f"Subject: {subject}")
        print(f"Content: {html_content}")
        return {"id": "simulated_id", "status": "simulated"}

    resend.api_key = settings.RESEND_API_KEY
    
    # Ensure 'to' is a list
    if isinstance(to, str):
        to = [to]
        
    params = {
        "from": settings.FROM_EMAIL,
        "to": to,
        "subject": subject,
        "html": html_content
    }
    
    try:
        email = resend.Emails.send(params)
        return email
    except Exception as e:
        print(f"Error sending email via Resend: {e}")
        return None
