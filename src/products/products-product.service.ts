
import { In, InsertResult, Like, Repository } from 'typeorm';
import { IsUUID, isUUID } from 'class-validator';

import { HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SearchDto } from 'src/common/dto/search.dto';

import { SiproadResponseDto } from './dto/products-response-dto';
import { ProductsProductDto } from './dto/products-product.dto';
import { ProductsProduct } from './entities/products-product.entity';
import { ProductsCompany } from './entities/products-company.entity';
import { ProductsCompanyService } from './products-company.service';

@Injectable()
export class ProductsProductService {

  private readonly logger = new Logger(ProductsProductService.name);

  private dbDefaultLimit = 1000;

  constructor(
    private readonly ConfigService: ConfigService,

    @InjectRepository(ProductsProduct)
    private readonly productRepository: Repository<ProductsProduct>,

    private readonly productsCompanyService: ProductsCompanyService
    
  ){
    this.dbDefaultLimit = this.ConfigService.get("dbDefaultLimit");
  }
  
  updateProduct(dto: ProductsProductDto): Promise<SiproadResponseDto> {
    if(!dto.id)
      return this.createProduct(dto); // * create
    
    this.logger.log(`updateProduct: init process... dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    // * find company
    const searchDto: SearchDto = new SearchDto(dto.companyId);
    
    return this.productsCompanyService.findCompaniesByParams({}, searchDto)
    .then( (companyList: ProductsCompany[]) => {

      if(companyList.length == 0){
        const msg = `company not found, id=${dto.id}`;
        this.logger.warn(`updateProduct: not executed (${msg})`);
        return new SiproadResponseDto(HttpStatus.NOT_FOUND, msg);    
      }

      const company = companyList[0];

      // * find product
      const searchDto: SearchDto = new SearchDto(dto.id);
        
      return this.findProductsByParams({}, searchDto)
      .then( (entityList: ProductsProduct[]) => {

        // * validate
        if(entityList.length == 0){
          const msg = `product not found, id=${dto.id}`;
          this.logger.warn(`updateProduct: not executed (${msg})`);
          return new SiproadResponseDto(HttpStatus.NOT_FOUND, msg);  
        }
  
        let entity = entityList[0];
        
        // * update
        entity.company = company;
        entity.name = dto.name.toUpperCase();
        entity.description = dto.description.toUpperCase();
        entity.cost = dto.cost;
        entity.price = dto.cost;
        
        return this.saveProduct(entity)
        .then( (entity: ProductsProduct) => {
  
          // * map to dto
          const siproadFormulaDto = new ProductsProductDto(entity.company.id, entity.name, entity.description, entity.cost, entity.price, entity.id);
  
          const end = performance.now();
          this.logger.log(`updateProduct: executed, runtime=${(end - start) / 1000} seconds`);
          return new SiproadResponseDto(HttpStatus.OK, 'updated OK', siproadFormulaDto);
        })
        
      })

    })

  }

  createProduct(dto: ProductsProductDto): Promise<SiproadResponseDto> {
    this.logger.log(`createProduct: init process... dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    // * find company
    const searchDto: SearchDto = new SearchDto(dto.companyId);
    
    return this.productsCompanyService.findCompaniesByParams({}, searchDto)
    .then( (companyList: ProductsCompany[]) => {

      if(companyList.length == 0){
        const msg = `company not found, id=${dto.id}`;
        this.logger.warn(`createProduct: not executed (${msg})`);
        return new SiproadResponseDto(HttpStatus.NOT_FOUND, msg);    
      }

      const company = companyList[0];

      // * find product
      const searchDto: SearchDto = new SearchDto(undefined, [dto.name]);
        
      return this.findProductsByParams({}, searchDto, company.id)
      .then( (entityList: ProductsProduct[]) => {

        // * validate
        if(entityList.length > 0){
          const msg = `product already exists, name=${dto.name}`;
          this.logger.warn(`createProduct: not executed (${msg})`);
          return new SiproadResponseDto(HttpStatus.BAD_REQUEST, msg);
        }
  
        // * create
        let entity = new ProductsProduct();
        entity.company = company;
        entity.name = dto.name.toUpperCase();
        entity.description = dto.description.toUpperCase();
        entity.cost = dto.cost;
        entity.price = dto.cost;
  
        return this.saveProduct(entity)
        .then( (entity: ProductsProduct) => {
          const dto = new ProductsProductDto(entity.company.id, entity.name, entity.description, entity.cost, entity.price, entity.id)
          const end = performance.now();
          this.logger.log(`createProduct: OK, runtime=${(end - start) / 1000} seconds`);
          return new SiproadResponseDto(HttpStatus.CREATED, 'created OK', dto);
        })
  
      })


    })


  }

  findProducts(companyId: string, paginationDto: PaginationDto, searchDto: SearchDto): Promise<void | SiproadResponseDto> {
    
    // // * validate
    // const isSearchByName: boolean = (searchDto.search && !isUUID(searchDto.search)) || (searchDto.searchList && searchDto.searchList.length > 0);

    // if( isSearchByName && !companyId ){
    //   const msg = `companyId is required`;
    //   this.logger.warn(`findOneProductByValue: not executed (${msg})`);
    //   return Promise.resolve(new SiproadResponseDto(HttpStatus.BAD_REQUEST, msg));
    // }

    return this.findProductsByParams(paginationDto, searchDto, companyId)
    .then( (entityList: ProductsProduct[]) => entityList.map( (entity: ProductsProduct) => new ProductsProductDto(entity.company.id, entity.name, entity.description, entity.cost, entity.price, entity.id) ) )// * map entities to DTOs
    .then( (dtoList: ProductsProductDto[]) => new SiproadResponseDto(HttpStatus.OK, 'OK', dtoList) )
    .catch(error => {
      this.logger.error(`findProducts: error`, error)
    })

  }

  findOneProductByValue(companyId: string, value: string): Promise<SiproadResponseDto> {
    const start = performance.now();

    const searchDto: SearchDto = new SearchDto(value);
    
    // * find product
    return this.findProductsByParams({}, searchDto, companyId)
    .then( (entityList: ProductsProduct[]) => {
      
      if(entityList.length == 0){
        const msg = `product not found, value=${value}`;
        this.logger.warn(`findOneProductByValue: ${msg}`);
        return new SiproadResponseDto(HttpStatus.NOT_FOUND, msg);
      }

      const entity = entityList[0];

      const dto = new ProductsProductDto(entity.company.id, entity.name, entity.description, entity.cost, entity.price, entity.id);
      const end = performance.now();
      this.logger.log(`findOneProductByValue: executed, runtime=${(end - start) / 1000} seconds`);
      return new SiproadResponseDto(HttpStatus.OK, 'OK', dto);
    })
    
  }

  removeProduct(id: string): Promise<SiproadResponseDto> {
    this.logger.log(`removeProduct: init process... id=${id}`);
    const start = performance.now();

    // * find product
    const searchDto: SearchDto = new SearchDto(id);
    
    return this.findProductsByParams({}, searchDto)
    .then( (entityList: ProductsProduct[]) => {
      
      if(entityList.length == 0){
        const msg = `product not found, id=${id}`;
        return new SiproadResponseDto(HttpStatus.NOT_FOUND, msg);
      }
      
      const entity = entityList[0];

      // * remove
      return this.productRepository.remove(entity)
      .then( (entity: ProductsProduct) => {
        const end = performance.now();
        this.logger.log(`removeProduct: OK, runtime=${(end - start) / 1000} seconds, entity=${JSON.stringify(entity)}`);
        return new SiproadResponseDto(HttpStatus.OK, 'delete OK');
      })

    })
    .catch(error => {

      if(error.errno == 1217) {
        this.logger.warn('removeProduct: not executed, error', error);
        return new SiproadResponseDto(HttpStatus.BAD_REQUEST, 'product is being used');
      }

      this.logger.error('removeProduct: error', error);
      throw error;
    })

  }

  private findProductsByParams(paginationDto: PaginationDto, searchDto: SearchDto, companyId?: string): Promise<ProductsProduct[]> {
    const {page=1, limit=this.dbDefaultLimit} = paginationDto;

    // * search by partial name
    const value = searchDto.search
    if(value) {
      const whereByName = { company: { id: companyId}, name: Like(`%${searchDto.search}%`), status: true };
      const whereById   = { id: value, status: true };
      const where = isUUID(value) ? whereById : whereByName;

      return this.productRepository.find({
        take: limit,
        skip: (page - 1) * limit,
        where: where
      })
    }

    // * search by names
    if(searchDto.searchList) {
      return this.productRepository.find({
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
    return this.productRepository.find({
      take: limit,
      skip: (page - 1) * limit,
      where: { 
        company: {
          id: companyId
        },
        status: true }
    })
    
  }

  private saveProduct(entity: ProductsProduct): Promise<ProductsProduct> {
    const start = performance.now();

    const newEntity: ProductsProduct = this.productRepository.create(entity);

    return this.productRepository.save(newEntity)
    .then( (entity: ProductsProduct) => {
      const end = performance.now();
      this.logger.log(`saveProduct: OK, runtime=${(end - start) / 1000} seconds, entity=${JSON.stringify(entity)}`);
      return entity;
    })
  }
  
}
