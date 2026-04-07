"""
MS Graph email service — direct port of lib/graph.ts.
Silently no-ops when Azure credentials are not configured.
"""
import base64
import logging
from typing import Optional

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


async def _get_app_token() -> str:
    tenant_id = settings.AZURE_AD_TENANT_ID
    client_id = settings.AZURE_AD_CLIENT_ID
    client_secret = settings.AZURE_AD_CLIENT_SECRET

    async with httpx.AsyncClient() as client:
        res = await client.post(
            f"https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token",
            data={
                "client_id": client_id,
                "client_secret": client_secret,
                "scope": "https://graph.microsoft.com/.default",
                "grant_type": "client_credentials",
            },
        )
        res.raise_for_status()
        return res.json()["access_token"]


def _credentials_configured() -> bool:
    return bool(settings.GRAPH_SENDER_EMAIL and settings.AZURE_AD_CLIENT_ID)


async def send_status_email(
    to_email: str,
    employee_name: str,
    status: str,
    work_date: str,
    project_name: Optional[str] = None,
    client_name: Optional[str] = None,
    manager_reason: Optional[str] = None,
) -> None:
    if not _credentials_configured():
        logger.warning("[graph] Email not sent — GRAPH_SENDER_EMAIL or Azure credentials not configured.")
        return

    try:
        token = await _get_app_token()
        project_label = " / ".join(filter(None, [client_name, project_name])) or "N/A"

        if status == "Approved":
            subject = f"Timesheet Approved — {work_date}"
            body = (
                f'<p>Hi {employee_name},</p>'
                f'<p>Your timesheet entry for <strong>{project_label}</strong> on '
                f'<strong>{work_date}</strong> has been '
                f'<strong style="color:#34D399">approved</strong>.</p>'
                f'<p>Regards,<br/>GSR Portal</p>'
            )
        else:
            subject = f"Timesheet Denied — {work_date}"
            body = (
                f'<p>Hi {employee_name},</p>'
                f'<p>Your timesheet entry for <strong>{project_label}</strong> on '
                f'<strong>{work_date}</strong> has been '
                f'<strong style="color:#F87171">denied</strong>.</p>'
                f'<p><strong>Reason:</strong> {manager_reason or "No reason provided."}</p>'
                f'<p>Please correct and resubmit. Regards,<br/>GSR Portal</p>'
            )

        async with httpx.AsyncClient() as client:
            await client.post(
                f"https://graph.microsoft.com/v1.0/users/{settings.GRAPH_SENDER_EMAIL}/sendMail",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "message": {
                        "subject": subject,
                        "body": {"contentType": "HTML", "content": body},
                        "toRecipients": [{"emailAddress": {"address": to_email}}],
                    }
                },
            )
    except Exception as e:
        logger.error(f"[graph] Failed to send email: {e}")


async def send_timesheet_to_client(
    to_email: str,
    client_manager_name: str,
    employee_name: str,
    from_date: str,
    to_date: str,
    csv_content: str,
    csv_filename: str,
    approval_token: str,
) -> None:
    if not _credentials_configured():
        logger.warning("[graph] Client email not sent — GRAPH_SENDER_EMAIL or Azure credentials not configured.")
        return

    try:
        token = await _get_app_token()
        base_url = settings.BACKEND_URL
        subject = f"GSR Timesheet — {employee_name} — {from_date} to {to_date}"

        approve_url = f"{base_url}/api/client-approval?token={approval_token}&action=approve"
        reject_url = f"{base_url}/api/client-approval?token={approval_token}&action=reject"

        body = f"""
        <p>Dear {client_manager_name},</p>
        <p>Please find attached the timesheet for <strong>{employee_name}</strong>
           for the period <strong>{from_date}</strong> to <strong>{to_date}</strong>.</p>
        <p>Please review the attached timesheet and click one of the buttons below to respond:</p>
        <p style="margin: 24px 0;">
          <a href="{approve_url}"
             style="background:#16a34a; color:white; padding:12px 28px; border-radius:8px;
                    text-decoration:none; font-weight:600; margin-right:16px; display:inline-block;">
            Approve Timesheet
          </a>
          <a href="{reject_url}"
             style="background:#dc2626; color:white; padding:12px 28px; border-radius:8px;
                    text-decoration:none; font-weight:600; display:inline-block;">
            Reject Timesheet
          </a>
        </p>
        <p style="color:#666; font-size:12px;">
          These links are unique to this timesheet submission and can only be used once.
        </p>
        <p>Regards,<br/>GSR HR Portal</p>
        """

        csv_base64 = base64.b64encode(csv_content.encode("utf-8")).decode("utf-8")

        async with httpx.AsyncClient() as client:
            await client.post(
                f"https://graph.microsoft.com/v1.0/users/{settings.GRAPH_SENDER_EMAIL}/sendMail",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "message": {
                        "subject": subject,
                        "body": {"contentType": "HTML", "content": body},
                        "toRecipients": [{"emailAddress": {"address": to_email}}],
                        "attachments": [
                            {
                                "@odata.type": "#microsoft.graph.fileAttachment",
                                "name": csv_filename,
                                "contentType": "text/csv",
                                "contentBytes": csv_base64,
                            }
                        ],
                    }
                },
            )
    except Exception as e:
        logger.error(f"[graph] Failed to send timesheet to client: {e}")


async def send_reminder_email(
    to_email: str,
    employee_name: str,
    reminder_type: str,
) -> None:
    if not _credentials_configured():
        logger.warning("[graph] Reminder not sent — GRAPH_SENDER_EMAIL or Azure credentials not configured.")
        return

    try:
        token = await _get_app_token()

        if reminder_type == "weekly":
            subject = "GSR Portal — Please submit your timesheet for this week"
            body = (
                f'<p>Hi {employee_name},</p>'
                f'<p>This is a friendly reminder to submit your timesheet entries for this week '
                f'on the <strong>GSR Portal</strong>.</p>'
                f'<p>Regards,<br/>GSR Portal</p>'
            )
        else:
            subject = "GSR Portal — Month-end reminder: Submit your timesheet to your client"
            body = (
                f'<p>Hi {employee_name},</p>'
                f'<p>Month-end reminder: Please submit your timesheet to your client manager '
                f'before the <strong>1st of next month</strong>.</p>'
                f'<p>You can do this from the <strong>TimeSheet</strong> page using the '
                f'"Submit to Client" button.</p>'
                f'<p>Regards,<br/>GSR Portal</p>'
            )

        async with httpx.AsyncClient() as client:
            await client.post(
                f"https://graph.microsoft.com/v1.0/users/{settings.GRAPH_SENDER_EMAIL}/sendMail",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json={
                    "message": {
                        "subject": subject,
                        "body": {"contentType": "HTML", "content": body},
                        "toRecipients": [{"emailAddress": {"address": to_email}}],
                    }
                },
            )
    except Exception as e:
        logger.error(f"[graph] Failed to send reminder email: {e}")
