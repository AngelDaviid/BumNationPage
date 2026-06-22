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

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsOptional()
  @IsString()
  middleName?: string;

  @IsString()
  @IsNotEmpty()
  firstLastName!: string;

  @IsOptional()
  @IsString()
  secondLastName?: string;

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
