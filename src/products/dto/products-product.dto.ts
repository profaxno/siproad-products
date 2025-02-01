import { IsBoolean, IsIn, IsInt, IsNumber, IsOptional, IsPositive, IsString, IsUUID, MaxLength } from "class-validator";
import { MeasuresEnum } from "../enum/measures.enum";

export class ProductsProductDto {
  
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

  constructor(companyId: string, name: string, description: string, cost: number, price: number, id?: string) {
    this.companyId = companyId;
    this.name = name;
    this.description = description;
    this.cost = cost;
    this.price = price;
    this.id = id;
  }
}
