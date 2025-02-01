
import { In, InsertResult, Like, Repository } from 'typeorm';
import { isUUID } from 'class-validator';

import { HttpStatus, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';

import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SearchDto } from 'src/common/dto/search.dto';

import { productsResponseDto } from './dto/products-response-dto';
import { FormulaDto, FormulaElementDto } from './dto/formula.dto';
import { Company } from './entities/company.entity';
import { Element } from './entities/element.entity';
import { Formula } from './entities/formula.entity';
import { FormulaElement } from './entities/formula-element.entity';
import { CompanyService } from './company.service';

@Injectable()
export class FormulaService {

  private readonly logger = new Logger(FormulaService.name);

  private dbDefaultLimit = 1000;

  constructor(
    private readonly ConfigService: ConfigService,
    
    @InjectRepository(Formula)
    private readonly formulaRepository: Repository<Formula>,
    
    @InjectRepository(FormulaElement)
    private readonly formulaElementRepository: Repository<FormulaElement>,

    @InjectRepository(Element)
    private readonly elementRepository: Repository<Element>,

    private readonly companyService: CompanyService
    
  ){
    this.dbDefaultLimit = this.ConfigService.get("dbDefaultLimit");
  }

  updateFormula(dto: FormulaDto): Promise<productsResponseDto> {
    if(!dto.id)
      return this.createFormula(dto); // * create
    
    this.logger.log(`updateFormula: init process... dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    // * find company
    const searchDto: SearchDto = new SearchDto(dto.companyId);
    
    return this.companyService.findCompaniesByParams({}, searchDto)
    .then( (companyList: Company[]) => {

      if(companyList.length == 0){
        const msg = `company not found, id=${dto.id}`;
        this.logger.warn(`updateFormula: not executed (${msg})`);
        return new productsResponseDto(HttpStatus.NOT_FOUND, msg);    
      }

      const company = companyList[0];

      // * find formula
      const searchDto: SearchDto = new SearchDto(dto.id);
        
      return this.findFormulasByParams({}, searchDto)
      .then( (entityList: Formula[]) => {

        // * validate
        if(entityList.length == 0){
          const msg = `formula not found, id=${dto.id}`;
          this.logger.warn(`updateFormula: not executed (${msg})`);
          return new productsResponseDto(HttpStatus.NOT_FOUND, msg);  
        }

        let entity = entityList[0];

        // * update
        entity.company = company;
        entity.name = dto.name.toUpperCase();
        entity.cost = dto.cost;

        return this.saveFormula(entity) // * update formula
        .then( (entity: Formula) => this.updateFormulaElement(entity, dto.elementList) ) // * create formulaElement
        .then( (formulaElementList: FormulaElement[]) => this.generateFormulaWithElementList(entity, formulaElementList) ) // * generate formula with formulaElement
        .then( (dto: FormulaDto) => {
          const end = performance.now();
          this.logger.log(`updateFormula: executed, runtime=${(end - start) / 1000} seconds`);
          return new productsResponseDto(HttpStatus.OK, 'updated OK', [dto]);
        })
        
      })

    })

  }

  createFormula(dto: FormulaDto): Promise<productsResponseDto> {
    this.logger.log(`createFormula: init process... dto=${JSON.stringify(dto)}`);
    const start = performance.now();

    // * find company
    const searchDto: SearchDto = new SearchDto(dto.companyId);

    return this.companyService.findCompaniesByParams({}, searchDto)
    .then( (companyList: Company[]) => {

      if(companyList.length == 0){
        const msg = `company not found, id=${dto.id}`;
        this.logger.warn(`createFormula: not executed (${msg})`);
        return new productsResponseDto(HttpStatus.NOT_FOUND, msg);    
      }

      const company = companyList[0];

      // * find formula
      const searchDto: SearchDto = new SearchDto(undefined, [dto.name]);
      
      return this.findFormulasByParams({}, searchDto, company.id)
      .then( (entityList: Formula[]) => {
  
        // * validate
        if(entityList.length > 0){
          const msg = `formula already exists, name=${dto.name}`;
          this.logger.warn(`createFormula: not executed (${msg})`);
          return new productsResponseDto(HttpStatus.BAD_REQUEST, msg);
        }
        
        // * create
        let entity = new Formula();
        entity.company = company;
        entity.name = dto.name.toUpperCase();
        entity.cost = dto.cost;
  
        return this.saveFormula(entity) // * create formula
        .then( (entity: Formula) => {
  
          return this.updateFormulaElement(entity, dto.elementList) // * create formulaElement
          .then( (formulaElementList: FormulaElement[]) => this.generateFormulaWithElementList(entity, formulaElementList) ) // * generate formula with formulaElement
          .then( (dto: FormulaDto) => {
  
            const end = performance.now();
            this.logger.log(`createFormula: created OK, runtime=${(end - start) / 1000} seconds`);
            return new productsResponseDto(HttpStatus.CREATED, 'created OK', [dto]);
          })
  
        })
  
      })

    })
    
  }

  findFormulas(companyId: string, paginationDto: PaginationDto, searchDto: SearchDto): Promise<void | productsResponseDto> {
    const start = performance.now();

    return this.findFormulasByParams(paginationDto, searchDto, companyId)
    .then( (entityList: Formula[]) => entityList.map( (entity) => this.generateFormulaWithElementList(entity, entity.formulaElement) ) )
    .then( (dtoList: FormulaDto[]) => {
      
      if(dtoList.length == 0){
        const msg = `formulas not found`;
        this.logger.warn(`findFormulas: ${msg}`);
        return new productsResponseDto(HttpStatus.NOT_FOUND, msg);
      }

      const end = performance.now();
      this.logger.log(`findFormulas: executed, runtime=${(end - start) / 1000} seconds`);
      return new productsResponseDto(HttpStatus.OK, 'OK', dtoList);
    })
    .catch(error => {
      this.logger.error(`findFormulas: error`, error);
      throw error;
    })
 
  }

  findOneFormulaByValue(companyId: string, value: string): Promise<productsResponseDto> {
    const start = performance.now();
    const searchDto: SearchDto = new SearchDto(value);
        
    // * find element
    return this.findFormulasByParams({}, searchDto, companyId)
    .then( (entityList: Formula[]) => entityList.map( (entity) => this.generateFormulaWithElementList(entity, entity.formulaElement) ) )
    .then( (dtoList: FormulaDto[]) => {
      
      if(dtoList.length == 0){
        const msg = `formula not found, value=${value}`;
        this.logger.warn(`findOneFormulaByValue: ${msg}`);
        return new productsResponseDto(HttpStatus.NOT_FOUND, msg);
      }

      const end = performance.now();
      this.logger.log(`findOneFormulaByValue: executed, runtime=${(end - start) / 1000} seconds`);
      return new productsResponseDto(HttpStatus.OK, 'OK', dtoList);
    })
    .catch(error => {
      this.logger.error(`findOneFormulaByValue: error`, error);
      throw error;
    })

    // const where = isUUID(value) ? { id: value, status: true } : { name: value.toUpperCase(), status: true };

    // return this.formulaRepository.findOne({
    //   relations: {
    //     formulaElement: true
    //   },
    //   where: where,
    // })
    // .then( (entity: Formula) => {
      
    //   if(!entity){
    //     const msg = `formula not found, value=${value}`;
    //     return new productsResponseDto(HttpStatus.NOT_FOUND, msg);
    //   }
      
    //   const siproadFormulaDto = this.generateFormulaWithFormulaElement(entity, entity.formulaElement);

    //   return new productsResponseDto(HttpStatus.OK, 'OK', siproadFormulaDto);
    // })
    
  }

  removeFormula(id: string): Promise<productsResponseDto> {
    this.logger.log(`removeFormula: init process... id=${id}`);
    const start = performance.now();

    // * find formula
    const searchDto: SearchDto = new SearchDto(id);
    
    return this.findFormulasByParams({}, searchDto)
    .then( (entityList: Formula[]) => {
  
      // * validate
      if(entityList.length == 0){
        const msg = `formula not found, id=${id}`;
        return new productsResponseDto(HttpStatus.NOT_FOUND, msg);
      }

      const entity = entityList[0];
      
      // TODO: Posiblemente eliminar los formula-element se deba hacer via CASCADE true
      // * remove
      return this.formulaElementRepository.findBy( { formula: entity } ) // * find formulaElement
      .then( (formulaElementList: FormulaElement[]) => this.formulaElementRepository.remove(formulaElementList)) // * remove formulaElements
      .then( () => this.formulaRepository.remove(entity) ) // * remove formula
      .then( (entity: Formula) => {

        const end = performance.now();
        this.logger.log(`removeFormula: OK, runtime=${(end - start) / 1000} seconds`);
        return new productsResponseDto(HttpStatus.OK, 'delete OK');

      })

    })
    .catch(error => {
      if(error.errno == 1217) {
        this.logger.warn('removeFormula: not executed, error', error);
        return new productsResponseDto(HttpStatus.BAD_REQUEST, 'formula is being used');
      }

      this.logger.error('removeFormula: error', error);
      throw error;
    })

  }

  private findFormulasByParams(paginationDto: PaginationDto, searchDto: SearchDto, companyId?: string): Promise<Formula[]> {
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

  // private findOneFormula(value: string): Promise<Formula> {

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

  private saveFormula(entity: Formula): Promise<Formula> {
    const start = performance.now();

    const newEntity: Formula = this.formulaRepository.create(entity);

    return this.formulaRepository.save(newEntity)
    .then( (entity: Formula) => {
      const end = performance.now();
      this.logger.log(`saveFormula: OK, runtime=${(end - start) / 1000} seconds, entity=${JSON.stringify(entity)}`);
      return entity;
    })
  }

  private updateFormulaElement(formula: Formula, formulaElementDtoList: FormulaElementDto[] = []): Promise<FormulaElement[]> {
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
    .then( (elementList: Element[]) => {

      // * validate
      if(elementList.length !== elementIdList.length){
        const elementIdNotFoundList: string[] = elementIdList.filter( (id) => !elementList.find( (element) => element.id == id) );
        const msg = `elements not found, idList=${JSON.stringify(elementIdNotFoundList)}`;
        throw new NotFoundException(msg); 
      }

      // * create formulaElement
      return this.formulaElementRepository.findBy( { formula } ) // * find formulaElement
      .then( (formulaElementList: FormulaElement[]) => this.formulaElementRepository.remove(formulaElementList)) // * remove formulaElements
      .then( () => {
        
        // * generate formula element list
        const formulaElementList: FormulaElement[] = elementList.map( (element: Element) => {
          const formulaElement = new FormulaElement();
          formulaElement.formula = formula;
          formulaElement.element = element;
          formulaElement.qty = formulaElementDtoList.find( (elementDto) => elementDto.id == element.id).qty;
          return formulaElement;
        })
  
        // * bulk insert
        return this.bulkInsertFormulaElements(formulaElementList)
        .then( (formulaElementList: FormulaElement[]) => {
          const end = performance.now();
          this.logger.log(`updateFormulaElement: OK, runtime=${(end - start) / 1000} seconds`);
          return formulaElementList;
        })

      })


    })

  }

  private bulkInsertFormulaElements(formulaElementList: FormulaElement[]): Promise<FormulaElement[]> {
    const start = performance.now();
    this.logger.log(`bulkInsertFormulaElements: init process... listSize=${formulaElementList.length}`);

    const newFormulaElementList: FormulaElement[] = formulaElementList.map( (value) => this.formulaElementRepository.create(value));
    
    return this.formulaElementRepository.manager.transaction( async(transactionalEntityManager) => {
      
      return transactionalEntityManager
        .createQueryBuilder()
        .insert()
        .into(FormulaElement)
        .values(newFormulaElementList)
        .execute()
        .then( (insertResult: InsertResult) => {
          const end = performance.now();
          this.logger.log(`bulkInsertFormulaElements: OK, runtime=${(end - start) / 1000} seconds, insertResult=${JSON.stringify(insertResult.raw)}`);
          return newFormulaElementList;
        })
    })
  }

  generateFormulaWithElementList(formula: Formula, formulaElementList: FormulaElement[]): FormulaDto {
    
    let formulaElementDtoList: FormulaElementDto[] = [];
    let cost: number = formula.cost;

    if(formulaElementList.length > 0){
      formulaElementDtoList = formulaElementList.map( (formulaElement: FormulaElement) => new FormulaElementDto(formulaElement.element.id, formulaElement.qty, formulaElement.element.name, formulaElement.element.cost, formulaElement.element.unit) );
      
      // * calculate cost
      cost = formulaElementDtoList.reduce( (cost, formulaElementDto) => cost + (formulaElementDto.qty * formulaElementDto.cost), 0);
    } 

    // * generate formula dto
    const formulaDto = new FormulaDto(formula.company.id, formula.name, cost, formulaElementDtoList, formula.id);

    return formulaDto;
  }

}
