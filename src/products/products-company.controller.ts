import { Controller, Get, Post, Body, Patch, Param, Delete, Logger, HttpCode, HttpStatus, Query, ParseUUIDPipe, ParseArrayPipe } from '@nestjs/common';

import { PaginationDto } from 'src/common/dto/pagination.dto'; 
import { SearchDto } from 'src/common/dto/search.dto';

import { ProductsCompanyDto } from './dto/products-company.dto';
import { SiproadResponseDto } from './dto/products-response-dto';
import { ProductsCompanyService } from './products-company.service';

@Controller('siproad-products')
export class ProductsCompanyController {

  private readonly logger = new Logger(ProductsCompanyController.name);

  constructor(
    private readonly productsCompanyService: ProductsCompanyService
  ) {}

  // @Post('/companies/create')
  // @HttpCode(HttpStatus.OK)
  // createCompany(@Body() dto: ProductsCompanyDto): Promise<SiproadResponseDto> {
  //   this.logger.log(`>>> createCompany: dto=${JSON.stringify(dto)}`);
  //   const start = performance.now();

  //   return this.productsCompanyService.createCompany(dto)
  //   .then( (response: SiproadResponseDto) => {
  //     const end = performance.now();
  //     this.logger.log(`<<< createCompany: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
  //     return response;
  //   })
  //   .catch( (error: Error) => {
  //     this.logger.error(`createCompany: error=${error.stack}`);
  //     return new SiproadResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
  //   })
  // }

  @Patch('/companies/update')
  @HttpCode(HttpStatus.OK)
  updateCompany(@Body() dto: ProductsCompanyDto): Promise<SiproadResponseDto> {
    this.logger.log(`>>> updateCompany: dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    return this.productsCompanyService.updateCompany(dto)
    .then( (response: SiproadResponseDto) => {
      const end = performance.now();
      this.logger.log(`<<< updateCompany: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      this.logger.error(`updateCompany: error=${error.stack}`);
      return new SiproadResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })
  }

  @Get('/companies')
  findCompanies(@Query() paginationDto: PaginationDto, @Body() searchDto: SearchDto): Promise<SiproadResponseDto> {
    this.logger.log(`>>> findCompanies: paginationDto=${JSON.stringify(paginationDto)}, searchDto=${JSON.stringify(searchDto)}`);
    const start = performance.now();
    
    return this.productsCompanyService.findCompanies(paginationDto, searchDto)
    .then( (response: SiproadResponseDto) => {
      const end = performance.now();
      this.logger.log(`<<< findCompanies: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      this.logger.error(`findCompanies: error=${error.stack}`);
      return new SiproadResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })
  }

  @Get('/companies/:value')
  findOneCompanyByValue(@Param('value') value: string): Promise<SiproadResponseDto> {
    this.logger.log(`>>> findOneCompanyByValue: value=${value}`);
    const start = performance.now();

    return this.productsCompanyService.findOneCompanyByValue(value)
    .then( (response: SiproadResponseDto) => {
      const end = performance.now();
      this.logger.log(`<<< findOneCompanyByValue: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      this.logger.error(`findOneCompanyByValue: error=${error.stack}`);
      return new SiproadResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })

  }

  @Delete('companies/:id')
  removeCompany(@Param('id', ParseUUIDPipe) id: string): Promise<SiproadResponseDto> {
    this.logger.log(`>>> removeCompany: id=${id}`);
    const start = performance.now();

    return this.productsCompanyService.removeCompany(id)
    .then( (response: SiproadResponseDto) => {
      const end = performance.now();
      this.logger.log(`<<< removeCompany: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      this.logger.error(`removeCompany: error=${error.stack}`);
      return new SiproadResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })
  }
  
}
