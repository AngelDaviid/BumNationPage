import { IsDateString } from 'class-validator';

export class CreateMembershipDto {
  @IsDateString()
  startDate!: string;

  @IsDateString()
  nextPaymentDate!: string;
}
