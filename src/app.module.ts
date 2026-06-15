import { Module } from '@nestjs/common';
import { ProductsModule } from './products/products.module';
import { CategoryModule } from './category/category.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [ProductsModule, CategoryModule, PrismaModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
