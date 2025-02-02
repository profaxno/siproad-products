import { IsArray, IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength, ValidateNested } from "class-validator";
import { MeasuresEnum } from "../enum/measures.enum";
import { Type } from "class-transformer";
import { FormulaElementDto } from "./formula.dto";

export class ProductDto {
  
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsUUID()
  companyId: string;

  @IsString()
  @MaxLength(45)
  name: string;

  @IsString()
  @MaxLength(255)
  description: string;

  @IsNumber()
  cost: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductFormulaDto)
  formulaList?: ProductFormulaDto[];

  constructor(companyId: string, name: string, description: string, cost: number, price: number, formulaList: ProductFormulaDto[], id?: string) {
    this.companyId = companyId;
    this.name = name;
    this.description = description;
    this.cost = cost;
    this.price = price;
    this.id = id;
    this.formulaList = formulaList;
  }
}

export class ProductFormulaDto {
  @IsUUID()
  id: string;
  
  @IsNumber()
  qty: number;

  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormulaElementDto)
  elementList?: FormulaElementDto[];
  
  constructor(id: string, qty: number, name?: string, cost?: number, elementList?: FormulaElementDto[]){
    this.id = id;
    this.qty = qty;
    this.name = name;
    this.cost = cost;
    this.elementList = elementList;
  }
}
