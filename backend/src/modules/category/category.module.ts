import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import {CategoryResolver} from "@/src/modules/category/category.resolver";
import {CategoryReferenceResolver} from "@/src/modules/category/category-reference.resolver";

@Module({
  providers: [CategoryService, CategoryResolver, CategoryReferenceResolver],
})
export class CategoryModule {}
