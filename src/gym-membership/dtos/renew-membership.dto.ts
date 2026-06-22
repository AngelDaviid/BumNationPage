import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class RenewMembershipDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @IsDateString()
  validFrom!: string;

  @IsDateString()
  validUntil!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
