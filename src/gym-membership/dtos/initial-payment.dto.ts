import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';
import { Escape, Sanitize, Trim } from 'class-sanitizer';

export class InitialPaymentDto {
  @IsNumber()
  @IsPositive()
  amount!: number;

  @Trim()
  @Sanitize(Escape)
  @IsOptional()
  @IsString()
  notes?: string;
}
