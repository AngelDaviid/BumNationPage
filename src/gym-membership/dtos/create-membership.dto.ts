import { IsDateString, IsNotEmpty, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { InitialPaymentDto } from './initial-payment.dto';

export class CreateMembershipDto {
  @IsDateString()
  startDate!: string;

  @IsNotEmpty()
  @IsObject()
  @Type(() => InitialPaymentDto)
  initialPayment!: InitialPaymentDto;
}
