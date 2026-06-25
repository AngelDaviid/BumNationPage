import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginate } from '../common/helpers/pagination.helper';

@Injectable()
export class OrdersService {
  constructor(private readonly prismaService: PrismaService) {}

  async checkout(userId: string) {
    const cart = await this.prismaService.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new NotFoundException('Tu carrito está vacío');
    }

    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(
          `No hay suficiente stock de "${item.product.name}". Disponible: ${item.product.stock}`,
        );
      }
    }

    const total = cart.items.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0,
    );

    const order = await this.prismaService.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          total,
          status: 'PENDING_CONFIRMATION',
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              priceAtTime: item.product.price,
            })),
          },
        },
        include: { items: { include: { product: true } } },
      });

      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

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
      this.prismaService.order.count(),
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

    return this.prismaService.order.update({
      where: { id: orderId },
      data: { status },
    });
  }

  async cancelMyOrder(userId: string, orderId: string, reason?: string) {
    return this.prismaService.$transaction(async (tx) => {
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
  }

  async cancelOrderAsAdmin(orderId: string, reason?: string) {
    return this.prismaService.$transaction(async (tx) => {
      const result = await tx.order.updateMany({
        where: {
          id: orderId,
          status: { not: 'CANCELLED' },
        },
        data: { status: 'CANCELLED', cancelReason: reason },
      });

      if (result.count === 0) {
        throw new NotFoundException(
          'Orden no encontrada o ya estaba cancelada',
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
  }
}
