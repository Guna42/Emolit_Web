"""Cleanly rebuild email_service.py."""
import os

path = os.path.join('app', 'services', 'email_service.py')
content = open(path, 'r', encoding='utf-8').read()

# Keep everything up to the Reminder Email Template section
marker = '# -- Reminder Email Template'
alt_marker = '# \u2500\u2500 Reminder Email Template'
cut = content.find(alt_marker)
if cut == -1:
    cut = content.find(marker)

top = content[:cut].rstrip() + '\n\n\n'

reminder_section = '''# \u2500\u2500 Reminder Email Template \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500

REMINDER_HTML_TEMPLATE = """\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Emolit Reminder</title>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background-color:#DDDFEE;font-family:\'Outfit\',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#DDDFEE;padding:52px 16px 64px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0">
        <tr><td style="padding:0 0 28px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;"><span style="font-family:\'Libre Baskerville\',Georgia,serif;font-size:30px;color:#40415D;font-weight:700;letter-spacing:-0.5px;">Emo<em style="color:#6B6D9E;font-style:italic;font-weight:400;">lit</em></span></td>
            <td align="right" style="vertical-align:middle;"><span style="font-size:8.5px;color:#6B6D9E;letter-spacing:4.5px;text-transform:uppercase;font-family:\'Outfit\',Arial,sans-serif;font-weight:600;">Gentle&nbsp;Nudge</span></td>
          </tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;"><tr><td style="border-top:2px solid rgba(64,65,93,0.3);font-size:0;">&nbsp;</td></tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:3px;"><tr><td style="border-top:1px solid rgba(64,65,93,0.1);font-size:0;">&nbsp;</td></tr></table>
        </td></tr>
        <tr><td>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#40415D;border-radius:20px 20px 0 0;overflow:hidden;">
            <tr><td style="height:5px;background:linear-gradient(90deg,#6B6D9E 0%,#8E90BE 40%,#DDDFEE 100%);font-size:0;">&nbsp;</td></tr>
            <tr><td style="padding:52px 52px 0;">
              <p style="font-size:8px;color:#8183A8;letter-spacing:5px;text-transform:uppercase;margin:0 0 20px;font-family:\'Outfit\',Arial,sans-serif;font-weight:700;">&#8212;&nbsp; Your reminder is here &nbsp;&#8212;</p>
              <h1 style="font-family:\'Libre Baskerville\',Georgia,serif;font-size:54px;color:#DDDFEE;margin:0;line-height:1.05;font-weight:700;letter-spacing:-2px;">We kept<br><em style="font-style:italic;font-weight:400;color:#8E90BE;font-size:58px;">your place.</em></h1>
              <p style="font-size:14px;color:#9496BB;line-height:1.9;margin:24px 0 0;font-weight:400;max-width:400px;font-family:\'Outfit\',Arial,sans-serif;">You asked us to hold this thought for you. The moment you set aside is ready &mdash; no rush, no pressure.</p>
            </td></tr>
            <tr><td style="padding:36px 52px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(221,223,238,0.07);border:1px solid rgba(221,223,238,0.15);border-left:4px solid #8E90BE;border-radius:12px;">
                <tr><td style="padding:28px 32px;">
                  <p style="font-size:8px;color:#8183A8;letter-spacing:4px;text-transform:uppercase;margin:0 0 14px;font-family:\'Outfit\',Arial,sans-serif;font-weight:600;">Your intention</p>
                  <p style="font-family:\'Libre Baskerville\',Georgia,serif;font-size:19px;color:#DDDFEE;line-height:1.75;margin:0;font-style:italic;">{step_text}</p>
                </td></tr>
              </table>
            </td></tr>
            <tr><td style="padding:36px 52px 52px;">
              <table cellpadding="0" cellspacing="0"><tr><td style="background-color:#DDDFEE;border-radius:10px;"><a href="{app_url}" style="display:inline-block;padding:17px 44px;font-family:\'Outfit\',Arial,sans-serif;font-size:10.5px;font-weight:700;color:#40415D;text-decoration:none;letter-spacing:3.5px;text-transform:uppercase;">Continue in Emolit &rarr;</a></td></tr></table>
              <p style="font-size:11px;color:#6B6D9E;margin:16px 0 0;font-family:\'Outfit\',Arial,sans-serif;">Takes &lt; 2 minutes &nbsp;&middot;&nbsp; Pick up right where you left off</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-left:1px solid rgba(64,65,93,0.08);border-right:1px solid rgba(64,65,93,0.08);">
            <tr><td style="padding:40px 52px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td width="36" style="vertical-align:top;padding-top:4px;"><span style="font-family:\'Libre Baskerville\',Georgia,serif;font-size:64px;color:#DDDFEE;line-height:1;display:block;margin-top:-12px;">&ldquo;</span></td>
                <td style="vertical-align:top;padding-left:8px;">
                  <p style="font-family:\'Libre Baskerville\',Georgia,serif;font-size:18px;color:#40415D;line-height:1.8;margin:0 0 14px;font-style:italic;">Emotional growth isn&rsquo;t a race &mdash; it&rsquo;s a practice. Every moment of awareness is the whole point.</p>
                  <p style="font-size:10px;color:#9496BB;margin:0;letter-spacing:3px;text-transform:uppercase;font-family:\'Outfit\',Arial,sans-serif;font-weight:600;">The Emolit Philosophy</p>
                </td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#F3F4FA;border:1px solid rgba(64,65,93,0.08);border-top:none;border-radius:0 0 20px 20px;overflow:hidden;">
            <tr><td style="height:3px;background:linear-gradient(90deg,#DDDFEE 0%,#6B6D9E 50%,#40415D 100%);font-size:0;">&nbsp;</td></tr>
            <tr><td style="padding:28px 52px 32px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td style="vertical-align:middle;">
                  <p style="font-size:10.5px;color:#9496BB;margin:0 0 3px;font-family:\'Outfit\',Arial,sans-serif;">You scheduled this reminder inside Emolit.</p>
                  <p style="font-size:10.5px;color:#B0B2CC;margin:0;font-family:\'Outfit\',Arial,sans-serif;">&#169; 2026 Emolit &nbsp;&middot;&nbsp; All rights reserved.</p>
                </td>
                <td align="right" style="vertical-align:middle;"><span style="font-family:\'Libre Baskerville\',Georgia,serif;font-style:italic;font-size:13px;color:#8183A8;">with care &#9825;</span></td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding-top:24px;text-align:center;"><p style="font-size:8px;color:#8183A8;margin:0;letter-spacing:5px;text-transform:uppercase;font-family:\'Outfit\',Arial,sans-serif;">Emotional Intelligence for Everyone</p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _build_reminder_html(step_text: str, step_number: int) -> str:
    _ = step_number
    return REMINDER_HTML_TEMPLATE.replace("{step_text}", step_text).replace("{app_url}", APP_URL)


def send_reminder_email(to_email: str, step_text: str, step_number: int) -> bool:
    """Send a branded reminder email via SMTP. Returns True on success."""
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured.")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "\\U0001f331 A gentle nudge from Emolit"
        msg["From"]    = f"{FROM_NAME} <{SMTP_USER}>"
        msg["To"]      = to_email
        plain = (
            f\'\'\'Hey there!\\n\\nYou asked Emolit to remind you about:\\n\\n"{step_text}"\\n\\n\'\'\'
            f\'\'\'Head back when ready: {APP_URL}\\n\\n-- The Emolit Team\'\'\'
        )
        msg.attach(MIMEText(plain, "plain"))
        msg.attach(MIMEText(_build_reminder_html(step_text, step_number), "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as srv:
            srv.ehlo(); srv.starttls(); srv.ehlo()
            srv.login(SMTP_USER, SMTP_PASSWORD)
            srv.sendmail(SMTP_USER, to_email, msg.as_string())
        logger.info(f"Reminder email sent to {to_email} step {step_number}")
        return True
    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP auth failed")
        return False
    except Exception as e:
        logger.error(f"Reminder email error: {e}")
        return False
'''

final = top + reminder_section
open(path, 'w', encoding='utf-8').write(final)
print(f"Rebuilt: {len(final.splitlines())} lines.")
