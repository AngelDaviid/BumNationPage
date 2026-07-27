import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UpdateUserDto } from './dto/update-user.dto';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { paginate } from '../common/helpers/pagination.helper';
import { calculateMembershipStats } from '../common/utils/membership-stats.util';
import { Prisma } from '@prisma/client';

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

  async getAllUsers(paginationDto: PaginationDto) {
    const { limit = 10, page = 1, search } = paginationDto;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      ...(search && {
        OR: [{ identification: { contains: search, mode: 'insensitive' } }],
      }),
    };

    const [users, total] = await this.prismaService.$transaction([
      this.prismaService.user.findMany({
        where,
        omit: { password: true },
        skip,
        take: limit,
        include: { gymMembership: true },
      }),
      this.prismaService.user.count(),
    ]);

    const userWithStats = users.map((user) => {
      if (!user.gymMembership) {
        return { ...user, membershipStats: null };
      }

      return {
        ...user,
        membershipStats: calculateMembershipStats(user.gymMembership),
      };
    });

    return paginate(userWithStats, total, page, limit);
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
        omit: { password: true },
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
