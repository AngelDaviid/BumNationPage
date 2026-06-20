import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class UsersService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async getUserByIdentification(identification: string) {
    return await this.prismaService.user.findUnique({
      where: { identification },
    });
  }

  async getAllUsers() {
    return await this.prismaService.user.findMany({
      omit: { password: true },
    });
  }

  async getUserById(id: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      omit: { password: true },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return user;
  }

  async createUser(createUserDto: CreateUserDto) {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    try {
      return await this.prismaService.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException(`El usuario no existe`);
      }
      throw new InternalServerErrorException('Error al crear el usuario');
    }
  }

  async uploadUserImage(id: string, file: Express.Multer.File) {
    await this.getUserById(id);

    const result = await this.cloudinaryService.uploadImage(file);

    return this.prismaService.user.update({
      where: { id },
      data: { imageUrl: result.secure_url },
      omit: { password: true },
    });
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    await this.getUserById(id);

    try {
      return await this.prismaService.user.update({
        where: { id },
        data: updateUserDto,
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2003'
      ) {
        throw new BadRequestException(`El usuario con id ${id} no existe`);
      }
      throw new InternalServerErrorException('Error al actualizar el usuario');
    }
  }

  async deleteUser(id: string) {
    await this.getUserById(id);

    return await this.prismaService.user.delete({
      where: { id },
    });
  }
}
