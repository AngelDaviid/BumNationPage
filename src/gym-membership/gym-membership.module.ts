import { Module } from '@nestjs/common';
import { GymMembershipService } from './gym-membership.service';
import { GymMembershipController } from './gym-membership.controller';

@Module({
  providers: [GymMembershipService],
  controllers: [GymMembershipController],
})
export class GymMembershipModule {}
