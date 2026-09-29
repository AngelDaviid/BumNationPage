import { Trim, Sanitize, Escape } from 'class-sanitizer';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateCategoryDto {
  @Trim()
  @Sanitize(Escape)
  @IsString()
  @IsNotEmpty()
  name!: string;
}
