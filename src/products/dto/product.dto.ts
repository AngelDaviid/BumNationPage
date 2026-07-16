import { Trim, Sanitize, Escape } from 'class-sanitizer';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsInt,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateProductDto {
  @Trim()
  @Sanitize(Escape)
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Trim()
  @Sanitize(Escape)
  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  @IsPositive()
  price!: number;

  @IsInt()
  @IsPositive()
  stock!: number;

  @IsOptional()
  @Trim()
  @Sanitize(Escape)
  @IsString()
  brand?: string;

  @IsInt()
  @IsPositive()
  categoryId!: number;

  @IsBoolean()
  isActive!: boolean;
}
