import {
  Body,
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Public } from './decorators/public.decorator';
import { Throttle } from '@nestjs/throttler';
import { AUTH_COOKIE, authCookieOptions } from './auth-cookie';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async signIn(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { access_token, user } = await this.authService.signIn(
      loginDto.identification,
      loginDto.password,
    );
    response.cookie(AUTH_COOKIE, access_token, authCookieOptions());
    return { user };
  }

  @Public()
  @Throttle({ short: { limit: 5, ttl: 60000 } })
  @HttpCode(HttpStatus.CREATED)
  @Post('register')
  async signUp(
    @Body() createUserDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { access_token, user } = await this.authService.signUp(createUserDto);
    response.cookie(AUTH_COOKIE, access_token, authCookieOptions());
    return { user };
  }

  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post('logout')
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie(AUTH_COOKIE, authCookieOptions());
  }
}
