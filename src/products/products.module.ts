import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsCompanyController } from './products-company.controller';
import { ProductsCompanyService } from './products-company.service';
import { ProductsCompany } from './entities/products-company.entity';

import { ProductsElementController } from './products-element.controller';
import { ProductsElementService } from './products-element.service';
import { ProductsElement } from './entities/products-element.entity';

import { ProductsFormulaController } from './products-formula.controller';
import { ProductsFormulaService } from './products-formula.service';
import { ProductsFormula } from './entities/products-formula.entity';
import { ProductsFormulaElement } from './entities/products-formula-element.entity';

import { ProductsProductController } from './products-product.controller';
import { ProductsProductService } from './products-product.service';
import { ProductsProduct } from './entities/products-product.entity';
import { ProductsProductFormula } from './entities/products-product-formula.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([ProductsCompany, ProductsElement, ProductsFormula, ProductsFormulaElement, ProductsProduct, ProductsProductFormula])
  ],
  controllers: [ProductsCompanyController, ProductsElementController, ProductsFormulaController, ProductsProductController],
  providers: [ProductsCompanyService, ProductsElementService, ProductsFormulaService, ProductsProductService],
})
export class SiproadProductsModule {}
