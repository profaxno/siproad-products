import { Controller, Get, Post, Body, Patch, Param, Delete, Logger, HttpCode, HttpStatus, Query, ParseUUIDPipe, ParseArrayPipe } from '@nestjs/common';

import { PaginationDto } from 'src/common/dto/pagination.dto'; 
import { SearchDto } from 'src/common/dto/search.dto';

import { ProductsProductDto } from './dto/products-product.dto';
import { SiproadResponseDto } from './dto/products-response-dto';
import { ProductsProductService } from './products-product.service';


@Controller('siproad-products')
export class ProductsProductController {

  private readonly logger = new Logger(ProductsProductController.name);

  constructor(
    private readonly productsProductService: ProductsProductService
  ) {}

  // @Post('/products/create')
  // @HttpCode(HttpStatus.OK)
  // createProduct(@Body() dto: ProductsProductDto): Promise<SiproadResponseDto> {
  //   this.logger.log(`>>> createProduct: dto=${JSON.stringify(dto)}`);
  //   const start = performance.now();

  //   return this.productsProductService.createProduct(dto)
  //   .then( (response: SiproadResponseDto) => {
  //     const end = performance.now();
  //     this.logger.log(`<<< createProduct: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
  //     return response;
  //   })
  //   .catch( (error: Error) => {
  //     this.logger.error(error.stack);
  //     return new SiproadResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
  //   })
  // }

  @Patch('/products/update') // TODO: Posiblemente sea mas elegante que el companyId venga como un param en la url, una pregunta interesante si cambio el companyId haciend un update que pasa?
  @HttpCode(HttpStatus.OK)
  updateProduct(@Body() dto: ProductsProductDto): Promise<SiproadResponseDto> {
    this.logger.log(`>>> updateProduct: dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    return this.productsProductService.updateProduct(dto)
    .then( (response: SiproadResponseDto) => {
      const end = performance.now();
      this.logger.log(`<<< updateProduct: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      this.logger.error(error.stack);
      return new SiproadResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })
  }

  @Get('/products/:companyId')
  findProducts(@Param('companyId', ParseUUIDPipe) companyId: string, @Query() paginationDto: PaginationDto, @Body() searchDto: SearchDto): Promise<SiproadResponseDto> {
    this.logger.log(`>>> findProducts: companyId=${companyId}, paginationDto=${JSON.stringify(paginationDto)}, searchDto=${JSON.stringify(searchDto)}`);
    const start = performance.now();
    
    return this.productsProductService.findProducts(companyId, paginationDto, searchDto)
    .then( (response: SiproadResponseDto) => {
      const end = performance.now();
      this.logger.log(`<<< findProducts: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      this.logger.error(error.stack);
      return new SiproadResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })
  }

  @Get('/products/:companyId/:value')
  findOneProductByValue(@Param('companyId', ParseUUIDPipe) companyId: string, @Param('value') value: string): Promise<SiproadResponseDto> {
    this.logger.log(`>>> findOneProductByValue: companyId=${companyId}, value=${value}`);
    const start = performance.now();

    return this.productsProductService.findOneProductByValue(companyId, value)
    .then( (response: SiproadResponseDto) => {
      const end = performance.now();
      this.logger.log(`<<< findOneProductByValue: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      this.logger.error(error.stack);
      return new SiproadResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })

  }

  @Delete('products/:id')
  removeProduct(@Param('id', ParseUUIDPipe) id: string): Promise<SiproadResponseDto> {
    this.logger.log(`>>> removeProduct: id=${id}`);
    const start = performance.now();

    return this.productsProductService.removeProduct(id)
    .then( (response: SiproadResponseDto) => {
      const end = performance.now();
      this.logger.log(`<<< removeProduct: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      this.logger.error(error.stack);
      return new SiproadResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })
  }
  
}
