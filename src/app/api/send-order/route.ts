import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const { clientEmail, clientName, modulesText, materialsText, cuttingListText } = await request.json();

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465');
    const smtpUser = process.env.SMTP_USER || 'matias@vascohogar.com';
    const smtpPass = process.env.SMTP_PASS;

    if (!smtpPass) {
      return NextResponse.json(
        { error: 'El servidor de correo no está configurado. Por favor, añada la variable de entorno SMTP_PASS.' },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    let mailBody = `NIDEL MUEBLES - NUEVO PEDIDO ENVIADO DESDE LA WEB\n`;
    mailBody += `==================================================\n`;
    mailBody += `DATOS DEL CLIENTE REGISTRADO:\n`;
    mailBody += `- Nombre: ${clientName || 'Cliente de Nidel'}\n`;
    mailBody += `- Email de registro: ${clientEmail || 'No especificado'}\n`;
    mailBody += `==================================================\n\n`;
    
    mailBody += `1. DETALLE DE MÓDULOS:\n`;
    mailBody += `----------------------------------------\n`;
    mailBody += `${modulesText}\n\n`;
    
    mailBody += `2. RESUMEN DE MATERIALES Y HERRAJES:\n`;
    mailBody += `----------------------------------------\n`;
    mailBody += `${materialsText}\n\n`;
    
    mailBody += `3. DESPIECE DE CORTES (MEDIDAS):\n`;
    mailBody += `----------------------------------------\n`;
    mailBody += `${cuttingListText}\n\n`;
    
    mailBody += `========================================\n`;
    mailBody += `Este es un mensaje generado automáticamente por el Constructor de Cocinas de Nidel Muebles.`;

    const mailOptions = {
      from: `"Nidel Web" <${smtpUser}>`,
      to: 'matias@vascohogar.com',
      replyTo: clientEmail || smtpUser,
      subject: `Pedido a Fábrica de ${clientName || 'Cliente'} - Nidel Muebles`,
      text: mailBody,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error sending order email:', error);
    return NextResponse.json(
      { error: 'Error al enviar el correo: ' + (error.message || error) },
      { status: 500 }
    );
  }
}
