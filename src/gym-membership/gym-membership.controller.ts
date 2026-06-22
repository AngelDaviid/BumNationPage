import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Patch,
} from '@nestjs/common';
import { GymMembershipService } from './gym-membership.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/role.decorator';
import { Role } from '@prisma/client';
import { CreateMembershipDto } from './dtos/create-membership.dto';
import { RenewMembershipDto } from './dtos/renew-membership.dto';
import { UpdateMembershipStatusDto } from './dtos/update-membership-status.dto';

@Controller('gym-membership')
export class GymMembershipController {
  constructor(private readonly gymMembershipService: GymMembershipService) {}

  @Get('me')
  getMyMembership(@CurrentUser() user) {
    return this.gymMembershipService.getMyMembership(user.id);
  }

  @Get('me/payments')
  getMyPayments(@CurrentUser() user) {
    return this.gymMembershipService.getMyPayments(user.id);
  }

  @Roles(Role.ADMIN)
  @Get()
  getAllMemberships() {
    return this.gymMembershipService.getAllmemberships();
  }

  @Roles(Role.ADMIN)
  @Get(':userId')
  getMembershipByUserId(@CurrentUser() user, @Param('userId') userId: string) {
    return this.gymMembershipService.getMembershipByUserId(userId);
  }

  @Roles(Role.ADMIN)
  @Post(':userId')
  createMembership(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() createMembershipDto: CreateMembershipDto,
  ) {
    return this.gymMembershipService.createMembership(
      userId,
      createMembershipDto,
    );
  }

  @Roles(Role.ADMIN)
  @Post(':userId/renew')
  renewMembership(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() renewMembershipDto: RenewMembershipDto,
  ) {
    return this.gymMembershipService.renewMembership(
      userId,
      renewMembershipDto,
    );
  }

  @Roles(Role.ADMIN)
  @Patch(':userId/status')
  updateStatus(
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() updateMembershipStatusDto: UpdateMembershipStatusDto,
  ) {
    return this.gymMembershipService.updateStatus(
      userId,
      updateMembershipStatusDto,
    );
  }
}
