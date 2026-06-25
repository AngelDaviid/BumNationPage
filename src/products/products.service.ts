import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import 'multer';
import { Prisma } from '@prisma/client';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginate } from '../common/helpers/pagination.helper';

@Injectable()
export class ProductsService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getAllProducts(paginationDto: PaginationDto) {
    const { limit = 10, page = 1 } = paginationDto;
    const skip = (page - 1) * limit;

    const [products, total] = await this.prismaService.$transaction([
      this.prismaService.product.findMany({
        skip,
        take: limit,
        include: { category: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prismaService.product.count(),
    ]);

    return paginate(products, total, page, limit);
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

  async uploadProductImage(id: number, file: Express.Multer.File) {
    await this.getProductById(id);

    const result = await this.cloudinaryService.uploadImage(file);

    return this.prismaService.product.update({
      where: { id },
      data: { imageUrl: result.secure_url },
    });
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
