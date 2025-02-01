
import { In, InsertResult, Like, Repository } from 'typeorm';
import { IsUUID, isUUID } from 'class-validator';

import { HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SearchDto } from 'src/common/dto/search.dto';

import { SiproadResponseDto } from './dto/products-response-dto';
import { ProductsElementDto } from './dto/products-element.dto';
import { ProductsElement } from './entities/products-element.entity';
import { ProductsCompany } from './entities/products-company.entity';
import { ProductsCompanyService } from './products-company.service';

@Injectable()
export class ProductsElementService {

  private readonly logger = new Logger(ProductsElementService.name);

  private dbDefaultLimit = 1000;

  constructor(
    private readonly ConfigService: ConfigService,

    @InjectRepository(ProductsElement)
    private readonly elementRepository: Repository<ProductsElement>,

    private readonly productsCompanyService: ProductsCompanyService
    
  ){
    this.dbDefaultLimit = this.ConfigService.get("dbDefaultLimit");
  }
  
  updateElement(dto: ProductsElementDto): Promise<SiproadResponseDto> {
    if(!dto.id)
      return this.createElement(dto); // * create
    
    this.logger.log(`updateElement: init process... dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    // * find company
    const searchDto: SearchDto = new SearchDto(dto.companyId);
    
    return this.productsCompanyService.findCompaniesByParams({}, searchDto)
    .then( (companyList: ProductsCompany[]) => {

      if(companyList.length == 0){
        const msg = `company not found, id=${dto.id}`;
        this.logger.warn(`updateElement: not executed (${msg})`);
        return new SiproadResponseDto(HttpStatus.NOT_FOUND, msg);    
      }

      const company = companyList[0];

      // * find element
      const searchDto: SearchDto = new SearchDto(dto.id);
        
      return this.findElementsByParams({}, searchDto)
      .then( (entityList: ProductsElement[]) => {

        // * validate
        if(entityList.length == 0){
          const msg = `element not found, id=${dto.id}`;
          this.logger.warn(`updateElement: not executed (${msg})`);
          return new SiproadResponseDto(HttpStatus.NOT_FOUND, msg);  
        }
  
        let entity = entityList[0];
        
        // * update
        entity.company = company;
        entity.name = dto.name.toUpperCase();
        entity.cost = dto.cost;
        entity.stock = dto.stock;
        entity.unit = dto.unit;
        
        return this.saveElement(entity)
        .then( (entity: ProductsElement) => {
  
          // * map to dto
          const siproadFormulaDto = new ProductsElementDto(entity.company.id, entity.name, entity.cost, entity.stock, entity.unit, entity.id);
  
          const end = performance.now();
          this.logger.log(`updateElement: executed, runtime=${(end - start) / 1000} seconds`);
          return new SiproadResponseDto(HttpStatus.OK, 'updated OK', siproadFormulaDto);
        })
        
      })

    })

  }

  createElement(dto: ProductsElementDto): Promise<SiproadResponseDto> {
    this.logger.log(`createElement: init process... dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    // * find company
    const searchDto: SearchDto = new SearchDto(dto.companyId);
    
    return this.productsCompanyService.findCompaniesByParams({}, searchDto)
    .then( (companyList: ProductsCompany[]) => {

      if(companyList.length == 0){
        const msg = `company not found, id=${dto.id}`;
        this.logger.warn(`createElement: not executed (${msg})`);
        return new SiproadResponseDto(HttpStatus.NOT_FOUND, msg);    
      }

      const company = companyList[0];

      // * find element
      const searchDto: SearchDto = new SearchDto(undefined, [dto.name]);
        
      return this.findElementsByParams({}, searchDto, company.id)
      .then( (entityList: ProductsElement[]) => {

        // * validate
        if(entityList.length > 0){
          const msg = `element already exists, name=${dto.name}`;
          this.logger.warn(`createElement: not executed (${msg})`);
          return new SiproadResponseDto(HttpStatus.BAD_REQUEST, msg);
        }
  
        // * create
        let entity = new ProductsElement();
        entity.company = company;
        entity.name = dto.name.toUpperCase()
        entity.cost = dto.cost;
        entity.stock = dto.stock;
        entity.unit = dto.unit;
  
        return this.saveElement(entity)
        .then( (entity: ProductsElement) => {
          const dto = new ProductsElementDto(entity.company.id, entity.name, entity.cost, entity.stock, entity.unit, entity.id)
          const end = performance.now();
          this.logger.log(`createElement: OK, runtime=${(end - start) / 1000} seconds`);
          return new SiproadResponseDto(HttpStatus.CREATED, 'created OK', dto);
        })
  
      })


    })


  }

  findElements(companyId: string, paginationDto: PaginationDto, searchDto: SearchDto): Promise<void | SiproadResponseDto> {
    
    // // * validate
    // const isSearchByName: boolean = (searchDto.search && !isUUID(searchDto.search)) || (searchDto.searchList && searchDto.searchList.length > 0);

    // if( isSearchByName && !companyId ){
    //   const msg = `companyId is required`;
    //   this.logger.warn(`findOneElementByValue: not executed (${msg})`);
    //   return Promise.resolve(new SiproadResponseDto(HttpStatus.BAD_REQUEST, msg));
    // }

    return this.findElementsByParams(paginationDto, searchDto, companyId)
    .then( (entityList: ProductsElement[]) => entityList.map( (entity: ProductsElement) => new ProductsElementDto(entity.company.id, entity.name, entity.cost, entity.stock, entity.unit, entity.id) ) )// * map entities to DTOs
    .then( (dtoList: ProductsElementDto[]) => new SiproadResponseDto(HttpStatus.OK, 'OK', dtoList) )
    .catch(error => {
      this.logger.error(`findElements: error`, error)
    })

  }

  findOneElementByValue(companyId: string, value: string): Promise<SiproadResponseDto> {
    const start = performance.now();

    // // * validate
    // const isSearchByName: boolean = !isUUID(value);

    // if( isSearchByName && !companyId ){
    //   const msg = `companyId is required`;
    //   this.logger.warn(`findOneElementByValue: not executed (${msg})`);
    //   return Promise.resolve(new SiproadResponseDto(HttpStatus.BAD_REQUEST, msg));
    // }

    const searchDto: SearchDto = new SearchDto(value);
    
    // * find element
    return this.findElementsByParams({}, searchDto, companyId)
    .then( (entityList: ProductsElement[]) => {
      
      if(entityList.length == 0){
        const msg = `element not found, value=${value}`;
        this.logger.warn(`findOneElementByValue: ${msg}`);
        return new SiproadResponseDto(HttpStatus.NOT_FOUND, msg);
      }

      const entity = entityList[0];

      const dto = new ProductsElementDto(entity.company.id, entity.name, entity.cost, entity.stock, entity.unit, entity.id);
      const end = performance.now();
      this.logger.log(`findOneElementByValue: executed, runtime=${(end - start) / 1000} seconds`);
      return new SiproadResponseDto(HttpStatus.OK, 'OK', dto);
    })
    
  }

  removeElement(id: string): Promise<SiproadResponseDto> {
    this.logger.log(`removeElement: init process... id=${id}`);
    const start = performance.now();

    // * find element
    const searchDto: SearchDto = new SearchDto(id);
    
    return this.findElementsByParams({}, searchDto)
    .then( (entityList: ProductsElement[]) => {
      
      if(entityList.length == 0){
        const msg = `element not found, id=${id}`;
        return new SiproadResponseDto(HttpStatus.NOT_FOUND, msg);
      }
      
      const entity = entityList[0];

      // * remove
      return this.elementRepository.remove(entity)
      .then( (entity: ProductsElement) => {
        const end = performance.now();
        this.logger.log(`removeElement: OK, runtime=${(end - start) / 1000} seconds, entity=${JSON.stringify(entity)}`);
        return new SiproadResponseDto(HttpStatus.OK, 'delete OK');
      })

    })
    .catch(error => {

      if(error.errno == 1217) {
        this.logger.warn('removeElement: not executed, error', error);
        return new SiproadResponseDto(HttpStatus.BAD_REQUEST, 'element is being used');
      }

      this.logger.error('removeElement: error', error);
      throw error;
    })

  }

  private findElementsByParams(paginationDto: PaginationDto, searchDto: SearchDto, companyId?: string): Promise<ProductsElement[]> {
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

  private saveElement(entity: ProductsElement): Promise<ProductsElement> {
    const start = performance.now();

    const newEntity: ProductsElement = this.elementRepository.create(entity);

    return this.elementRepository.save(newEntity)
    .then( (entity: ProductsElement) => {
      const end = performance.now();
      this.logger.log(`saveElement: OK, runtime=${(end - start) / 1000} seconds, entity=${JSON.stringify(entity)}`);
      return entity;
    })
  }
  
}
