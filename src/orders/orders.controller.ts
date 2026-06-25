import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/role.decorator';
import { UpdateOrderStatusDto } from './dtos/update-order-status.dto';
import { CancelOrderDto } from './dtos/cancel-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  async checkout(@CurrentUser() user) {
    return this.ordersService.checkout(user.id);
  }

  @Get('me')
  async getMyOrders(
    @CurrentUser() user,
    @Query() paginationDto: PaginationDto,
  ) {
    return this.ordersService.getMyOrders(user.id, paginationDto);
  }

  @Get(':id')
  getOrderById(@CurrentUser() user, @Param('id', ParseUUIDPipe) id: string) {
    return this.ordersService.getOrderById(
      user.id,
      id,
      user.role === Role.ADMIN,
    );
  }

  @Roles(Role.ADMIN)
  @Get()
  getAllOrders(@Query() paginationDto: PaginationDto) {
    return this.ordersService.getAllOrders(paginationDto);
  }

  @Roles(Role.ADMIN)
  @Get('search/:orderNumber')
  getOrderByNumber(@Param('orderNumber', ParseIntPipe) orderNumber: number) {
    return this.ordersService.getOrderByNumber(orderNumber);
  }

  @Roles(Role.ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, updateStatusDto.status);
  }

  @Patch(':id/cancel')
  cancelMyOrder(
    @CurrentUser() user,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cancelOrderDto: CancelOrderDto,
  ) {
    return this.ordersService.cancelMyOrder(
      user.id,
      id,
      cancelOrderDto.cancelReason,
    );
  }

  @Roles(Role.ADMIN)
  @Patch(':id/admin-cancel')
  cancelOrderAsAdmin(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cancelOrderDto: CancelOrderDto,
  ) {
    return this.ordersService.cancelOrderAsAdmin(
      id,
      cancelOrderDto.cancelReason,
    );
  }
}
