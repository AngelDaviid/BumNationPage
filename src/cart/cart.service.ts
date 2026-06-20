import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartService {
  constructor(private readonly prismaService: PrismaService) {}

  async getOrCreateCart(userId: string) {
    let cart = await this.prismaService.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart) {
      cart = await this.prismaService.cart.create({
        data: { userId },
        include: { items: { include: { product: true } } },
      });
    }

    return cart;
  }

  async getCart(userId: string) {
    return await this.getOrCreateCart(userId);
  }

  async addItem(userId: string, productId: number, quantity: number) {
    const product = await this.prismaService.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    if (product.stock < quantity) {
      throw new BadRequestException(
        `Solo hay ${product.stock} unidades disponibles de "${product.name}"`,
      );
    }

    const cart = await this.getOrCreateCart(userId);

    return this.prismaService.cartItem.upsert({
      where: { cartId_productId: { cartId: cart.id, productId } },
      create: { cartId: cart.id, productId, quantity },
      update: { quantity: { increment: quantity } },
      include: { product: true },
    });
  }

  async updateItemQuantity(userId: string, itemId: string, quantity: number) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prismaService.cartItem.findUnique({
      where: { id: itemId },
      include: { product: true },
    });

    if (!item || item.cartId !== cart.id) {
      throw new NotFoundException('Item no encontrado en el carrito');
    }

    if (item.product.stock < quantity) {
      throw new BadRequestException(
        `Solo hay ${item.product.stock} unidades disponibles de "${item.product.name}"`,
      );
    }

    return this.prismaService.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: true },
    });
  }

  async removeItem(userId: string, itemId: string) {
    const cart = await this.getOrCreateCart(userId);
    const item = await this.prismaService.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.cartId !== cart.id) {
      throw new NotFoundException('Item no encontrado en el carrito');
    }

    return this.prismaService.cartItem.delete({
      where: { id: itemId },
    });
  }

  async clearCart(userId: string) {
    const cart = await this.getOrCreateCart(userId);

    return this.prismaService.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }
}
