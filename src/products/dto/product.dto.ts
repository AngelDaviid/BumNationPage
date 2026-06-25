import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  price!: number;

  @Type(() => Number)
  @IsNumber()
  stock!: number;

  @IsString()
  @IsOptional()
  brand?: string;

  @Type(() => Number)
  @IsNumber()
  categoryId!: number;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}
