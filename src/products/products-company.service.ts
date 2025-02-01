
import { In, InsertResult, Like, Repository } from 'typeorm';
import { isUUID } from 'class-validator';

import { HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SearchDto } from 'src/common/dto/search.dto';

import { SiproadResponseDto } from './dto/products-response-dto';
import { ProductsCompanyDto } from './dto/products-company.dto';
import { ProductsCompany } from './entities/products-company.entity';

@Injectable()
export class ProductsCompanyService {

  private readonly logger = new Logger(ProductsCompanyService.name);

  private dbDefaultLimit = 1000;

  constructor(
    private readonly ConfigService: ConfigService,

    @InjectRepository(ProductsCompany)
    private readonly companyRepository: Repository<ProductsCompany>,
    
  ){
    this.dbDefaultLimit = this.ConfigService.get("dbDefaultLimit");
  }
  
  updateCompany(dto: ProductsCompanyDto): Promise<SiproadResponseDto> {
    if(!dto.id)
      return this.createCompany(dto); // * create
    
    this.logger.log(`updateCompany: init process... dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    const searchDto: SearchDto = new SearchDto(dto.id);
    
    return this.findCompaniesByParams({}, searchDto)
    .then( (entityList: ProductsCompany[]) => {

      // * validate
      if(entityList.length == 0){
        const msg = `company not found, id=${dto.id}`;
        this.logger.warn(`updateCompany: not executed (${msg})`);
        return new SiproadResponseDto(HttpStatus.NOT_FOUND, msg);  
      }

      let entity = entityList[0];
      
      // * update
      entity.name = dto.name.toUpperCase();
      
      return this.saveCompany(entity)
      .then( (entity: ProductsCompany) => {

        // * map to dto
        const siproadFormulaDto = new ProductsCompanyDto(entity.name, entity.id);

        const end = performance.now();
        this.logger.log(`updateCompany: executed, runtime=${(end - start) / 1000} seconds`);
        return new SiproadResponseDto(HttpStatus.OK, 'updated OK', siproadFormulaDto);
      })
      
    })

  }

  createCompany(dto: ProductsCompanyDto): Promise<SiproadResponseDto> {
    this.logger.log(`createCompany: init process... dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    // * find company
    const searchDto: SearchDto = new SearchDto(undefined, [dto.name]);
    
    return this.findCompaniesByParams({}, searchDto)
    .then( (entityList: ProductsCompany[]) => {

      // * validate
      if(entityList.length > 0){
        const msg = `company already exists, name=${dto.name}`;
        this.logger.warn(`createCompany: not executed (${msg})`);
        return new SiproadResponseDto(HttpStatus.BAD_REQUEST, msg);
      }

      // * create
      let entity = new ProductsCompany();
      entity.name = dto.name.toUpperCase()
      
      return this.saveCompany(entity)
      .then( (entity: ProductsCompany) => {
        const dto = new ProductsCompanyDto(entity.name, entity.id)
        const end = performance.now();
        this.logger.log(`createCompany: OK, runtime=${(end - start) / 1000} seconds`);
        return new SiproadResponseDto(HttpStatus.CREATED, 'created OK', dto);
      })

    })

  }

  findCompanies(paginationDto: PaginationDto, searchDto: SearchDto): Promise<void | SiproadResponseDto> {
      
    return this.findCompaniesByParams(paginationDto, searchDto)
    .then( (entityList: ProductsCompany[]) => entityList.map( (entity: ProductsCompany) => new ProductsCompanyDto(entity.name, entity.id) ) ) // * map entities to DTOs
    .then( (dtoList: ProductsCompanyDto[]) => new SiproadResponseDto(HttpStatus.OK, 'OK', dtoList))
    .catch(error => {
      this.logger.error(`findCompanies: error`, error)
    })

  }

  findOneCompanyByValue(value: string): Promise<SiproadResponseDto> {
    const start = performance.now();

    // * find element
    const searchDto: SearchDto = new SearchDto(value);
    
    // * find element
    return this.findCompaniesByParams({}, searchDto)
    .then( (entityList: ProductsCompany[]) => {
      
      if(entityList.length == 0){
        const msg = `company not found, value=${value}`;
        return new SiproadResponseDto(HttpStatus.NOT_FOUND, msg);
      }
      
      const entity = entityList[0];

      const dto = new ProductsCompanyDto(entity.name, entity.id);
      const end = performance.now();
      this.logger.log(`findOneCompanyByValue: executed, runtime=${(end - start) / 1000} seconds`);
      return new SiproadResponseDto(HttpStatus.OK, 'OK', dto);
    })
    
  }

  removeCompany(id: string): Promise<SiproadResponseDto> {
    this.logger.log(`removeCompany: init process... id=${id}`);
    const start = performance.now();

    const searchDto: SearchDto = new SearchDto(id);
    
    return this.findCompaniesByParams({}, searchDto)
    .then( (entityList: ProductsCompany[]) => {
      
      if(entityList.length == 0){
        const msg = `company not found, id=${id}`;
        return new SiproadResponseDto(HttpStatus.NOT_FOUND, msg);
      }
      
      const entity = entityList[0];

      // * remove
      return this.companyRepository.remove(entity)
      .then( (entity: ProductsCompany) => {
        const end = performance.now();
        this.logger.log(`removeCompany: OK, entity=${JSON.stringify(entity)}`);
        return new SiproadResponseDto(HttpStatus.OK, 'delete OK');
      })

    })
    .catch(error => {
      if(error.errno == 1217) {
        this.logger.warn('removeCompany: not executed, error', error);
        return new SiproadResponseDto(HttpStatus.BAD_REQUEST, 'company is being used');
      }

      this.logger.error('removeCompany: error', error);
      throw error;
    })

  }

  findCompaniesByParams(paginationDto: PaginationDto, searchDto: SearchDto): Promise<ProductsCompany[]> {
    const {page=1, limit=this.dbDefaultLimit} = paginationDto;

    // * search by partial name
    if(searchDto.search) {
      const whereByName = { name: Like(`%${searchDto.search}%`), status: true };
      const whereById   =  { id: searchDto.search, status: true };
      const where = isUUID(searchDto.search) ? whereById : whereByName;

      return this.companyRepository.find({
        take: limit,
        skip: (page - 1) * limit,
        where: where
      })
    }

    // * search by names
    if(searchDto.searchList) {
      return this.companyRepository.find({
        take: limit,
        skip: (page - 1) * limit,
        where: {
          name: In(searchDto.searchList),
          status: true,
        },
      })
    }

    // * search all
    return this.companyRepository.find({
      take: limit,
      skip: (page - 1) * limit,
      where: { status: true }
    })
    
  }

  private saveCompany(entity: ProductsCompany): Promise<ProductsCompany> {
    const start = performance.now();

    const newEntity: ProductsCompany = this.companyRepository.create(entity);

    return this.companyRepository.save(newEntity)
    .then( (entity: ProductsCompany) => {
      const end = performance.now();
      this.logger.log(`saveCompany: OK, runtime=${(end - start) / 1000} seconds, entity=${JSON.stringify(entity)}`);
      return entity;
    })
  }

}
