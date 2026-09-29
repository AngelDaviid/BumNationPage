import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(identification: string, pass: string) {
    const user =
      await this.usersService.getUserByIdentification(identification);

    if (!user) {
      throw new UnauthorizedException('Credenciales Incorrectas');
    }

    const isPasswordValid = await bcrypt.compare(pass, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales Incorrectas');
    }

    return this.buildAuthResponse(await this.usersService.getUserById(user.id));
  }

  async signUp(createUserDto: CreateUserDto) {
    const user = await this.usersService.createUser(createUserDto);

    return this.buildAuthResponse(user);
  }

  private async buildAuthResponse(user: Omit<User, 'password'>) {
    const payload = { sub: user.id, identification: user.identification };
    const { password, ...safeUser } = user;

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: safeUser,
    };
  }
}
