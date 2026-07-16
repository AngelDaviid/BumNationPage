import { Trim, Sanitize, Escape } from 'class-sanitizer';
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

  @Trim()
  @Sanitize(Escape)
  @IsOptional()
  @IsString()
  notes?: string;
}
