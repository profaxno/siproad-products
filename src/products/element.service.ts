
import { In, InsertResult, Like, Repository } from 'typeorm';
import { IsUUID, isUUID } from 'class-validator';

import { HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SearchDto } from 'src/common/dto/search.dto';

import { productsResponseDto } from './dto/products-response-dto';
import { ElementDto } from './dto/element.dto';
import { Element } from './entities/element.entity';
import { Company } from './entities/company.entity';
import { CompanyService } from './company.service';

@Injectable()
export class ElementService {

  private readonly logger = new Logger(ElementService.name);

  private dbDefaultLimit = 1000;

  constructor(
    private readonly ConfigService: ConfigService,

    @InjectRepository(Element)
    private readonly elementRepository: Repository<Element>,

    private readonly companyService: CompanyService
    
  ){
    this.dbDefaultLimit = this.ConfigService.get("dbDefaultLimit");
  }
  
  updateElement(dto: ElementDto): Promise<productsResponseDto> {
    if(!dto.id)
      return this.createElement(dto); // * create
    
    this.logger.log(`updateElement: init process... dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    // * find company
    const searchDto: SearchDto = new SearchDto(dto.companyId);
    
    return this.companyService.findCompaniesByParams({}, searchDto)
    .then( (companyList: Company[]) => {

      if(companyList.length == 0){
        const msg = `company not found, id=${dto.id}`;
        this.logger.warn(`updateElement: not executed (${msg})`);
        return new productsResponseDto(HttpStatus.NOT_FOUND, msg);    
      }

      const company = companyList[0];

      // * find element
      const searchDto: SearchDto = new SearchDto(dto.id);
        
      return this.findElementsByParams({}, searchDto)
      .then( (entityList: Element[]) => {

        // * validate
        if(entityList.length == 0){
          const msg = `element not found, id=${dto.id}`;
          this.logger.warn(`updateElement: not executed (${msg})`);
          return new productsResponseDto(HttpStatus.NOT_FOUND, msg);  
        }
  
        let entity = entityList[0];
        
        // * update
        entity.company = company;
        entity.name = dto.name.toUpperCase();
        entity.cost = dto.cost;
        entity.stock = dto.stock;
        entity.unit = dto.unit;
        
        return this.saveElement(entity)
        .then( (entity: Element) => {
  
          // * map to dto
          const dto = new ElementDto(entity.company.id, entity.name, entity.cost, entity.stock, entity.unit, entity.id);
  
          const end = performance.now();
          this.logger.log(`updateElement: executed, runtime=${(end - start) / 1000} seconds`);
          return new productsResponseDto(HttpStatus.OK, 'updated OK', [dto]);
        })
        
      })

    })

  }

  createElement(dto: ElementDto): Promise<productsResponseDto> {
    this.logger.log(`createElement: init process... dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    // * find company
    const searchDto: SearchDto = new SearchDto(dto.companyId);
    
    return this.companyService.findCompaniesByParams({}, searchDto)
    .then( (companyList: Company[]) => {

      if(companyList.length == 0){
        const msg = `company not found, id=${dto.id}`;
        this.logger.warn(`createElement: not executed (${msg})`);
        return new productsResponseDto(HttpStatus.NOT_FOUND, msg);    
      }

      const company = companyList[0];

      // * find element
      const searchDto: SearchDto = new SearchDto(undefined, [dto.name]);
        
      return this.findElementsByParams({}, searchDto, company.id)
      .then( (entityList: Element[]) => {

        // * validate
        if(entityList.length > 0){
          const msg = `element already exists, name=${dto.name}`;
          this.logger.warn(`createElement: not executed (${msg})`);
          return new productsResponseDto(HttpStatus.BAD_REQUEST, msg);
        }
  
        // * create
        let entity = new Element();
        entity.company = company;
        entity.name = dto.name.toUpperCase()
        entity.cost = dto.cost;
        entity.stock = dto.stock;
        entity.unit = dto.unit;
  
        return this.saveElement(entity)
        .then( (entity: Element) => {
          const dto = new ElementDto(entity.company.id, entity.name, entity.cost, entity.stock, entity.unit, entity.id)
          const end = performance.now();
          this.logger.log(`createElement: OK, runtime=${(end - start) / 1000} seconds`);
          return new productsResponseDto(HttpStatus.CREATED, 'created OK', [dto]);
        })
  
      })

    })

  }

  findElements(companyId: string, paginationDto: PaginationDto, searchDto: SearchDto): Promise<productsResponseDto> {
    const start = performance.now();

    return this.findElementsByParams(paginationDto, searchDto, companyId)
    .then( (entityList: Element[]) => entityList.map( (entity: Element) => new ElementDto(entity.company.id, entity.name, entity.cost, entity.stock, entity.unit, entity.id) ) )// * map entities to DTOs
    .then( (dtoList: ElementDto[]) => {
      
      if(dtoList.length == 0){
        const msg = `elements not found`;
        this.logger.warn(`findElements: ${msg}`);
        return new productsResponseDto(HttpStatus.NOT_FOUND, msg, []);
      }

      const end = performance.now();
      this.logger.log(`findElements: executed, runtime=${(end - start) / 1000} seconds`);
      return new productsResponseDto(HttpStatus.OK, 'OK', dtoList);
    })
    .catch(error => {
      this.logger.error(`findElements: error`, error);
      throw error;
    })

  }

  findOneElementByValue(companyId: string, value: string): Promise<productsResponseDto> {
    const start = performance.now();

    const searchDto: SearchDto = new SearchDto(value);
    
    return this.findElementsByParams({}, searchDto, companyId)
    .then( (entityList: Element[]) => entityList.map( (entity: Element) => new ElementDto(entity.company.id, entity.name, entity.cost, entity.stock, entity.unit, entity.id) ) )// * map entities to DTOs
    .then( (dtoList: ElementDto[]) => {
      
      if(dtoList.length == 0){
        const msg = `element not found, value=${value}`;
        this.logger.warn(`findOneElementByValue: ${msg}`);
        return new productsResponseDto(HttpStatus.NOT_FOUND, msg, []);
      }

      const end = performance.now();
      this.logger.log(`findOneElementByValue: executed, runtime=${(end - start) / 1000} seconds`);
      return new productsResponseDto(HttpStatus.OK, 'OK', dtoList);
    })
    .catch(error => {
      this.logger.error(`findOneElementByValue: error`, error);
      throw error;
    })

  }

  removeElement(id: string): Promise<productsResponseDto> {
    this.logger.log(`removeElement: init process... id=${id}`);
    const start = performance.now();

    // * find element
    const searchDto: SearchDto = new SearchDto(id);
    
    return this.findElementsByParams({}, searchDto)
    .then( (entityList: Element[]) => {
      
      if(entityList.length == 0){
        const msg = `element not found, id=${id}`;
        return new productsResponseDto(HttpStatus.NOT_FOUND, msg);
      }
      
      const entity = entityList[0];

      // * remove
      return this.elementRepository.remove(entity)
      .then( (entity: Element) => {
        const end = performance.now();
        this.logger.log(`removeElement: OK, runtime=${(end - start) / 1000} seconds, entity=${JSON.stringify(entity)}`);
        return new productsResponseDto(HttpStatus.OK, 'delete OK');
      })

    })
    .catch(error => {

      if(error.errno == 1217) {
        this.logger.warn('removeElement: not executed, error', error);
        return new productsResponseDto(HttpStatus.BAD_REQUEST, 'element is being used');
      }

      this.logger.error('removeElement: error', error);
      throw error;
    })

  }

  private findElementsByParams(paginationDto: PaginationDto, searchDto: SearchDto, companyId?: string): Promise<Element[]> {
    const {page=1, limit=this.dbDefaultLimit} = paginationDto;

    // * search by partial name
    const value = searchDto.search
    if(value) {
      const whereByName = { company: { id: companyId}, name: Like(`%${searchDto.search}%`), status: true };
      const whereById   = { id: value, status: true };
      const where = isUUID(value) ? whereById : whereByName;

      return this.elementRepository.find({
        take: limit,
        skip: (page - 1) * limit,
        where: where
      })
    }

    // * search by names
    if(searchDto.searchList) {
      return this.elementRepository.find({
        take: limit,
        skip: (page - 1) * limit,
        where: {
          company: {
            id: companyId
          },
          name: In(searchDto.searchList),
          status: true,
        }
      })
    }

    // * search all
    return this.elementRepository.find({
      take: limit,
      skip: (page - 1) * limit,
      where: { 
        company: {
          id: companyId
        },
        status: true }
    })
    
  }

  private saveElement(entity: Element): Promise<Element> {
    const start = performance.now();

    const newEntity: Element = this.elementRepository.create(entity);

    return this.elementRepository.save(newEntity)
    .then( (entity: Element) => {
      const end = performance.now();
      this.logger.log(`saveElement: OK, runtime=${(end - start) / 1000} seconds, entity=${JSON.stringify(entity)}`);
      return entity;
    })
  }
  
}
