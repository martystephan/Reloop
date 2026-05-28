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
  include_subject: number;
  include_message: number;
  include_email: number;
  include_meta: number;
  include_screenshot: number;
  created_at: number;
}

interface SubmissionItem {
  type: string;
  subject?: string;
  message?: string;
  email?: string;
  screenshot?: string;
  meta?: Record<string, unknown>;
}

/** Splits a data URL into the pieces nodemailer needs for an attachment. */
function screenshotAttachment(dataUrl: string) {
  const match = /^data:(.+?);base64,(.*)$/s.exec(dataUrl);
  if (!match) return null;
  const [, contentType, base64] = match;
  const ext = contentType.split("/")[1]?.split("+")[0] ?? "png";
  return {
    filename: `screenshot.${ext}`,
    content: base64,
    encoding: "base64" as const,
    contentType,
  };
}

export function sendViaService(
  service: NotificationServiceRow,
  projectName: string,
  item: SubmissionItem,
): void {
  const transport = nodemailer.createTransport({
    host: service.smtp_host,
    port: service.smtp_port,
    secure: service.smtp_secure === 1,
    auth: { user: service.smtp_user, pass: service.smtp_pass },
  });

  const lines: string[] = [];
  if (service.include_subject && item.subject) {
    lines.push(`Subject: ${item.subject}`);
  }
  if (service.include_email && item.email) {
    lines.push(`Email: ${item.email}`);
  }
  if (service.include_message && item.message) {
    lines.push("", item.message);
  }
  if (service.include_meta && item.meta && Object.keys(item.meta).length > 0) {
    lines.push("", "Metadata:", JSON.stringify(item.meta, null, 2));
  }

  const text = [
    `New ${item.type} submission for project: ${projectName}`,
    "",
    ...lines,
  ].join("\n");

  const attachment =
    service.include_screenshot && item.screenshot
      ? screenshotAttachment(item.screenshot)
      : null;

  transport
    .sendMail({
      from: `Reloop <${service.from_address}>`,
      to: service.to_address,
      subject: `[Reloop] New ${item.type} — ${projectName}`,
      text,
      attachments: attachment ? [attachment] : undefined,
    })
    .catch((err) => {
      console.error(
        `[reloop/mailer] failed to send via service "${service.name}":`,
        err,
      );
    });
}

/** Sends a test email and resolves on success, rejects with an Error on failure. */
export async function testConnection(service: NotificationServiceRow): Promise<void> {
  const transport = nodemailer.createTransport({
    host: service.smtp_host,
    port: service.smtp_port,
    secure: service.smtp_secure === 1,
    auth: { user: service.smtp_user, pass: service.smtp_pass },
  });

  await transport.verify();
  await transport.sendMail({
    from: `Reloop <${service.from_address}>`,
    to: service.to_address,
    subject: "[Reloop] Test connection",
    text: "This is a test email from Reloop to verify your notification service is working correctly.",
  });
}
