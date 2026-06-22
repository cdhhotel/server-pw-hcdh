import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { env } from "../../../config/env.js";

// Helper para capitalizar la primera letra
function capitalize(str: string): string {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Formateador de fecha amigable en español
function formatFriendlyDate(dateInput: Date | string): string {
  const date = new Date(dateInput);
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC"
  };
  return capitalize(date.toLocaleDateString("es-MX", options));
}

export class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    // Solo crear el transporte real si SMTP está completamente configurado con credenciales válidas
    const hasCredentials = !!env.SMTP_USER && !!env.SMTP_PASS;
    const hasRealHost = !!env.SMTP_HOST && env.SMTP_HOST !== "smtp.example.com";

    if (hasCredentials && hasRealHost) {
      this.transporter = nodemailer.createTransport({
        host: env.SMTP_HOST,
        port: env.SMTP_PORT,
        secure: env.SMTP_PORT === 465, // true para 465, false para otros puertos
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      });
    }
  }

  /**
   * Envia un correo de confirmación de reservación al huésped principal
   * @param reservation Datos de la reservación (con relaciones habitacion y huesped_reservacion)
   */
  async sendReservationConfirmation(reservation: any): Promise<void> {
    // 1. Encontrar el huésped principal
    const principalRelation = reservation.huesped_reservacion?.find(
      (hr: any) => hr.es_principal
    );

    if (!principalRelation || !principalRelation.huesped) {
      console.warn(`[EmailService] No se encontró el huésped principal para la reservación ${reservation.folio}. Correo no enviado.`);
      return;
    }

    const guest = principalRelation.huesped;
    if (!guest.email) {
      console.warn(`[EmailService] El huésped principal ${guest.nombre} ${guest.apellidos} no tiene correo registrado. Correo no enviado.`);
      return;
    }

    // 2. Preparar los datos dinámicos para el correo
    const entryDate = new Date(reservation.fecha_entrada);
    const exitDate = new Date(reservation.fecha_salida);
    const diffTime = Math.abs(exitDate.getTime() - entryDate.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;

    const subtotal = Number(reservation.precio_total_noches) || 0;
    const tax = Number(reservation.impuestos) || 0;
    const total = Number(reservation.total_pagar) || 0;

    const dataToReplace: Record<string, string> = {
      nombre: `${guest.nombre} ${guest.apellidos}`,
      folio: reservation.folio,
      fecha_entrada: formatFriendlyDate(reservation.fecha_entrada),
      fecha_salida: formatFriendlyDate(reservation.fecha_salida),
      habitacion_nombre: reservation.habitacion?.nombre || "Habitación Estándar",
      cantidad_huespedes: String(reservation.cantidad_huespedes),
      huespedes_label: reservation.cantidad_huespedes === 1 ? "Huésped" : "Huéspedes",
      noches: String(nights),
      noches_label: nights === 1 ? "noche" : "noches",
      subtotal: subtotal.toLocaleString("es-MX", { minimumFractionDigits: 2 }),
      impuestos: tax.toLocaleString("es-MX", { minimumFractionDigits: 2 }),
      total: total.toLocaleString("es-MX", { minimumFractionDigits: 2 }),
      telefono: guest.telefono || "No especificado",
      comentarios_block: reservation.comentarios ? `
              <tr>
                <td colspan="2" style="padding: 15px 0 5px 0; border-top: 1px dashed #eee8e0; vertical-align: top;">
                  <span style="font-size: 11px; color: #8a7e72; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Peticiones Especiales</span><br>
                  <p style="margin: 4px 0 0 0; font-size: 14px; color: #5a524a; font-style: italic;">"${reservation.comentarios}"</p>
                </td>
              </tr>
            ` : ""
    };

    // 3. Renderizar el HTML
    const htmlContent = this.getHtmlTemplate(dataToReplace);

    // 4. Enviar o Simular
    if (this.transporter) {
      const mailOptions = {
        from: env.SMTP_FROM,
        to: guest.email,
        subject: `Confirmación de Reservación - Folio ${reservation.folio}`,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`[EmailService] Correo de confirmación enviado exitosamente a: ${guest.email} para reservación ${reservation.folio}.`);
    } else {
      // MODO SIMULACIÓN EN LOCAL
      const tempDir = path.join(process.cwd(), "temp-emails");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const fileName = `last-reservation-${reservation.folio}.html`;
      const filePath = path.join(tempDir, fileName);
      fs.writeFileSync(filePath, htmlContent, "utf-8");

      const clickablePath = `file:///${filePath.replace(/\\/g, "/")}`;

      console.log(`\n========================================================================`);
      console.log(`[EmailService] [MODO SIMULADOR ACTIVADO - SMTP NO CONFIGURADO]`);
      console.log(`Se ha generado la previsualización del correo de confirmación.`);
      console.log(`Huésped: ${guest.nombre} ${guest.apellidos} (${guest.email})`);
      console.log(`Folio: ${reservation.folio}`);
      console.log(`Para ver el diseño profesional del correo, haz clic o abre este archivo:`);
      console.log(`${clickablePath}`);
      console.log(`========================================================================\n`);
    }
  }

  private getHtmlTemplate(data: Record<string, string>): string {
    const template = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Confirmación de Reservación - Hotel Casa Dolores</title>
  <style>
    body {
      font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
      background-color: #fcfbfa;
      color: #3d3730;
      margin: 0;
      padding: 0;
      -webkit-font-smoothing: antialiased;
    }
  </style>
</head>
<body style="background-color: #fcfbfa; color: #3d3730; margin: 0; padding: 20px; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
  <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border: 1px solid #eee8e0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
    <!-- Header -->
    <tr>
      <td align="center" style="background-color: #A0442A; padding: 40px 20px; border-bottom: 4px solid #B38A3A;">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px; text-transform: uppercase;">Hotel Casa Dolores</h1>
        <p style="color: rgba(255, 255, 255, 0.8); margin: 5px 0 0 0; font-size: 14px; letter-spacing: 1px; font-style: italic;">Hidalgo, Guanajuato</p>
      </td>
    </tr>
    <!-- Content -->
    <tr>
      <td style="padding: 40px 30px;">
        <h2 style="color: #A0442A; font-weight: 600; margin-top: 0; font-size: 20px;">¡Gracias por tu reservación, {{nombre}}!</h2>
        <p style="font-size: 15px; line-height: 1.6; color: #5a524a; margin-bottom: 25px;">
          Nos complace confirmar tu estancia en el <strong>Hotel Casa Dolores</strong>. Hemos registrado los detalles de tu reserva bajo el siguiente folio único. Por favor, conserva esta información para tu check-in.
        </p>

        <!-- Folio Banner -->
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fdfaf7; border-left: 4px solid #B38A3A; margin: 25px 0; padding: 15px; border-radius: 0 4px 4px 0;">
          <tr>
            <td>
              <span style="font-size: 11px; text-transform: uppercase; color: #8a7e72; font-weight: 700; letter-spacing: 1px;">Folio de Reservación</span><br>
              <strong style="font-size: 24px; color: #A0442A; font-family: 'Courier New', Courier, monospace; letter-spacing: 1px;">{{folio}}</strong>
            </td>
          </tr>
        </table>

        <!-- Details Grid -->
        <h3 style="font-size: 14px; border-bottom: 2px solid #eee8e0; padding-bottom: 8px; margin-top: 30px; margin-bottom: 15px; color: #3d3730; text-transform: uppercase; letter-spacing: 0.5px;">Detalles de la Estancia</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
          <tr>
            <td width="50%" style="padding: 10px 10px 10px 0; vertical-align: top;">
              <span style="font-size: 11px; color: #8a7e72; text-transform: uppercase; font-weight: 700;">Fecha de Entrada</span><br>
              <strong style="font-size: 14px; color: #3d3730;">{{fecha_entrada}}</strong><br>
              <span style="font-size: 12px; color: #8a7e72;">Check-in: 15:00 hrs</span>
            </td>
            <td width="50%" style="padding: 10px 0 10px 10px; vertical-align: top;">
              <span style="font-size: 11px; color: #8a7e72; text-transform: uppercase; font-weight: 700;">Fecha de Salida</span><br>
              <strong style="font-size: 14px; color: #3d3730;">{{fecha_salida}}</strong><br>
              <span style="font-size: 12px; color: #8a7e72;">Check-out: 12:00 hrs</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 10px 10px 10px 0; vertical-align: top; border-top: 1px solid #fcfbfa;">
              <span style="font-size: 11px; color: #8a7e72; text-transform: uppercase; font-weight: 700;">Habitación</span><br>
              <strong style="font-size: 14px; color: #3d3730;">{{habitacion_nombre}}</strong>
            </td>
            <td style="padding: 10px 0 10px 10px; vertical-align: top; border-top: 1px solid #fcfbfa;">
              <span style="font-size: 11px; color: #8a7e72; text-transform: uppercase; font-weight: 700;">Huéspedes</span><br>
              <strong style="font-size: 14px; color: #3d3730;">{{cantidad_huespedes}} {{huespedes_label}}</strong>
            </td>
          </tr>
          {{comentarios_block}}
        </table>

        <!-- Financial Summary -->
        <h3 style="font-size: 14px; border-bottom: 2px solid #eee8e0; padding-bottom: 8px; margin-top: 30px; margin-bottom: 15px; color: #3d3730; text-transform: uppercase; letter-spacing: 0.5px;">Resumen de la Cotización</h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #fcfbfa; border: 1px solid #eee8e0; border-radius: 6px; padding: 15px; margin-bottom: 30px;">
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #5a524a;">Subtotal por estancia ({{noches}} {{noches_label}})</td>
            <td align="right" style="padding: 6px 0; font-size: 14px; font-weight: bold; color: #3d3730;">\${{subtotal}} MXN</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #5a524a;">Impuestos (16% IVA)</td>
            <td align="right" style="padding: 6px 0; font-size: 14px; font-weight: bold; color: #3d3730;">\${{impuestos}} MXN</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #5a524a;">Método de Pago</td>
            <td align="right" style="padding: 6px 0; font-size: 14px; font-weight: bold; color: #3d3730;">Efectivo (al check-in)</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; font-size: 14px; color: #5a524a;">Estado de Pago</td>
            <td align="right" style="padding: 6px 0; font-size: 14px; font-weight: bold; color: #d97706;">Pendiente</td>
          </tr>
          <tr style="border-top: 1px solid #eee8e0;">
            <td style="padding: 12px 0 0 0; font-size: 15px; font-weight: bold; color: #A0442A;">Total Confirmado</td>
            <td align="right" style="padding: 12px 0 0 0; font-size: 18px; font-weight: bold; color: #A0442A;">\${{total}} MXN</td>
          </tr>
        </table>

        <!-- Contact Support -->
        <p style="font-size: 14px; color: #8a7e72; text-align: center; margin: 30px 0 10px 0; line-height: 1.5;">
          ¿Tienes preguntas o deseas modificar tu reserva?<br>
          Llámanos al teléfono <strong style="color: #3d3730;">418 123 4567</strong> o simplemente responde a este correo.
        </p>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td align="center" style="background-color: #f5ece3; padding: 30px 20px; border-top: 1px solid #eee8e0;">
        <p style="margin: 0; font-size: 12px; color: #8a7e72; line-height: 1.6;">
          <strong>Hotel Casa Dolores</strong><br>
          Calle Principal #10, Centro Histórico<br>
          Dolores Hidalgo, C.N.G., Guanajuato, México
        </p>
        <div style="margin-top: 15px;">
          <span style="font-size: 11px; color: #b5a89b;">&copy; 2026 Hotel Casa Dolores. Todos los derechos reservados.</span>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>
        `;

    let result = template;
    for (const key of Object.keys(data)) {
      result = result.replace(new RegExp(`{{${key}}}`, "g"), data[key] ?? "");
    }
    return result;
  }
}
