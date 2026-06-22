import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMembershipDto } from './dtos/create-membership.dto';
import { RenewMembershipDto } from './dtos/renew-membership.dto';
import { UpdateMembershipStatusDto } from './dtos/update-membership-status.dto';

@Injectable()
export class GymMembershipService {
  constructor(private readonly prismaService: PrismaService) {}

  private calculateMembershipStats(membership: {
    startDate: Date;
    nextPaymentDate: Date;
    status: string;
  }) {
    const today = new Date();

    const daysAsMember = Math.floor(
      (today.getTime() - membership.startDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    const daysUntilExpire = Math.floor(
      (membership.nextPaymentDate.getTime() - today.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    return {
      daysAsMember,
      daysUntilExpire: Math.max(0, daysUntilExpire),
      isAboutToExpire: daysUntilExpire <= 7 && daysUntilExpire >= 0,
      isExpired: daysUntilExpire < 0,
    };
  }

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

    const existing = await this.prismaService.gymMembership.findUnique({
      where: { userId },
    });

    if (existing) {
      throw new BadRequestException(`El usuario ya tiene una membresía activa`);
    }

    return this.prismaService.gymMembership.create({
      data: {
        userId,
        startDate: new Date(createMembershipDto.startDate),
        nextPaymentDate: new Date(createMembershipDto.nextPaymentDate),
      },
      include: {
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
  }

  async renewMembership(
    userId: string,
    renewMembershipDto: RenewMembershipDto,
  ) {
    const membership = await this.prismaService.gymMembership.findUnique({
      where: { userId },
    });

    if (!membership) {
      throw new NotFoundException(`Membresía no encontrada para el usuario`);
    }

    if (membership.status === 'CANCELLED') {
      throw new BadRequestException(
        `No se puede renovar una membresía cancelada, crea una nueva`,
      );
    }

    return this.prismaService.$transaction(async (tx) => {
      await tx.membershipPayment.create({
        data: {
          membershipId: membership.id,
          amount: renewMembershipDto.amount,
          notes: renewMembershipDto.notes,
          validFrom: new Date(renewMembershipDto.validFrom),
          validUntil: new Date(renewMembershipDto.validUntil),
        },
      });

      return tx.gymMembership.update({
        where: { userId },
        data: {
          nextPaymentDate: new Date(renewMembershipDto.validUntil),
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
    });

    if (!membership) {
      throw new NotFoundException(`Membresía no encontrada para el usuario`);
    }

    if (membership.status === updateMembershipDto.status) {
      throw new BadRequestException(
        `La membresía ya está en estado ${updateMembershipDto.status}`,
      );
    }

    return this.prismaService.gymMembership.update({
      where: { userId },
      data: { status: updateMembershipDto.status },
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
      ...this.calculateMembershipStats(m),
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
      ...this.calculateMembershipStats(membership),
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
      ...this.calculateMembershipStats(membership),
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
