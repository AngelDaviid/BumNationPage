import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport, Transporter } from 'nodemailer';
import {
  OrderStatusEmailData,
  orderStatusEmail,
} from './templates/order-status.template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    const user = this.config.get<string>('MAIL_USER');
    const pass = this.config.get<string>('MAIL_APP_PASSWORD');

    this.from = `${this.config.get<string>('MAIL_FROM_NAME')} <${user}>`;
    this.transporter =
      user && pass
        ? createTransport({
            host: this.config.get<string>('MAIL_HOST'),
            port: this.config.get<number>('MAIL_PORT'),
            secure: this.config.get<number>('MAIL_PORT') === 465,
            auth: { user, pass },
          })
        : null;

    if (!this.transporter) {
      this.logger.warn(
        'MAIL_USER o MAIL_APP_PASSWORD no están configurados, no se enviarán correos',
      );
    }
  }

  sendOrderStatus(
    to: string,
    data: Omit<OrderStatusEmailData, 'frontendUrl' | 'logoUrl'>,
  ) {
    const { subject, html } = orderStatusEmail({
      ...data,
      frontendUrl: this.config.get<string>('FRONTEND_URL')!,
      logoUrl: this.config.get<string>('MAIL_LOGO_URL'),
    });

    this.send(to, subject, html);
  }

  private send(to: string, subject: string, html: string) {
    if (!this.transporter) return;

    this.transporter
      .sendMail({ from: this.from, to, subject, html })
      .catch((error: Error) =>
        this.logger.error(
          `No se pudo enviar el correo a ${to}: ${error.message}`,
        ),
      );
  }
}
