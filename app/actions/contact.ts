"use server"

import { z } from "zod"

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  level: z.string().min(1),
  message: z.string().min(10),
})

export type ContactFormData = z.infer<typeof schema>
export type ContactResult = { success: boolean; error?: string }

export async function submitContact(data: ContactFormData): Promise<ContactResult> {
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: "Datos del formulario incorrectos." }
  }

  const { name, email, phone, level, message } = parsed.data

  try {
    if (process.env.RESEND_API_KEY) {
      const { Resend } = await import("resend")
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: `Brit English Academy <${process.env.RESEND_FROM_EMAIL ?? "noreply@BritEnglishAcademy.com"}>`,
        to: "info@BritEnglishAcademy.com",
        subject: `Nuevo contacto web: ${name} (Nivel ${level})`,
        html: `
          <h2>Nuevo mensaje de contacto — Brit English Academy</h2>
          <p><strong>Nombre:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          ${phone ? `<p><strong>Teléfono:</strong> ${phone}</p>` : ""}
          <p><strong>Nivel actual:</strong> ${level}</p>
          <p><strong>Mensaje:</strong></p>
          <p style="white-space:pre-line">${message}</p>
        `,
      })
    } else {
      console.log("[Contact Form — dev mode, no RESEND_API_KEY]", { name, email, level })
    }

    return { success: true }
  } catch (err) {
    console.error("[Contact Form Error]", err)
    return { success: false, error: "Error al enviar el mensaje. Inténtalo de nuevo." }
  }
}
