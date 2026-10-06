import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../users/dto/create-user.dto';

const DUMMY_HASH =
  '$2b$10$CoiWDovz3aaHgmZdTe5v1.z3U5MAZKBeRzzHGLfUYLrY3BTf.tWre';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(identification: string, pass: string) {
    const user =
      await this.usersService.getUserByIdentification(identification);

    const isPasswordValid = await bcrypt.compare(
      pass,
      user?.password ?? DUMMY_HASH,
    );

    if (!user || !isPasswordValid) {
      throw new UnauthorizedException('Credenciales Incorrectas');
    }

    const payload = { sub: user.id, identification: user.identification };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...safeUser } = user;

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: safeUser,
    };
  }

  async signUp(createUserDto: CreateUserDto) {
    const user = await this.usersService.createUser(createUserDto);

    const payload = { sub: user.id, identification: user.identification };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user,
    };
  }
}
