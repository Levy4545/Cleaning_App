# Notification system (in-app + email)

## What was added

- **In-app notifications** with a header bell, unread badge, dropdown, and `/notifications` page
- **Dual-channel dispatch**: every booking event writes an `IN_APP` row and sends an **email**
- **Appointment message threads** on customer cards and the admin inbox; sending a message notifies the other party
- Richer event copy:
  - Customer: approved **with price**, cancelled, completed (ready for pickup / on-site done)
  - Admin: new booking, customer cancel
- Schema migration `0005_notifications_in_app_messages` (`type`, `href`, `appointmentId`, `readAt`)

## Best email setup for a company Gmail

Use **Nodemailer + Gmail SMTP with a Google App Password**. This is the practical production path for a company Gmail / Google Workspace mailbox without standing up a separate ESP.

1. On the company Google account, enable **2-Step Verification**
2. Create an **App Password** at https://myaccount.google.com/apppasswords (app: Mail)
3. Put these in `.env.local` / production secrets:

```env
GMAIL_USER=bookings@yourcompany.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
NOTIFICATION_EMAIL_FROM="Master-Gold Cleaning <bookings@yourcompany.com>"
```

Defaults: `smtp.gmail.com:465` (override with `SMTP_HOST` / `SMTP_PORT` if needed).

### Why this over alternatives

| Option | When to use |
| --- | --- |
| **Gmail SMTP + App Password** (implemented) | Company Gmail/Workspace, low volume transactional mail, fastest to ship |
| Resend / SendGrid (also kept as fallback) | Higher volume, better deliverability dashboards, custom domain DKIM without Google |
| Gmail API OAuth2 | Strict enterprise policy forbidding app passwords; more moving parts |

Delivery order in code: **Gmail SMTP → Resend → console stub**.

Without Gmail/Resend credentials, emails log as `[notify:email:stub]` so local/dev still works.

## Event matrix

| Event | Customer | Admin |
| --- | --- | --- |
| Booking created | — | in-app + email |
| Approved (price included) | in-app + email | — |
| Rejected / admin cancel | in-app + email | — |
| Customer cancel | — | in-app + email |
| Completed (pickup copy for drop-off) | in-app + email | — |
| Appointment message | recipient | recipient |

## Migrate

```bash
npm run db:migrate
```
