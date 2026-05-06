import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const NOTIFY_TO = 'paras@pplai.app'
const FROM = 'PPL AI <noreply@contact.pplai.app>'

export async function sendContactFormEmail(data: {
  name: string; email: string; subject: string; message: string
}) {
  if (!process.env.RESEND_API_KEY) return
  await resend.emails.send({
    from: FROM,
    to: NOTIFY_TO,
    replyTo: data.email,
    subject: `[Contact] ${data.subject} — ${data.name}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0f172a;">
        <div style="font-size:18px;font-weight:800;margin-bottom:24px;">New contact form submission</div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#64748b;width:90px;">From</td><td style="font-weight:600;">${data.name} &lt;${data.email}&gt;</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Subject</td><td>${data.subject}</td></tr>
        </table>
        <div style="margin-top:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 20px;font-size:14px;line-height:1.7;white-space:pre-wrap;">${data.message}</div>
      </div>
    `,
  })
}

export async function sendJobApplicationEmail(data: {
  role: string; message: string | null; resumeFileName: string | null
}) {
  if (!process.env.RESEND_API_KEY) return
  await resend.emails.send({
    from: FROM,
    to: NOTIFY_TO,
    subject: `[Jobs] Application for ${data.role}`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0f172a;">
        <div style="font-size:18px;font-weight:800;margin-bottom:24px;">New job application</div>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr><td style="padding:8px 0;color:#64748b;width:90px;">Role</td><td style="font-weight:700;color:#6366f1;">${data.role}</td></tr>
          <tr><td style="padding:8px 0;color:#64748b;">Resume</td><td>${data.resumeFileName ?? '(not provided)'}</td></tr>
        </table>
        ${data.message ? `<div style="margin-top:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 20px;font-size:14px;line-height:1.7;white-space:pre-wrap;">${data.message}</div>` : ''}
        <p style="margin-top:20px;font-size:13px;color:#94a3b8;">Resume file must be retrieved from server logs / storage.</p>
      </div>
    `,
  })
}

export async function sendAdminPasswordResetEmail(to: string, resetUrl: string) {
  if (!process.env.RESEND_API_KEY) return
  await resend.emails.send({
    from: 'PPL AI Admin <admin@contact.pplai.app>',
    to,
    subject: 'Reset your PPL AI Admin password',
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0f172a;">
        <div style="font-size:20px;font-weight:800;margin-bottom:4px;">PPL AI · Admin</div>
        <div style="font-size:13px;color:#64748b;margin-bottom:32px;">Password Reset</div>
        <p style="font-size:15px;line-height:1.6;">Someone requested a password reset for your admin account.</p>
        <p style="font-size:15px;line-height:1.6;">Click the button below to set a new password. This link expires in <strong>1 hour</strong>.</p>
        <div style="margin:28px 0;">
          <a href="${resetUrl}" style="display:inline-block;background:#6366f1;color:#fff;border-radius:8px;padding:12px 28px;font-size:15px;font-weight:700;text-decoration:none;">Reset Password</a>
        </div>
        <p style="font-size:13px;color:#94a3b8;word-break:break-all;">Or copy this link: ${resetUrl}</p>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />
        <p style="font-size:12px;color:#94a3b8;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `,
  })
}

export async function sendAdminAccessEmail(to: string, role: string, addedBy: string) {
  if (!process.env.RESEND_API_KEY) return // silently skip if not configured

  const roleDesc: Record<string, string> = {
    view:    'View — read-only access to all panels',
    comment: 'Comment — read access + can update support tickets',
    admin:   'Admin — full access including user management',
  }

  await resend.emails.send({
    from:    'PPL AI Admin <admin@pplai.app>',
    to,
    subject: "You've been added to PPL AI Admin Panel",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0f172a;">
        <div style="font-size:20px;font-weight:800;margin-bottom:4px;">PPL AI · Admin</div>
        <div style="font-size:13px;color:#64748b;margin-bottom:32px;">pplai.app</div>

        <p style="font-size:15px;line-height:1.6;">Hi,</p>
        <p style="font-size:15px;line-height:1.6;">
          <strong>${addedBy}</strong> has granted you access to the PPL AI Admin Panel.
        </p>

        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px 20px;margin:24px 0;">
          <div style="font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Your Access Level</div>
          <div style="font-size:15px;font-weight:700;color:#6366f1;">${role.toUpperCase()}</div>
          <div style="font-size:13px;color:#475569;margin-top:4px;">${roleDesc[role] ?? role}</div>
        </div>

        <p style="font-size:14px;color:#475569;line-height:1.6;">
          Sign in at <a href="https://pplai.app/admin" style="color:#6366f1;">pplai.app/admin</a> using your email and password.
        </p>

        <hr style="border:none;border-top:1px solid #e2e8f0;margin:28px 0;" />
        <p style="font-size:12px;color:#94a3b8;">
          If you were not expecting this, please contact <a href="mailto:paras@pplai.app" style="color:#6366f1;">paras@pplai.app</a>.
        </p>
      </div>
    `,
  })
}
