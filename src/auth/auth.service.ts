import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(
    identification: string,
    pass: string,
  ): Promise<{ access_token: string }> {
    const user =
      await this.usersService.getUserByIdentification(identification);

    if (!user) {
      throw new UnauthorizedException('Credenciales Incorrectas');
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales Incorrectas');
    }

    const payload = { sub: user.id, identification: user.identification };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async signUp(createUserDto: CreateUserDto) {
    const user = await this.usersService.createUser(createUserDto);

    const payload = { sub: user.id, identification: user.identification };

    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
