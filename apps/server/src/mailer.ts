import nodemailer from "nodemailer";

export interface NotificationServiceRow {
  id: string;
  name: string;
  type: string;
  smtp_host: string;
  smtp_port: number;
  smtp_secure: number;
  smtp_user: string;
  smtp_pass: string;
  from_address: string;
  to_address: string;
  created_at: number;
}

interface FeedbackItem {
  type: string;
  message: string;
  rating?: number | null;
  url?: string | null;
}

interface UserMeta {
  id?: string;
  email?: string;
  name?: string;
}

export function sendViaService(
  service: NotificationServiceRow,
  projectName: string,
  items: FeedbackItem[],
  user: UserMeta | null,
): void {
  const transport = nodemailer.createTransport({
    host: service.smtp_host,
    port: service.smtp_port,
    secure: service.smtp_secure === 1,
    auth: { user: service.smtp_user, pass: service.smtp_pass },
  });

  const itemLines = items
    .map((it) => {
      const parts = [`[${it.type.toUpperCase()}] ${it.message}`];
      if (it.rating != null) parts.push(`Rating: ${it.rating}/5`);
      if (it.url) parts.push(`URL: ${it.url}`);
      return parts.join("\n");
    })
    .join("\n\n---\n\n");

  const userLine = user
    ? [user.name, user.email, user.id ? `id:${user.id}` : null]
        .filter(Boolean)
        .join(" / ")
    : null;

  const text = [
    `New feedback received for project: ${projectName}`,
    userLine ? `User: ${userLine}` : null,
    "",
    itemLines,
  ]
    .filter((l) => l !== null)
    .join("\n");

  transport
    .sendMail({
      from: service.from_address,
      to: service.to_address,
      subject: `[Reloop] ${items.length === 1 ? "New feedback" : `${items.length} new feedback items`} — ${projectName}`,
      text,
    })
    .catch((err) => {
      console.error(
        `[reloop/mailer] failed to send via service "${service.name}":`,
        err,
      );
    });
}
