import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsPositive, Max, Min } from 'class-validator';

export class PaginationDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  @Max(100, { message: 'El límite máximo es 100 registros por página' })
  @Type(() => Number)
  limit?: number = 10;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'La página minima es 1' })
  @Type(() => Number)
  page?: number = 1;
}
