
import { In, InsertResult, Like, Repository } from 'typeorm';
import { isUUID } from 'class-validator';

import { HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SearchDto } from 'src/common/dto/search.dto';

import { SiproadResponseDto } from './dto/products-response-dto';
import { ProductsFormulaDto, ProductFormulaElementDto } from './dto/products-formula.dto';
import { ProductsCompany } from './entities/products-company.entity';
import { ProductsElement } from './entities/products-element.entity';
import { ProductsFormula } from './entities/products-formula.entity';
import { ProductsFormulaElement } from './entities/products-formula-element.entity';
import { ProductsCompanyService } from './products-company.service';

@Injectable()
export class ProductsFormulaService {

  private readonly logger = new Logger(ProductsFormulaService.name);

  private dbDefaultLimit = 1000;

  constructor(
    private readonly ConfigService: ConfigService,
    
    @InjectRepository(ProductsFormula)
    private readonly formulaRepository: Repository<ProductsFormula>,
    
    @InjectRepository(ProductsFormulaElement)
    private readonly formulaElementRepository: Repository<ProductsFormulaElement>,

    @InjectRepository(ProductsElement)
    private readonly elementRepository: Repository<ProductsElement>,

    private readonly productsCompanyService: ProductsCompanyService
    
  ){
    this.dbDefaultLimit = this.ConfigService.get("dbDefaultLimit");
  }

  updateFormula(dto: ProductsFormulaDto): Promise<SiproadResponseDto> {
    if(!dto.id)
      return this.createFormula(dto); // * create
    
    this.logger.log(`updateFormula: init process... dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    // * find company
    const searchDto: SearchDto = new SearchDto(dto.companyId);
    
    return this.productsCompanyService.findCompaniesByParams({}, searchDto)
    .then( (companyList: ProductsCompany[]) => {

      if(companyList.length == 0){
        const msg = `company not found, id=${dto.id}`;
        this.logger.warn(`updateFormula: not executed (${msg})`);
        return new SiproadResponseDto(HttpStatus.NOT_FOUND, msg);    
      }

      const company = companyList[0];

      // * find formula
      const searchDto: SearchDto = new SearchDto(dto.id);
        
      return this.findFormulasByParams({}, searchDto)
      .then( (entityList: ProductsFormula[]) => {

        // * validate
        if(entityList.length == 0){
          const msg = `formula not found, id=${dto.id}`;
          this.logger.warn(`updateFormula: not executed (${msg})`);
          return new SiproadResponseDto(HttpStatus.NOT_FOUND, msg);  
        }

        let entity = entityList[0];

        // * update
        entity.company = company;
        entity.name = dto.name.toUpperCase();
        entity.cost = dto.cost;

        return this.saveFormula(entity) // * update formula
        .then( (entity: ProductsFormula) => this.updateFormulaElement(entity, dto.formulaElementList) ) // * create formulaElement
        .then( (formulaElementList: ProductsFormulaElement[]) => this.generateFormulaWithFormulaElement(entity, formulaElementList) ) // * generate formula with formulaElement
        .then( (siproadFormulaDto: ProductsFormulaDto) => {
          const end = performance.now();
          this.logger.log(`updateFormula: executed, runtime=${(end - start) / 1000} seconds`);
          return new SiproadResponseDto(HttpStatus.OK, 'updated OK', siproadFormulaDto);
        })
        
      })

    })

  }

  createFormula(dto: ProductsFormulaDto): Promise<SiproadResponseDto> {
    this.logger.log(`createFormula: init process... dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    // * find company
    const searchDto: SearchDto = new SearchDto(dto.companyId);

    return this.productsCompanyService.findCompaniesByParams({}, searchDto)
    .then( (companyList: ProductsCompany[]) => {

      if(companyList.length == 0){
        const msg = `company not found, id=${dto.id}`;
        this.logger.warn(`createFormula: not executed (${msg})`);
        return new SiproadResponseDto(HttpStatus.NOT_FOUND, msg);    
      }

      const company = companyList[0];

      // * find formula
      const searchDto: SearchDto = new SearchDto(undefined, [dto.name]);
      
      return this.findFormulasByParams({}, searchDto, company.id)
      .then( (entityList: ProductsFormula[]) => {
  
        // * validate
        if(entityList.length > 0){
          const msg = `formula already exists, name=${dto.name}`;
          this.logger.warn(`createFormula: not executed (${msg})`);
          return new SiproadResponseDto(HttpStatus.BAD_REQUEST, msg);
        }
        
        // * create
        let entity = new ProductsFormula();
        entity.company = company;
        entity.name = dto.name.toUpperCase();
        entity.cost = dto.cost;
  
        return this.saveFormula(entity) // * create formula
        .then( (entity: ProductsFormula) => {
  
          return this.updateFormulaElement(entity, dto.formulaElementList) // * create formulaElement
          .then( (formulaElementList: ProductsFormulaElement[]) => this.generateFormulaWithFormulaElement(entity, formulaElementList) ) // * generate formula with formulaElement
          .then( (formulaDto: ProductsFormulaDto) => {
  
            const end = performance.now();
            this.logger.log(`createFormula: created OK, runtime=${(end - start) / 1000} seconds`);
            return new SiproadResponseDto(HttpStatus.CREATED, 'created OK', formulaDto);
          })
  
        })
  
      })

    })
    
  }

  findFormulas(companyId: string, paginationDto: PaginationDto, searchDto: SearchDto): Promise<void | SiproadResponseDto> {

    return this.findFormulasByParams(paginationDto, searchDto, companyId)
    .then( (entityList: ProductsFormula[]) => entityList.map( (entity) => this.generateFormulaWithFormulaElement(entity, entity.formulaElement) ) )
    .then( (dtoList: ProductsFormulaDto[]) => new SiproadResponseDto(HttpStatus.OK, 'OK', dtoList))
    .catch(error => {
      this.logger.error(`findFormulas: error`, error)
    })
 
  }

  findOneFormulaByValue(companyId: string, value: string): Promise<SiproadResponseDto> {
    const start = performance.now();
    const searchDto: SearchDto = new SearchDto(value);
        
    // * find element
    return this.findFormulasByParams({}, searchDto, companyId)
    .then( (entityList: ProductsFormula[]) => {
      
      if(entityList.length == 0){
        const msg = `formula not found, value=${value}`;
        this.logger.warn(`findOneFormulaByValue: ${msg}`);
        return new SiproadResponseDto(HttpStatus.NOT_FOUND, msg);
      }

      const entity = entityList[0];

      const dto = this.generateFormulaWithFormulaElement(entity, entity.formulaElement);
      const end = performance.now();
      this.logger.log(`findOneFormulaByValue: executed, runtime=${(end - start) / 1000} seconds`);
      return new SiproadResponseDto(HttpStatus.OK, 'OK', dto);
    })

    // const where = isUUID(value) ? { id: value, status: true } : { name: value.toUpperCase(), status: true };

    // return this.formulaRepository.findOne({
    //   relations: {
    //     formulaElement: true
    //   },
    //   where: where,
    // })
    // .then( (entity: ProductsFormula) => {
      
    //   if(!entity){
    //     const msg = `formula not found, value=${value}`;
    //     return new SiproadResponseDto(HttpStatus.NOT_FOUND, msg);
    //   }
      
    //   const siproadProductsFormulaDto = this.generateFormulaWithFormulaElement(entity, entity.formulaElement);

    //   return new SiproadResponseDto(HttpStatus.OK, 'OK', siproadProductsFormulaDto);
    // })
    
  }

  removeFormula(id: string): Promise<SiproadResponseDto> {
    this.logger.log(`removeFormula: init process... id=${id}`);
    const start = performance.now();

    // * find formula
    const searchDto: SearchDto = new SearchDto(id);
    
    return this.findFormulasByParams({}, searchDto)
    .then( (entityList: ProductsFormula[]) => {
  
      // * validate
      if(entityList.length == 0){
        const msg = `formula not found, id=${id}`;
        return new SiproadResponseDto(HttpStatus.NOT_FOUND, msg);
      }

      const entity = entityList[0];
      
      // TODO: Posiblemente eliminar los formula-element se deba hacer via CASCADE true
      // * remove
      return this.formulaElementRepository.findBy( { formula: entity } ) // * find formulaElement
      .then( (formulaElementList: ProductsFormulaElement[]) => this.formulaElementRepository.remove(formulaElementList)) // * remove formulaElements
      .then( () => this.formulaRepository.remove(entity) ) // * remove formula
      .then( (entity: ProductsFormula) => {

        const end = performance.now();
        this.logger.log(`removeFormula: OK, runtime=${(end - start) / 1000} seconds`);
        return new SiproadResponseDto(HttpStatus.OK, 'delete OK');

      })

    })
    .catch(error => {
      if(error.errno == 1217) {
        this.logger.warn('removeFormula: not executed, error', error);
        return new SiproadResponseDto(HttpStatus.BAD_REQUEST, 'formula is being used');
      }

      this.logger.error('removeFormula: error', error);
      throw error;
    })

  }

  private findFormulasByParams(paginationDto: PaginationDto, searchDto: SearchDto, companyId?: string): Promise<ProductsFormula[]> {
    const {page=1, limit=this.dbDefaultLimit} = paginationDto;

    // * search by partial name
    if(searchDto.search) {
      const whereByName = { company: { id: companyId }, name: Like(`%${searchDto.search}%`), status: true };
      const whereById   = { id: searchDto.search, status: true };
      const where = isUUID(searchDto.search) ? whereById : whereByName;

      return this.formulaRepository.find({
        take: limit,
        skip: (page - 1) * limit,
        where: where,
        relations: {
          formulaElement: true
        }
      })
    }

    // * search by names
    if(searchDto.searchList) {
      return this.formulaRepository.find({
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
          formulaElement: true
        }
      })
    }

    // * search all
    return this.formulaRepository.find({
      take: limit,
      skip: (page - 1) * limit,
      where: { 
        company: { 
          id: companyId 
        },
        status: true },
      relations: {
        formulaElement: true
      }
    })
    
  }

  // private findOneFormula(value: string): Promise<ProductsFormula> {

  //   if(isUUID(value)){
  //     return this.formulaRepository.findOneBy({ id: value }); // * find by id
  //   }
    
  //   return this.formulaRepository.createQueryBuilder() // * find by name
  //   .where('UPPER(name) = :name', {
  //     name: value.toUpperCase()
  //   })
  //   //.leftJoinAndSelect('product.images', 'prodImages')
  //   .getOne()
    
  // }

  private saveFormula(entity: ProductsFormula): Promise<ProductsFormula> {
    const start = performance.now();

    const newEntity: ProductsFormula = this.formulaRepository.create(entity);

    return this.formulaRepository.save(newEntity)
    .then( (entity: ProductsFormula) => {
      const end = performance.now();
      this.logger.log(`saveFormula: OK, runtime=${(end - start) / 1000} seconds, entity=${JSON.stringify(entity)}`);
      return entity;
    })
  }

  private updateFormulaElement(formula: ProductsFormula, formulaElementDtoList: ProductFormulaElementDto[] = []): Promise<ProductsFormulaElement[]> {
    this.logger.log(`updateFormulaElement: init process... formula=${JSON.stringify(formula)}, formulaElementDtoList=${JSON.stringify(formulaElementDtoList)}`);
    const start = performance.now();

    if(formulaElementDtoList.length == 0){
      this.logger.warn(`updateFormulaElement: not executed (formula element list empty)`);
      return Promise.resolve([]);
    }

    // * find elements by id
    const elementIdList = formulaElementDtoList.map( (item) => item.id );

    return this.elementRepository.findBy({ // TODO: Posiblemente aca deberia utilizarse el servicio y no el repositorio
      id: In(elementIdList),
    })
    .then( (elementList: ProductsElement[]) => {

      // * validate
      if(elementList.length !== elementIdList.length){
        const elementIdNotFoundList: string[] = elementIdList.filter( (id) => !elementList.find( (element) => element.id == id) );
        const msg = `elements not found, idList=${JSON.stringify(elementIdNotFoundList)}`;
        throw new NotFoundException(msg); 
      }

      // * create formulaElement
      return this.formulaElementRepository.findBy( { formula } ) // * find formulaElement
      .then( (formulaElementList: ProductsFormulaElement[]) => this.formulaElementRepository.remove(formulaElementList)) // * remove formulaElements
      .then( () => {
        
        // * generate formula element list
        const formulaElementList: ProductsFormulaElement[] = elementList.map( (element: ProductsElement) => {
          const formulaElement = new ProductsFormulaElement();
          formulaElement.formula = formula;
          formulaElement.element = element;
          formulaElement.qty = formulaElementDtoList.find( (elementDto) => elementDto.id == element.id).qty;
          return formulaElement;
        })
  
        // * bulk insert
        return this.bulkInsertFormulaElements(formulaElementList)
        .then( (formulaElementList: ProductsFormulaElement[]) => {
          const end = performance.now();
          this.logger.log(`updateFormulaElement: OK, runtime=${(end - start) / 1000} seconds`);
          return formulaElementList;
        })

      })


    })

  }

  private bulkInsertFormulaElements(formulaElementList: ProductsFormulaElement[]): Promise<ProductsFormulaElement[]> {
    const start = performance.now();
    this.logger.log(`bulkInsertFormulaElements: init process... listSize=${formulaElementList.length}`);

    const newFormulaElementList: ProductsFormulaElement[] = formulaElementList.map( (value) => this.formulaElementRepository.create(value));
    
    return this.formulaElementRepository.manager.transaction( async(transactionalEntityManager) => {
      
      return transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(ProductsFormulaElement)
        .values(newFormulaElementList)
        .execute()
        .then( (insertResult: InsertResult) => {
          const end = performance.now();
          this.logger.log(`bulkInsertFormulaElements: OK, runtime=${(end - start) / 1000} seconds, insertResult=${JSON.stringify(insertResult.raw)}`);
          return newFormulaElementList;
        })
    })
  }

  private generateFormulaWithFormulaElement(formula: ProductsFormula, formulaElementList: ProductsFormulaElement[]): ProductsFormulaDto {
    
    let formulaElementDtoList: ProductFormulaElementDto[] = [];
    let cost: number = formula.cost;

    if(formulaElementList.length > 0){
      formulaElementDtoList = formulaElementList.map( (formulaElement: ProductsFormulaElement) => new ProductFormulaElementDto(formulaElement.element.id, formulaElement.qty, formulaElement.element.cost, formulaElement.element.unit, formulaElement.element.name) );
      
      // * calculate cost
      cost = formulaElementList.reduce( (cost, formulaElement) => cost + (formulaElement.qty * formulaElement.element.cost), 0);
    } 

    // * generate formula dto
    const formulaDto = new ProductsFormulaDto(formula.company.id, formula.name, formulaElementDtoList, cost, formula.id);

    return formulaDto;
  }

}
