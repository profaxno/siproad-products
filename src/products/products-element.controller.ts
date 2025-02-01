import { Controller, Get, Post, Body, Patch, Param, Delete, Logger, HttpCode, HttpStatus, Query, ParseUUIDPipe, ParseArrayPipe } from '@nestjs/common';

import { PaginationDto } from 'src/common/dto/pagination.dto'; 
import { SearchDto } from 'src/common/dto/search.dto';

import { ProductsElementDto } from './dto/products-element.dto';
import { SiproadResponseDto } from './dto/products-response-dto';
import { ProductsElementService } from './products-element.service';


@Controller('siproad-products')
export class ProductsElementController {

  private readonly logger = new Logger(ProductsElementController.name);

  constructor(
    private readonly productsElementService: ProductsElementService
  ) {}

  // @Post('/elements/create')
  // @HttpCode(HttpStatus.OK)
  // createElement(@Body() dto: ProductsElementDto): Promise<SiproadResponseDto> {
  //   this.logger.log(`>>> createElement: dto=${JSON.stringify(dto)}`);
  //   const start = performance.now();

  //   return this.productsElementService.createElement(dto)
  //   .then( (response: SiproadResponseDto) => {
  //     const end = performance.now();
  //     this.logger.log(`<<< createElement: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
  //     return response;
  //   })
  //   .catch( (error: Error) => {
  //     this.logger.error(error.stack);
  //     return new SiproadResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
  //   })
  // }

  @Patch('/elements/update') // TODO: Posiblemente sea mas elegante que el companyId venga como un param en la url, una pregunta interesante si cambio el companyId haciend un update que pasa?
  @HttpCode(HttpStatus.OK)
  updateElement(@Body() dto: ProductsElementDto): Promise<SiproadResponseDto> {
    this.logger.log(`>>> updateElement: dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    return this.productsElementService.updateElement(dto)
    .then( (response: SiproadResponseDto) => {
      const end = performance.now();
      this.logger.log(`<<< updateElement: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      this.logger.error(error.stack);
      return new SiproadResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })
  }

  @Get('/elements/:companyId')
  findElements(@Param('companyId', ParseUUIDPipe) companyId: string, @Query() paginationDto: PaginationDto, @Body() searchDto: SearchDto): Promise<SiproadResponseDto> {
    this.logger.log(`>>> findElements: companyId=${companyId}, paginationDto=${JSON.stringify(paginationDto)}, searchDto=${JSON.stringify(searchDto)}`);
    const start = performance.now();
    
    return this.productsElementService.findElements(companyId, paginationDto, searchDto)
    .then( (response: SiproadResponseDto) => {
      const end = performance.now();
      this.logger.log(`<<< findElements: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      this.logger.error(error.stack);
      return new SiproadResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })
  }

  @Get('/elements/:companyId/:value')
  findOneElementByValue(@Param('companyId', ParseUUIDPipe) companyId: string, @Param('value') value: string): Promise<SiproadResponseDto> {
    this.logger.log(`>>> findOneElementByValue: companyId=${companyId}, value=${value}`);
    const start = performance.now();

    return this.productsElementService.findOneElementByValue(companyId, value)
    .then( (response: SiproadResponseDto) => {
      const end = performance.now();
      this.logger.log(`<<< findOneElementByValue: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      this.logger.error(error.stack);
      return new SiproadResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })

  }

  @Delete('elements/:id')
  removeElement(@Param('id', ParseUUIDPipe) id: string): Promise<SiproadResponseDto> {
    this.logger.log(`>>> removeElement: id=${id}`);
    const start = performance.now();

    return this.productsElementService.removeElement(id)
    .then( (response: SiproadResponseDto) => {
      const end = performance.now();
      this.logger.log(`<<< removeElement: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      this.logger.error(error.stack);
      return new SiproadResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })
  }
  
}
