import nodemailer from "nodemailer";

import { env } from "@/env";

export type NotifyChannel = "EMAIL" | "SMS" | "IN_APP";

export type NotifyInput = {
  shopId: string;
  userId: string;
  channel: NotifyChannel;
  to: string;
  subject?: string;
  body: string;
  /** Optional HTML for email providers that support it */
  html?: string;
};

export type NotifyResult = {
  ok: boolean;
  provider: string;
  error?: string;
};

/**
 * Notification delivery facade.
 *
 * EMAIL priority:
 * 1. Company Gmail / Google Workspace via SMTP (GMAIL_USER + GMAIL_APP_PASSWORD)
 * 2. Resend API (RESEND_API_KEY + NOTIFICATION_EMAIL_FROM)
 * 3. Console stub (dev-safe when neither is configured)
 *
 * SMS: Twilio when credentials are set, otherwise stub.
 * IN_APP: no external send — persistence is handled by the caller.
 */
export async function sendNotification(input: NotifyInput): Promise<NotifyResult> {
  if (input.channel === "IN_APP") {
    return { ok: true, provider: "in-app" };
  }
  if (input.channel === "EMAIL") {
    return sendEmail(input);
  }
  return sendSms(input);
}

function fromAddress() {
  return env.NOTIFICATION_EMAIL_FROM ?? env.GMAIL_USER ?? "noreply@master-gold.local";
}

async function sendEmail(input: NotifyInput): Promise<NotifyResult> {
  const subject = input.subject ?? "Master-Gold Cleaning";
  const html = input.html ?? plainTextToHtml(input.body);

  if (env.GMAIL_USER && env.GMAIL_APP_PASSWORD) {
    return sendViaGmailSmtp({
      to: input.to,
      subject,
      text: input.body,
      html,
    });
  }

  if (env.RESEND_API_KEY && env.NOTIFICATION_EMAIL_FROM) {
    return sendViaResend({
      to: input.to,
      subject,
      text: input.body,
      html,
      from: env.NOTIFICATION_EMAIL_FROM,
      apiKey: env.RESEND_API_KEY,
    });
  }

  console.info("[notify:email:stub]", {
    to: input.to,
    subject,
    body: input.body,
  });
  return { ok: true, provider: "stub-email" };
}

async function sendViaGmailSmtp(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<NotifyResult> {
  try {
    const transporter = nodemailer.createTransport({
      host: env.SMTP_HOST ?? "smtp.gmail.com",
      port: env.SMTP_PORT ?? 465,
      secure: (env.SMTP_PORT ?? 465) === 465,
      auth: {
        user: env.GMAIL_USER!,
        pass: env.GMAIL_APP_PASSWORD!,
      },
    });

    await transporter.sendMail({
      from: fromAddress(),
      to: input.to,
      subject: input.subject,
      text: input.text,
      html: input.html,
    });

    return { ok: true, provider: "gmail-smtp" };
  } catch (error) {
    return {
      ok: false,
      provider: "gmail-smtp",
      error: error instanceof Error ? error.message : "Unknown Gmail SMTP error",
    };
  }
}

async function sendViaResend(input: {
  to: string;
  subject: string;
  text: string;
  html: string;
  from: string;
  apiKey: string;
}): Promise<NotifyResult> {
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: input.from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, provider: "resend", error: text };
    }

    return { ok: true, provider: "resend" };
  } catch (error) {
    return {
      ok: false,
      provider: "resend",
      error: error instanceof Error ? error.message : "Unknown email error",
    };
  }
}

async function sendSms(input: NotifyInput): Promise<NotifyResult> {
  const sid = env.TWILIO_ACCOUNT_SID;
  const token = env.TWILIO_AUTH_TOKEN;
  const from = env.TWILIO_FROM_NUMBER;

  if (!sid || !token || !from) {
    console.info("[notify:sms:stub]", {
      to: input.to,
      body: input.body,
    });
    return { ok: true, provider: "stub-sms" };
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
    const body = new URLSearchParams({
      To: input.to,
      From: from,
      Body: input.body,
    });

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, provider: "twilio", error: text };
    }

    return { ok: true, provider: "twilio" };
  } catch (error) {
    return {
      ok: false,
      provider: "twilio",
      error: error instanceof Error ? error.message : "Unknown SMS error",
    };
  }
}

function plainTextToHtml(body: string) {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br/>");

  return `<!DOCTYPE html>
<html>
  <body style="font-family: Georgia, 'Times New Roman', serif; background:#0b0b0b; color:#f5f0e8; padding:24px;">
    <div style="max-width:560px;margin:0 auto;background:#151515;border:1px solid #2a2a2a;border-radius:12px;padding:28px;">
      <p style="margin:0 0 8px;color:#c9a227;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;">Master-Gold Cleaning</p>
      <div style="font-size:15px;line-height:1.6;color:#e8e2d6;">${escaped}</div>
    </div>
  </body>
</html>`;
}
