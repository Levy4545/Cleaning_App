import { env } from "@/env";

export type NotifyChannel = "EMAIL" | "SMS";

export type NotifyInput = {
  shopId: string;
  userId: string;
  channel: NotifyChannel;
  to: string;
  subject?: string;
  body: string;
};

export type NotifyResult = {
  ok: boolean;
  provider: string;
  error?: string;
};

/**
 * Notification facade for MVP.
 * - EMAIL: logs + optional Resend when RESEND_API_KEY is set
 * - SMS: logs + optional Twilio when credentials are set
 * Providers can be swapped without changing booking/approve flows.
 */
export async function sendNotification(input: NotifyInput): Promise<NotifyResult> {
  if (input.channel === "EMAIL") {
    return sendEmail(input);
  }
  return sendSms(input);
}

async function sendEmail(input: NotifyInput): Promise<NotifyResult> {
  const apiKey = env.RESEND_API_KEY;
  const from = env.NOTIFICATION_EMAIL_FROM;

  if (!apiKey || !from) {
    console.info("[notify:email:stub]", {
      to: input.to,
      subject: input.subject,
      body: input.body,
    });
    return { ok: true, provider: "stub-email" };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject ?? "Master-Gold Cleaning",
        text: input.body,
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
