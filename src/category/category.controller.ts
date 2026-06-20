import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Public } from '../auth/decorators/public.decorator';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/role.decorator';

@Controller('category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Public()
  @Get()
  getAllCategories() {
    return this.categoryService.getAllCategories();
  }

  @Public()
  @Get(':id')
  getCategoryById(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.getCategoryById(id);
  }

  @Roles(Role.ADMIN)
  @Post()
  createCategory(@Body() categoryDto: CreateCategoryDto) {
    return this.categoryService.createCategory(categoryDto);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  updateCategory(
    @Body() updateCategoryDto: UpdateCategoryDto,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.categoryService.updateCategory(id, updateCategoryDto);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.categoryService.deleteCategory(id);
  }
}
