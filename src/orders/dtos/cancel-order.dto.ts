import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelOrderDto {
  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'La razón de cancelación no puede exceder los 500 caracteres',
  })
  cancelReason?: string;
}
