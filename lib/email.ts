import { Resend } from "resend"

const FROM = `Brit English Academy <${process.env.RESEND_FROM_EMAIL ?? "noreply@BritEnglishAcademy.com"}>`

function wrap(body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:Inter,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
<tr><td style="background:#012169;padding:24px 32px;border-radius:12px 12px 0 0;">
<p style="margin:0;color:#fff;font-size:18px;font-weight:700;letter-spacing:-0.3px;">Brit English Academy</p>
</td></tr>
<tr><td style="background:#fff;padding:32px;border-radius:0 0 12px 12px;border:1px solid #E5E7EB;border-top:0;">
${body}
</td></tr>
<tr><td style="padding:20px 0;text-align:center;">
<p style="margin:0;font-size:12px;color:#9CA3AF;">© ${new Date().getFullYear()} Brit English Academy · Correo automático, por favor no respondas.</p>
</td></tr>
</table></td></tr></table>
</body></html>`
}

const btn = (url: string, label: string) =>
  `<a href="${url}" style="display:inline-block;background:#012169;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:600;margin-top:20px;">${label}</a>`

export async function sendEmail(to: string | string[], subject: string, body: string) {
  const recipients = Array.isArray(to) ? to : [to]
  if (recipients.length === 0) return

  if (!process.env.RESEND_API_KEY) {
    console.log("[Email dev]", { to: recipients, subject })
    return
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({ from: FROM, to: recipients, subject, html: wrap(body) })
  } catch (err) {
    console.error("[Email error]", err)
  }
}

// ── Templates ────────────────────────────────────────────────────────────────

export function tplHomeworkSubmitted(studentName: string, title: string, appUrl: string): string {
  return `
    <h2 style="margin:0 0 16px;font-size:20px;color:#012169;">Nuevo deber para revisar</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      <strong>${studentName}</strong> ha enviado un nuevo deber y está esperando revisión:
    </p>
    <div style="background:#F3F4F6;border-left:4px solid #012169;border-radius:0 8px 8px 0;padding:14px 18px;">
      <p style="margin:0;font-size:15px;color:#111827;font-weight:600;">${title}</p>
    </div>
    ${btn(`${appUrl}/admin/homework`, "Revisar deber →")}
  `
}

export function tplHomeworkCorrected(studentName: string, title: string, appUrl: string): string {
  return `
    <h2 style="margin:0 0 16px;font-size:20px;color:#012169;">¡Tu tarea ha sido corregida!</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Hola <strong>${studentName}</strong>, tu profesor ha revisado y corregido tu tarea.
      Accede a la plataforma para ver el feedback detallado y el archivo corregido.
    </p>
    <div style="background:#F3F4F6;border-left:4px solid #16A34A;border-radius:0 8px 8px 0;padding:14px 18px;">
      <p style="margin:0;font-size:15px;color:#111827;font-weight:600;">${title}</p>
    </div>
    ${btn(`${appUrl}/homework`, "Ver corrección →")}
  `
}

export function tplAnnouncement(content: string, appUrl: string): string {
  const preview = content.length > 200 ? content.slice(0, 200) + "…" : content
  return `
    <h2 style="margin:0 0 16px;font-size:20px;color:#012169;">Nuevo anuncio de la escuela</h2>
    <div style="background:#EEF1FA;border-left:4px solid #C8102E;border-radius:0 8px 8px 0;padding:14px 18px;margin-bottom:8px;">
      <p style="margin:0;font-size:15px;color:#374151;line-height:1.6;">${preview}</p>
    </div>
    ${btn(`${appUrl}/community`, "Ver en la comunidad →")}
  `
}

export function tplWelcome(fullName: string, appUrl: string): string {
  const firstName = fullName.split(" ")[0]
  return `
    <h2 style="margin:0 0 16px;font-size:20px;color:#012169;">¡Bienvenido/a, ${firstName}!</h2>
    <p style="margin:0 0 16px;font-size:15px;color:#374151;line-height:1.6;">
      Ya formas parte de la comunidad de Brit English Academy. Desde tu dashboard podrás:
    </p>
    <ul style="margin:0 0 16px;padding-left:20px;font-size:15px;color:#374151;line-height:1.8;">
      <li>Ver y completar lecciones en vídeo</li>
      <li>Enviar deberes y recibir correcciones con IA</li>
      <li>Practicar exámenes estilo Cambridge</li>
      <li>Participar en la comunidad de estudiantes</li>
    </ul>
    ${btn(`${appUrl}/dashboard`, "Ir a mi dashboard →")}
  `
}
