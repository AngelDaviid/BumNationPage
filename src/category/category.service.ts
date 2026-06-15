import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoryService {
  constructor(private readonly prismaService: PrismaService) {}

  async getAllCategories() {
    return this.prismaService.category.findMany();
  }

  async getCategoryById(id: number) {
    const category = await this.prismaService.category.findUnique({
      where: { id },
    });

    if (!category) {
      throw new NotFoundException(`Categoría con id ${id} no encontrada`);
    }

    return category;
  }

  async createCategory(categoryDto: CreateCategoryDto) {
    try {
      return await this.prismaService.category.create({
        data: categoryDto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `La categoría "${categoryDto.name}" ya existe`,
        );
      }
      throw new InternalServerErrorException('Error al crear la categoría');
    }
  }

  async updateCategory(id: number, updateCategoryDto: UpdateCategoryDto) {
    await this.getCategoryById(id);

    try {
      return await this.prismaService.category.update({
        where: { id },
        data: updateCategoryDto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `La categoría "${updateCategoryDto.name}" ya existe`,
        );
      }
      throw new InternalServerErrorException(
        'Error al actualizar la categoría',
      );
    }
  }

  async deleteCategory(id: number) {
    await this.getCategoryById(id);

    try {
      return await this.prismaService.category.delete({
        where: { id },
      });
    } catch {
      throw new InternalServerErrorException('Error al eliminar la categoría');
    }
  }
}
