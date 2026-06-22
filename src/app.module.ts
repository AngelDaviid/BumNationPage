import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { CategoryModule } from './category/category.module';
import { PrismaModule } from './prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { RolesGuard } from './auth/guards/roles/roles.guard';
import { APP_GUARD } from '@nestjs/core/constants';
import { JwtAuthGuard } from './auth/guards/jwt-auth/jwt-auth.guard';
import { CartModule } from './cart/cart.module';
import { OrdersService } from './orders/orders.service';
import { OrdersController } from './orders/orders.controller';
import { OrdersModule } from './orders/orders.module';
import { GymMembershipModule } from './gym-membership/gym-membership.module';

@Module({
  imports: [
    ProductsModule,
    CategoryModule,
    PrismaModule,
    ConfigModule.forRoot({ isGlobal: true }),
    UsersModule,
    AuthModule,
    CartModule,
    OrdersModule,
    GymMembershipModule,
  ],
  controllers: [OrdersController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    OrdersService,
  ],
})
export class AppModule {}
