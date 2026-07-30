import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMembershipDto } from './dtos/create-membership.dto';
import { RenewMembershipDto } from './dtos/renew-membership.dto';
import { UpdateMembershipStatusDto } from './dtos/update-membership-status.dto';
import { calculateMembershipStats } from '../common/utils/membership-stats.util';
import { MembershipStatus, Prisma } from '@prisma/client';
import { addOneMonth } from '../common/utils/date.utils';

@Injectable()
export class GymMembershipService {
  constructor(private readonly prismaService: PrismaService) {}

  async createMembership(
    userId: string,
    createMembershipDto: CreateMembershipDto,
  ) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`Usuario no encontrado`);
    }

    const existingMembership =
      await this.prismaService.gymMembership.findUnique({
        where: { userId },
      });

    if (existingMembership) {
      throw new BadRequestException(`El usuario ya tiene una membresía activa`);
    }

    const { startDate, initialPayment } = createMembershipDto;
    const parsedStartDate = new Date(startDate);
    const validUntil = addOneMonth(parsedStartDate);

    return this.prismaService.$transaction(async (tx) => {
      const membership = await tx.gymMembership.create({
        data: {
          userId,
          startDate: parsedStartDate,
          nextPaymentDate: validUntil,
        },
      });

      await tx.membershipPayment.create({
        data: {
          membershipId: membership.id,
          amount: initialPayment.amount,
          notes: initialPayment.notes,
          validFrom: parsedStartDate,
          validUntil,
        },
      });

      return tx.gymMembership.findUnique({
        where: { id: membership.id },
        include: {
          user: {
            select: {
              firstName: true,
              firstLastName: true,
              email: true,
              phone: true,
            },
          },
          membershipPayments: { orderBy: { paidAt: 'desc' } },
        },
      });
    });
  }

  async renewMembership(
    userId: string,
    renewMembershipDto: RenewMembershipDto,
  ) {
    const membership = await this.prismaService.gymMembership.findUnique({
      where: { id: userId },
    });

    if (!membership) {
      throw new NotFoundException(`Membresía no encontrada para el usuario`);
    }

    if (membership.status === 'CANCELLED') {
      throw new BadRequestException(
        `No se puede renovar una membresía cancelada, crea una nueva`,
      );
    }

    const validFrom = new Date();
    const validUntil = addOneMonth(validFrom);

    return this.prismaService.$transaction(async (tx) => {
      await this.prismaService.membershipPayment.create({
        data: {
          membershipId: membership.id,
          amount: renewMembershipDto.amount,
          notes: renewMembershipDto.notes,
          validFrom,
          validUntil,
        },
      });

      return tx.gymMembership.update({
        where: { userId },
        data: {
          nextPaymentDate: validUntil,
          status: 'ACTIVE',
        },
        include: {
          membershipPayments: { orderBy: { paidAt: 'desc' } },
          user: {
            select: {
              firstName: true,
              firstLastName: true,
              email: true,
              phone: true,
            },
          },
        },
      });
    });
  }

  async updateStatus(
    userId: string,
    updateMembershipDto: UpdateMembershipStatusDto,
  ) {
    const membership = await this.prismaService.gymMembership.findUnique({
      where: { userId },
      include: {
        membershipPayments: { select: { validFrom: true, validUntil: true } },
      },
    });

    if (!membership) {
      throw new NotFoundException(`Membresía no encontrada para el usuario`);
    }

    if (membership.status === updateMembershipDto.status) {
      throw new BadRequestException(
        `La membresía ya está en estado ${updateMembershipDto.status}`,
      );
    }

    const data: Prisma.GymMembershipUpdateInput = {
      status: updateMembershipDto.status,
    };

    if (updateMembershipDto.status === MembershipStatus.EXPIRED) {
      data.expiredAt = membership.expiredAt ?? new Date();
    }

    if (updateMembershipDto.status === MembershipStatus.ACTIVE) {
      data.expiredAt = null;
    }

    return this.prismaService.gymMembership.update({
      where: { userId },
      data,
    });
  }

  async getAllmemberships() {
    const memberships = await this.prismaService.gymMembership.findMany({
      include: {
        user: {
          select: {
            firstName: true,
            firstLastName: true,
            email: true,
            phone: true,
          },
        },
        membershipPayments: { orderBy: { paidAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...m,
      ...calculateMembershipStats(m),
    }));
  }

  async getMembershipByUserId(userId: string) {
    const membership = await this.prismaService.gymMembership.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            firstName: true,
            firstLastName: true,
            email: true,
            phone: true,
          },
        },
        membershipPayments: { orderBy: { paidAt: 'desc' } },
      },
    });

    if (!membership) {
      throw new NotFoundException(`Membresía no encontrada para el usuario`);
    }

    return {
      ...membership,
      ...calculateMembershipStats(membership),
    };
  }

  async getMyMembership(userId: string) {
    const membership = await this.prismaService.gymMembership.findUnique({
      where: { userId },
      include: {
        membershipPayments: { orderBy: { paidAt: 'desc' } },
      },
    });

    if (!membership) {
      throw new NotFoundException(`Membresía no encontrada para el usuario`);
    }

    return {
      ...membership,
      ...calculateMembershipStats(membership),
    };
  }

  async getMyPayments(userId: string) {
    const membership = await this.prismaService.gymMembership.findUnique({
      where: { userId },
    });

    if (!membership) {
      throw new NotFoundException('No tienes una membresía');
    }

    return this.prismaService.membershipPayment.findMany({
      where: { membershipId: membership.id },
      orderBy: { paidAt: 'desc' },
    });
  }
}
