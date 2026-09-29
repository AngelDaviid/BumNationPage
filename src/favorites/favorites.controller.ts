import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AddFavoriteDto } from './dtos/add-favorite.dto';

@Controller('favorites')
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  getFavorites(@CurrentUser() user: AuthUser) {
    return this.favoritesService.getFavorites(user.id);
  }

  @Get(':productId/check')
  checkFavorite(
    @CurrentUser() user: AuthUser,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.favoritesService.isFavorite(user.id, productId);
  }

  @Post()
  addFavorite(
    @CurrentUser() user: AuthUser,
    @Body() addFavoriteDto: AddFavoriteDto,
  ) {
    return this.favoritesService.addFavorite(user.id, addFavoriteDto.productId);
  }

  @Delete(':productId')
  removeFavorite(
    @CurrentUser() user: AuthUser,
    @Param('productId', ParseIntPipe) productId: number,
  ) {
    return this.favoritesService.removeFavorite(user.id, productId);
  }
}
