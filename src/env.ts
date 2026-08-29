import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().url(),
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
    /**
     * Company Gmail / Google Workspace SMTP (recommended for auto emails).
     * Create an App Password at https://myaccount.google.com/apppasswords
     * (2FA must be enabled on the Google account).
     */
    GMAIL_USER: z.string().email().optional(),
    GMAIL_APP_PASSWORD: z.string().min(8).optional(),
    /** Override SMTP host/port when not using smtp.gmail.com defaults */
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().positive().optional(),
    /** Optional — email notifications via Resend (fallback if Gmail unset) */
    RESEND_API_KEY: z.string().min(1).optional(),
    /** From address for emails (defaults to GMAIL_USER when using Gmail) */
    NOTIFICATION_EMAIL_FROM: z.string().min(1).optional(),
    /** Optional — SMS via Twilio (in addition to in-app + email) */
    TWILIO_ACCOUNT_SID: z.string().min(1).optional(),
    TWILIO_AUTH_TOKEN: z.string().min(1).optional(),
    TWILIO_FROM_NUMBER: z.string().min(1).optional(),
    /**
     * When set to SMS, also send SMS for system events (requires Twilio).
     * In-app + email are always attempted regardless of this value.
     */
    NOTIFY_CHANNEL: z.enum(["EMAIL", "SMS"]).default("EMAIL"),
    /**
     * If set, this email is promoted to ADMIN on sync (local bootstrap).
     * Leave unset in production once a real admin exists.
     */
    ADMIN_BOOTSTRAP_EMAIL: z.string().email().optional(),
  },
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    GMAIL_USER: process.env.GMAIL_USER,
    GMAIL_APP_PASSWORD: process.env.GMAIL_APP_PASSWORD,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
    NOTIFICATION_EMAIL_FROM: process.env.NOTIFICATION_EMAIL_FROM,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_FROM_NUMBER: process.env.TWILIO_FROM_NUMBER,
    NOTIFY_CHANNEL: process.env.NOTIFY_CHANNEL,
    ADMIN_BOOTSTRAP_EMAIL: process.env.ADMIN_BOOTSTRAP_EMAIL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },
  skipValidation: process.env.SKIP_ENV_VALIDATION === "true",
  emptyStringAsUndefined: true,
});
