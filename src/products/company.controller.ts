import { Controller, Get, Post, Body, Patch, Param, Delete, Logger, HttpCode, HttpStatus, Query, ParseUUIDPipe, ParseArrayPipe } from '@nestjs/common';

import { PaginationDto } from 'src/common/dto/pagination.dto'; 
import { SearchDto } from 'src/common/dto/search.dto';

import { CompanyDto } from './dto/company.dto';
import { productsResponseDto } from './dto/products-response-dto';
import { CompanyService } from './company.service';

@Controller('siproad-products')
export class CompanyController {

  private readonly logger = new Logger(CompanyController.name);

  constructor(
    private readonly companyService: CompanyService
  ) {}

  @Patch('/companies/update')
  @HttpCode(HttpStatus.OK)
  updateCompany(@Body() dto: CompanyDto): Promise<productsResponseDto> {
    this.logger.log(`>>> updateCompany: dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    return this.companyService.updateCompany(dto)
    .then( (response: productsResponseDto) => {
      const end = performance.now();
      this.logger.log(`<<< updateCompany: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      this.logger.error(error.stack);
      return new productsResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })
  }

  @Get('/companies')
  findCompanies(@Query() paginationDto: PaginationDto, @Body() searchDto: SearchDto): Promise<productsResponseDto> {
    this.logger.log(`>>> findCompanies: paginationDto=${JSON.stringify(paginationDto)}, searchDto=${JSON.stringify(searchDto)}`);
    const start = performance.now();
    
    return this.companyService.findCompanies(paginationDto, searchDto)
    .then( (response: productsResponseDto) => {
      const end = performance.now();
      this.logger.log(`<<< findCompanies: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      this.logger.error(error.stack);
      return new productsResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })
  }

  @Get('/companies/:value')
  findOneCompanyByValue(@Param('value') value: string): Promise<productsResponseDto> {
    this.logger.log(`>>> findOneCompanyByValue: value=${value}`);
    const start = performance.now();

    return this.companyService.findOneCompanyByValue(value)
    .then( (response: productsResponseDto) => {
      const end = performance.now();
      this.logger.log(`<<< findOneCompanyByValue: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      this.logger.error(error.stack);
      return new productsResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })

  }

  @Delete('companies/:id')
  removeCompany(@Param('id', ParseUUIDPipe) id: string): Promise<productsResponseDto> {
    this.logger.log(`>>> removeCompany: id=${id}`);
    const start = performance.now();

    return this.companyService.removeCompany(id)
    .then( (response: productsResponseDto) => {
      const end = performance.now();
      this.logger.log(`<<< removeCompany: executed, runtime=${(end - start) / 1000} seconds, response=${JSON.stringify(response)}`);
      return response;
    })
    .catch( (error: Error) => {
      this.logger.error(error.stack);
      return new productsResponseDto(HttpStatus.INTERNAL_SERVER_ERROR, error.message);
    })
  }
  
}
