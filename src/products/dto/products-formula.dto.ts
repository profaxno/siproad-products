import { ArrayNotEmpty, IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength, ValidateNested } from "class-validator";
import { ProductsElementDto } from "./products-element.dto";
import { Type } from "class-transformer";

export class ProductsFormulaDto {
  @IsUUID()
  @IsOptional()
  id?: string;

  @IsUUID()
  companyId?: string;

  @IsString()
  @MaxLength(45)
  name: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductFormulaElementDto)
  formulaElementList?: ProductFormulaElementDto[];

  @IsNumber()
  cost: number;

  constructor(companyId: string, name: string, formulaElementList: ProductFormulaElementDto[], cost: number, id?: string){
    this.companyId = companyId;
    this.name = name;
    this.formulaElementList = formulaElementList;
    this.cost = cost;
    this.id = id;
  }
}

export class ProductFormulaElementDto {
  @IsUUID()
  id: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsNumber()
  qty: number;

  @IsNumber()
  @IsOptional()
  cost?: number;

  @IsString()
  @IsOptional()
  unit?: string;

  constructor(id: string, qty: number, cost?: number, unit?: string, name?: string){
    this.id = id;
    this.qty = qty;
    this.cost = cost;
    this.unit = unit;
    this.name = name;
  }
}
