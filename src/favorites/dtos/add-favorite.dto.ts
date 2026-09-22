import { IsInt, IsPositive } from 'class-validator';

export class AddFavoriteDto {
  @IsInt()
  @IsPositive()
  productId!: number;
}
