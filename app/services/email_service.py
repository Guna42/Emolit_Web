import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger("emolit.email")

# ── SMTP Config ───────────────────────────────────────────────────────────────
SMTP_HOST     = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER     = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
FROM_NAME     = os.getenv("FROM_NAME", "Emolit")
APP_URL       = os.getenv("APP_URL", "https://emolit.app")


# ── Verification Email ────────────────────────────────────────────────────────

def _build_verification_html(verification_link: str) -> str:
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify your Emolit account</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background-color:#FFF8DC;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8DC;padding:52px 16px 60px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background-color:#FFF8DC;">
        <tr><td style="padding:0 52px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;"><span style="font-family:'Playfair Display',Georgia,serif;font-size:34px;color:#3D2520;font-weight:700;letter-spacing:-0.5px;">Emo<em style="color:#674846;font-style:italic;">lit</em></span></td>
            <td align="right" style="vertical-align:middle;"><span style="font-size:9px;color:#A08070;letter-spacing:4px;text-transform:uppercase;font-family:'Inter',Arial,sans-serif;">Vol. I &nbsp;&#183;&nbsp; 2026</span></td>
          </tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr><td style="border-top:3px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:3px;"><tr><td style="border-top:1px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
        </td></tr>
      </table>
      <table width="580" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-left:1px solid rgba(103,72,70,0.15);border-right:1px solid rgba(103,72,70,0.15);">
        <tr><td style="padding:52px 52px 0;">
          <p style="font-size:9px;color:#A08070;letter-spacing:5px;text-transform:uppercase;margin:0 0 28px;font-family:'Inter',Arial,sans-serif;font-weight:500;">&#8212; Account Verification &#8212;</p>
          <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:58px;color:#3D2520;margin:0;line-height:1.04;font-weight:700;letter-spacing:-2.5px;">
            Your story<br/>begins<br/><em style="font-style:italic;font-weight:400;color:#674846;font-size:62px;">here.</em>
          </h1>
        </td></tr>
        <tr><td style="padding:36px 52px 48px;">
          <table cellpadding="0" cellspacing="0" style="margin-bottom:26px;"><tr><td style="width:44px;border-top:2px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
          <p style="font-size:15px;color:#6B4E4A;line-height:1.9;margin:0 0 36px;font-weight:300;max-width:400px;font-family:'Inter',Arial,sans-serif;">
            Welcome to <strong style="color:#3D2520;font-weight:600;">Emolit</strong> &#8212; your personal space to understand, name, and grow through your emotions. One click and you&#8217;re in.
          </p>
          <table cellpadding="0" cellspacing="0" style="margin:0 0 16px;"><tr>
            <td style="background-color:#674846;">
              <a href="{verification_link}" style="display:inline-block;padding:20px 56px;font-family:'Inter',Arial,sans-serif;font-size:11px;font-weight:600;color:#FFF8DC;text-decoration:none;letter-spacing:3.5px;text-transform:uppercase;">Verify My Account</a>
            </td>
          </tr></table>
          <p style="font-size:11px;color:#BCA898;margin:0;font-family:'Inter',Arial,sans-serif;">Link expires in 24&#160;hours &#160;&#183;&#160; One-time use only</p>
        </td></tr>
        <tr><td style="padding:0 52px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid rgba(103,72,70,0.18);font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>
        <tr><td style="padding:32px 52px 28px;"><p style="font-size:9px;color:#A08070;letter-spacing:5px;text-transform:uppercase;margin:0;font-family:'Inter',Arial,sans-serif;font-weight:500;text-align:center;">Inside Emolit</p></td></tr>
        <tr><td style="padding:0 52px 52px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr valign="top">
            <td width="30%" style="padding-right:14px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:2px solid #674846;padding-top:20px;">
              <p style="font-family:'Playfair Display',Georgia,serif;font-size:28px;color:rgba(103,72,70,0.15);margin:0 0 10px;font-weight:700;line-height:1;">01</p>
              <p style="font-size:12px;color:#3D2520;font-weight:600;margin:0 0 7px;font-family:'Inter',Arial,sans-serif;">Emotion Mapping</p>
              <p style="font-size:11px;color:#A08070;margin:0;line-height:1.6;font-family:'Inter',Arial,sans-serif;">Understand your inner landscape</p>
            </td></tr></table></td>
            <td width="30%" style="padding-right:14px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:2px solid #674846;padding-top:20px;">
              <p style="font-family:'Playfair Display',Georgia,serif;font-size:28px;color:rgba(103,72,70,0.15);margin:0 0 10px;font-weight:700;line-height:1;">02</p>
              <p style="font-size:12px;color:#3D2520;font-weight:600;margin:0 0 7px;font-family:'Inter',Arial,sans-serif;">Daily Journaling</p>
              <p style="font-size:11px;color:#A08070;margin:0;line-height:1.6;font-family:'Inter',Arial,sans-serif;">Reflect, write, and grow daily</p>
            </td></tr></table></td>
            <td width="30%"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:2px solid #674846;padding-top:20px;">
              <p style="font-family:'Playfair Display',Georgia,serif;font-size:28px;color:rgba(103,72,70,0.15);margin:0 0 10px;font-weight:700;line-height:1;">03</p>
              <p style="font-size:12px;color:#3D2520;font-weight:600;margin:0 0 7px;font-family:'Inter',Arial,sans-serif;">Guided Growth</p>
              <p style="font-size:11px;color:#A08070;margin:0;line-height:1.6;font-family:'Inter',Arial,sans-serif;">Build lasting emotional strength</p>
            </td></tr></table></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:20px 52px;background-color:#FFFDF5;border-top:1px solid rgba(103,72,70,0.10);">
          <p style="font-size:12px;color:#BCA898;line-height:1.8;margin:0;font-family:'Inter',Arial,sans-serif;">
            Button not working? Copy and paste this link:<br/>
            <a href="{verification_link}" style="color:#674846;text-decoration:none;font-weight:500;word-break:break-all;">{verification_link}</a>
          </p>
        </td></tr>
        <tr><td style="padding:0 52px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:3px;"><tr><td style="border-top:3px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td style="border-top:1px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
        </td></tr>
        <tr><td style="padding:0 52px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;">
              <p style="font-size:11px;color:#C4A898;margin:0 0 3px;font-family:'Inter',Arial,sans-serif;">Didn&#8217;t create this account? Simply ignore this email.</p>
              <p style="font-size:11px;color:#C4A898;margin:0;font-family:'Inter',Arial,sans-serif;">&#169; 2026 Emolit &#183; All rights reserved.</p>
            </td>
            <td align="right" style="vertical-align:middle;"><span style="font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:13px;color:#BCA898;">made with care &#9825;</span></td>
          </tr></table>
        </td></tr>
      </table>
      <p style="font-size:9px;color:#A08070;margin:22px 0 0;text-align:center;letter-spacing:4px;text-transform:uppercase;font-family:'Inter',Arial,sans-serif;">Emotional Intelligence for Everyone</p>
    </td></tr>
  </table>
</body>
</html>"""


def send_verification_email(to_email: str, verification_link: str) -> bool:
    """Send a branded verification email. Returns True on success."""
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured.")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Verify your Emolit account"
        msg["From"]    = f"{FROM_NAME} <{SMTP_USER}>"
        msg["To"]      = to_email
        plain = (
            f"Welcome to Emolit!\n\nVerify your email:\n{verification_link}\n\n"
            "Expires in 24 hours.\n\n-- The Emolit Team"
        )
        msg.attach(MIMEText(plain, "plain"))
        msg.attach(MIMEText(_build_verification_html(verification_link), "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as srv:
            srv.ehlo(); srv.starttls(); srv.ehlo()
            srv.login(SMTP_USER, SMTP_PASSWORD)
            srv.sendmail(SMTP_USER, to_email, msg.as_string())
        logger.info(f"Verification email sent to {to_email}")
        return True
    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP auth failed")
        return False
    except Exception as e:
        logger.error(f"Verification email error: {e}")
        return False


# ── Reminder Email ────────────────────────────────────────────────────────────

# Using str.format() instead of f-string so the HTML is not evaluated at import.
_REMINDER_HTML = """\
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Your Emolit Reminder</title>
  <link href="https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background-color:#DDDFEE;font-family:'Outfit',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#DDDFEE;padding:52px 16px 64px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0">
        <tr><td style="padding:0 0 28px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;"><span style="font-family:'Libre Baskerville',Georgia,serif;font-size:30px;color:#40415D;font-weight:700;letter-spacing:-0.5px;">Emo<em style="color:#6B6D9E;font-style:italic;font-weight:400;">lit</em></span></td>
            <td align="right" style="vertical-align:middle;"><span style="font-size:8.5px;color:#6B6D9E;letter-spacing:4.5px;text-transform:uppercase;font-family:'Outfit',Arial,sans-serif;font-weight:600;">Gentle&nbsp;Nudge</span></td>
          </tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:18px;"><tr><td style="border-top:2px solid rgba(64,65,93,0.3);font-size:0;">&nbsp;</td></tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:3px;"><tr><td style="border-top:1px solid rgba(64,65,93,0.1);font-size:0;">&nbsp;</td></tr></table>
        </td></tr>
        <tr><td>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#40415D;border-radius:20px 20px 0 0;overflow:hidden;">
            <tr><td style="height:5px;background:linear-gradient(90deg,#6B6D9E 0%,#8E90BE 40%,#DDDFEE 100%);font-size:0;">&nbsp;</td></tr>
            <tr><td style="padding:52px 52px 0;">
              <p style="font-size:8px;color:#8183A8;letter-spacing:5px;text-transform:uppercase;margin:0 0 20px;font-family:'Outfit',Arial,sans-serif;font-weight:700;">&#8212;&nbsp; Your reminder is here &nbsp;&#8212;</p>
              <h1 style="font-family:'Libre Baskerville',Georgia,serif;font-size:54px;color:#DDDFEE;margin:0;line-height:1.05;font-weight:700;letter-spacing:-2px;">We kept<br><em style="font-style:italic;font-weight:400;color:#8E90BE;font-size:58px;">your place.</em></h1>
              <p style="font-size:14px;color:#9496BB;line-height:1.9;margin:24px 0 0;max-width:400px;font-family:'Outfit',Arial,sans-serif;">You asked us to hold this thought for you. The moment you set aside is ready &mdash; no rush, no pressure.</p>
            </td></tr>
            <tr><td style="padding:36px 52px 0;">
              <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(221,223,238,0.07);border:1px solid rgba(221,223,238,0.15);border-left:4px solid #8E90BE;border-radius:12px;">
                <tr><td style="padding:28px 32px;">
                  <p style="font-size:8px;color:#8183A8;letter-spacing:4px;text-transform:uppercase;margin:0 0 14px;font-family:'Outfit',Arial,sans-serif;font-weight:600;">Your intention</p>
                  <p style="font-family:'Libre Baskerville',Georgia,serif;font-size:19px;color:#DDDFEE;line-height:1.75;margin:0;font-style:italic;">{step_text}</p>
                </td></tr>
              </table>
            </td></tr>
            <tr><td style="padding:36px 52px 52px;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="background-color:#DDDFEE;border-radius:10px;"><a href="{app_url}" style="display:inline-block;padding:17px 44px;font-family:'Outfit',Arial,sans-serif;font-size:10.5px;font-weight:700;color:#40415D;text-decoration:none;letter-spacing:3.5px;text-transform:uppercase;">Continue in Emolit &rarr;</a></td>
              </tr></table>
              <p style="font-size:11px;color:#6B6D9E;margin:16px 0 0;font-family:'Outfit',Arial,sans-serif;">Takes &lt; 2 minutes &nbsp;&middot;&nbsp; Pick up right where you left off</p>
            </td></tr>
          </table>
        </td></tr>
        <tr><td>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-left:1px solid rgba(64,65,93,0.08);border-right:1px solid rgba(64,65,93,0.08);">
            <tr><td style="padding:40px 52px;">
              <table width="100%" cellpadding="0" cellspacing="0"><tr>
                <td width="36" style="vertical-align:top;padding-top:4px;"><span style="font-family:'Libre Baskerville',Georgia,serif;font-size:64px;color:#DDDFEE;line-height:1;display:block;margin-top:-12px;">&ldquo;</span></td>
                <td style="vertical-align:top;padding-left:8px;">
                  <p style="font-family:'Libre Baskerville',Georgia,serif;font-size:18px;color:#40415D;line-height:1.8;margin:0 0 14px;font-style:italic;">Emotional growth isn&rsquo;t a race &mdash; it&rsquo;s a practice. Every moment of awareness is the whole point.</p>
                  <p style="font-size:10px;color:#9496BB;margin:0;letter-spacing:3px;text-transform:uppercase;font-family:'Outfit',Arial,sans-serif;font-weight:600;">The Emolit Philosophy</p>
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
                  <p style="font-size:10.5px;color:#9496BB;margin:0 0 3px;font-family:'Outfit',Arial,sans-serif;">You scheduled this reminder inside Emolit.</p>
                  <p style="font-size:10.5px;color:#B0B2CC;margin:0;font-family:'Outfit',Arial,sans-serif;">&#169; 2026 Emolit &nbsp;&middot;&nbsp; All rights reserved.</p>
                </td>
                <td align="right" style="vertical-align:middle;"><span style="font-family:'Libre Baskerville',Georgia,serif;font-style:italic;font-size:13px;color:#8183A8;">with care &#9825;</span></td>
              </tr></table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding-top:24px;text-align:center;"><p style="font-size:8px;color:#8183A8;margin:0;letter-spacing:5px;text-transform:uppercase;font-family:'Outfit',Arial,sans-serif;">Emotional Intelligence for Everyone</p></td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""


def _build_reminder_html(step_text: str, step_number: int) -> str:
    _ = step_number
    return _REMINDER_HTML.replace("{step_text}", step_text).replace("{app_url}", APP_URL)


def send_reminder_email(to_email: str, step_text: str, step_number: int) -> bool:
    """Send a branded reminder email. Returns True on success."""
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured.")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "\U0001f331 A gentle nudge from Emolit"
        msg["From"]    = f"{FROM_NAME} <{SMTP_USER}>"
        msg["To"]      = to_email
        plain = (
            f'Hey there!\n\nYou asked Emolit to remind you:\n\n"{step_text}"\n\n'
            f"Head back when ready: {APP_URL}\n\n-- The Emolit Team"
        )
        msg.attach(MIMEText(plain, "plain"))
        html_content = _build_reminder_html(step_text, step_number)
        logger.info(f"📧 DEBUG HTML START: {html_content[:500]}")
        msg.attach(MIMEText(html_content, "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as srv:
            srv.ehlo(); srv.starttls(); srv.ehlo()
            srv.login(SMTP_USER, SMTP_PASSWORD)
            srv.sendmail(SMTP_USER, to_email, msg.as_string())
        logger.info(f"Reminder email sent to {to_email} step {step_number}")
        return True
    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP auth failed — check SMTP_USER and SMTP_PASSWORD in .env")
        return False
    except Exception as e:
        logger.error(f"Reminder email error: {e}")
        return False


# ── OTP Password Reset Email ──────────────────────────────────────────────────

def _build_otp_html(otp: str) -> str:
    otp_spaced = ' '.join(list(otp))
    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Password Reset Code \u2014 Emolit</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,600&family=Inter:wght@300;400;500;600;800&display=swap" rel="stylesheet"/>
</head>
<body style="margin:0;padding:0;background-color:#FFF8DC;font-family:'Inter',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#FFF8DC;padding:52px 16px 60px;">
    <tr><td align="center">
      <table width="580" cellpadding="0" cellspacing="0" style="background-color:#FFF8DC;">
        <tr><td style="padding:0 52px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;"><span style="font-family:'Playfair Display',Georgia,serif;font-size:34px;color:#3D2520;font-weight:700;letter-spacing:-0.5px;">Emo<em style="color:#674846;font-style:italic;">lit</em></span></td>
            <td align="right" style="vertical-align:middle;"><span style="font-size:9px;color:#A08070;letter-spacing:4px;text-transform:uppercase;font-family:'Inter',Arial,sans-serif;">Password Reset</span></td>
          </tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;"><tr><td style="border-top:3px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:3px;"><tr><td style="border-top:1px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
        </td></tr>
      </table>
      <table width="580" cellpadding="0" cellspacing="0" style="background-color:#FFFFFF;border-left:1px solid rgba(103,72,70,0.15);border-right:1px solid rgba(103,72,70,0.15);">
        <tr><td style="padding:52px 52px 0;">
          <p style="font-size:9px;color:#A08070;letter-spacing:5px;text-transform:uppercase;margin:0 0 28px;font-family:'Inter',Arial,sans-serif;font-weight:500;">&#8212; Password Reset &#8212;</p>
          <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:52px;color:#3D2520;margin:0;line-height:1.08;font-weight:700;letter-spacing:-2px;">One code.<br/>New start.<br/><em style="font-style:italic;font-weight:400;color:#674846;font-size:56px;">Yours.</em></h1>
        </td></tr>
        <tr><td style="padding:36px 52px 0;">
          <table cellpadding="0" cellspacing="0" style="margin-bottom:20px;"><tr><td style="width:44px;border-top:2px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
          <p style="font-size:15px;color:#6B4E4A;line-height:1.9;margin:0 0 32px;font-weight:300;max-width:440px;font-family:'Inter',Arial,sans-serif;">
            Enter this code in the Emolit app to reset your password. It&#8217;s valid for <strong style="color:#3D2520;font-weight:600;">10 minutes</strong> only.
          </p>
        </td></tr>
        <tr><td style="padding:0 52px 48px;text-align:center;">
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 24px;">
            <tr><td style="background-color:#3D2520;padding:28px 48px;border-radius:8px;text-align:center;">
              <span style="font-family:'Inter',Arial,monospace;font-size:44px;font-weight:800;color:#FFF8DC;letter-spacing:20px;display:block;">{otp_spaced}</span>
            </td></tr>
          </table>
          <p style="font-size:11px;color:#BCA898;margin:0;font-family:'Inter',Arial,sans-serif;">Expires in 10&#160;minutes &nbsp;&#183;&nbsp; One-time use only</p>
        </td></tr>
        <tr><td style="padding:0 52px;"><table width="100%" cellpadding="0" cellspacing="0"><tr><td style="border-top:1px solid rgba(103,72,70,0.18);font-size:0;line-height:0;">&nbsp;</td></tr></table></td></tr>
        <tr><td style="padding:28px 52px;"><p style="font-size:12px;color:#BCA898;line-height:1.8;margin:0;font-family:'Inter',Arial,sans-serif;">If you didn&#8217;t request a password reset, please ignore this email. Your account remains secure.</p></td></tr>
        <tr><td style="padding:0 52px;">
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:3px;"><tr><td style="border-top:3px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;"><tr><td style="border-top:1px solid #674846;font-size:0;line-height:0;">&nbsp;</td></tr></table>
        </td></tr>
        <tr><td style="padding:0 52px 40px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:middle;"><p style="font-size:11px;color:#C4A898;margin:0;font-family:'Inter',Arial,sans-serif;">&#169; 2026 Emolit &#183; All rights reserved.</p></td>
            <td align="right" style="vertical-align:middle;"><span style="font-family:'Playfair Display',Georgia,serif;font-style:italic;font-size:13px;color:#BCA898;">made with care &#9825;</span></td>
          </tr></table>
        </td></tr>
      </table>
      <p style="font-size:9px;color:#A08070;margin:22px 0 0;text-align:center;letter-spacing:4px;text-transform:uppercase;font-family:'Inter',Arial,sans-serif;">Emotional Intelligence for Everyone</p>
    </td></tr>
  </table>
</body>
</html>"""


def send_otp_email(to_email: str, otp: str) -> bool:
    """Send a branded OTP password-reset email. Returns True on success."""
    if not SMTP_USER or not SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured \u2014 cannot send OTP email.")
        return False
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = "Your Emolit password reset code"
        msg["From"]    = f"{FROM_NAME} <{SMTP_USER}>"
        msg["To"]      = to_email
        plain = (
            f"Your Emolit password reset code is: {otp}\n\n"
            "This code expires in 10 minutes.\n\n"
            "If you didn't request this, please ignore this email.\n\n"
            "-- The Emolit Team"
        )
        msg.attach(MIMEText(plain, "plain"))
        msg.attach(MIMEText(_build_otp_html(otp), "html"))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as srv:
            srv.ehlo(); srv.starttls(); srv.ehlo()
            srv.login(SMTP_USER, SMTP_PASSWORD)
            srv.sendmail(SMTP_USER, to_email, msg.as_string())
        logger.info(f"OTP email sent to {to_email}")
        return True
    except smtplib.SMTPAuthenticationError:
        logger.error("SMTP auth failed \u2014 check SMTP_USER and SMTP_PASSWORD")
        return False
    except Exception as e:
        logger.error(f"OTP email error: {e}")
        return False
