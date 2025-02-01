import { Controller, Get, Post, Body, Patch, Param, Delete, Logger, HttpCode, HttpStatus, Query, ParseUUIDPipe, ParseArrayPipe } from '@nestjs/common';

import { PaginationDto } from 'src/common/dto/pagination.dto'; 
import { SearchDto } from 'src/common/dto/search.dto';

import { ProductsFormulaDto } from './dto/products-formula.dto';
import { SiproadResponseDto } from './dto/products-response-dto';
import { ProductsFormulaService } from './products-formula.service';

@Controller('siproad-products')
export class ProductsFormulaController {

  private readonly logger = new Logger(ProductsFormulaController.name);

  constructor(
    private readonly productsFormulaService: ProductsFormulaService
  ) {}

  // @Post('/formulas/create')
  // @HttpCode(HttpStatus.OK)
  // createFormula(@Body() dto: ProductsFormulaDto): Promise<SiproadResponseDto> {
  //   this.logger.log(`>>> createFormula: dto=${JSON.stringify(dto)}`);
  //   const start = performance.now();

  //   return this.productsFormulaService.createFormula(dto)
  //   .then( (response: SiproadResponseDto) => {
  //     const end = performance.now();
  //     this.logger.log(`<<< createFormula: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
  //     return response;
  //   })
  //   .catch( (error: Error) => {
  //     this.logger.error(`createFormula: error=${error.stack}`);
  //     return new SiproadResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
  //   })
  // }

  @Patch('/formulas/update')
  @HttpCode(HttpStatus.OK)
  updateFormula(@Body() dto: ProductsFormulaDto): Promise<SiproadResponseDto> {
    this.logger.log(`>>> updateFormula: dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    return this.productsFormulaService.updateFormula(dto)
    .then( (response: SiproadResponseDto) => {
      const end = performance.now();
      this.logger.log(`<<< updateFormula: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      this.logger.error(`updateFormula: error=${error.stack}`);
      return new SiproadResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })
  }

  @Get('/formulas/:companyId')
  findFormulas(@Param('companyId', ParseUUIDPipe) companyId: string, @Query() paginationDto: PaginationDto, @Body() searchDto: SearchDto): Promise<SiproadResponseDto> {
    this.logger.log(`>>> findFormulas: companyId=${companyId}, paginationDto=${JSON.stringify(paginationDto)}, searchDto=${JSON.stringify(searchDto)}`);
    const start = performance.now();

    return this.productsFormulaService.findFormulas(companyId, paginationDto, searchDto)
    .then( (response: SiproadResponseDto) => {
      const end = performance.now();
      this.logger.log(`<<< findFormulas: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      this.logger.error(`findFormulas: error=${error.stack}`);
      return new SiproadResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })
  }

  @Get('/formulas/:companyId/:value')
  findOneFormulaByValue(@Param('companyId', ParseUUIDPipe) companyId: string, @Param('value') value: string): Promise<SiproadResponseDto> {
    this.logger.log(`>>> findOneFormulaWithElementsByValue: companyId=${companyId}, value=${value}`);
    const start = performance.now();

    return this.productsFormulaService.findOneFormulaByValue(companyId, value)
    .then( (response: SiproadResponseDto) => {
      const end = performance.now();
      this.logger.log(`<<< findOneFormulaWithElementsByValue: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      this.logger.error(`findOneFormulaWithElementsByValue: error=${error.stack}`);
      return new SiproadResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })

  }

  @Delete('formulas/:id')
  removeFormula(@Param('id', ParseUUIDPipe) id: string): Promise<SiproadResponseDto> {
    this.logger.log(`>>> removeFormula: id=${id}`);
    const start = performance.now();

    return this.productsFormulaService.removeFormula(id)
    .then( (response: SiproadResponseDto) => {
      const end = performance.now();
      this.logger.log(`<<< removeFormula: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      this.logger.error(`removeFormula: error=${error.stack}`);
      return new SiproadResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })
  }
  
}
