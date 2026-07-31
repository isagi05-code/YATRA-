import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

def send_otp_email(email: str, otp_code: str) -> bool:
    # 1. Check if SMTP configuration is provided in environment variables
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    smtp_sender = os.getenv("SMTP_SENDER", smtp_user)
    
    success = False
    
    if smtp_host and smtp_port and smtp_user and smtp_pass:
        try:
            print(f"[Email Gateway] Attempting to send OTP via SMTP to {email}...")
            
            # Create message container
            msg = MIMEMultipart('alternative')
            msg['Subject'] = "Yatra AI - Your OTP Verification Code"
            msg['From'] = smtp_sender
            msg['To'] = email
            
            # Simple elegant plain text and HTML bodies
            text = f"Your Yatra AI OTP verification code is: {otp_code}\nThis code is valid for 5 minutes."
            html = f"""
            <html>
              <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0b0f19; color: #ffffff; padding: 20px;">
                <div style="max-width: 500px; margin: 0 auto; background-color: #111827; border: 1px solid #1f2937; border-radius: 12px; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #3b82f6; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: 0.5px;">Yatra <span style="color: #60a5fa;">AI</span></h2>
                  </div>
                  <hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;" />
                  <p style="font-size: 16px; line-height: 1.5; color: #9ca3af;">Hello,</p>
                  <p style="font-size: 16px; line-height: 1.5; color: #d1d5db;">You have requested a verification code to access your Yatra AI dashboard. Please use the following One-Time Password (OTP):</p>
                  <div style="text-align: center; margin: 30px 0;">
                    <span style="display: inline-block; font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #10b981; background-color: #064e3b; padding: 12px 24px; border-radius: 8px; border: 1px solid #047857;">{otp_code}</span>
                  </div>
                  <p style="font-size: 14px; color: #6b7280; text-align: center;">This code is valid for 5 minutes. If you did not request this, you can safely ignore this email.</p>
                  <hr style="border: 0; border-top: 1px solid #1f2937; margin: 20px 0;" />
                  <p style="font-size: 12px; color: #4b5563; text-align: center; margin: 0;">&copy; 2026 Yatra AI. All rights reserved.</p>
                </div>
              </body>
            </html>
            """
            
            part1 = MIMEText(text, 'plain')
            part2 = MIMEText(html, 'html')
            msg.attach(part1)
            msg.attach(part2)
            
            clean_pass = smtp_pass.replace(" ", "").strip()
            
            # Use SSL/TLS or StartTLS based on port
            port = int(smtp_port)
            if port == 465:
                server = smtplib.SMTP_SSL(smtp_host, port, timeout=15)
            else:
                server = smtplib.SMTP(smtp_host, port, timeout=15)
                server.starttls()
                
            server.login(smtp_user, clean_pass)
            server.sendmail(smtp_sender, email, msg.as_string())
            server.quit()
            
            print(f"[Email Gateway] SMTP success: Email sent to {email}")
            success = True
        except Exception as e:
            print(f"[Email Gateway Error] Failed to send email via SMTP: {e}")
            
    # Always fallback to simulation printing for easy console validation
    print("\n" + "[EMAIL] " + "="*65)
    print(f"[EMAIL] [SIMULATED EMAIL SENDER] Sending Email to: {email}")
    print("[EMAIL] Subject: Yatra AI - Your OTP Verification Code")
    print("[EMAIL] Body:")
    print("[EMAIL]   Hi Travel Enthusiast,")
    print(f"[EMAIL]   Your verification code for Yatra AI is: {otp_code}")
    print("[EMAIL]   This code is valid for 5 minutes.")
    print("[EMAIL] " + "="*65 + "\n")
    
    return success
