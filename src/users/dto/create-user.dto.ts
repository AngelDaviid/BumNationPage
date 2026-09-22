import { Trim, Sanitize, Escape } from 'class-sanitizer';
import {
  IsString,
  IsNotEmpty,
  IsEmail,
  MinLength,
  IsOptional,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'La identificación solo debe contener números' })
  identification!: string;

  @Trim()
  @Sanitize(Escape)
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @Trim()
  @Sanitize(Escape)
  @IsOptional()
  @IsString()
  middleName?: string;

  @Trim()
  @Sanitize(Escape)
  @IsString()
  @IsNotEmpty()
  firstLastName!: string;

  @Trim()
  @Sanitize(Escape)
  @IsOptional()
  @IsString()
  secondLastName?: string;

  @Trim()
  @IsEmail({}, { message: 'El email no tiene un formato válido' })
  email!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{7,15}$/, {
    message: 'El teléfono debe contener solo números (7-15 dígitos)',
  })
  phone!: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password!: string;
}
