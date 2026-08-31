import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

import { readRawDatabaseUrl, normalizeDatabaseUrl } from "./db/connection-url";
import { readSupabaseAnonKey, readSupabaseUrl } from "./lib/supabase/env-keys";

const postgresUrl = z
  .string()
  .trim()
  .min(1)
  .refine(
    (value) => /^(postgres|postgresql):\/\//i.test(value),
    "Must start with postgres:// or postgresql://",
  );

function databaseUrlFromEnv() {
  const raw = readRawDatabaseUrl();
  if (!raw) return undefined;
  try {
    return normalizeDatabaseUrl(raw);
  } catch {
    return raw;
  }
}

export const env = createEnv({
  server: {
    /**
     * App Postgres (Drizzle). In production this is usually the same Supabase
     * project as Auth — copy Connect → Transaction pooler (database password).
     */
    DATABASE_URL: postgresUrl,
    /** Optional. Unused by the app today; set it if you add admin Supabase APIs. */
    SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(1).optional(),
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
    // Filled from SUPABASE_URL / SUPABASE_ANON_KEY (Vercel Secrets) or NEXT_PUBLIC_* aliases.
    NEXT_PUBLIC_SUPABASE_URL: z.string().trim().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().trim().min(1),
  },
  runtimeEnv: {
    DATABASE_URL: databaseUrlFromEnv(),
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
    NEXT_PUBLIC_SUPABASE_URL: readSupabaseUrl(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: readSupabaseAnonKey(),
  },
  skipValidation:
    process.env.SKIP_ENV_VALIDATION === "true" ||
    // `npm run build` must compile on Vercel even if a linked project is missing env.
    process.env.npm_lifecycle_event === "build",
  emptyStringAsUndefined: true,
  onValidationError: (issues) => {
    const lines = issues.map((issue) => {
      const path = issue.path?.length ? issue.path.join(".") : "(unknown)";
      return `  ${path}: ${issue.message}`;
    });
    console.error(
      [
        "Invalid environment variables:",
        ...lines,
        "",
        "On Vercel: Project → Settings → Environment Variables.",
        "Enable Production and Preview, and keep “available at Build Time”.",
        "Required: DATABASE_URL (or POSTGRES_URL), SUPABASE_URL, SUPABASE_ANON_KEY",
        "On Vercel add SUPABASE_URL and SUPABASE_ANON_KEY as Secrets (no NEXT_PUBLIC_ prefix).",
        "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY still work locally, or as Vercel Config.",
        "DATABASE_URL is the Postgres URI from Supabase → Connect → Transaction pooler (database password, not the service_role key).",
      ].join("\n"),
    );
    throw new Error("Invalid environment variables");
  },
});
