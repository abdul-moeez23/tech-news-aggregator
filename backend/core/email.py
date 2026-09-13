import resend
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

def send_email(to, subject, html_content):
    """
    Utility function to send an email using the Resend API.
    Raises an exception on failure so the caller can decide how to handle it.
    """
    if not settings.RESEND_API_KEY:
        logger.warning(f"[send_email] RESEND_API_KEY is not set. Simulating email to {to}")
        logger.debug(f"[send_email] Subject: {subject}")
        logger.debug(f"[send_email] Content: {html_content}")
        return {"id": "simulated_id", "status": "simulated"}

    resend.api_key = settings.RESEND_API_KEY

    # Ensure 'to' is a list
    if isinstance(to, str):
        to = [to]

    params = {
        "from": settings.FROM_EMAIL,
        "to": to,
        "subject": subject,
        "html": html_content,
    }

    email = resend.Emails.send(params)
    logger.info(f"[send_email] Email sent successfully to {to} | id: {email.get('id', 'N/A')}")
    return email
