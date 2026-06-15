import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateProductDto } from './dto/product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllProducts() {
    return this.prismaService.product.findMany();
  }

  async getProductById(id: number) {
    const product = await this.prismaService.product.findUnique({
      where: {
        id,
      },
    });
    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async createProduct(product: CreateProductDto) {
    try {
      return await this.prismaService.product.create({
        data: product,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          `La categoría con id ${product.categoryId} no existe`,
        );
      }
      throw new InternalServerErrorException('Error al crear el producto');
    }
  }

  async updateProduct(id: number, product: UpdateProductDto) {
    await this.getProductById(id);

    try {
      return await this.prismaService.product.update({
        where: { id },
        data: product,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(
          `La categoría con id ${product.categoryId} no existe`,
        );
      }
      throw new InternalServerErrorException('Error al actualizar el producto');
    }
  }

  async deleteProduct(id: number) {
    await this.getProductById(id);

    return this.prismaService.product.delete({
      where: { id },
    });
  }
}
