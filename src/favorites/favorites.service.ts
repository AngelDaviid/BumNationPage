import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prismaService: PrismaService) {}

  async getFavorites(userId: string) {
    return this.prismaService.favorite.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addFavorite(userId: string, productId: number) {
    const product = await this.prismaService.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return this.prismaService.favorite.upsert({
      where: { userId_productId: { userId, productId } },
      create: { userId, productId },
      update: {},
      include: { product: true },
    });
  }

  async removeFavorite(userId: string, productId: number) {
    const favorite = await this.prismaService.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    if (!favorite) {
      throw new NotFoundException('El producto no está en favoritos');
    }

    return this.prismaService.favorite.delete({
      where: { userId_productId: { userId, productId } },
      include: { product: true },
    });
  }

  async isFavorite(userId: string, productId: number) {
    const favorite = await this.prismaService.favorite.findUnique({
      where: { userId_productId: { userId, productId } },
    });

    return { isFavorite: !!favorite };
  }
}
