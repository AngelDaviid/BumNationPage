import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MembershipStatus } from '@prisma/client';
import { calculateMembershipStats } from '../../common/utils/membership-stats.util';

@Injectable()
export class MemberShipStatusTask {
  private readonly logger = new Logger(MemberShipStatusTask.name);

  constructor(private readonly prismaService: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'America/Bogota',
  })
  async checkAndUpdateMembershipStatuses() {
    this.logger.log('Iniciando verificacón de estados de membresía...');

    const memberships = await this.prismaService.gymMembership.findMany({
      where: {
        status: { in: [MembershipStatus.ACTIVE, MembershipStatus.EXPIRED] },
      },
    });

    let expiredCount = 0;
    let cancelledCount = 0;

    for (const membership of memberships) {
      const stats = calculateMembershipStats(membership);

      if (stats.isExpired) {
        if (!membership.expiredAt) {
          await this.prismaService.gymMembership.update({
            where: { userId: membership.userId },
            data: {
              status: MembershipStatus.EXPIRED,
              expiredAt: membership.nextPaymentDate,
            },
          });
          expiredCount++;
          continue;
        }

        if (stats.daysSinceExpired >= 90) {
          await this.prismaService.gymMembership.update({
            where: { userId: membership.userId },
            data: {
              status: MembershipStatus.CANCELLED,
            },
          });
          cancelledCount++;
        }
      }
    }

    this.logger.log(
      `Verificación completa: ${expiredCount} marcadas como expiradas, ${cancelledCount} canceladas.`,
    );
  }
}
