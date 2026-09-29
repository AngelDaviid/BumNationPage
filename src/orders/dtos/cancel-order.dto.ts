import { Trim, Sanitize, Escape } from 'class-sanitizer';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOrderDto {
  @Trim()
  @Sanitize(Escape)
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'El motivo no puede superar los 500 caracteres' })
  cancelReason?: string;
}
