import { Controller, Get, Post, Body, Patch, Param, Delete, Logger, HttpCode, HttpStatus, Query, ParseUUIDPipe, ParseArrayPipe, NotFoundException } from '@nestjs/common';

import { PaginationDto } from 'src/common/dto/pagination.dto'; 
import { SearchDto } from 'src/common/dto/search.dto';

import { ElementDto } from './dto/element.dto';
import { ProductsResponseDto } from './dto/products-response-dto';
import { ElementService } from './element.service';
import { AlreadyExistException, IsBeingUsedException } from './exceptions/products.exception';


@Controller('siproad-products')
export class ElementController {

  private readonly logger = new Logger(ElementController.name);

  constructor(
    private readonly elementService: ElementService
  ) {}

  @Patch('/elements/update')
  @HttpCode(HttpStatus.OK)
  updateElement(@Body() dto: ElementDto): Promise<ProductsResponseDto> {
    this.logger.log(`>>> updateElement: dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    return this.elementService.updateElement(dto)
    .then( (dto: ElementDto) => {
      const response = new ProductsResponseDto(HttpStatus.OK, 'created/updated', [dto]);
      const end = performance.now();
      this.logger.log(`<<< updateElement: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      if(error instanceof NotFoundException)
        return new ProductsResponseDto(HttpStatus.NOT_FOUND, error.message, []);
      
      if(error instanceof AlreadyExistException)
        return new ProductsResponseDto(HttpStatus.BAD_REQUEST, error.message, []);

      this.logger.error(error.stack);
      return new ProductsResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })
  }

  @Get('/elements/:companyId')
  findElements(@Param('companyId', ParseUUIDPipe) companyId: string, @Query() paginationDto: PaginationDto, @Body() searchDto: SearchDto): Promise<ProductsResponseDto> {
    this.logger.log(`>>> findElements: companyId=${companyId}, paginationDto=${JSON.stringify(paginationDto)}, searchDto=${JSON.stringify(searchDto)}`);
    const start = performance.now();
    
    return this.elementService.findElements(companyId, paginationDto, searchDto)
    .then( (dtoList: ElementDto[]) => {
      const response = new ProductsResponseDto(HttpStatus.OK, "executed", dtoList);
      const end = performance.now();
      this.logger.log(`<<< findElements: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      if(error instanceof NotFoundException)
        return new ProductsResponseDto(HttpStatus.NOT_FOUND, error.message, []);

      this.logger.error(error.stack);
      return new ProductsResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })
  }

  @Get('/elements/:companyId/:value')
  findOneElementByValue(@Param('companyId', ParseUUIDPipe) companyId: string, @Param('value') value: string): Promise<ProductsResponseDto> {
    this.logger.log(`>>> findOneElementByValue: companyId=${companyId}, value=${value}`);
    const start = performance.now();

    return this.elementService.findOneElementByValue(companyId, value)
    .then( (dtoList: ElementDto[]) => {
      const response = new ProductsResponseDto(HttpStatus.OK, "executed", dtoList);
      const end = performance.now();
      this.logger.log(`<<< findOneElementByValue: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      if(error instanceof NotFoundException)
        return new ProductsResponseDto(HttpStatus.NOT_FOUND, error.message, []);

      this.logger.error(error.stack);
      return new ProductsResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })

  }

  @Delete('elements/:id')
  removeElement(@Param('id', ParseUUIDPipe) id: string): Promise<ProductsResponseDto> {
    this.logger.log(`>>> removeElement: id=${id}`);
    const start = performance.now();

    return this.elementService.removeElement(id)
    .then( (msg: string) => {
      const response = new ProductsResponseDto(HttpStatus.OK, msg);
      const end = performance.now();
      this.logger.log(`<<< removeElement: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      if(error instanceof NotFoundException)
        return new ProductsResponseDto(HttpStatus.NOT_FOUND, error.message, []);
      
      if(error instanceof IsBeingUsedException)
        return new ProductsResponseDto(HttpStatus.BAD_REQUEST, error.message, []);

      this.logger.error(error.stack);
      return new ProductsResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })
  }
  
}
