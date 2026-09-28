import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AddToCartDto } from './dtos/add-to-cart.dto';
import { UpdateCartItemDto } from './dtos/update-cart-item.dto';

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser() user: AuthUser) {
    return this.cartService.getCart(user.id);
  }

  @Post('items')
  addItem(@CurrentUser() user: AuthUser, @Body() addItemDto: AddToCartDto) {
    return this.cartService.addItem(
      user.id,
      addItemDto.productId,
      addItemDto.quantity,
    );
  }

  @Patch('items/:id')
  updateItem(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) itemId: string,
    @Body() updateItemDto: UpdateCartItemDto,
  ) {
    return this.cartService.updateItemQuantity(
      user.id,
      itemId,
      updateItemDto.quantity,
    );
  }

  @Delete('items/:id')
  removeItem(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) itemId: string,
  ) {
    return this.cartService.removeItem(user.id, itemId);
  }

  @Delete()
  clearCart(@CurrentUser() user: AuthUser) {
    return this.cartService.clearCart(user.id);
  }
}
