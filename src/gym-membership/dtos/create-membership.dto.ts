import {
  IsDateString,
  IsNotEmpty,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InitialPaymentDto } from './initial-payment.dto';

export class CreateMembershipDto {
  @IsDateString()
  startDate!: string;

  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => InitialPaymentDto)
  initialPayment!: InitialPaymentDto;
}
