import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginate } from '../common/helpers/pagination.helper';
import { MailService } from '../mail/mail.service';

const ADMIN_CANCELLABLE_STATUSES: OrderStatus[] = [
  'PENDING_CONFIRMATION',
  'CONFIRMED',
  'AWAITING_PAYMENT',
  'PAID',
];

@Injectable()
export class OrdersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly mailService: MailService,
  ) {}

  async checkout(userId: string) {
    const cart = await this.prismaService.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new NotFoundException('Tu carrito está vacío');
    }

    const inactiveItems = cart.items.filter((item) => !item.product.isActive);
    const validItems = cart.items.filter((item) => item.product.isActive);

    if (inactiveItems.length > 0) {
      await this.prismaService.cartItem.deleteMany({
        where: {
          id: { in: inactiveItems.map((item) => item.id) },
        },
      });

      const names = inactiveItems.map((item) => item.product.name).join(', ');

      throw new BadRequestException(
        `Los siguientes productos ya no están disponibles y fueron eliminados de tu carrito: ${names}. Por favor revisa tu carrito e intenta de nuevo.`,
      );
    }

    if (validItems.length === 0) {
      throw new NotFoundException('Tu carrito está vacío');
    }

    for (const item of validItems) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `No hay suficiente stock de "${item.product.name}". Disponible: ${item.product.stock}`,
        );
      }
    }

    const total = validItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    const order = await this.prismaService.$transaction(async (tx) => {
      const removed = await tx.cartItem.deleteMany({
        where: { id: { in: validItems.map((item) => item.id) } },
      });

      if (removed.count !== validItems.length) {
        throw new BadRequestException(
          'Tu carrito cambió mientras se procesaba el pedido, revisa e intenta de nuevo',
        );
      }

      for (const item of validItems) {
        const updated = await tx.product.updateMany({
          where: { id: item.productId, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });

        if (updated.count === 0) {
          throw new BadRequestException(
            `No hay suficiente stock de "${item.product.name}"`,
          );
        }
      }

      return tx.order.create({
        data: {
          userId,
          total,
          status: 'PENDING_CONFIRMATION',
          items: {
            create: validItems.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtTime: item.product.price,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });
    });

    void this.notifyStatusChange(order.id);

    return order;
  }

  async getMyOrders(userId: string, paginationDto: PaginationDto) {
    const { limit = 10, page = 1 } = paginationDto;
    const skip = (page - 1) * limit;

    const [orders, total] = await this.prismaService.$transaction([
      this.prismaService.order.findMany({
        where: { userId },
        skip,
        take: limit,
        include: { items: { include: { product: true } } },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.order.count({ where: { userId } }),
    ]);
    return paginate(orders, total, page, limit);
  }

  async getOrderById(userId: string, orderId: string, isAdmin: boolean) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      throw new NotFoundException('Order no encontrada');
    }

    if (!isAdmin && order.userId !== userId) {
      throw new BadRequestException('No tienes permiso para ver esta orden');
    }

    return order;
  }

  async getAllOrders(paginationDto: PaginationDto) {
    const { limit = 10, page = 1 } = paginationDto;
    const skip = (page - 1) * limit;

    const [orders, total] = await this.prismaService.$transaction([
      this.prismaService.order.findMany({
        skip,
        take: limit,
        include: {
          items: { include: { product: true } },
          user: {
            select: {
              id: true,
              firstName: true,
              firstLastName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.order.count(),
    ]);
    return paginate(orders, total, page, limit);
  }

  async getOrderByNumber(orderNumber: number) {
    const order = await this.prismaService.order.findUnique({
      where: { orderNumber },
      include: {
        items: { include: { product: true } },
        user: {
          select: {
            id: true,
            firstName: true,
            firstLastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order no encontrada');
    }

    return order;
  }

  async updateStatus(orderId: string, status: OrderStatus) {
    const order = await this.prismaService.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order no encontrada');
    }

    if (status === 'CANCELLED') {
      throw new BadRequestException(
        'Para cancelar una orden usa la opción de cancelar',
      );
    }

    if (order.status === 'CANCELLED') {
      throw new BadRequestException(
        'Una orden cancelada no puede cambiar de estado',
      );
    }

    const updated = await this.prismaService.order.update({
      where: { id: orderId },
      data: { status },
    });

    if (order.status !== status) {
      void this.notifyStatusChange(orderId);
    }

    return updated;
  }

  async cancelMyOrder(userId: string, orderId: string, reason?: string) {
    const cancelled = await this.prismaService.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: {
          id: orderId,
          userId,
          status: { in: ['PENDING_CONFIRMATION', 'CONFIRMED'] },
        },
        data: { status: 'CANCELLED', cancelReason: reason },
      });

      if (result.count === 0) {
        throw new BadRequestException(
          'Esta orden no existe, no es tuya, o ya no se puede cancelar',
        );
      }

      const items = await tx.orderItem.findMany({
        where: { orderId },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return tx.order.findUnique({ where: { id: orderId } });
    });

    void this.notifyStatusChange(orderId);

    return cancelled;
  }

  async cancelOrderAsAdmin(orderId: string, reason?: string) {
    const cancelled = await this.prismaService.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: {
          id: orderId,
          status: { in: ADMIN_CANCELLABLE_STATUSES },
        },
        data: { status: 'CANCELLED', cancelReason: reason },
      });

      if (result.count === 0) {
        const order = await tx.order.findUnique({ where: { id: orderId } });

        if (!order) {
          throw new NotFoundException('Orden no encontrada');
        }

        throw new BadRequestException(
          order.status === 'CANCELLED'
            ? 'La orden ya estaba cancelada'
            : 'La orden ya fue enviada o entregada y no se puede cancelar',
        );
      }

      const items = await tx.orderItem.findMany({
        where: { orderId },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return tx.order.findUnique({ where: { id: orderId } });
    });

    void this.notifyStatusChange(orderId);

    return cancelled;
  }

  private async notifyStatusChange(orderId: string) {
    const order = await this.prismaService.order
      .findUnique({
        where: { id: orderId },
        include: {
          user: { select: { email: true, firstName: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      })
      .catch(() => null);

    if (!order) return;

    this.mailService.sendOrderStatus(order.user.email, {
      firstName: order.user.firstName,
      orderId: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total),
      cancelReason: order.cancelReason,
      items: order.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        price: Number(item.priceAtTime),
      })),
    });
  }
}
