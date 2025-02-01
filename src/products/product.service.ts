
import { In, InsertResult, Like, Repository } from 'typeorm';
import { isUUID } from 'class-validator';

import { HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SearchDto } from 'src/common/dto/search.dto';

import { productsResponseDto } from './dto/products-response-dto';
import { ProductDto, ProductFormulaDto } from './dto/product.dto';
import { Product } from './entities/product.entity';
import { ProductFormula } from './entities/product-formula.entity';

import { CompanyService } from './company.service';
import { Company } from './entities/company.entity';

import { FormulaService } from './formula.service';
import { Formula } from './entities/formula.entity';

@Injectable()
export class ProductService {

  private readonly logger = new Logger(ProductService.name);

  private dbDefaultLimit = 1000;

  constructor(
    private readonly ConfigService: ConfigService,
    
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    
    @InjectRepository(ProductFormula)
    private readonly productFormulaRepository: Repository<ProductFormula>,

    @InjectRepository(Formula)
    private readonly formulaRepository: Repository<Formula>,

    private readonly companyService: CompanyService,
    private readonly formulaService: FormulaService
    
  ){
    this.dbDefaultLimit = this.ConfigService.get("dbDefaultLimit");
  }

  updateProduct(dto: ProductDto): Promise<productsResponseDto> {
    if(!dto.id)
      return this.createProduct(dto); // * create
    
    this.logger.log(`updateProduct: init process... dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    // * find company
    const searchDto: SearchDto = new SearchDto(dto.companyId);
    
    return this.companyService.findCompaniesByParams({}, searchDto)
    .then( (companyList: Company[]) => {

      if(companyList.length == 0){
        const msg = `company not found, id=${dto.id}`;
        this.logger.warn(`updateProduct: not executed (${msg})`);
        return new productsResponseDto(HttpStatus.NOT_FOUND, msg);    
      }

      const company = companyList[0];

      // * find product
      const searchDto: SearchDto = new SearchDto(dto.id);
        
      return this.findProductsByParams({}, searchDto)
      .then( (entityList: Product[]) => {

        // * validate
        if(entityList.length == 0){
          const msg = `product not found, id=${dto.id}`;
          this.logger.warn(`updateProduct: not executed (${msg})`);
          return new productsResponseDto(HttpStatus.NOT_FOUND, msg);  
        }

        let entity = entityList[0];

        // * update
        entity.company = company;
        entity.name = dto.name.toUpperCase();
        entity.description = dto.description.toUpperCase();
        entity.cost = dto.cost;
        entity.price = dto.price;

        return this.saveProduct(entity) // * update product
        .then( (entity: Product) => this.updateProductFormula(entity, dto.formulaList) ) // * create productFormula
        .then( (productFormulaList: ProductFormula[]) => this.generateProductWithFormulaList(entity, productFormulaList) ) // * generate product with productFormula
        .then( (dto: ProductDto) => {
          const end = performance.now();
          this.logger.log(`updateProduct: executed, runtime=${(end - start) / 1000} seconds`);
          return new productsResponseDto(HttpStatus.OK, 'updated OK', [dto]);
        })
        
      })

    })

  }

  createProduct(dto: ProductDto): Promise<productsResponseDto> {
    this.logger.log(`createProduct: init process... dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    // * find company
    const searchDto: SearchDto = new SearchDto(dto.companyId);

    return this.companyService.findCompaniesByParams({}, searchDto)
    .then( (companyList: Company[]) => {

      if(companyList.length == 0){
        const msg = `company not found, id=${dto.id}`;
        this.logger.warn(`createProduct: not executed (${msg})`);
        return new productsResponseDto(HttpStatus.NOT_FOUND, msg);    
      }

      const company = companyList[0];

      // * find product
      const searchDto: SearchDto = new SearchDto(undefined, [dto.name]);
      
      return this.findProductsByParams({}, searchDto, company.id)
      .then( (entityList: Product[]) => {
  
        // * validate
        if(entityList.length > 0){
          const msg = `product already exists, name=${dto.name}`;
          this.logger.warn(`createProduct: not executed (${msg})`);
          return new productsResponseDto(HttpStatus.BAD_REQUEST, msg);
        }
        
        // * create
        let entity = new Product();
        entity.company = company;
        entity.name = dto.name.toUpperCase();
        entity.description = dto.description.toUpperCase();
        entity.cost = dto.cost;
        entity.price = dto.price;
  
        return this.saveProduct(entity) // * create product
        .then( (entity: Product) => {
  
          return this.updateProductFormula(entity, dto.formulaList) // * create productFormula
          .then( (productFormulaList: ProductFormula[]) => this.generateProductWithFormulaList(entity, productFormulaList) ) // * generate product with productFormula
          .then( (dto: ProductDto) => {
  
            const end = performance.now();
            this.logger.log(`createProduct: created OK, runtime=${(end - start) / 1000} seconds`);
            return new productsResponseDto(HttpStatus.CREATED, 'created OK', [dto]);
          })
  
        })
  
      })

    })
    
  }

  findProducts(companyId: string, paginationDto: PaginationDto, searchDto: SearchDto): Promise<productsResponseDto> {
    const start = performance.now();

    return this.findProductsByParams(paginationDto, searchDto, companyId)
    .then( (entityList: Product[]) => entityList.map( (entity) => this.generateProductWithFormulaList(entity, entity.productFormula) ) )
    .then( (dtoList: ProductDto[]) => {
      
      if(dtoList.length == 0){
        const msg = `products not found`;
        this.logger.warn(`findProducts: ${msg}`);
        return new productsResponseDto(HttpStatus.NOT_FOUND, msg);
      }

      const end = performance.now();
      this.logger.log(`findProducts: executed, runtime=${(end - start) / 1000} seconds`);
      return new productsResponseDto(HttpStatus.OK, 'OK', dtoList);
    })
    .catch(error => {
      this.logger.error(`findProducts: error`, error);
      throw error;
    })
 
  }

  findOneProductByValue(companyId: string, value: string): Promise<productsResponseDto> {
    const start = performance.now();

    const searchDto: SearchDto = new SearchDto(value);

    return this.findProductsByParams({}, searchDto, companyId)
    .then( (entityList: Product[]) => entityList.map( (entity) => this.generateProductWithFormulaList(entity, entity.productFormula) ) )
    .then( (dtoList: ProductDto[]) => {
      
      if(dtoList.length == 0){
        const msg = `product not found, value=${value}`;
        this.logger.warn(`findOneProductByValue: ${msg}`);
        return new productsResponseDto(HttpStatus.NOT_FOUND, msg);
      }

      const end = performance.now();
      this.logger.log(`findOneProductByValue: executed, runtime=${(end - start) / 1000} seconds`);
      return new productsResponseDto(HttpStatus.OK, 'OK', dtoList);
    })
    .catch(error => {
      this.logger.error(`findOneProductByValue: error`, error);
      throw error;
    })
    
  }

  removeProduct(id: string): Promise<productsResponseDto> {
    this.logger.log(`removeProduct: init process... id=${id}`);
    const start = performance.now();

    // * find product
    const searchDto: SearchDto = new SearchDto(id);
    
    return this.findProductsByParams({}, searchDto)
    .then( (entityList: Product[]) => {
  
      // * validate
      if(entityList.length == 0){
        const msg = `product not found, id=${id}`;
        return new productsResponseDto(HttpStatus.NOT_FOUND, msg);
      }

      const entity = entityList[0];
      
      // TODO: Posiblemente eliminar los product-formula se deba hacer via CASCADE true
      // * remove
      return this.productFormulaRepository.findBy( { product: entity } ) // * find productFormula
      .then( (productFormulaList: ProductFormula[]) => this.productFormulaRepository.remove(productFormulaList)) // * remove productFormulas
      .then( () => this.productRepository.remove(entity) ) // * remove product
      .then( (entity: Product) => {

        const end = performance.now();
        this.logger.log(`removeProduct: OK, runtime=${(end - start) / 1000} seconds`);
        return new productsResponseDto(HttpStatus.OK, 'delete OK');

      })

    })
    .catch(error => {
      if(error.errno == 1217) {
        this.logger.warn('removeProduct: not executed, error', error);
        return new productsResponseDto(HttpStatus.BAD_REQUEST, 'product is being used');
      }

      this.logger.error('removeProduct: error', error);
      throw error;
    })

  }

  private findProductsByParams(paginationDto: PaginationDto, searchDto: SearchDto, companyId?: string): Promise<Product[]> {
    const {page=1, limit=this.dbDefaultLimit} = paginationDto;

    // * search by partial name
    if(searchDto.search) {
      const whereByName = { company: { id: companyId }, name: Like(`%${searchDto.search}%`), status: true };
      const whereById   = { id: searchDto.search, status: true };
      const where = isUUID(searchDto.search) ? whereById : whereByName;

      return this.productRepository.find({
        take: limit,
        skip: (page - 1) * limit,
        where: where,
        relations: {
          productFormula: true
        }
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
        },
        relations: {
          productFormula: true
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
        status: true },
      relations: {
        productFormula: true
      }
    })
    
  }

  // private findOneProduct(value: string): Promise<Product> {

  //   if(isUUID(value)){
  //     return this.productRepository.findOneBy({ id: value }); // * find by id
  //   }
    
  //   return this.productRepository.createQueryBuilder() // * find by name
  //   .where('UPPER(name) = :name', {
  //     name: value.toUpperCase()
  //   })
  //   //.leftJoinAndSelect('product.images', 'prodImages')
  //   .getOne()
    
  // }

  private saveProduct(entity: Product): Promise<Product> {
    const start = performance.now();

    const newEntity: Product = this.productRepository.create(entity);

    return this.productRepository.save(newEntity)
    .then( (entity: Product) => {
      const end = performance.now();
      this.logger.log(`saveProduct: OK, runtime=${(end - start) / 1000} seconds, entity=${JSON.stringify(entity)}`);
      return entity;
    })
  }

  private updateProductFormula(product: Product, productFormulaDtoList: ProductFormulaDto[] = []): Promise<ProductFormula[]> {
    this.logger.log(`updateProductFormula: init process... product=${JSON.stringify(product)}, productFormulaDtoList=${JSON.stringify(productFormulaDtoList)}`);
    const start = performance.now();

    if(productFormulaDtoList.length == 0){
      this.logger.warn(`updateProductFormula: not executed (product formula list empty)`);
      return Promise.resolve([]);
    }

    // * find formulas by id
    const formulaIdList = productFormulaDtoList.map( (item) => item.id );

    return this.formulaRepository.findBy({ // TODO: Posiblemente aca deberia utilizarse el servicio y no el repositorio
      id: In(formulaIdList),
    })
    .then( (formulaList: Formula[]) => {

      // * validate
      if(formulaList.length !== formulaIdList.length){
        const formulaIdNotFoundList: string[] = formulaIdList.filter( (id) => !formulaList.find( (formula) => formula.id == id) );
        const msg = `formulas not found, idList=${JSON.stringify(formulaIdNotFoundList)}`;
        throw new NotFoundException(msg); 
      }

      // * create productFormula
      return this.productFormulaRepository.findBy( { product } ) // * find productFormula
      .then( (productFormulaList: ProductFormula[]) => this.productFormulaRepository.remove(productFormulaList)) // * remove productFormulas
      .then( () => {
        
        // * generate product formula list
        const productFormulaList: ProductFormula[] = formulaList.map( (formula: Formula) => {
          const productFormula = new ProductFormula();
          productFormula.product = product;
          productFormula.formula = formula;
          productFormula.qty = productFormulaDtoList.find( (formulaDto) => formulaDto.id == formula.id).qty;
          return productFormula;
        })
  
        // * bulk insert
        return this.bulkInsertProductFormulas(productFormulaList)
        .then( (productFormulaList: ProductFormula[]) => {
          const end = performance.now();
          this.logger.log(`updateProductFormula: OK, runtime=${(end - start) / 1000} seconds`);
          return productFormulaList;
        })

      })


    })

  }

  private bulkInsertProductFormulas(productFormulaList: ProductFormula[]): Promise<ProductFormula[]> {
    const start = performance.now();
    this.logger.log(`bulkInsertProductFormulas: init process... listSize=${productFormulaList.length}`);

    const newProductFormulaList: ProductFormula[] = productFormulaList.map( (value) => this.productFormulaRepository.create(value));
    
    return this.productFormulaRepository.manager.transaction( async(transactionalEntityManager) => {
      
      return transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(ProductFormula)
        .values(newProductFormulaList)
        .execute()
        .then( (insertResult: InsertResult) => {
          const end = performance.now();
          this.logger.log(`bulkInsertProductFormulas: OK, runtime=${(end - start) / 1000} seconds, insertResult=${JSON.stringify(insertResult.raw)}`);
          return newProductFormulaList;
        })
    })
  }

  private generateProductWithFormulaList(product: Product, productFormulaList: ProductFormula[]): ProductDto {
    
    let productFormulaDtoList: ProductFormulaDto[] = [];
    let cost: number = product.cost;

    if(productFormulaList.length > 0){

      productFormulaDtoList = productFormulaList.map( (productFormula: ProductFormula) => {
        const formulaDto = this.formulaService.generateFormulaWithElementList(productFormula.formula, productFormula.formula.formulaElement);
        
        // * update quantity of each ingredient
        formulaDto.elementList = formulaDto.elementList.map( (elementDto) => {
          elementDto.qty = elementDto.qty * productFormula.qty;
          return elementDto;
        } );

        // * update formula cost
        const formulaCost = formulaDto.cost * productFormula.qty;
        return new ProductFormulaDto(formulaDto.id, productFormula.qty, formulaDto.name, formulaCost, formulaDto.elementList);
      });
      
      // * calculate cost
      cost = productFormulaDtoList.reduce( (cost, productFormulaDto) => cost + (productFormulaDto.cost), 0);
    }

    // * generate product dto
    const productDto = new ProductDto(product.company.id, product.name, product.description, cost, product.price, productFormulaDtoList, product.id);

    return productDto;
  }
  
  // private generateProductWithFormulaList(product: Product, productFormulaList: ProductFormula[]): ProductDto {
    
  //   let productFormulaDtoList: ProductFormulaDto[] = [];
  //   let cost: number = product.cost;

  //   if(productFormulaList.length > 0){

  //     productFormulaDtoList = productFormulaList.map( (productFormula: ProductFormula) => {
        
  //       let formulaElementDtoList: FormulaElementDto[] = [];
        
  //       // * map formula-element to DTO
  //       const formulaElementList: FormulaElement[] = productFormula.formula.formulaElement;
  //       if(formulaElementList?.length > 0){
  //         formulaElementDtoList = formulaElementList.map( (formulaElement) => new FormulaElementDto(formulaElement.element.id, formulaElement.qty, formulaElement.element.name, formulaElement.element.cost, formulaElement.element.unit) )
  //       }

  //       return new ProductFormulaDto(productFormula.formula.id, productFormula.qty, productFormula.formula.name, productFormula.formula.cost, formulaElementDtoList) 
  //     });
      
  //     // * calculate cost
  //     cost = productFormulaList.reduce( (cost, productFormula) => cost + (productFormula.qty * productFormula.formula.cost), 0);
  //   }

  //   // * generate product dto
  //   const productDto = new ProductDto(product.company.id, product.name, product.description, cost, product.price, productFormulaDtoList, product.id);

  //   return productDto;
  // }

}
