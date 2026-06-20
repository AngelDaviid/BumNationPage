import {
  Body,
  Controller,
  Delete,
  FileTypeValidator,
  Get,
  MaxFileSizeValidator,
  Param,
  ParseFilePipe,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesGuard } from '../auth/guards/roles/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth/jwt-auth.guard';
import { Roles } from '../auth/decorators/role.decorator';
import { Role } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  @Roles(Role.ADMIN)
  @Get()
  async getAllUsers() {
    return await this.userService.getAllUsers();
  }

  @Roles(Role.ADMIN)
  @Get(':id')
  async getUserById(@Param('id', ParseUUIDPipe) id: string) {
    return await this.userService.getUserById(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  async createUser(@Body() createUserDto: CreateUserDto) {
    return await this.userService.createUser(createUserDto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadUserImage(
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.userService.uploadUserImage(id, file);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  async updateUser(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return await this.userService.updateUser(id, updateUserDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  async deleteUser(@Param('id', ParseUUIDPipe) id: string) {
    await this.userService.deleteUser(id);

    return { message: 'Usuario eliminado exitosamente' };
  }

  @Get('me')
  getMyProfile(@CurrentUser() user) {
    return this.userService.getUserById(user.id);
  }

  @Patch('me')
  updateMyProfile(@CurrentUser() user, @Body() dto: UpdateUserDto) {
    return this.userService.updateUser(user.id, dto);
  }

  @Patch('me/image')
  @UseInterceptors(FileInterceptor('file'))
  uploadMyImage(
    @CurrentUser() user,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|webp)$/ }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.userService.uploadUserImage(user.id, file);
  }
}
