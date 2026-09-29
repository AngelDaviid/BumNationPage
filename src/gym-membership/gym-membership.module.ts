import { Module } from '@nestjs/common';
import { GymMembershipService } from './gym-membership.service';
import { GymMembershipController } from './gym-membership.controller';
import { MemberShipStatusTask } from './tasks/member-ship.status.task';

@Module({
  providers: [GymMembershipService, MemberShipStatusTask],
  controllers: [GymMembershipController],
})
export class GymMembershipModule {}
