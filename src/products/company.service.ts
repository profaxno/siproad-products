
import { In, InsertResult, Like, Repository } from 'typeorm';
import { isUUID } from 'class-validator';

import { HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SearchDto } from 'src/common/dto/search.dto';

import { productsResponseDto } from './dto/products-response-dto';
import { CompanyDto } from './dto/company.dto';
import { Company } from './entities/company.entity';

@Injectable()
export class CompanyService {

  private readonly logger = new Logger(CompanyService.name);

  private dbDefaultLimit = 1000;

  constructor(
    private readonly ConfigService: ConfigService,

    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    
  ){
    this.dbDefaultLimit = this.ConfigService.get("dbDefaultLimit");
  }
  
  updateCompany(dto: CompanyDto): Promise<productsResponseDto> {
    if(!dto.id)
      return this.createCompany(dto); // * create
    
    this.logger.log(`updateCompany: init process... dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    const searchDto: SearchDto = new SearchDto(dto.id);
    
    return this.findCompaniesByParams({}, searchDto)
    .then( (entityList: Company[]) => {

      // * validate
      if(entityList.length == 0){
        const msg = `company not found, id=${dto.id}`;
        this.logger.warn(`updateCompany: not executed (${msg})`);
        return new productsResponseDto(HttpStatus.NOT_FOUND, msg);  
      }

      let entity = entityList[0];
      
      // * update
      entity.name = dto.name.toUpperCase();
      
      return this.saveCompany(entity)
      .then( (entity: Company) => {

        // * map to dto
        const dto = new CompanyDto(entity.name, entity.id);

        const end = performance.now();
        this.logger.log(`updateCompany: executed, runtime=${(end - start) / 1000} seconds`);
        return new productsResponseDto(HttpStatus.OK, 'updated OK', [dto]);
      })
      
    })
    .catch(error => {
      this.logger.error(`updateCompany: error`, error);
      throw error;
    })

  }

  createCompany(dto: CompanyDto): Promise<productsResponseDto> {
    this.logger.log(`createCompany: init process... dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    // * find company
    const searchDto: SearchDto = new SearchDto(undefined, [dto.name]);
    
    return this.findCompaniesByParams({}, searchDto)
    .then( (entityList: Company[]) => {

      // * validate
      if(entityList.length > 0){
        const msg = `company already exists, name=${dto.name}`;
        this.logger.warn(`createCompany: not executed (${msg})`);
        return new productsResponseDto(HttpStatus.BAD_REQUEST, msg);
      }

      // * create
      let entity = new Company();
      entity.name = dto.name.toUpperCase()
      
      return this.saveCompany(entity)
      .then( (entity: Company) => {
        const dto = new CompanyDto(entity.name, entity.id)
        const end = performance.now();
        this.logger.log(`createCompany: OK, runtime=${(end - start) / 1000} seconds`);
        return new productsResponseDto(HttpStatus.CREATED, 'created OK', [dto]);
      })

    })
    .catch(error => {
      this.logger.error(`createCompany: error`, error);
      throw error;
    })

  }

  findCompanies(paginationDto: PaginationDto, searchDto: SearchDto): Promise<void | productsResponseDto> {
    const start = performance.now();

    return this.findCompaniesByParams(paginationDto, searchDto)
    .then( (entityList: Company[]) => entityList.map( (entity: Company) => new CompanyDto(entity.name, entity.id) ) ) // * map entities to DTOs
    .then( (dtoList: CompanyDto[]) => {

      if(dtoList.length == 0){
        const msg = `companies not found`;
        this.logger.warn(`findCompanies: ${msg}`);
        return new productsResponseDto(HttpStatus.NOT_FOUND, msg);
      }

      const end = performance.now();
      this.logger.log(`findCompanies: executed, runtime=${(end - start) / 1000} seconds`);
      return new productsResponseDto(HttpStatus.OK, 'OK', dtoList);
    })
    .catch(error => {
      this.logger.error(`findCompanies: error`, error);
      throw error;
    })

  }

  findOneCompanyByValue(value: string): Promise<productsResponseDto> {
    const start = performance.now();

    const searchDto: SearchDto = new SearchDto(value);
    
    return this.findCompaniesByParams({}, searchDto)
    .then( (entityList: Company[]) => entityList.map( (entity: Company) => new CompanyDto(entity.name, entity.id) ) ) // * map entities to DTOs
    .then( (dtoList: CompanyDto[]) => {

      if(dtoList.length == 0){
        const msg = `company not found, value=${value}`;
        this.logger.warn(`findOneCompanyByValue: ${msg}`);
        return new productsResponseDto(HttpStatus.NOT_FOUND, msg);
      }

      const end = performance.now();
      this.logger.log(`findOneCompanyByValue: executed, runtime=${(end - start) / 1000} seconds`);
      return new productsResponseDto(HttpStatus.OK, 'OK', dtoList);
    })
    .catch(error => {
      this.logger.error(`findOneCompanyByValue: error`, error);
      throw error;
    })
    
  }

  removeCompany(id: string): Promise<productsResponseDto> {
    this.logger.log(`removeCompany: init process... id=${id}`);
    const start = performance.now();

    const searchDto: SearchDto = new SearchDto(id);
    
    return this.findCompaniesByParams({}, searchDto)
    .then( (entityList: Company[]) => {
      
      if(entityList.length == 0){
        const msg = `company not found, id=${id}`;
        return new productsResponseDto(HttpStatus.NOT_FOUND, msg);
      }

      // * delete
      return this.companyRepository.delete(id)
      .then( () => {
        const end = performance.now();
        this.logger.log(`removeCompany: OK, runtime=${(end - start) / 1000} seconds`);
        return new productsResponseDto(HttpStatus.OK, 'delete OK');
      })

    })
    .catch(error => {
      if(error.errno == 1217) {
        this.logger.warn('removeCompany: not executed, error', error);
        return new productsResponseDto(HttpStatus.BAD_REQUEST, 'company is being used');
      }

      this.logger.error('removeCompany: error', error);
      throw error;
    })

  }

  findCompaniesByParams(paginationDto: PaginationDto, searchDto: SearchDto): Promise<Company[]> {
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

  private saveCompany(entity: Company): Promise<Company> {
    const start = performance.now();

    const newEntity: Company = this.companyRepository.create(entity);

    return this.companyRepository.save(newEntity)
    .then( (entity: Company) => {
      const end = performance.now();
      this.logger.log(`saveCompany: OK, runtime=${(end - start) / 1000} seconds, entity=${JSON.stringify(entity)}`);
      return entity;
    })
  }

}
