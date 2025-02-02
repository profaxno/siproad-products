import { Column, Entity, ManyToOne, OneToMany, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Company } from "./company.entity";
import { FormulaElement } from "./formula-element.entity";
import { ProductFormula } from "./product-formula.entity";

@Entity("pro_product")
export class Product {
  
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('varchar', { 
    length: 45,
    unique: true
  })
  name: string;

  @Column('varchar', { 
    length: 255
  })
  description: string;

  @Column('double')
  cost: number;

  @Column('double')
  price: number;

  // TODO: falta agregar createAt y UpdatedAt

  @Column('boolean', {
    default: true
  })
  status: boolean

  @ManyToOne(
    () => Company,
    (company) => company.product,
    { eager: true }
  )
  company: Company;

  @OneToMany(
    () => ProductFormula,
    (productFormula) => productFormula.product,
    { eager: true }
  )
  productFormula: ProductFormula[];
}
