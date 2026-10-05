import { OrderStatus } from '@prisma/client';

export interface OrderStatusEmailItem {
  name: string;
  quantity: number;
  price: number;
}

export interface OrderStatusEmailData {
  firstName: string;
  orderId: string;
  orderNumber: number;
  status: OrderStatus;
  total: number;
  items: OrderStatusEmailItem[];
  cancelReason?: string | null;
  frontendUrl: string;
  logoUrl?: string;
}

const BRAND_GREEN = '#78dc28';

const STATUS_COPY: Record<
  OrderStatus,
  { label: string; subject: string; message: string; color: string }
> = {
  PENDING_CONFIRMATION: {
    label: 'Por confirmar',
    subject: 'Recibimos tu pedido',
    message:
      'Recibimos tu pedido y lo estamos revisando. Te avisaremos cuando esté confirmado.',
    color: '#f59e0b',
  },
  CONFIRMED: {
    label: 'Confirmado',
    subject: 'Tu pedido fue confirmado',
    message: 'Confirmamos tu pedido y ya lo estamos preparando.',
    color: '#3b82f6',
  },
  AWAITING_PAYMENT: {
    label: 'Esperando pago',
    subject: 'Tu pedido está esperando el pago',
    message:
      'Tu pedido está listo y solo falta el pago. Cuando lo recibamos seguimos con el envío.',
    color: '#f97316',
  },
  PAID: {
    label: 'Pagado',
    subject: 'Recibimos el pago de tu pedido',
    message: 'Recibimos tu pago. Pronto enviaremos tu pedido.',
    color: '#10b981',
  },
  SHIPPED: {
    label: 'Enviado',
    subject: 'Tu pedido va en camino',
    message: 'Tu pedido salió de la tienda y va en camino.',
    color: '#8b5cf6',
  },
  DELIVERED: {
    label: 'Entregado',
    subject: 'Tu pedido fue entregado',
    message: 'Tu pedido fue entregado. ¡Gracias por comprar en BumNation GYM!',
    color: '#16a34a',
  },
  CANCELLED: {
    label: 'Cancelado',
    subject: 'Tu pedido fue cancelado',
    message: 'Tu pedido fue cancelado.',
    color: '#ef4444',
  },
};

const currency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export function orderStatusEmail(data: OrderStatusEmailData) {
  const copy = STATUS_COPY[data.status];
  const orderUrl = `${data.frontendUrl}/orders/${data.orderId}`;

  const header = data.logoUrl
    ? `<img src="${escapeHtml(data.logoUrl)}" alt="BumNation GYM" height="56" style="display:block;margin:0 auto;height:56px;width:auto;" />`
    : `<div style="font-size:26px;font-weight:900;letter-spacing:2px;color:#111111;">BUMNATION <span style="color:${BRAND_GREEN};">GYM</span></div>`;

  const rows = data.items
    .map(
      (item) => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#27272a;font-size:14px;">${escapeHtml(item.name)} <span style="color:#71717a;">x${item.quantity}</span></td>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0f0;color:#27272a;font-size:14px;text-align:right;white-space:nowrap;">${currency.format(item.price * item.quantity)}</td>
        </tr>`,
    )
    .join('');

  const reason =
    data.status === 'CANCELLED' && data.cancelReason
      ? `<p style="margin:12px 0 0;padding:12px 14px;background:#fef2f2;border-radius:8px;color:#991b1b;font-size:14px;">Motivo: ${escapeHtml(data.cancelReason)}</p>`
      : '';

  const html = `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${copy.subject}</title>
  </head>
  <body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e4e4e7;">
            <tr>
              <td style="padding:28px 24px 20px;text-align:center;border-bottom:4px solid ${BRAND_GREEN};">${header}</td>
            </tr>
            <tr>
              <td style="padding:28px 24px 8px;">
                <p style="margin:0 0 8px;color:#18181b;font-size:18px;font-weight:bold;">Hola ${escapeHtml(data.firstName)},</p>
                <p style="margin:0 0 18px;color:#3f3f46;font-size:15px;line-height:1.5;">${copy.message}</p>
                <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 4px;">
                  <tr>
                    <td style="color:#71717a;font-size:13px;padding-right:10px;">Pedido #${data.orderNumber}</td>
                    <td style="background:${copy.color};color:#ffffff;font-size:12px;font-weight:bold;padding:4px 12px;border-radius:999px;">${copy.label}</td>
                  </tr>
                </table>
                ${reason}
              </td>
            </tr>
            <tr>
              <td style="padding:12px 24px 0;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  ${rows}
                  <tr>
                    <td style="padding:14px 0 0;color:#18181b;font-size:15px;font-weight:bold;">Total</td>
                    <td style="padding:14px 0 0;color:#18181b;font-size:15px;font-weight:bold;text-align:right;">${currency.format(data.total)}</td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:28px 24px;text-align:center;">
                <a href="${orderUrl}" style="display:inline-block;background:${BRAND_GREEN};color:#111111;font-size:15px;font-weight:bold;text-decoration:none;padding:12px 28px;border-radius:10px;">Ver mi pedido</a>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#fafafa;color:#a1a1aa;font-size:12px;text-align:center;">Recibes este correo porque hiciste un pedido en BumNation GYM.</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    `Hola ${data.firstName},`,
    '',
    copy.message,
    '',
    `Pedido #${data.orderNumber}: ${copy.label}`,
    ...(data.status === 'CANCELLED' && data.cancelReason
      ? [`Motivo: ${data.cancelReason}`]
      : []),
    '',
    ...data.items.map(
      (item) =>
        `${item.name} x${item.quantity}: ${currency.format(item.price * item.quantity)}`,
    ),
    `Total: ${currency.format(data.total)}`,
    '',
    `Ver mi pedido: ${orderUrl}`,
    '',
    'BumNation GYM',
  ].join('\n');

  return {
    subject: `${copy.subject} · Pedido #${data.orderNumber}`,
    html,
    text,
  };
}
